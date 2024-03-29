import { Bot, Log } from '../Bot';
import { ChartItem } from '../Chart';
import { ExchangeApiData, ExchangeApiInterface, ExchangeApiTickerData } from '../Exchange';
import { OrderItem, OrderStatus, OrderData } from '../Order';
import { PairData } from '../Pair';

export class PaperExchange implements ExchangeApiInterface {
	name: string;
	uuid: string;

	constructor (
		_: ExchangeApiData,
	) {
		this.name = _.name;
		this.uuid = _.uuid;
	}

	async closeOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderData = {
			status: OrderStatus.Close,
			responseTime: Date.now(),
		};
		Bot.log(`Exchange '${this.name}'; Order '${_.name}'; Close`);
		return orderResponse;
	}

	async openOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderData = {
			status: OrderStatus.Open,
			responseTime: Date.now(),
		};
		Bot.log(`Exchange '${this.name}'; Order '${_.name}'; Open`);
		return orderResponse;
	}

	async editOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderData = {
			status: OrderStatus.Edit,
			responseTime: Date.now(),
		};
		Bot.log(`Exchange '${this.name}'; Order '${_.name}'; Edit`);
		return orderResponse;
	}

	async getBalance () {
		return {
			balance: [],
			balanceIndex: [],
		};
	}

	async getOrder (
		_: OrderItem,
	) {
		const orderResponse: OrderData = {
			status: OrderStatus.Unknown,
			responseTime: Date.now(),
		};
		Bot.log(`Exchange '${this.name}'; Order '${_.name}'; Get`);
		return orderResponse;
	}

	async getTicker (
		_: PairData,
	) {
		return {
			ticker: [],
			tickerIndex: [],
		};
	}

	async syncChart (
		chart: ChartItem,
	) {
		
	}
}