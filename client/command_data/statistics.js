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
                    'name': 'cutoff',
                    'description': 'Get graph of a tier cutoff over time',
                    'params': [
                        {
                            'type': 'integer',
                            'name': 'tier',
                            'required': true,
                            'description': 'The cutoff tier specified',
                            'choices': [
                                ['T1', 1],
                                ['T2', 2],
                                ['T3', 3],
                                ['T10', 10],
                                ['T20', 20],
                                ['T30', 30],
                                ['T40', 40],
                                ['T50', 50],
                                ['T100', 100],
                                ['T200', 200],
                                ['T300', 300],
                                ['T400', 400],
                                ['T500', 500],
                                ['T1000', 1000],
                                ['T2000', 2000],
                                ['T3000', 3000],
                                ['T4000', 4000],
                                ['T5000', 5000],
                                ['T10000', 10000],
                                ['T20000', 20000],
                                ['T30000', 30000],
                                ['T40000', 40000],
                                ['T50000', 50000]
                            ]
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