# TradeBot
Still in very early stages of development. Leveraging the `talib` library, via [the NPM `talib` wrapper](https://www.npmjs.com/package/talib).

Following a concept of strategies, which look for scenarios (definable sets of conditions over a number of data frames) on chart and/or technical analysis; firing events (such as buy, sell, SL, etc.), based on the number of signals within a given time frame.

## Structure
Here is a basic overview of how the bot is currently structured. Subject to change, as this project is still in development.

### Subscribing to `Timeframe` changes
```
Bot.subscribe({
  action: () => {},
  chart: chartKrakenEthBtc4h,
  condition: [
    ['total', '>=', '3'],
  ],
  name: 'buyEthBtcKraken',
  timeframeAny: [
    defaultTimeframe,
  ],
});
```

### `Timeframe`
Run over `intervalTime`, checking one or more `Strategy`. Matches will `Bot.despatch()` to any `Timeframe` subscribers.

Note: A `Timeframe` uses only milliseconds. Everything else is in seconds.

```
let defaultTimeframe = Timeframe.new({
  intervalTime: 1000, // 1 second
  maxTime: 86400000 * 30, // last 30 days
  strategy: [
    stratBullishSma20Cross,
  ],
});

setTimeout(function () {
  defaultTimeframe.deactivate();
}, 2000);
```

### `Strategy` (belonging to a `Timeframe`)
One or more `Analysis` result sets, for a given `Chart`, looking for one or more `Scenario` condition matches (which can trigger an optional chained `Strategy`).

```
let stratBullishSma20Cross = Strategy.new({
  action: [
    [scenarioSma20CrossUp],
  ],
  analysis: [
    analysisSma20,
  ],
  chart: chartKrakenEthBtc4h,
  name: 'BullishSma20Cross',
});
```

### `Scenario` (belonging to a `Strategy`)
One or more sets of conditions against one or more sets of `Analysis` and/or `Chart` metrics.

```
const Sma20CrossUp = Scenario.new({
  analysis: [
    analysisSma20,
  ],
  condition: [

    // Three candles back
    [
      ['close', '<', 'outReal'],
    ],

    // Two...
    [
      ['close', '<', 'outReal'],
    ],

    // Previous candle
    [
      ['close', '>=', 'outReal'],
    ],

    // Latest candle
    [
      ['close', '>=', 'outReal'],
    ],
  ],
  name: 'scenarioSma20CrossUp',
});
```

### `Analysis` (belonging to a `Strategy` and/or `Scenario`)
A light `talib` wrapper, with configuration.

```
const analysisSma20 = Analysis.new({
  name: 'SMA20',
  config: {
    inRealField: 'close',
    optInTimePeriod: 20,
    // startIndex: 20, // Force offset of TA, to chart datapoints
  },
  type: 'SMA',
});
```

### `Chart` (belonging to an `Exchange`)
Collection of data points for a `Chart` with `Pair` of `Asset`, for a `candleTime`, updated every `pollTime`, sourced from storage.

```
let chartKrakenEthBtc4h = Chart.new({
  exchange: exchangeKraken,
  pair: pairEthBtc,
  pollTime: 300, // 5m in seconds
  candleTime: 14400 // 4h in seconds
});
```

### `Asset` (belonging to a `Pair`)
TBC

```
let assetEth = Asset.new({
  exchange: exchangeKraken,
  symbol: 'ETH'
});

let assetBtc = Asset.new({
  exchange: exchangeKraken,
  symbol: 'BTC'
});

let pairEthBtc = Pair.new({
  a: assetEth,
  b: assetBtc
});
```

### `Exchange`
A potential source of `Chart` data, or destination for `Exchange` actions. I.e. based on a `Bot.subscribe()` despatch to open/close a `Position`.

```
const exchangeKraken = Kraken.new({
  name: 'Kraken',
  key: process.env.KRAKEN_CLIENT_KEY,
  secret: process.env.KRAKEN_CLIENT_SECRET,
});
```

## Storage
All created items (i.e. `Pair.new()`) are kept in a simple global storage system, identified by their own UUID. Using `Bot.setItem(object): uuid` and `Bot.getItem(uuid): object`

## Todo

- Monitor strategy signals within a timeframe; At Nth, trigger buy, sell, SL, etc.
- Progressive chart for active strategies (currently parses the entire dataset).
- JSON/YAML support for configurations
- Expand `Bot.setItem` and `Bot.getItem` storage system (Redis, MongoDB, etc)

## Testing
Mocha, Chai (TBC)
```
npm test
```

## Development
```
tsc --watch
node dist/index.js
```

## Caveats

### `Scenario.test()`
Currrently doesn't care how many result datasets have the same output field names. If you run conditions on field names that happen to exist in more that one of the provided datasets, it will skew your `conditionMatch` count, thus invalidating your scenario. Changing all dataset output field names, would mitigate this.