/**
 * @fileoverview Used to get statistics about a user
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'games',
        'utilization': '/games',
        'description': 'Get predicted game energy usage for a user',
        'ephemeral': false,
        'subcommands': [
            {
                'name': 'user',
                'description': 'Get graph of a user over time',
                'params': [
                    {
                        'type': 'user',
                        'name': 'user',
                        'required': true,
                        'description': 'A linked User that has been tracked'
                    },
                    {
                        'type': 'integer',
                        'name': 'event',
                        'required': false,
                        'description': 'The event to display for',
                    }
                ]
            }
        ]
    },

    'CONSTANTS': {
        'NO_EVENT_ERR': {
            'type': 'Error',
            'message': 'What do you want statistics to do? There isn\'t even an event right now.'
        },

        'SEKAI_BEST_HOST': 'api.sekai.best',

        'CONDENSED': '📱',
    }
};