import { expect } from 'chai';

import * as dotenv from 'dotenv';
dotenv.config();

import { Asset, AssetItem } from '../src/Bot/Asset';
import { Bot, Log } from '../src/Bot/Bot';
import { Pair, PairItem } from '../src/Bot/Pair';

import { Position, PositionItem } from '../src/Bot/Position';
import { Order, OrderAction, OrderItem, OrderSide, OrderType } from '../src/Bot/Order';
import { Exchange, ExchangeItem } from '../src/Bot/Exchange';

const fs = require('fs');

// Only test if we have a Kraken API key/secret
if (
    process.env.KRAKEN_CLIENT_KEY?.length
    && process.env.KRAKEN_CLIENT_SECRET?.length
) {
    describe('Kraken support', () => {
        let exchangeKraken: ExchangeItem;
        let assetEth: AssetItem;
        let assetBtc: AssetItem;
        let pairEthBtc: PairItem;
        let position1: PositionItem;
        let order1: OrderItem;
    
        before(async function () {
    
            // Example Kraken exchange client
            exchangeKraken = await Exchange.new({
                class: 'Kraken',
                key: process.env.KRAKEN_CLIENT_KEY,
                secret: process.env.KRAKEN_CLIENT_SECRET,
            });
    
            // Create ETH asset
            assetEth = Asset.new({
                exchange: exchangeKraken,
                symbol: 'ETH'
            });
    
            // Create BTC asset
            assetBtc = Asset.new({
                exchange: exchangeKraken,
                symbol: 'BTC'
            });
    
            // Create ETH BTC pair of assets
            pairEthBtc = Pair.new({
                a: assetEth,
                b: assetBtc
            });
    
            // Create an existing position on exchange
            position1 = Position.new({
                exchange: exchangeKraken,
                pair: pairEthBtc,
    
                // 0.1 ETH
                amount: '0.1'
            });
    
            order1 = Order.new({
    
                // Percentages can only be used if a `position` is provided, otherwise e.g. 0.01
                // For ETHBTC, this would be the amount of ETH
                amount: '10%',
    
                // NOTE: Ensure we are only testing orders, regardless of `BOT_DRYRUN`
                dryrun: true,
    
                // The exchange associated with this order
                exchange: exchangeKraken,
    
                // The trading pair, i.e. ETHBTC
                pair: pairEthBtc,
    
                // An optional `Position`
                position: position1,
    
                // Either `OrderSide.Buy`, or `OrderSide.Sell`
                side: OrderSide.Buy,
    
                // Default: Order type is `OrderType.Market`
                // type: OrderType.Market,
            });
        });
    
        it('should validate market buy order creation', async () => {
    
            // Create a market buy order, and execute create on exchange
            try {
                // NOTE: `order1` has been defined above as a market buy order
    
                // Response will contain original `order1` with any changes, such as 
                // the exchange side transaction ID, and `confirmed` should be `true` if successful
                // For the purposes of testing, we'll store the response in its own variable
                let order1CreateMarketBuy = await order1.execute(OrderAction.Create);
                console.log(order1CreateMarketBuy);
            } catch (err) {
                Bot.log(err as string, Log.Err);
            }
        });
    
        it('should validate limit buy order creation', async () => {
    
            // Create a limit buy order, and execute create on exchange
            try {
                // Modifying `order1`
                // Price. For ETHBTC, This would be at the price of BTC
                order1.price = '0.01';
        
                // Type of order 
                order1.type = OrderType.Limit;
    
                // Response will contain original `order1` with any changes, such as 
                // the exchange side transaction ID, and `confirmed` should be `true` if successful
                // For the purposes of testing, we'll store the response in its own variable
                let order1CreateLimitBuy = await order1.execute(OrderAction.Create);
                console.log(order1CreateLimitBuy);
            } catch (err) {
                Bot.log(err as string, Log.Err);
            }
        });
    });
}
