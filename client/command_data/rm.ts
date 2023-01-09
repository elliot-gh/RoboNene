/**
 * @fileoverview contains information about the /rm command
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'rm',
        'utilization': '/rm',
        'description': 'Changes the channel name to the given code and players',
        'ephemeral': false,
        'subcommands': [
            {
                'name': 'code',
                'description': 'Change a room\'s code',
                'params': [
                    {
                        'type': 'integer',
                        'name': 'code',
                        'required': true,
                        'description': 'The new room code',
                    }
                ]
            },
            {
                'name': 'players',
                'description': 'change a rooms players',
                'params': [
                    {
                        'type': 'integer',
                        'name': 'players',
                        'required': true,
                        'description': 'Players needed',
                        'choices': [
                            ['0 (Full)', 0],
                            ['1', 1],
                            ['2', 2],
                            ['3', 3],
                            ['4', 4],
                        ]
                    }
                ]
            },
            {
                'name': 'both',
                'description': 'Change a room\'s code and players',
                'params': [
                    {
                        'type': 'integer',
                        'name': 'code',
                        'required': false,
                        'description': 'The new room code',
                    },
                    {
                        'type': 'integer',
                        'name': 'players',
                        'required': false,
                        'description': 'Players needed',
                        'choices': [
                            ['0 (Full)', 0],
                            ['1', 1],
                            ['2', 2],
                            ['3', 3],
                            ['4', 4],
                        ]
                    }
                ]
            }, 
            {
                'name': 'close',
                'description': 'Close a room',
            }
        ]
    },

    'CONSTANTS': {
        'WRONG_FORMAT': {
            'type': 'Error', 
            'message': 'Wrong channel format. Channel name needs to be in the format *-#####'
        },
        'WRONG_CODE_LENGTH': {
            'type': 'Error',
            'message': 'Room code must be 5 characters long'
        },
        'ERROR': {
            'type': 'Error',
            'message': 'Error occured trying to change channel name.'
        }
    }
};