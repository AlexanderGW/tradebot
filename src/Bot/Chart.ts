import { v4 as uuidv4 } from 'uuid';
import { Bot, Log } from "./Bot";
import { PairItem } from "./Pair";

export const chartCandleFields = [
	'change',
	'changePercent',
	'close',
	'closeTime',
	'high',
	'low',
	'open',
	'openTime',
	'tradeCount',
	'volume',
	'weightedAvePrice',
];

export type ChartData = {
	dataset?: ChartCandleData,
	datasetFile?: string,
	datasetEndTime?: number, // Milliseconds
	datasetStartTime?: number, // Milliseconds
	datasetTimeField?: string,
	datasetUpdateTime?: number, // Milliseconds
	name?: string,
	datasetNextTime?: number, // Milliseconds
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
	datasetFile?: string;
	datasetEndTime: number = 0;
	datasetStartTime: number = 0;
	datasetTimeField: string = '';
	datasetUpdateTime: number = 0;
	name?: string;
	datasetNextTime: number = 0;
	pair: PairItem;
	pollTime: number = 0;
	candleTime: number = 3600000; // One hour
	uuid: string;

	constructor (
		data: ChartData,
	) {
		this.dataset = data.dataset;
		if (data.datasetFile)
			this.datasetFile = data.datasetFile;
		if (data.datasetEndTime)
			this.datasetEndTime = data.datasetEndTime;
		if (data.datasetStartTime)
			this.datasetStartTime = data.datasetStartTime;
		if (data.datasetTimeField)
			this.datasetTimeField = data.datasetTimeField;
		if (data.datasetUpdateTime)
			this.datasetUpdateTime = data.datasetUpdateTime;
		if (data.name)
			this.name = data.name;
		if (data.datasetNextTime)
			this.datasetNextTime = data.datasetNextTime;
		this.pair = data.pair;
		if (data.pollTime)
			this.pollTime = data.pollTime;
		if (data.candleTime)
			this.candleTime = data.candleTime;
		this.uuid = data.uuid ?? uuidv4();

		if (this.datasetFile) {
			const fs = require('fs');

			if (!fs.existsSync(this.datasetFile)) {
				if (process.env.BOT_CHART_DATAFILE_FAIL_EXIT === '1')
					throw (`Chart '${this.name}'; Dataset not found '${this.datasetFile}'`);

				return;
			}

			try {
				let response: any = fs.readFileSync(
					this.datasetFile,
					'utf8',
					function (
						err: object,
						data: object
					) {
						if (err)
							console.error(err);
					}
				);
	
				let responseJson: ChartCandleData = JSON.parse(response);
				if (responseJson)
					this.dataset = responseJson;
			} catch (err) {
				Bot.log(err as string, Log.Err);
			}
		}

		this.refreshDataset();
	}

	refreshDataset () {
		let startTime: number[];
		let endTime: number[];
		let nextTime: number = 0;
		
		if (!this.datasetNextTime) {

			// Sync from when the chart was last updated
			if (this.datasetUpdateTime > 0)
				nextTime = this.datasetUpdateTime;
			
			// Get a default number of candles
			else {
				let totalCandles: number = 50;
				if (process.env.BOT_CHART_DEFAULT_CANDLE_COUNT)
					totalCandles = parseInt(process.env.BOT_CHART_DEFAULT_CANDLE_COUNT);

				nextTime = Date.now() - (this.candleTime * totalCandles)
			}
		}
		
		// Set dataset time field
		if (!this.datasetTimeField?.length) {
			let timeField: string = '';
			if (this.dataset?.openTime)
				timeField = 'openTime';
			else if (this.dataset?.closeTime)
				timeField = 'closeTime';
			
			this.datasetTimeField = timeField;
		}

		// Get first and last chart dataset candle times
		if (
			this.dataset?.hasOwnProperty(this.datasetTimeField)
			&& this.dataset[this.datasetTimeField].length
		) {
			startTime = this.dataset[this.datasetTimeField]?.slice(0, 1);
			if (startTime) {
				const value = startTime[0] * 1000;
				this.datasetStartTime = value;
			}
			
			endTime = this.dataset[this.datasetTimeField]?.slice(-1);
			if (endTime) {
				const value = endTime[0] * 1000;
				this.datasetEndTime = value;
				nextTime = value;
			}
		}

		if (nextTime)
			this.datasetNextTime = nextTime

		let logLine = `Chart '${this.name}'; Refreshed dataset'`;

		if (this.datasetTimeField)
			logLine = `${logLine}; Field '${this.datasetTimeField}'`;

		if (this.datasetStartTime) {
			let startDate = new Date(this.datasetStartTime);
			logLine = `${logLine}; Start '${startDate.toISOString()}'`;
		}

		if (this.datasetEndTime) {
			let endDate = new Date(this.datasetEndTime);
			logLine = `${logLine}; End '${endDate.toISOString()}'`;
		}

		if (this.datasetUpdateTime) {
			let updateDate = new Date(this.datasetUpdateTime);
			logLine = `${logLine}; Update '${updateDate.toISOString()}'`;
		}

		if (this.datasetNextTime) {
			let nextDate = new Date(this.datasetNextTime);
			logLine = `${logLine}; Next '${nextDate.toISOString()}'`;
		}

		Bot.log(logLine);
	}

	updateDataset (
		data: ChartCandleData,
	) {
		let replaceDataset: boolean = false;
		let finalData: any = this.dataset;

		let dataLength: number = 0;
		if (data?.hasOwnProperty(this.datasetTimeField))
			dataLength = data[this.datasetTimeField].length;

		if (this.dataset) {
			if (this.datasetEndTime) {
				let datasetEndTimeIndex: number = 0;
				if (this.dataset?.hasOwnProperty(this.datasetTimeField)) {
					datasetEndTimeIndex = this.dataset[this.datasetTimeField].lastIndexOf(this.datasetEndTime / 1000);
					if (datasetEndTimeIndex < 0)
						datasetEndTimeIndex = this.dataset[this.datasetTimeField].length;
				}
				// console.log(`datasetEndTimeIndex: ${datasetEndTimeIndex}`);
				
				let dataEndTimeIndex: number = data[this.datasetTimeField].lastIndexOf(this.datasetEndTime / 1000);
				// console.log(`dataEndTimeIndex: ${dataEndTimeIndex}`);

				let datasetOffset = datasetEndTimeIndex;
				// console.log(`datasetOffset: ${datasetOffset}`);

				for (let i = dataEndTimeIndex; i < data[this.datasetTimeField].length; i++) {
					for (let j in chartCandleFields) {
						let field = chartCandleFields[j];
						if (data.hasOwnProperty(field) && data[field][i] && finalData[field]) {
							// console.log(`finalData[${field}][${datasetOffset}] = data[${field}][${i}]`);
							finalData[field][datasetOffset] = data[field][i];
						}
						
					}
					datasetOffset++;
				}
			} else
				replaceDataset = true;
		} else
			replaceDataset = true;

		// Replace dataset with new data
		if (replaceDataset)
			finalData = data;

		this.dataset = finalData;
		this.datasetUpdateTime = Date.now();
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