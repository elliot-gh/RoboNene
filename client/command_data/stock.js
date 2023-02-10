/**
 * @fileoverview /stock
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'stock',
        'utilization': '/stock',
        'description': 'returns the current stock price of the given company ticker',
        'ephemeral': false,
        'subcommands': [
            {
                'name': 'get',
                'description': 'Get current stock/crypto price',
                'params': [
                    {
                        'type': 'string',
                        'name': 'symbol',
                        'required': true,
                        'description': 'stock symbol to get price of'
                    }
                ]
            },
            {
                'name': 'buy',
                'description': 'Get current stock/crypto price',
                'params': [
                    {
                        'type': 'string',
                        'name': 'symbol',
                        'required': true,
                        'description': 'stock symbol to buy'
                    },
                    {
                        'type': 'integer',
                        'name': 'amount',
                        'required': true,
                        'description': 'amount of the stock to buy'
                    }
                ]
            },
            {
                'name': 'sell',
                'description': 'Get current stock/crypto price',
                'params': [
                    {
                        'type': 'string',
                        'name': 'symbol',
                        'required': true,
                        'description': 'stock symbol to sell'
                    },
                    {
                        'type': 'integer',
                        'name': 'amount',
                        'required': true,
                        'description': 'amount of the stock to sell'
                    }
                ]
            },
            {
                'name': 'list',
                'description': 'List all available stock/crypto symbols',
            },
            {
                'name': 'portfolio',
                'description': 'List your current stock portfolio',
            }
        ]
        
    },

    'CONSTANTS': {}
};