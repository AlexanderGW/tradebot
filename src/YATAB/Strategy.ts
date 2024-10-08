import { AnalysisResultData, AnalysisItem, AnalysisExecuteResultData } from "./Analysis";
import { YATAB, Log } from "./YATAB";
import { ChartCandleData, ChartItem } from "./Chart";
import { ScenarioConditionMatch, ScenarioItem, getFieldData } from "./Scenario";
import { v4 as uuidv4 } from 'uuid';
import { TimeframeItem } from "./Timeframe";

const talib = require('talib');

export type StrategyData = {
	analysis: AnalysisItem[],
	chart: ChartItem,
	name?: string,
	action: Array<[ScenarioItem, StrategyItem?]>,
	uuid?: string,
}

export type StrategyExecuteData = {
	timeframe: TimeframeItem,
}

export class StrategyItem implements StrategyData {
	analysis: AnalysisItem[];
	chart: ChartItem;
	name?: string;
	uuid: string;
	result: Array<AnalysisResultData> = [];
	resultIndex: string[] = [];
	action: Array<[ScenarioItem, StrategyItem?]>;

	constructor (
		_: StrategyData,
	) {
		this.analysis = _.analysis;
		this.chart = _.chart;
		if (_.name)
			this.name = _.name;
		this.action = _.action;
		this.uuid = _.uuid ?? uuidv4();
	}

	/**
	 * Replace `Chart` data
	 * 
	 * @param chart 
	 */
	setChart (
		chart: ChartItem
	) {
		this.chart = chart;
	}

	/**
	 * Return (if exists) previously executed analysis
	 * 
	 * @param analysis 
	 * @returns 
	 */
	getResult (
		analysis: AnalysisItem
	): AnalysisResultData | boolean {
		let index = this.resultIndex.findIndex(_uuid => _uuid === analysis.uuid);

		if (index >= 0)
			return this.result[index];
		return false;
	}

	/**
	 * Execute all analysis on the strategy
	 */
	execute (
		_: StrategyExecuteData,
	) {
		if (!this.chart.dataset)
			throw new Error(`Chart '${this.chart.name}' dataset is empty`);
			
		let analysis: AnalysisItem;
		let i: number;
		let action: [ScenarioItem, StrategyItem?];

		let signal: Array<Array<Array<ScenarioConditionMatch>>> = [];

		// Process analysis
		for (i = 0; i < this.analysis.length; i++) {
			analysis = this.analysis[i];

			let inReal: number[] | string[] = [];
			let inRealClass: string = '';
			let inRealField: string = '';
			if (analysis?.config?.inRealField) {
				const fieldResult = getFieldData(analysis.config.inRealField);
				inRealClass = String(fieldResult.fieldClass);
				inRealField = fieldResult.fieldName;
			}

			// Source the result of previously executed analysis
			if (analysis.config?.inRealAnalysis) {
				if (!inRealField)
					throw new Error('Analysis dataset input field is unknown.');

				let analysisResult = this.getResult(analysis.config.inRealAnalysis);
				if (analysisResult === false)
					throw new Error('No result found for provided analysis, make sure it executes before this analysis.');

				if (typeof analysisResult === 'object' && analysisResult.result) {
					let resultValue = analysisResult.result[inRealField as keyof AnalysisExecuteResultData];
					if (resultValue)
						inReal = resultValue;
				}
			}

			// Source chart data
			else if (analysis.config?.inRealField) {
				if (this.chart.dataset?.hasOwnProperty(inRealField)) {
					const resultValue = this.chart.dataset[inRealField as keyof ChartCandleData];
					if (resultValue)
						inReal = resultValue;
				}
			}

			if (!inReal)
				throw new Error(`Analysis '${analysis.name}' dataset input '${inReal}' is empty.`);

			// Prepare talib options
			let executeOptions = {
				name: analysis.type,
				startIdx: 0,
				...analysis.config,
				endIdx: inReal.length - 1,
				inReal: inReal,
			};

			// Execute
			let result: AnalysisResultData = talib.execute(executeOptions);

			// console.log(result);

			// Store results
			this.result.push(result);
			this.resultIndex.push(analysis.uuid);
		}

		// Process actions
		for (i = 0; i < this.action.length; i++) {
			action = this.action[i];

			// Add specified analysis results, to the test dataset
			let analysis: AnalysisItem;
			let result;
			let analysisData: Array<[AnalysisItem, AnalysisResultData]> = [];
			if (action[0].analysis) {
				for (let i = 0; i < action[0].analysis.length; i++) {
					analysis = this.analysis[i];
	
					result = this.getResult(analysis);
					if (typeof result !== 'boolean')
						analysisData.push([analysis, result]);
				}
			}

			let timeField: string = '';
			if (this.chart.dataset?.openTime)
				timeField = 'openTime';
			else if (this.chart.dataset?.closeTime)
				timeField = 'closeTime';

			// Test scenario conditions against analysis, or candle metrics
			try {
				signal = action[0].test({
					chart: this.chart,
					analysisData: analysisData,
	
					// Optional `Strategy` to execute on a `Scenario` match
					strategy: action[1],
					strategyExecuteData: _,
				});
			} catch (error) {
				YATAB.log(error, Log.Err);
			}
		}

		return signal;
	}
}

export const Strategy = {
	new (
		_: StrategyData,
	): StrategyItem {
		let item = new StrategyItem(_);
		let uuid = YATAB.setItem(item);

		return YATAB.getItem(uuid) as StrategyItem;
	}
};