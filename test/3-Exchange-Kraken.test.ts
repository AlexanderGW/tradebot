import { expect } from 'chai';

import * as dotenv from 'dotenv';
dotenv.config();

import { Asset, AssetItem } from '../src/YATAB/Asset';
import { YATAB, Log } from '../src/YATAB/YATAB';
import { Pair, PairItem } from '../src/YATAB/Pair';

import { Order, OrderAction, OrderItem, OrderSide, OrderStatus, OrderType } from '../src/YATAB/Order';
import { Exchange, ExchangeItem } from '../src/YATAB/Exchange';

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
        let assetGbp: AssetItem;
        let pairEthBtcKraken: PairItem;
        let pairEthGbpKraken: PairItem;
        let order1: OrderItem;

        let order1OpenMarketBuy: OrderItem;
        let order1CloseLimitBuy: OrderItem;
        let order1OpenLimitBuy: OrderItem;
        let order1EditLimitBuy: OrderItem;
    
        before(async function () {
    
            // Example Kraken exchange client
            exchangeKraken = await Exchange.new({
                class: 'Kraken',
                key: process.env.KRAKEN_CLIENT_KEY,
                secret: process.env.KRAKEN_CLIENT_SECRET,
            });
    
            // ETH asset
            assetEth = Asset.new({
                symbol: 'ETH'
            });
    
            // BTC asset
            assetBtc = Asset.new({
                symbol: 'BTC'
            });

            assetGbp = Asset.new({
                symbol: 'GBP'
            });
    
            // ETH BTC pair of assets
            // pairEthBtcKraken = await Pair.new({
            //     a: assetEth,
            //     b: assetBtc,
            //     exchange: exchangeKraken,
            // });

            pairEthGbpKraken = await Pair.new({
                a: assetEth,
                b: assetGbp,
                exchange: exchangeKraken,
            });
    
            order1 = await Order.new({

                // Percentages can only be used if a balance of pair asset B (BTC) is known
                // For ETHBTC, this would be the quantity of BTC
                quantity: '10%',

                // NOTE: Ensure we are only testing orders
                // `BOT_DRYRUN=1` environment (will set all orders to default dry-run)
                // For playbooks, use `dryrun: true` at the top for everything, or individual orders.
                // dryrun: true,

                // The trading pair, i.e. ETH/BTC on Kraken
                pair: pairEthGbpKraken,

                // Either `OrderSide.Buy`, or `OrderSide.Sell`
                side: OrderSide.Buy,

                // Exchange response should match this, with a new `responseTime`
                status: OrderStatus.Open,

                // Default: Order type is `OrderType.Market`
                type: OrderType.Market,
            });
        });

        // it('should validate market buy order creation', async () => {

        //     // Execute market buy order create on exchange
        //     try {

        //         // Response will contain the exchange side transaction ID, and a
        //         // new `responseTime`, and `status` if successful. You will
        //         // need to update the order accordingly.
        //         // let orderResponse = await order1.execute();

        //         // // Check order confirmation
        //         // console.log(orderResponse);
        //     } catch (error) {
        //         YATAB.log(error, Log.Err);
        //     }
        // });
    
        it('should validate limit buy order creation', async () => {
    
            // Execute limit buy order create on exchange
            try {

                // Price. For ETHBTC, This would be at the price of BTC
                order1.price = '0.01';

                // Type of order
                order1.type = OrderType.Limit;

                // Response will contain the exchange side transaction ID, and a
                // new `responseTime`, and `status` if successful. You will
                // need to update the order accordingly.
                // let orderResponse = await order1.execute();

                // // Check order confirmation
                // console.log(orderResponse);
            } catch (error) {
                YATAB.log(error, Log.Err);
            }
        });

        // it('should validate limit buy order edit', async () => {

        //     // Execute limit buy order edit on exchange
        //     try {
        //         // Modifying `order1`

        //         // Price. For ETHBTC, This would be at the price of BTC
        //         order1OpenLimitBuy.price = '0.009';

        //         // Type of order 
        //         order1OpenLimitBuy.type = OrderType.Limit;

        //         // Call requires `transactionId` value
        //         order1OpenLimitBuy.transactionId = ['false'];

        //         // Response will contain original `order1` with any changes, such as 
        //         // the exchange side transaction ID, and `confirmed` should be `true` if successful
        //         // For the purposes of testing, we'll store the response in its own variable
        //         order1EditLimitBuy = await order1OpenLimitBuy.execute(OrderAction.Edit);
        //         console.log(order1EditLimitBuy);
        //     } catch (error) {
        //         YATAB.log(error, Log.Err);
        //     }
        // });
    
        // it('should validate limit buy order cancel', async () => {
    
        //     // Execute limit buy order cancel on exchange
        //     try {
        //         // Modifying `order1`

        //         // Call requires `transactionId` value
        //         order1OpenLimitBuy.transactionId = ['false'];

        //         // Response will contain original `order1` with any changes, such as 
        //         // the exchange side transaction ID, and `confirmed` should be `true` if successful
        //         // For the purposes of testing, we'll store the response in its own variable
        //         order1CloseLimitBuy = await order1OpenLimitBuy.execute(OrderAction.Close);
        //         console.log(order1CloseLimitBuy);
        //     } catch (error) {
        //         YATAB.log(error, Log.Err);
        //     }
        // });
    });
}
