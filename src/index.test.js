import nsLoyalty from './index';
import mockAxios from 'axios';

const loyalty = new nsLoyalty.NsLoyalty({
    requestUrl: 'fullData',
    market: 'EX',
    userId: 'EX12345',
    jwt: "JWT abcdefg1234567",
    client_id: "7654321gfedcba",
    client_secret: "12345abcde"
});

const loyaltyNoUser = new nsLoyalty.NsLoyalty({
    requestUrl: 'partialData',
    market: false,
    userId: false,
    jwt: "JWT abcdefg1234567",
    client_id: "7654321gfedcba",
    client_secret: "12345abcde"
});

describe('Checking test', () => {

    Date.prototype.addDays = function(days) {
      var date = new Date(this.valueOf());
      //date.setDate(date.getDate() + days);
      return new Date(date.getTime() + (days*24*60*60*1000));
      //return date;
    }

    let format = (dateVal) => {
      return String(dateVal.getFullYear() + "-" + insertLeadingZeroes(dateVal.getMonth() + 1) + "-" + insertLeadingZeroes(dateVal.getDate()));
    }

    let insertLeadingZeroes = (dateNum) => {
      if(dateNum < 10) {
        return '0' + dateNum;
      }
      return dateNum;
    }

    let fiveDays = new Date();
    fiveDays = fiveDays.addDays(5);
    let twentyfiveDays = new Date();
    twentyfiveDays = twentyfiveDays.addDays(25);
    let seventyfiveDays = new Date();
    seventyfiveDays = seventyfiveDays.addDays(75);

    let marketConfigResponse = {
        optInStatus: 'YES',
        tierData: [
          {
            name: 'Tier1',
            purchaseIncrement: 50,
            minSpend: 50,
            purchaseRatio: 0.05,
            redemptionLimit: 0.7,
            daysToExpire: 90
          },
          {
            name: 'Tier2',
            purchaseIncrement: 50,
            minSpend: 50,
            purchaseRatio: 0.07,
            redemptionLimit: 0.7,
            daysToExpire: 90
          },
          {
            name: 'Tier3',
            purchaseIncrement: 50,
            minSpend: 50,
            purchaseRatio: 0.1,
            redemptionLimit: 0.7,
            daysToExpire: 180
          },
          {
            name: 'Tier4',
            purchaseIncrement: 0,
            minSpend: 0,
            purchaseRatio: 0,
            redemptionLimit: 0.7,
            daysToExpire: 90
          }
        ]
      }
    
    let rewardsAndCurrentTierResponse = {
        buckets: { withinSeven: [{
          actionId: 109,
          activity: "CREDIT",
          credit: 400,
          debit: null,
          displayText: "Purchase",
          orderId: "123456",
          createDate: "2019-08-20T22:05:57+0000",
          expireDate: format(fiveDays)
        }], withinThirty: 500, longTerm: 500 },
        optInStatus: 'YES',
        soonestExpiring: { pointsToExpire: 400, expirationDate: format(fiveDays) },
        userTier: {
          name: 'Tier4',
          purchaseIncrement: 0,
          minSpend: 0,
          purchaseRatio: 0,
          redemptionLimit: 0.7,
          daysToExpire: 90
        },
        wallet: {
          available: 1400,
          spent: 250,
          spentInPeriod: 1500,
          expiredPoints: 0,
          lifetimePointsEarned: 1500,
          expired: 0
        }
      }

    let walletAndSoonestExpireResponse = {
        optInStatus: 'YES',
        soonestExpiring: { pointsToExpire: 400, expirationDate: format(fiveDays) },
        wallet: {
          available: 1400,
          spent: 250,
          spentInPeriod: 1500,
          expiredPoints: 0,
          lifetimePointsEarned: 1500,
          expired: 0
        }
      }      
      
    let allActivityResponse = {
        activity: [
          {
            actionId: 148,
            activity: "DEBIT",
            credit: null,
            debit: 100,
            displayText: "Return",
            orderId: "123456",
            createDate: "2019-08-20T22:40:17+0000",
            expireDate: null
          },
          {
            actionId: 107,
            activity: "CREDIT",
            credit: null,
            debit: 250,
            displayText: "107 Debit",
            orderId: "123456",
            createDate: "2019-08-20T22:05:57+0000",
            expireDate: null
          },
          {
            actionId: 109,
            activity: "CREDIT",
            credit: 500,
            debit: null,
            displayText: "Purchase",
            orderId: "123456",
            createDate: "2019-08-20T22:05:57+0000",
            expireDate: format(fiveDays)
          },
          {
            actionId: 109,
            activity: "CREDIT",
            credit: 500,
            debit: null,
            displayText: "Purchase",
            orderId: "1234567",
            createDate: "2019-08-19T15:50:07+0000",
            expireDate: format(twentyfiveDays)
          },
          {
            actionId: 109,
            activity: "CREDIT",
            credit: 500,
            debit: null,
            displayText: "Purchase",
            orderId: "12345678",
            createDate: "2019-08-12T16:01:35+0000",
            expireDate: format(seventyfiveDays)
          }
        ],
        buckets: { withinSeven: [{
          actionId: 109,
          activity: "CREDIT",
          credit: 400,
          debit: null,
          displayText: "Purchase",
          orderId: "123456",
          createDate: "2019-08-20T22:05:57+0000",
          expireDate: format(fiveDays)
        }], withinThirty: 500, longTerm: 500 },
        optInStatus: 'YES',
        soonestExpiring: { pointsToExpire: 400, expirationDate: format(fiveDays) },
        tierData: [
          {
            name: 'Tier1',
            purchaseIncrement: 50,
            minSpend: 50,
            purchaseRatio: 0.05,
            redemptionLimit: 0.7,
            daysToExpire: 90
          },
          {
            name: 'Tier2',
            purchaseIncrement: 50,
            minSpend: 50,
            purchaseRatio: 0.07,
            redemptionLimit: 0.7,
            daysToExpire: 90
          },
          {
            name: 'Tier3',
            purchaseIncrement: 50,
            minSpend: 50,
            purchaseRatio: 0.1,
            redemptionLimit: 0.7,
            daysToExpire: 180
          },
          {
            name: 'Tier4',
            purchaseIncrement: 0,
            minSpend: 0,
            purchaseRatio: 0,
            redemptionLimit: 0.7,
            daysToExpire: 90
          }
        ],
        userTier: {
          name: 'Tier4',
          purchaseIncrement: 0,
          minSpend: 0,
          purchaseRatio: 0,
          redemptionLimit: 0.7,
          daysToExpire: 90
        },
        wallet: {
          available: 1400,
          spent: 250,
          spentInPeriod: 1500,
          expiredPoints: 0,
          lifetimePointsEarned: 1500,
          expired: 0
        }
      }

    let noMarketNoUser = {
      optInStatus: false,
      tierData: []
    }

    it('Should return market config', () => {
        expect(loyalty.getMarketConfig()).resolves.toMatchObject(marketConfigResponse);
    });

    it('Should return rewards and current tier info', () => {
        expect(loyalty.getRewardsBucketsAndCurrentTierData()).resolves.toMatchObject(rewardsAndCurrentTierResponse);
    });

    it('Should return wallet and soonest to expire', () => {
        expect(loyalty.getWalletAndSoonestToExpire()).resolves.toMatchObject(walletAndSoonestExpireResponse);
    });

    it('Should return all info', () => {
        expect(loyalty.getAllLoyaltyInfo()).resolves.toMatchObject(allActivityResponse);
    });

    it('Test scenario with no user or market config returned', async () => {
      loyalty.resetLoyaltyObject();
      let axiosResponse = await mockAxios.post();
      
      //Change the user object to nonexistent:
      axiosResponse.data.user = null;
      axiosResponse.data.marketConfig = null;
      expect(loyalty.createActivityArray([])).toHaveLength(0);
      expect(loyalty.createAndSetBucketsFromActivity(axiosResponse.data)).toBeFalsy();
      expect(loyalty.setSoonestToExpire(axiosResponse.data)).toBeFalsy();
      expect(loyalty.setStatus(axiosResponse.data)).toBeFalsy();
      expect(loyalty.setWallet(axiosResponse.data)).toBeFalsy();
      expect(loyalty.setTierData(axiosResponse.data)).toBeFalsy();
    });

    it('Should return data without a user or a tier', () => {
      loyalty.resetLoyaltyObject();
      expect(loyaltyNoUser.getAllLoyaltyInfo()).resolves.toMatchObject(noMarketNoUser);
    })
});