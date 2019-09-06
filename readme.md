# ns-loyalty

This library handles the interaction with the service layer for retrieving information about the loyalty program and the user's loyalty information.

### Installing

All that is needed for adding this to your project is including the library in your package.json like so:

yarn add @nuskin/ns-loyalty

## How to use in your project.

Once you have imported the library into your project, you can use it like you see here:

```
let loyaltyConfig = {
    requestUrl: 'https://example.url.nuskin.com',
    market: 'EX',
    userId: 'EX0123456',
    jwt: "JWT abcdefg1234567",
    client_id: "gfedcba7654321",
    client_secret: "12345abcde",
}

let loyalty = new nsLoyalty.NsLoyalty(loyaltyConfig);

loyalty.getAllLoyaltyInfo().then(response => {
    let value = response;
    doSomethingWith(value);
});
```

As you likely noticed, the library expects an object in the constructor with the following data points:

```
let loyaltyConfig = {
    requestUrl: 'https://example.url.nuskin.com', // This can be retrieved from ConfigService.getMarketConfig().awsUrl
    market: 'EX', // This can be retrieved from the UserService.getUser().countryCd
    userId: 'EX0123456', // This is the id value of the user, which can be retrieved from UserService.getUser().id
    jwt: "JWT abcdefg1234567", // This is the JWT for the current user, needed to make data requests when a user is logged in.
    client_id: "gfedcba7654321", // This is the client_id for making requests through the proxy service. It can be retrieved from: 
    client_secret: "12345abcde", // This is the client_secret for making request through the proxy service. It can be retrieved from:
}
```

You pass that into the object when initializing like so:

```
let loyalty = new nsLoyalty.NsLoyalty(loyaltyConfig);
```

Now you have a loyalty object which can be used for making one of the following requests:

* getMarketConfig
* getRewardsBucketsAndCurrentTierData
* getWalletAndSoonestToExpire
* getAllLoyaltyInfo

An example would be:

```
loyalty.getMarketConfig().then((response) => {
    let doSomething = response;
});
```

Here is an example of what each returns:

### getMarketConfig

```
{
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
```

### getRewardsBucketsAndCurrentTierData

```
{
  buckets: { withinSeven: [], withinThirty: 0, longTerm: 2055 },
  optInStatus: 'YES',
  soonestExpiring: { pointsToExpire: 685, expirationDate: '2019-11-17' },
  userTier: {
    name: 'Tier4',
    purchaseIncrement: 0,
    minSpend: 0,
    purchaseRatio: 0,
    redemptionLimit: 0.7,
    daysToExpire: 90
  },
  wallet: {
    available: 2055,
    spent: 685,
    spentInPeriod: 2055,
    expiredPoints: 0,
    lifetimePointsEarned: 2740,
    expired: 0
  }
}
```

### getWalletAndSoonestToExpire

```
{
  optInStatus: 'YES',
  soonestExpiring: { pointsToExpire: 685, expirationDate: '2019-11-17' },
  wallet: {
    available: 2055,
    spent: 685,
    spentInPeriod: 2055,
    expiredPoints: 0,
    lifetimePointsEarned: 2740,
    expired: 0
  }
}
```

### getAllLoyaltyInfo

```
{
  activity: [
    {
      actionId: 148,
      activity: 'DEBIT',
      credit: null,
      debit: 685,
      displayText: 'Return',
      orderId: '0130064377',
      createDate: '2019-08-20T22:40:17+0000',
      expireDate: null
    },
    {
      actionId: 109,
      activity: 'CREDIT',
      credit: 685,
      debit: null,
      displayText: 'Purchase',
      orderId: '0130064383',
      createDate: '2019-08-20T22:05:57+0000',
      expireDate: '2019-11-18T22:05:57+0000'
    },
    {
      actionId: 109,
      activity: 'CREDIT',
      credit: 685,
      debit: null,
      displayText: 'Purchase',
      orderId: '0130064377',
      createDate: '2019-08-19T15:50:07+0000',
      expireDate: '2019-11-17T15:50:07+0000'
    },
    {
      actionId: 109,
      activity: 'CREDIT',
      credit: 1370,
      debit: null,
      displayText: 'Purchase',
      orderId: '0130064345',
      createDate: '2019-08-12T16:01:35+0000',
      expireDate: null
    }
  ],
  buckets: { withinSeven: [], withinThirty: 0, longTerm: 2055 },
  optInStatus: 'YES',
  soonestExpiring: { pointsToExpire: 685, expirationDate: '2019-11-17' },
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
    available: 2055,
    spent: 685,
    spentInPeriod: 2055,
    expiredPoints: 0,
    lifetimePointsEarned: 2740,
    expired: 0
  }
}
```

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://code.tls.nuskin.io/ns-am/loyalty/ns-loyalty/tags). 