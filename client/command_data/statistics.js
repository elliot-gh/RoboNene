/**
 * @fileoverview Used to get statistics about a user
 * @author Potor10
 */

module.exports = {
    'INFO': {
        'name': 'statistics',
        'utilization': '/statistics',
        'description': 'Get statistics about a users performance this event and the past hour',
        'ephemeral': false,
        'subcommands': [
            {
                'name': 'user',
                'description': 'A user that has linked to Ghost Nene Robo',
                'params': [
                    {
                        'type': 'user',
                        'name': 'user',
                        'required': true,
                        'description': 'A linked User that has been tracked'
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

        'SEKAI_BEST_HOST': 'api.sekai.best'
    }
}