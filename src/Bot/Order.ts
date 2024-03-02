import { Bot, Log } from "./Bot";
import { PairItem } from "./Pair";
import { v4 as uuidv4 } from 'uuid';
import { ExchangeItem } from "./Exchange";
import { isPercentage, toFixedNumber } from "./Helper";

export enum OrderAction {
	Close = 'Close',
	Edit = 'Edit',
	None = 'None',
	Open = 'Open',
	Get = 'Get',
}

export enum OrderSide {
	Buy = 'Buy',
	Sell = 'Sell',
	Unknown = 'Unknown',
};

export enum OrderStatus {
	Cancel = 'Cancel',
	Close = 'Close',
	Edit = 'Edit',
	Error = 'Error',
	Expired = 'Expired',
	Open = 'Open',
	Pending = 'Pending',
	Unknown = 'Unknown',
};

export enum OrderType {
	Market = 'Market',
	Limit = 'Limit',
	TakeProfit = 'TakeProfit',
	StopLoss = 'StopLoss',
	Unknown = 'Unknown',
};

export type OrderData = {
	[index: string]: any,
	closeTime?: number,
	dryrun?: boolean,
	expireTime?: number,
	inSync?: boolean,
	limitPrice?: string, // for stop limit triggers?
	name?: string,
	openTime?: number,
	pair?: PairItem,
	price?: string,
	priceActual?: number,
	quantity?: string,
	quantityActual?: number,
	quantityFilled?: number,
	referenceId?: number | string;
	related?: OrderItem,
	responseStatus?: OrderStatus,
	responseTime?: number,
	side?: OrderSide,
	startTime?: number,
	status?: OrderStatus,
	stopPrice?: string,
	transactionId?: string[],
	type?: OrderType,
	updateTime?: number,
	uuid?: string,
}

// TODO: Consolidate with `OrderData`? - Split out?
// MOVE TO `ExchangeOrderData` ?
export type OrderExchangeData = {
	[index: string]: any,
	closeTime?: number,
	expireTime?: number,
	limitPrice?: string,
	openTime?: number,
	price?: string,
	quantity?: string,
	quantityFilled?: number,
	referenceId?: number | string,
	status?: OrderStatus,
	responseTime?: number,
	side?: OrderSide,
	startTime?: number,
	stopPrice?: string,
	transactionId?: string[],
	type?: OrderType,
}

export class OrderItem implements OrderData {
	[index: string]: any,
	closeTime: number = 0;
	dryrun: boolean = true;
	expireTime: number = 0;
	limitPrice: string = '0';
	name?: string;
	openTime?: number = 0;
	pair: PairItem;
	price: string = '0';
	priceActual?: number = 0;
	quantity: string = '0';
	quantityActual: number = 0;
	quantityFilled: number = 0;
	referenceId: number = 0;
	related?: OrderItem;
	responseStatus: OrderStatus = OrderStatus.Unknown;
	responseTime: number = 0;
	side: OrderSide = OrderSide.Buy;
	startTime: number = 0;
	status: OrderStatus = OrderStatus.Unknown;
	stopPrice: string = '0';
	transactionId: string[] = [];
	type?: OrderType = OrderType.Unknown;
	updateTime: number = 0;
	uuid: string;

	constructor (
		_: OrderData,
	) {
		if (!_.pair)
			throw new Error(`Pair information is required.`);

		this.update(_);

		this.pair = _.pair;
		this.uuid = _.uuid ?? uuidv4();
	}

	isFilled() {
		return this.quantityActual === this.quantityFilled;
	}

	nextAction () {

		// Response status does not match status, test for next action
		if (

			// Unconfirmed
			!this.responseTime

			// Unknown state
			|| this.status === OrderStatus.Unknown

			// Status mismatch
			|| this.responseStatus !== this.status
		) {

			// Has no transaction ID
			if (
				!this.transactionId.length
			) {
				switch (this.status) {
					case OrderStatus.Open:
						return OrderAction.Open;
				}
			}
			
			// Order has a transaction ID
			else {
				switch (this.status) {
					case OrderStatus.Close:
						return OrderAction.Close;
					case OrderStatus.Edit:
						return OrderAction.Edit;
					default:
						return OrderAction.Get;
				}
			}
		}

		return OrderAction.None;
	}

