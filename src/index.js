let axios = require('axios')

let NsLoyalty = class NsLoyalty {

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
      name: false,
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

    this.status = false;

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
    sortedArray[0].credit += totalToAdjustBy;
    this.buckets.withinSeven = sortedArray;
  }

  calculateCredit(activity, returnedItems) {
    if('order_' + activity.orderId.toString() in returnedItems){
      let returnVal = activity.credit - returnedItems['order_' + activity.orderId.toString()].returnValue;
      return returnVal;
    } else {
      return activity.credit;
    }
  }

  calculateDayDifference(date) {
    let now = new Date();
    let expireDate = new Date(date);
    return Math.floor((Date.UTC(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) ) /(1000 * 60 * 60 * 24));
  }

  createActivityArray(activityArray){
    let activity = [];
    activityArray.forEach( (item) => {
      activity.push(Object.assign({}, item));
    });
    return activity;
  }

  createAndSetBucketsFromActivity(graphResponse) {
    if(!graphResponse.user){
      return false;
    }
    let runningTotal = graphResponse.user.points.availablePoints;
    let returnedItems = [];
    //We need to get a list of the returns, so that we don't count those rewards:
    graphResponse.user.activity.activityDetail.forEach( (activity) => {
      if(activity.actionId === 148) {
        let orderArray = {}
        if('order_' + activity.orderId.toString() in returnedItems){
          orderArray = returnedItems[activity.orderId];
          orderArray.returnValue = orderArray.returnValue + activity.debit;
        } else {
          orderArray = {
            orderId: activity.orderId,
            returnValue: activity.debit
          }
        }
        returnedItems['order_' + activity.orderId.toString()] = orderArray;
      }
    });
    graphResponse.user.activity.activityDetail.forEach( (activity) => {
      let dateDiff = activity.expireDate ? this.calculateDayDifference(activity.expireDate) : 3650;
      if(activity.credit && runningTotal > 0 && dateDiff >= 0) {
        if(dateDiff > 30) {
          this.buckets.longTerm += this.calculateCredit(activity, returnedItems);
        } else if(dateDiff > 7) {
          this.buckets.withinThirty += this.calculateCredit(activity, returnedItems);
        } else {
          this.buckets.withinSeven.push(this.getWithinSevenActivityWithReturnsCalculated(activity, returnedItems));
        }
        runningTotal -= this.calculateCredit(activity, returnedItems);
      }
    });
    if(this.buckets.withinSeven.length && runningTotal < 0) {
      this.adjustWithinSevenToConsiderPartialCreditAvailability(runningTotal);
    } else {
      let sortedArray = this.sort('expireDate', this.buckets.withinSeven);
      this.buckets.withinSeven = sortedArray;
    }
  }

  async getAllLoyaltyInfo() {
    this.resetLoyaltyObject();
    let queryString = `
    {
      user(accountId: "${this.userId}", market: "${this.market}") {
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
      marketConfig(market: "${this.market}") {
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
      this.activity = graphResponse.user ? this.createActivityArray(graphResponse.user.activity.activityDetail) : [];
      this.createAndSetBucketsFromActivity(graphResponse);
      this.setCurrentTierData(graphResponse);
      this.setSoonestToExpire(graphResponse);
      this.setStatus(graphResponse);
      this.setTierData(graphResponse);
      this.setWallet(graphResponse);
    });

    return {
      activity: this.activity,
      buckets: this.buckets,
      optInStatus: this.status,
      soonestExpiring: this.soonestExpiring,
      tierData: this.tierData,
      userTier: this.currentTierData,
      wallet: this.wallet
    }
  }

  async getMarketConfig() {
    this.resetLoyaltyObject();
    let queryString = ``;
    if(this.userId){
      queryString = `
      {
        user(accountId: "${this.userId}", market: "${this.market}") {
          optInStatus
        }
        marketConfig(market: ${this.market}) {
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
    } else {
      queryString = `
      {
        marketConfig(market: ${this.market}) {
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
    }

    await this.makeGraphCall(queryString).then(graphResponse => {
      this.setStatus(graphResponse);
      this.setTierData(graphResponse);
    });

    return {
      optInStatus: this.status,
      tierData: this.tierData
    }
  }

  async getRewardsBucketsAndCurrentTierData() {
    this.resetLoyaltyObject();
    let queryString = `
      {
        user(accountId: ${this.userId}, market: ${this.market}) {
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
        marketConfig(market: ${this.market}) {
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
      this.setStatus(graphResponse);
      this.setWallet(graphResponse);
    });

    return {
      buckets: this.buckets,
      optInStatus: this.status,
      soonestExpiring: this.soonestExpiring,
      userTier: this.currentTierData,
      wallet: this.wallet
    }
  }

  async getWalletAndSoonestToExpire() {
    this.resetLoyaltyObject();
    let queryString = `
      {
        user(accountId: ${this.userId}, market: ${this.market}) {
          optInStatus
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
      }
    `;

    await this.makeGraphCall(queryString).then(graphResponse => {
      this.setSoonestToExpire(graphResponse);
      this.setStatus(graphResponse);
      this.setWallet(graphResponse);
    });

    return {
      optInStatus: this.status,
      soonestExpiring: this.soonestExpiring,
      wallet: this.wallet
    }
  }

  getWithinSevenActivityWithReturnsCalculated(activity, returnedItems) {
    if(returnedItems.includes('order_' + activity.orderId.toString())) {
      activity.credit = this.calculateCredit(activity, returnedItems);
    }
    return activity;
  }

  async makeGraphCall(queryString) {
    try {
      let requestConfig = {
        headers: {
          "Content-Type": "text/plain",
          "Authorization": this.jwt,
          "client_id": this.client_id,
          "client_secret": this.client_secret
        }
      }
      let axiosResponse = await axios.post(this.requestUrl, queryString, requestConfig);
      return axiosResponse.data
    } catch (error) {
      console.error('There is an error connecting to the GraphQL Proxy. Here is the error response: ', error)
    }
  }

  resetLoyaltyObject() {
    this.activity = [];

    this.buckets = {
      withinSeven: [],
      withinThirty: 0,
      longTerm: 0
    };

    this.currentTierData = {
      name: false,
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

    this.status = false;

    this.tierData = [];

    this.wallet = {
      available: 0,
      spent: 0,
      spentInPeriod: 0,
      expiredPoints: 0,
      lifetimePointsEarned: 0
    };
  }

  setCurrentTierData(graphResponse) {
    if(!graphResponse.user) {
      return false;
    }
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
    if(!graphResponse.marketConfig) {
      return false;
    } else {
      this.tierData = [];
    }
    graphResponse.marketConfig.tierConfig.forEach((market) => {
      this.tierData.push(market)
    });
  }

  setSoonestToExpire(graphResponse) {
    if(!graphResponse.user) {
      return false;
    }
    this.soonestExpiring.pointsToExpire = graphResponse.user.points.pointsToExpire;
    this.soonestExpiring.expirationDate = graphResponse.user.points.pointsToExpireDate;
  }

  setStatus(graphResponse) {
    this.status = graphResponse.user ? graphResponse.user.optInStatus : false;
  }

  setWallet(graphResponse) {
    if(!graphResponse.user) {
      return false;
    }
    this.wallet.available = graphResponse.user.points.availablePoints;
    this.wallet.spent = this.tallySpentPoints(graphResponse.user);
    this.wallet.spentInPeriod = graphResponse.user.points.totalSpend;
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
  }

  tallySpentPoints(graphResponseUser) {
    let totalSpend = 0;

    graphResponseUser.activity.activityDetail.forEach( (activity) => {
      if(activity.actionId === 107) {
        totalSpend += activity.debit;
      }
    })

    return totalSpend;
  }

}

module.exports = {
  NsLoyalty: NsLoyalty
}
