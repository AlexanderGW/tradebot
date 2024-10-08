import { v4 as uuidv4 } from 'uuid';
import { YATAB, Log } from './YATAB';
import { ChartCandleData } from './Chart';
import { StrategyItem } from "./Strategy";

export type TimeframeData = {
	interval?: any,
	intervalTime?: number, // Milliseconds
	lastEndTime?: number, // Milliseconds
	lastStartTime?: number, // Milliseconds
	name?: string,
	pollTime?: number, // Milliseconds
	result?: Array<Array<ChartCandleData>>,
	resultIndex?: string[],
	strategy: Array<StrategyItem>,
	uuid?: string,
	windowTime?: number, // Milliseconds
}

export class TimeframeItem implements TimeframeData {
	interval: any = 0;
	intervalTime: number = 0; // Run once
	lastEndTime: number = 0;
	lastStartTime: number = 0;
	name?: string;
	pollTime: number = 60000; // Sixty seconds
	result: Array<Array<ChartCandleData>> = [];
	resultIndex: string[] = [];
	strategy: Array<StrategyItem>;
	uuid: string;
	windowTime: number = 0;

	constructor (
		_: TimeframeData,
	) {
		if (_.lastStartTime)
			this.lastStartTime = _.lastStartTime;
		if (_.intervalTime && _.intervalTime >= 1000)
			this.intervalTime = _.intervalTime;
		if (_.name)
			this.name = _.name;
		if (_.pollTime && _.pollTime >= 1000)
			this.pollTime = _.pollTime;
		this.strategy = _.strategy;
		this.uuid = _.uuid ?? uuidv4();
		// TODO: Support empty value - number of candles based on strategy analysis input lengths + scenario condition length, etc.
		if (_.windowTime && _.windowTime >= 1000)
			this.windowTime = _.windowTime;
	}

	activate () {

		// Default to 10000ms
		if (!this.intervalTime)
			this.intervalTime = 10000;

		this.interval = setInterval(
			async function (timeframe) {
				await timeframe.execute();
			},
			this.intervalTime,
			this
		);
	}

	deactivate () {
		clearInterval(this.interval);
	}

	/**
	 * Return (if exists) previously collected strategy results
	 * 
	 * @param strategy 
	 * @returns 
	 */
	getResult (
		strategy: StrategyItem
	) {
		let index = this.resultIndex.findIndex(_uuid => _uuid === strategy.uuid);

		if (index >= 0)
			return this.result[index];
		return false;
	}

	async execute () {
		const startTime = Date.now();

		let logLine = `Timeframe '${this.name}'; Executed`;
		if (this.intervalTime)
			logLine = `${logLine}; Interval '${this.intervalTime}ms'`;
		if (this.lastStartTime) {
			logLine = `${logLine}; Last run '${this.lastStartTime}'`;
			logLine = `${logLine}; Time since '${startTime - this.lastStartTime}ms''`;
		}
		YATAB.log(logLine);

		// if ((startTime - this.lastStartTime) < this.intervalTime)
		// 	throw new Error(`Timeframe '${this.name}'; Interval time has not yet passed`);

		// Clear result set for new execution
		this.result = [];
		this.resultIndex = [];
		
		// Process strategies
		for (let i = 0; i < this.strategy.length; i++) {
			let strategy = this.strategy[i];

			// Use `windowTime` if chart doesn't have `datasetNextTime`
			if (!strategy.chart.datasetNextTime)
				strategy.chart.datasetNextTime = Date.now() - this.windowTime;

			if (

				// If timeframe chart syncing is not disabled
				(!process.env.BOT_TIMEFRAME_CHART_SYNC || process.env.BOT_TIMEFRAME_CHART_SYNC === '1')

				// Chart is overdue `pollTime`
				&& (startTime - strategy.chart.datasetSyncTime) >= strategy.chart.pollTime
			) {
				try {
					await strategy.chart.pair.exchange.syncChart(
						strategy.chart
					);
					strategy.chart.datasetSyncTime = Date.now();
				} catch (error) {
					YATAB.log(error, Log.Err);
				}
			}

			// Try strategy
			try {
				let signal = strategy.execute({
					timeframe: this,
				});

				// Duplicate strategy result set within this timeframe
				// if (this.getResult(strategy))
				// 	throw new Error(`Timeframe '${this.name}', strategy '${strategy.name}' result duplication.`);

				this.result.push(signal);
				this.resultIndex.push(strategy.name ?? strategy.uuid);
			} catch (error) {
				YATAB.log(error, Log.Err);
			}
		}

		this.lastEndTime = Date.now();
		YATAB.log(`Timeframe '${this.name}'; Finished; Runtime '${this.lastEndTime - startTime}ms'`);
		this.lastStartTime = startTime;
	}
}

export const Timeframe = {
	new (
		_: TimeframeData,
	): TimeframeItem {
		let item = new TimeframeItem(_);
		let uuid = YATAB.setItem(item);

		return YATAB.getItem(uuid) as TimeframeItem;
	}
};