	async setPrice (
		price: string,
	) {
		try {
			let priceActual: number = 0;

			const ticker = await this.pair.exchange.getTicker(this.pair);

			if (isPercentage(price)) {
				const pricePercent = Number(
					price.substring(0, price.length - 1)
				);

				const tickerPrice = Number(ticker?.price);
				if (!tickerPrice)
					throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Price is zero`);

				const priceChange = (tickerPrice / 100) * pricePercent;
				priceActual = tickerPrice + priceChange;
			} else
				priceActual = Number(price);

			if (priceActual <= 0)
				throw new Error(`Order '${this.name}'; Price is zero`);

			// Prune any extraneous decimals
			priceActual = toFixedNumber(
				priceActual,
				Number(ticker?.decimals)
			);

			// Bot.log(`Order '${this.name}'; Actual price: ${priceActual}`);

			this.price = price;
			this.priceActual = priceActual;

			return true;
		} catch (error) {
			Bot.log(error, Log.Err);

			return false;
		}
	}

	async getTicker () {
		try {
			return await this.pair.exchange.getTicker(this.pair);
		} catch (error) {
			Bot.log(error, Log.Err);
		}
	}

	async getBalanceA () {
		try {
			return await this.pair.exchange.getBalance(this.pair.a.symbol);
		} catch (error) {
			Bot.log(error, Log.Err);
		}
	}

	async getBalanceB () {
		try {
			return await this.pair.exchange.getBalance(this.pair.b.symbol);
		} catch (error) {
			Bot.log(error, Log.Err);
		}
	}

	async setQuantity (
		quantity: string,
	) {
		let quantityActual: number = 0;

		const ticker = await this.getTicker();
		if (!ticker)
			throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Failed to get ticker data`);

		const balanceA = await this.getBalanceA();
		if (!balanceA)
			throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Failed to get balance`);

		const balanceB = await this.getBalanceB();
		if (!balanceB)
			throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.b.name}'; Failed to get balance`);

		if (isPercentage(quantity)) {
			const quantityPercent = Number(
				quantity.substring(0, quantity.length - 1)
			);

			switch (this.side) {

				// Buy order
				case OrderSide.Buy:

					// Percentage of balance B
					if (!this.quantityActual) {
						if (!balanceB?.available || balanceB.available <= 0)
							throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.b.name}'; Balance is zero`);

						if (quantityPercent < 0) {
							quantityActual = 0;
							break;
						}

						if (quantityPercent > 100) {
							quantityActual = balanceB.available;
							break;
						}

						let targetPrice = 0;
						switch (this.type) {
							case OrderType.Market:
								targetPrice = Number(ticker.price);
								break;
							default:
								targetPrice = Number(this.priceActual);
						}

						if (!targetPrice)
							throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Price unknown`);

						quantityActual = ((balanceB.available / 100) * quantityPercent) / targetPrice;

						Bot.log(`Order '${this.name}'; Quantity derived as percentage '${quantity}', of pair '${this.pair.b.name}' balance '${balanceB.available}', for '${quantityActual}', at '${targetPrice}'`, Log.Verbose);

						break;
					}

					// Percentage of the current quantity
					quantityActual = this.quantityActual + ((this.quantityActual / 100) * quantityPercent);

					Bot.log(`Order '${this.name}'; Quantity derived as percentage '${quantity}', of quantity '${this.quantityActual}', for '${quantityActual}'`, Log.Verbose);

					break;

				// Sell order
				case OrderSide.Sell:

					// Percentage of balance A
					if (!this.quantityActual) {
						if (!balanceA?.available || balanceA.available <= 0)
							throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Balance is zero`);

						if (quantityPercent < 0) {
							quantityActual = 0;
							break;
						}
						
						if (quantityPercent > 100) {
							quantityActual = balanceA.available;
							break;
						}

						let targetPrice = 0;
						switch (this.type) {
							case OrderType.Market:
								targetPrice = Number(ticker.price);
								break;
							default:
								targetPrice = Number(this.priceActual);
						}

						if (!targetPrice)
							throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Price unknown`);

						quantityActual = ((balanceA.available / 100) * quantityPercent);

						Bot.log(`Order '${this.name}'; Quantity derived as percentage '${quantity}', of pair '${this.pair.a.name}' balance '${balanceA.available}', for '${quantityActual}', at '${targetPrice}'`, Log.Verbose);

						break;
					}

					// Percentage of the current quantity
					quantityActual = this.quantityActual + ((this.quantityActual / 100) * quantityPercent);

					Bot.log(`Order '${this.name}'; Quantity derived as percentage '${quantity}', of quantity '${this.quantityActual}', for '${quantityActual}'`, Log.Verbose);

					break;
			}
		} else {
			quantityActual = Number(quantity);

			switch (this.side) {
				case OrderSide.Buy:
					if (!balanceB?.available || balanceB.available <= 0)
						throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.b.name}'; Balance is zero`);

					if (!ticker?.price)
						throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Price unknown`);

					if (balanceB.available < quantityActual * ticker.price)
						throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Not enough balance`);

