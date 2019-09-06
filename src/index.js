let axios = require('axios')

let AnnexCloud = class AnnexCloud {

  activity = [];

  buckets = {
    withinSeven: [],
    withinThirty: 0,
    longTerm: 0
  };

  configData = {
    requestUrl: '',
    market: '',
    userId: '',
    jwt: '',
    client_id: '',
    client_secret: ''
  }

  currentTierData = {
    name: false,
    purchaseIncrement: 0,
    minSpend: 0,
    purchaseRatio: 0,
    redemptionLimit: 0,
    daysToExpire: 0
  };

  soonestExpiring = {
    pointsToExpire: 0,
    expirationDate: new Date()
  };

  status = false;

  tierData = [];

  wallet = {
    available: 0,
    spent: 0,
    spentInPeriod: 0,
    expiredPoints: 0,
    lifetimePointsEarned: 0
  };

  constructor (constructorObject) {
    this.configData = constructorObject;
    this.configData.requestUrl = constructorObject.requestUrl + '/loyalty-graphql/';
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
    if(!graphResponse.user){
      return false;
    }
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
      user(accountId: "` + this.configData.userId + `", market: "` + this.configData.market + `") {
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
      marketConfig(market: "` + this.configData.market + `") {
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
      this.activity = graphResponse.user ? graphResponse.user.activity.activityDetail : [];
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

  async getRewardsBucketsAndCurrentTierData() {
    let queryString = `
      {
        user(accountId: "` + this.configData.userId + `", market: "` + this.configData.market + `") {
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
        marketConfig(market: "` + this.configData.market + `") {
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
    let queryString = `
      {
        user(accountId: "` + this.configData.userId + `", market: "` + this.configData.market + `") {
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
      this.setStatus(graphResponse);
      this.setWallet(graphResponse);
    });

    return {
      optInStatus: this.status,
      soonestExpiring: this.soonestExpiring,
      wallet: this.wallet
    }
  }

  async makeGraphCall(queryString) {
    try {
      let requestConfig = {
        method: 'POST',
        url: this.configData.requestUrl,
        data: queryString,
        headers: {
          "Content-Type": "text/plain",
          "Authorization": this.configData.jwt,
          "client_id": this.configData.client_id,
          "client_secret": this.configData.client_secret
        }
      }
      let axiosResponse = await axios(requestConfig);
      return axiosResponse.data
    } catch (error) {
      console.error('There is an error connecting to the GraphQL Proxy. Here is the error response: ', error)
    }
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
    this.wallet.spent = graphResponse.user.points.usedPoints;
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

}

module.exports = {
  AnnexCloud: AnnexCloud
}














/*AnnexCloud = new function(){
  let activity = [],

  buckets = {
    withinSeven: [],
    withinThirty: 0,
    longTerm: 0
  },

  currentTierData = {
    name: false,
    purchaseIncrement: 0,
    minSpend: 0,
    purchaseRatio: 0,
    redemptionLimit: 0,
    daysToExpire: 0
  },

  soonestExpiring = {
    pointsToExpire: 0,
    expirationDate: new Date()
  },

  status = false,

  tierData = [],

  wallet = {
    available: 0,
    spent: 0,
    spentInPeriod: 0,
    expiredPoints: 0,
    lifetimePointsEarned: 0
  },
  
  publicFunctions = {
    getAllAnnexInfo : (async (configData) => {
      let queryString = `
      {
        user(accountId: "` + configData.userId + `", market: "` + configData.market + `") {
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
        marketConfig(market: "` + configData.market + `") {
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
  
      await makeGraphCall(queryString).then(graphResponse => {
        activity = graphResponse.user ? graphResponse.user.activity.activityDetail : [];
        createAndSetBucketsFromActivity(graphResponse);
        setCurrentTierData(graphResponse);
        setSoonestToExpire(graphResponse);
        setStatus(graphResponse);
        setTierData(graphResponse);
        setWallet(graphResponse);
      });
  
      return {
        activity: activity,
        buckets: buckets,
        optInStatus: status,
        soonestExpiring: soonestExpiring,
        tierData: tierData,
        userTier: currentTierData,
        wallet: wallet
      }
    }),
  
    getMarketConfig: (async (configData) => {
      this.configData = configData;
      let queryString = ``;
      if(configData.userId){
        queryString = `
        {
          user(accountId: "` + configData.userId + `", market: "` + configData.market + `") {
            optInStatus
          }
          marketConfig(market: "` + configData.market + `") {
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
          marketConfig(market: "` + configData.market + `") {
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
  
      await makeGraphCall(queryString).then(graphResponse => {
        setStatus(graphResponse);
        setTierData(graphResponse);
      });
  
      return {
        optInStatus: status,
        tierData: tierData
      }
    }),
  
    getRewardsBucketsAndCurrentTierData: (async (configData) => {
      let queryString = `
        {
          user(accountId: "` + configData.userId + `", market: "` + configData.market + `") {
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
          marketConfig(market: "` + configData.market + `") {
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
  
      await makeGraphCall(queryString).then(graphResponse => {
        createAndSetBucketsFromActivity(graphResponse);
        setCurrentTierData(graphResponse);
        setSoonestToExpire(graphResponse);
        setStatus(graphResponse);
        setWallet(graphResponse);
      });
  
      return {
        buckets: buckets,
        optInStatus: status,
        soonestExpiring: soonestExpiring,
        userTier: currentTierData,
        wallet: wallet
      }
    }),
  
    getWalletAndSoonestToExpire: (async (configData) => {
      let queryString = `
        {
          user(accountId: "` + configData.userId + `", market: "` + configData.market + `") {
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
  
      await makeGraphCall(queryString).then(graphResponse => {
        setSoonestToExpire(graphResponse);
        setStatus(graphResponse);
        setWallet(graphResponse);
      });
  
      return {
        optInStatus: status,
        soonestExpiring: soonestExpiring,
        wallet: wallet
      }
    })
  }

  adjustWithinSevenToConsiderPartialCreditAvailability = ((totalToAdjustBy) => {
    let sortedArray = sort('expireDate', buckets.withinSeven);
    sortedArray[0].credit -= totalToAdjustBy;
    buckets.withinSeven = sortedArray;
  });

  calculateDayDifference = ((date) => {
    let now = new Date();
    let expireDate = new Date(date);
    return Math.floor((Date.UTC(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) ) /(1000 * 60 * 60 * 24));
  });

  createAndSetBucketsFromActivity = ((graphResponse) => {
    if(!graphResponse.user){
      return false;
    }
    let runningTotal = graphResponse.user.points.availablePoints;
    graphResponse.user.activity.activityDetail.forEach( (activity) => {
      let dateDiff = activity.expireDate ? calculateDayDifference(activity.expireDate) : 3650;
      if(activity.credit && runningTotal > 0 && dateDiff >= 0) {
        if(dateDiff > 30) {
          if(activity.credit <= runningTotal){
            buckets.longTerm += activity.credit;
          } else {
            buckets.longTerm += runningTotal;
          }
        } else if(dateDiff > 7) {
          if(activity.credit <= runningTotal){
            buckets.withinThirty += activity.credit;
          } else {
            buckets.withinThirty += runningTotal;
          }
        } else {
          buckets.withinSeven.push(activity);
        }
        runningTotal = runningTotal - activity.credit;
      }
    });
    if(buckets.withinSeven.length && runningTotal < 0) {
      adjustWithinSevenToConsiderPartialCreditAvailability(runningTotal);
    }
  });

  makeGraphCall = (async (queryString) => {
    console.log(this.configData);
    try {
      let requestConfig = {
        method: 'POST',
        url: this.configData.requestUrl,
        data: queryString,
        headers: {
          "Content-Type": "text/plain",
          "Authorization": configData.jwt,
          "client_id": configData.client_id,
          "client_secret": configData.client_secret
        }
      }
      let axiosResponse = await axios(requestConfig);
      return axiosResponse.data
    } catch (error) {
      console.error('There is an error connecting to the GraphQL Proxy. Here is the error response: ', error)
    }
  });

  setCurrentTierData = ((graphResponse) => {
    if(!graphResponse.user) {
      return false;
    }
    //Define the current tier of the user in question:
    let userCurrentTier = graphResponse.user.tier.currentTier;
    
    //Iterate through the market data to get the info for the tier they belong to:
    graphResponse.marketConfig.tierConfig.forEach( (tierData) => {
      if(tierData.name === userCurrentTier) {
        currentTierData = tierData;
      }
    });
  });

  setTierData = ((graphResponse) => {
    if(!graphResponse.marketConfig) {
      return false;
    }
    graphResponse.marketConfig.tierConfig.forEach((market) => {
      tierData.push(market)
    });
  });

  setSoonestToExpire = ((graphResponse) => {
    if(!graphResponse.user) {
      return false;
    }
    soonestExpiring.pointsToExpire = graphResponse.user.points.pointsToExpire;
    soonestExpiring.expirationDate = graphResponse.user.points.pointsToExpireDate;
  });

  setStatus = ((graphResponse) => {
    status = graphResponse.user ? graphResponse.user.optInStatus : false;
  });

  setWallet = ((graphResponse) => {
    if(!graphResponse.user) {
      return false;
    }
    wallet.available = graphResponse.user.points.availablePoints;
    wallet.spent = graphResponse.user.points.usedPoints;
    wallet.spentInPeriod = graphResponse.user.points.totalSpend;
    wallet.expired = graphResponse.user.points.expiredPoints;
    wallet.lifetimePointsEarned = graphResponse.user.points.lifetimePoints;
  });

  sort = ((prop, arr) => {
    prop = prop.split('.');
    let len = prop.length;
    
    arr.sort(function (a, b) {
        let i = 0;
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
  });

  return publicFunctions;
}();

//export default AnnexCloud;
module.exports = {
  AnnexCloud: AnnexCloud
}
*/