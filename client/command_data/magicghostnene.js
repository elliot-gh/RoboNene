/**
 * @fileoverview /bonk
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'magicghostnene',
        'utilization': '/magicghostnene',
        'description': 'Ask the magic ghostnenerobo a question',
        'ephemeral': false,
        'params': [
            {
                'type': 'string',
                'name': 'prompt',
                'required': true,
                'description': 'The prompt to ask the magic ghostnenerobo'
            }
        ]
    },

    'CONSTANTS': {}
};