					break;

				case OrderSide.Sell:
					if (!balanceA?.available || balanceA.available <= 0)
						throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Balance is zero`);

					if (balanceA.available < quantityActual)
						throw new Error(`Order '${this.name}'; Pair '${this.pair.name}'; Asset '${this.pair.a.name}'; Not enough balance`);

					break;

				default:
					throw new Error(`Order '${this.name}'; Unknown side`);
			}
		}

		if (!quantityActual || quantityActual <= 0)
			throw new Error(`Order '${this.name}'; Quantity is zero`);

		// Prune any extraneous decimals
		Bot.log(`ticker`, Log.Verbose);
		Bot.log(ticker, Log.Verbose);
		if (ticker?.decimals) {
			quantityActual = toFixedNumber(
				quantityActual,
				Number(ticker?.decimals),
			);
		}

		// Bot.log(`Order '${this.name}'; Actual quantity: ${quantityActual}`);

		this.quantity = quantity;
		this.quantityActual = quantityActual;
	}

	async execute (
		_?: OrderAction
	) {

		const priceResult = await this.setPrice(this.price);
		if (!priceResult)
			throw new Error(`Order '${this.name}'; Price required for this type`);

		// Check quantity
		await this.setQuantity(this.quantity);

		let orderResponse: OrderExchangeData | undefined;
		
		// Build log message
		let logParts: string[] = [];
		let logType: Log = Log.Info;

		logParts.push(`Order '${this.name}'`);
		logParts.push(`Pair '${this.pair.name}'`);

		// Determine next action with exchange
		const action = _ ?? this.nextAction();

		logParts.push(`Action '${action}'`);

		switch (action) {
			case OrderAction.Close:
				logParts.push(`Close`);
				orderResponse = await this.pair.exchange.api?.closeOrder(this);
				break;

			case OrderAction.Open:
				logParts.push(`Open`);
				orderResponse = await this.pair.exchange.api?.openOrder(this);
				break;

			case OrderAction.Edit:
				logParts.push(`Edit`);
				orderResponse = await this.pair.exchange.api?.editOrder(this);
				break;

			case OrderAction.Get:
				logParts.push(`Get`);
				orderResponse = await this.pair.exchange.api?.getOrder(this);
				break;

			default:
				logParts.push(`None`);
				logType = Log.Verbose;
				break;
		}

		if (orderResponse) {

			// Order response contains higher confirmation time
			if (
				orderResponse.responseTime
				&& orderResponse.responseTime > this.responseTime
			) {
				logParts.push(`Confirmed '${orderResponse.status},${orderResponse.responseTime}'`);
			}

			// Log order response values
			logParts.push(`Type '${this.type}'`);
			if (
				orderResponse.price
				&& Number(orderResponse.price) > 0
			)
				logParts.push(`Price '${orderResponse.price}'`);
			logParts.push(`Side '${this.side}'`);
			if (
				orderResponse.stopPrice
				&& Number(orderResponse.stopPrice) > 0
			)
				logParts.push(`Stop '${orderResponse.stopPrice}'`);
			logParts.push(`Qty '${orderResponse.quantity ?? this.quantity}'`);
		}

		// Is a dry-run order
		if (this.dryrun)
			logParts.unshift('DRYRUN');

		Bot.log(logParts.join('; '), logType);

		return orderResponse;
	}

	update (
		_: OrderData
	) {
		this.dryrun = _.dryrun ?? Bot.dryrun;
		if (_.name)
			this.name = _.name;
		if (_.pair)
			this.pair = _.pair;
		if (_.price)
			this.price = _.price;
		if (_.priceActual)
			this.priceActual = _.priceActual;
		if (_.quantity)
			this.quantity = _.quantity;
		if (_.quantityActual)
			this.quantityActual = _.quantityActual;
		if (_.quantityFilled)
			this.quantityFilled = _.quantityFilled;
		if (_.related)
			this.related = _.related;
		if (_.responseTime)
			this.responseTime = _.responseTime;
		if (_.side)
			this.side = _.side;
		if (_.status)
			this.status = _.status;
		if (_.stopPrice)
			this.stopPrice = _.stopPrice;
		if (_.transactionId)
			this.transactionId = _.transactionId;
		if (_.type)
			this.type = _.type;
		if (_.updateTime)
			this.updateTime = _.updateTime;
	}
}

export const Order = {
	async new (
		_: OrderData,
	): Promise<OrderItem> {
		let item = new OrderItem(_);
		let uuid = Bot.setItem(item);

		return Bot.getItem(uuid);
	},
};