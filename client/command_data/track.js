/**
 * @fileoverview Command Data & Constants Related to the /track command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants and error values used exclusively in the /graph command.
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'track',
        'utilization': '/track',
        'description': 'Track a rank to see if it moves and ping the user if it does',
        'ephemeral': false,
        'params': [
            {
                'type': 'integer',
                'name': 'tier',
                'required': true,
                'description': 'The tier specified',
            }
        ]
    },

    'CONSTANTS': {
        'NO_EVENT_ERR': {
            'type': 'Error',
            'message': 'The Current Event is over or there is no event running'
        },

        'NO_DATA_ERR': {
            'type': 'Error',
            'message': 'Please cloose a different cutoff tier'
        },

        'TIER_ERR': {
            'type': 'Error',
            'message': 'Please choose a cutoff Tier Less than or Equal to 110'
        },

        'SEKAI_BEST_HOST': 'api.sekai.best'
    }
}