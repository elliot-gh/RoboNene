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
                'name': 'list',
                'description': 'List all available stock/crypto symbols',
            }
        ]
        
    },

    'CONSTANTS': {}
};