/**
 * @fileoverview Used to get statistics about a user
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'statistics',
        'utilization': '/statistics',
        'description': 'Get statistics about a users performance this event and the past hour',
        'ephemeral': false,
        'subcommands': [
                {
                    'name': 'cutoff',
                    'description': 'Get graph of a tier cutoff over time',
                    'params': [
                        {
                            'type': 'integer',
                            'name': 'tier',
                            'required': true,
                            'description': 'The cutoff tier specified',
                        },
                        {
                            'type': 'integer',
                            'name': 'event',
                            'required': false,
                            'description': 'The event to display for',
                        }
                    ]
                },
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
            'message': 'There is currently no event going on'
        },

        'SEKAI_BEST_HOST': 'api.sekai.best',

        'CONDENSED': '📱',
    }
};