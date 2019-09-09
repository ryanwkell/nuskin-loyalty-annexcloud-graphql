module.exports = {
    post: jest.fn((url) => {
        if(url === 'fullData/loyalty-graphql/'){
            Date.prototype.addDays = function(days) {
                var date = new Date(this.valueOf());
                return new Date(date.getTime() + (days*24*60*60*1000));
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

            return Promise.resolve({
                data: {
                    user: {
                        id: "EX12345",
                        optInStatus: "YES",
                        createDate: "2019-08-07T19:21:54+0000",
                        tier: {
                            currentTier: "Tier4",
                            nextTier: "",
                            purchaseRatio: 1,
                            pointsToNextTier: 0
                        },
                        activity: {
                            pages: 1,
                            activityCount: 4,
                            activityDetail: [
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
                            ]
                        },
                        points: {
                            availablePoints: 1400,
                            lifetimePoints: 1500,
                            totalSpend: 1500,
                            usedPoints: 100,
                            expiredPoints: 0,
                            holdPoints: 0,
                            usedPointsOnReward: 0,
                            pointsToExpire: 400,
                            pointsToExpireDate: format(fiveDays),
                            spendToNextTier: 0,
                            creditsToCurrencyRatio: 1,
                            creditsToCurrencyValue: 1400
                        }
                    },
                    marketConfig: {
                        titleParticipant: 1450,
                        tierConfig: [
                            {
                                name: "Tier1",
                                purchaseIncrement: 50,
                                minSpend: 50,
                                purchaseRatio: 0.05,
                                redemptionLimit: 0.7,
                                daysToExpire: 90
                            },
                            {
                                name: "Tier2",
                                purchaseIncrement: 50,
                                minSpend: 50,
                                purchaseRatio: 0.07,
                                redemptionLimit: 0.7,
                                daysToExpire: 90
                            },
                            {
                                name: "Tier3",
                                purchaseIncrement: 50,
                                minSpend: 50,
                                purchaseRatio: 0.1,
                                redemptionLimit: 0.7,
                                daysToExpire: 180
                            },
                            {
                                name: "Tier4",
                                purchaseIncrement: 0,
                                minSpend: 0,
                                purchaseRatio: 0,
                                redemptionLimit: 0.7,
                                daysToExpire: 90
                            }
                        ]
                    }
                }
            });
        }
        else {
            return Promise.resolve({
                data: {
                    user: null,
                    marketConfig: null
                }
            });
        }
    })
};