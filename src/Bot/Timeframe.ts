import { v4 as uuidv4 } from 'uuid';
import { Bot, BotEvent, Log } from './Bot';
import { ChartCandleData } from './Chart';
import { StrategyItem } from "./Strategy";

export type TimeframeData = {
	interval?: any,
	intervalTime?: number, // Milliseconds
	lastRunTime?: number, // Milliseconds
	keepalive?: boolean,
	name?: string,
	pollTime?: number, // Milliseconds
	strategy: Array<StrategyItem>,
	uuid?: string,
	windowTime?: number, // Milliseconds
}

export class TimeframeItem implements TimeframeData {
	interval: any;
	intervalTime: number;
	keepalive: boolean;
	lastRunTime: number;
	name?: string;
	pollTime: number;
	result: object[] = [];
	resultIndex: string[] = [];
	strategy: Array<StrategyItem>;
	uuid: string;
	windowTime: number;

	constructor (
		data: TimeframeData,
	) {
		if (data.lastRunTime)
			this.lastRunTime = data.lastRunTime > 0 ? data.lastRunTime : 0;
		else
			this.lastRunTime = 0;
		this.interval = 0;
		if (data.intervalTime)
			this.intervalTime = data.intervalTime > 0 ? data.intervalTime : 60000;
		else
			this.intervalTime = 60000;
		if (data.hasOwnProperty('keepalive'))
			this.keepalive = data.keepalive ? true : false;
		else
			this.keepalive = true;
		if (data.name)
			this.name = data.name;
		if (data.pollTime)
			this.pollTime = data.pollTime > 0 ? data.pollTime : 60000;
		else
			this.pollTime = 60000;
		this.strategy = data.strategy;
		this.uuid = data.uuid ?? uuidv4();
		if (data.windowTime)
			this.windowTime = data.windowTime > 0 ? data.windowTime : 900000;
		else
			this.windowTime = 900000;

		// Start the interval, if timeframe is marked as active
		if (this.keepalive === true) {
			setTimeout(
				function (timeframe) {
					timeframe.execute();
				},
				10,
				this
			);
			this.activate();
		}
	}

	activate () {
		this.keepalive = true;
		this.interval = setInterval(
			function (timeframe) {
				timeframe.execute();
			},
			this.intervalTime,
			this
		);
	}

	deactivate () {
		this.keepalive = false;
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
		if (!this.keepalive)
			Bot.log(`Timeframe '${this.uuid}' executed manually.`);

		const now = Date.now();

		if ((now - this.lastRunTime) >= this.intervalTime) {

			// Clear result set for new execution
			this.result = [];
			this.resultIndex = [];

			// Bot.log(`Last run: ${this.lastRunTime}`);
			// Bot.log(`Since last run: ${now - this.lastRunTime}`);
			
			// Process strategies
			for (let i = 0; i < this.strategy.length; i++) {
				let strategy = this.strategy[i];

				// Request chart updates, for strategy
				if ((now - strategy.chart.lastUpdateTime) >= strategy.chart.pollTime) {
					let date = new Date(strategy.chart.lastUpdateTime);

					Bot.log(`Strategy '${strategy.uuid}' chart '${strategy.chart.uuid}' to be synced from: ${date.toISOString()}`);

					try {
						await strategy.chart.exchange.syncChart(
							strategy.chart
						);
					} catch (err) {
						Bot.log(err as string, Log.Err);
					}
				}

				// Try strategy
				try {
					let signal = strategy.execute({
						windowTime: this.windowTime,
						timeframe: this,
					});

					// Duplicate strategy result set within this timeframe
					// if (this.getResult(strategy))
					// 	throw (`Timeframe '${this.name}', strategy '${strategy.name}' result duplication.`);

					this.result.push(signal);
					this.resultIndex.push(strategy.uuid);
				} catch (err) {
					Bot.log(err as string, Log.Err);
				}
			}

			// Send a despatch to indicate the timeframe has results.
			if (this.result.length) {
				Bot.despatch({
					event: BotEvent.TimeframeResult,
					uuid: this.uuid,
				});
			}

			this.lastRunTime = now;
		}
	}
}

export const Timeframe = {
	new (
		data: TimeframeData,
	): TimeframeItem {
		let item = new TimeframeItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};