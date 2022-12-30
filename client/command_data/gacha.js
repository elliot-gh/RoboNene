/**
 * @fileoverview /pray
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'gacha',
        'utilization': '/gacha',
        'description': 'Spend your luck on a gacha roll',
        'ephemeral': false,
        'params': [
            {
                'type': 'boolean',
                'name': 'single',
                'description': 'Whether to do a single pull or not',
                'required': false,
            }
        ]
    },

    'CONSTANTS': {}
};