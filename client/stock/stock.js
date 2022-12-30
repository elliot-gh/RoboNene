/**
 * @fileoverview Stock API code. Made by Ai0796, why have i done this
 */

const https = require('https');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

class Stock {
    constructor(APIKEY) {
        this.APIKEY = APIKEY;
    }

    async formatKey(key) {
        var i, frags = key.split(' ');
        for (i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    }

    /**
     * @typedef {Object} StockData
     * @property {String} symbol symbol of the stock ticker
     * @property {String} open opening price of the stock
     * @property {String} high highest price of the stock
     * @property {String} low lowest price of the stock
     * @property {String} price current price of the stock
     * @property {String} volume volume of the stock
     * @property {String} latestTradingDay latest trading day of the stock
     * @property {String} previousClose previous close of the stock
     * @property {String} change change of the stock
     * @property {String} changePercent change percent of the stock
     */

    /**
     * @param {String} symbol stock symbol, or optionally a project sekai character/ticker
     * @returns {Promise<StockData>} containing stock data
     */
    async getStockData(symbol) {

        let response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.APIKEY}`);
        let data = await response.json();

        let returnData = {};

        for (let key in data['Global Quote']) {
            let newKey = await this.formatKey(key.substring(4));
            returnData[newKey] = data['Global Quote'][key];
        
        }

        return returnData;
    }

    async getCryptoData(symbol) {

        let response = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${this.APIKEY}`);
        let data = await response.json();

        let returnData = {};

        let exemptKeys = ['1. From_Currency Code', '2. From_Currency Name', '3. To_Currency Code', '4. To_Currency Name']

        for (let key in data['Realtime Currency Exchange Rate']) {
            let newKey = await this.formatKey(key.substring(3));
            if (exemptKeys.includes(key)) {
                continue;
            }
            returnData[newKey] = data['Realtime Currency Exchange Rate'][key];
        }

        return returnData;
    }
}

module.exports = Stock;