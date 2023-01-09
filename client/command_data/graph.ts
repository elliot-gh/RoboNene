/**
 * @fileoverview Command Data & Constants Related to the /graph command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants and error values used exclusively in the /graph command.
 * @author Potor10
 */

module.exports = {
  'INFO': {
    'name': 'graph',
    'utilization': '/graph',
    'description': 'Display a graph displaying the historical amount of points for this event',
    'ephemeral': false,
    'subcommands': [
      {
        'name': 'cutoff',
        'description': 'Get graph of a tier cutoff over time',
        'params' : [
          {
            'type': 'integer',
            'name': 'tier',
            'required': true,
            'description': 'The cutoff tier specified',
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
  
    'NO_DATA_ERR': {
      'type': 'Error',
      'message': 'Please cloose a different cutoff tier'
    },
  
    'SEKAI_BEST_HOST': 'api.sekai.best'
  }
};