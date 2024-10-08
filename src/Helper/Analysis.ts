import { Analysis } from "../YATAB/Analysis";
import { YATAB, Log } from "../YATAB/YATAB";

// Relative Strength Index (RSI) 14
export const Rsi14 = Analysis.new({
	name: 'RSI',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 14,
		startIndex: 14,
	},
	type: 'RSI',
});
// YATAB.log(Rsi14.explain, Log.Verbose);

// Exponential Moving Average (EMA) 20
export const Ema20 = Analysis.new({
	name: 'EMA20',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 20,
	},
	type: 'EMA',
});
// YATAB.log(Ema20.explain, Log.Verbose);

// Exponential Moving Average (EMA) 21
export const Ema21 = Analysis.new({
	name: 'EMA21',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 21,
	},
	type: 'EMA',
});
// YATAB.log(Ema21.explain, Log.Verbose);

// Exponential Moving Average (EMA) 100
export const Ema100 = Analysis.new({
	name: 'EMA100',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 100,
	},
	type: 'EMA',
});
// YATAB.log(Ema100.explain, Log.Verbose);

// Simple Moving Average (SMA) 20
export const Sma20 = Analysis.new({
	name: 'SMA20',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 20,
	},
	type: 'SMA',
});
// YATAB.log(Sma20.explain, Log.Verbose);

// Simple Moving Average (SMA) 50
export const Sma50 = Analysis.new({
	name: 'SMA50',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 50,
	},
	type: 'SMA',
});
// YATAB.log(Sma50.explain, Log.Verbose);

// Simple Moving Average (SMA) 200
export const Sma200 = Analysis.new({
	name: 'SMA200',
	config: {
		inRealField: 'candle.close',
		optInTimePeriod: 200,
	},
	type: 'SMA',
});
// YATAB.log(Sma200.explain, Log.Verbose);

// Bollinger Bands (dependent on SMA20 result)
export const Bollinger20 = Analysis.new({
	name: 'Bollinger20',
	config: {
		inRealAnalysis: Sma20,
		inRealField: 'outReal',
		optInTimePeriod: 20,
	},
	type: 'BBANDS',
});
// console.log(Bollinger20.explain, Log.Verbose);

// Moving Average Convergence/Divergence (MACD) with defaults
export const Macd12_26_9 = Analysis.new({
	name: 'MACD12_26_9',
	config: {
		inRealField: 'candle.close',
	},
	type: 'MACD',
});
// YATAB.log(Macd12_26_9.explain, Log.Verbose);