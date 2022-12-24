/**
 * @fileoverview /stock
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'ticker',
        'utilization': '/stock',
        'description': 'returns the current stock price of the given company ticker',
        'ephemeral': false,
        'params': [
            {
                'type': 'string',
                'name': 'ticker',
                'required': true,
                'description': 'stock ticker'
            }
        ]
    },

    'CONSTANTS': {}
};