import { v4 as uuidv4 } from 'uuid';
import { Bot } from "./Bot";
import { PairItem } from "./Pair";

export type ChartData = {
	dataset?: ChartCandleData,
	lastUpdateTime?: number, // Milliseconds
	name?: string,
	pair: PairItem,
	pollTime?: number, // Seconds
	candleTime?: number, // Seconds
	uuid?: string,
};

export type ChartCandleData = {
	[index: string]: any,
	change?: string[],
	changePercent?: string[],
	close?: string[],
	closeTime?: number[],
	high?: string[],
	low?: string[],
	open?: string[],
	openTime?: number[],
	tradeCount?: number[],
	volume?: string[],
	weightedAvePrice?: string[], // TWAP
};

export class ChartItem implements ChartData {
	dataset?: ChartCandleData;
	lastUpdateTime: number;
	name?: string;
	pair: PairItem;
	pollTime: number;
	candleTime: number;
	uuid: string;

	constructor (
		data: ChartData,
	) {
		this.dataset = data.dataset;
		if (data.lastUpdateTime)
			this.lastUpdateTime = data.lastUpdateTime > 0 ? data.lastUpdateTime : 0;
		else
			this.lastUpdateTime = 0;
		if (data.name)
			this.name = data.name;
		this.pair = data.pair;
		if (data.pollTime)
			this.pollTime = data.pollTime > 0 ? data.pollTime : 60;
		else
			this.pollTime = 60;
		if (data.candleTime)
			this.candleTime = data.candleTime > 0 ? data.candleTime : 3600;
		else
			this.candleTime = 3600;
		this.uuid = data.uuid ?? uuidv4();
	}

	refresh (
		data: ChartCandleData,
	) {
		this.dataset = data;
		this.lastUpdateTime = Date.now();
		let lastUpdateDate = new Date(this.lastUpdateTime);
		Bot.log(`Chart '${this.uuid}'; Refreshed (${lastUpdateDate.toISOString()})`);
	}
}

export const Chart = {
	new (
		data: ChartData,
	): ChartItem {
		let item = new ChartItem(data);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	}
};