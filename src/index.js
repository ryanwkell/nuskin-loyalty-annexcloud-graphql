let axios = require('axios')

let AnnexCloud = class AnnexCloud {

  constructor (constructorObject) {
    this.requestUrl = constructorObject.requestUrl + '/loyalty-graphql/';
    this.market = constructorObject.market;
    this.userId = constructorObject.userId;
    this.jwt = constructorObject.jwt;
    this.client_id = constructorObject.client_id;
    this.client_secret = constructorObject.client_secret;

    this.activity = [];

    this.buckets = {
      withinSeven: [],
      withinThirty: 0,
      longTerm: 0
    };

    this.currentTierData = {
      name: '',
      purchaseIncrement: 0,
      minSpend: 0,
      purchaseRatio: 0,
      redemptionLimit: 0,
      daysToExpire: 0
    };

    this.soonestExpiring = {
      pointsToExpire: 0,
      expirationDate: new Date()
    };

    this.tierData = [];

    this.wallet = {
      available: 0,
      spent: 0,
      spentInPeriod: 0,
      expiredPoints: 0,
      lifetimePointsEarned: 0
    };
  }

  adjustWithinSevenToConsiderPartialCreditAvailability(totalToAdjustBy) {
    let sortedArray = this.sort('expireDate', this.buckets.withinSeven);
    sortedArray[0].credit -= totalToAdjustBy;
    this.buckets.withinSeven = sortedArray;
  }

  calculateDayDifference(date) {
    let now = new Date();
    let expireDate = new Date(date);
    return Math.floor((Date.UTC(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) ) /(1000 * 60 * 60 * 24));
  }

  createAndSetBucketsFromActivity(graphResponse) {
    let runningTotal = graphResponse.user.points.availablePoints;
    graphResponse.user.activity.activityDetail.forEach( (activity) => {
      let dateDiff = activity.expireDate ? this.calculateDayDifference(activity.expireDate) : 3650;
      if(activity.credit && runningTotal > 0 && dateDiff >= 0) {
        if(dateDiff > 30) {
          if(activity.credit <= runningTotal){
            this.buckets.longTerm += activity.credit;
          } else {
            this.buckets.longTerm += runningTotal;
          }
        } else if(dateDiff > 7) {
          if(activity.credit <= runningTotal){
            this.buckets.withinThirty += activity.credit;
          } else {
            this.buckets.withinThirty += runningTotal;
          }
        } else {
          this.buckets.withinSeven.push(activity);
        }
        runningTotal = runningTotal - activity.credit;
      }
    });
    if(this.buckets.withinSeven.length && runningTotal < 0) {
      this.adjustWithinSevenToConsiderPartialCreditAvailability(runningTotal);
    }
  }

  async getAllAnnexInfo() {
    let queryString = `
    {
      user(accountId: "` + this.userId + `", market: "` + this.market + `") {
        optInStatus
        tier {
          currentTier
          nextTier
          purchaseRatio
          pointsToNextTier
        }
        activity {
          pages
          activityCount
          activityDetail {
            actionId
            activity
            credit
            displayText
            orderId
            createDate
            expireDate
          }
        }
        points {
          availablePoints
          totalSpend
          usedPoints
          expiredPoints
          lifetimePoints
          spendToNextTier
          pointsToExpire
          pointsToExpireDate
        }
      }
      marketConfig(market: "` + this.market + `") {
        titleParticipant
        tierConfig {
          name
          purchaseIncrement
          minSpend
          purchaseRatio
          redemptionLimit
          daysToExpire
        }
      }
    }
    `;

    await this.makeGraphCall(queryString).then(graphResponse => {
      this.activity = graphResponse.user.activity.activityDetail;
      this.createAndSetBucketsFromActivity(graphResponse);
      this.setCurrentTierData(graphResponse);
      this.setSoonestToExpire(graphResponse);
      this.setTierData(graphResponse);
      this.setWallet(graphResponse);
    });

    return {
      activity: this.activity,
      buckets: this.buckets,
      soonestExpiring: this.soonestExpiring,
      tierData: this.tierData,
      userTier: this.currentTierData,
      wallet: this.wallet
    }
  }

  async getRewardsBucketsAndCurrentTierData() {
    let queryString = `
      {
        user(accountId: "` + this.userId + `", market: "` + this.market + `") {
          optInStatus
          tier {
            currentTier
          }
          activity {
            pages
            activityCount
            activityDetail {
              actionId
              activity
              credit
              debit
              displayText
              orderId
              createDate
              expireDate
            }
          }
          points {
            availablePoints
            totalSpend
            usedPoints
            expiredPoints
            lifetimePoints
            spendToNextTier
            pointsToExpire
            pointsToExpireDate
          }
        }
        marketConfig(market: "` + this.market + `") {
          titleParticipant
          tierConfig {
            name
            purchaseIncrement
            minSpend
            purchaseRatio
            redemptionLimit
            daysToExpire
          }
        }
      }
    `;

    await this.makeGraphCall(queryString).then(graphResponse => {
      this.createAndSetBucketsFromActivity(graphResponse);
      this.setCurrentTierData(graphResponse);
      this.setSoonestToExpire(graphResponse);
      this.setWallet(graphResponse);
    });

    return {
      buckets: this.buckets,
      soonestExpiring: this.soonestExpiring,
      userTier: this.currentTierData,
      wallet: this.wallet
    }
  }

  async getWalletAndSoonestToExpire() {
    let queryString = `
      {
        user(accountId: "` + this.userId + `", market: "` + this.market + `") {
          optInStatus
          points {
            availablePoints
            totalSpend
            usedPoints
            expiredPoints
            lifetimePoints
            spendToNextTier
            pointsToExpire
            pointsToExpireDate
          }
        }
      }
    `;

    await this.makeGraphCall(queryString).then(graphResponse => {
      this.setSoonestToExpire(graphResponse);
      this.setWallet(graphResponse);
    });

    return {
      wallet: this.wallet,
      soonestExpiring: this.soonestExpiring
    }
  }

  async makeGraphCall(queryString) {
    try {
      let requestConfig = {
        method: 'POST',
        url: this.requestUrl,
        data: queryString,
        headers: {
          "Content-Type": "text/plain",
          "Authorization": this.jwt,
          "client_id": this.client_id,
          "client_secret": this.client_secret
        }
      }
      let axiosResponse = await axios(requestConfig);
      return axiosResponse.data
    } catch (error) {
      console.error('There is an error connecting to the GraphQL Proxy. Here is the error response: ', error)
    }
  }

  setCurrentTierData(graphResponse) {
    //Define the current tier of the user in question:
    let userCurrentTier = graphResponse.user.tier.currentTier;
    
    //Iterate through the market data to get the info for the tier they belong to:
    graphResponse.marketConfig.tierConfig.forEach( (tierData) => {
      if(tierData.name === userCurrentTier) {
        this.currentTierData = tierData;
      }
    });
  }

  setTierData(graphResponse) {
    graphResponse.marketConfig.tierConfig.forEach((market) => {
      this.tierData.push(market)
    });
  }

  setSoonestToExpire(graphResponse) {
    this.soonestExpiring.pointsToExpire = graphResponse.user.points.pointsToExpire;
    this.soonestExpiring.expirationDate = new Date(graphResponse.user.points.pointsToExpireDate);
  }

  setWallet(graphResponse) {
    this.wallet.available = graphResponse.user.points.availablePoints;
    this.wallet.spent = graphResponse.user.points.usedPoints;
    this.wallet.spentInPeriod = graphResponse.user.points.spentPoints;
    this.wallet.expired = graphResponse.user.points.expiredPoints;
    this.wallet.lifetimePointsEarned = graphResponse.user.points.lifetimePoints;
  }

  sort(prop, arr) {
    prop = prop.split('.');
    var len = prop.length;
    
    arr.sort(function (a, b) {
        var i = 0;
        while( i < len ) {
            a = a[prop[i]];
            b = b[prop[i]];
            i++;
        }
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });
    return arr;
  };

}

module.exports = {
  AnnexCloud: AnnexCloud
}
