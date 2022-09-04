/**
 * @fileoverview Command Data & Constants Related to the /rank command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants values used exclusively in the /rank command.
 * @author Potor10
 */

module.exports = {
    'INFO': {
        'name': 'id',
        'utilization': '/id',
        'description': 'Display your Sekai ID',
        'ephemeral': true,
        'params': [
            {
                'type': 'boolean',
                'name': 'show',
                'required': false,
                'description': 'Whether the message is only shown to you or not'
            }
        ],

        'requiresLink': true
    },

    'CONSTANTS': {
        'NO_ACC_ERROR': {
            'type': 'Error',
            'message': 'This user has not linked their project sekai account with the bot.'
        }
    }
}