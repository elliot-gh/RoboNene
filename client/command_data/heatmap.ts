/**
 * @fileoverview Command Data & Constants Related to the /heatmap command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants and error values used exclusively in the /heatmap command.
 * @author Ai0796
 */

const palatteChoices = [
  ['Default', 0],
  ['Legacy', 1],
  ['Ankoha', 2],
  ['Cinema', 3],
  ['Shinonome', 4],
  ['Miracle Paint', 5]
];

module.exports = {
  'INFO': {
    'name': 'heatmap',
    'utilization': '/heatmap',
    'description': 'Display a histogram displaying the historical amount of points for a user or tier',
    'ephemeral': false,
    'subcommands': [
      {
        'name': 'cutoff',
        'description': 'Get histogram of a tier cutoff over time',
        'params' : [
          {
            'type': 'integer',
            'name': 'tier',
            'required': true,
            'description': 'The cutoff tier specified',
          },
          {
            'type': 'integer',
            'name': 'offset',
            'required': false,
            'description': 'Offset from UTC',
            'minValue': 0,
            'maxValue': 23
          },
          {
            'type': 'integer',
            'name': 'event',
            'required': false,
            'description': 'The event to display for',
          },
          {
            'type': 'integer',
            'name': 'pallete',
            'required': false,
            'description': 'The color pallete to use',
            'choices': palatteChoices
          }
        ]
      },
      {
        'name': 'user',
        'description': 'Get histogram of a user over time',
        'params': [
          {
          'type': 'user',
          'name': 'user',
          'required': true,
          'description': 'A linked User that has been tracked'
          },
          {
            'type': 'integer',
            'name': 'offset',
            'required': false,
            'description': 'Offset from hour 0 (Defaults to 18, EST Start time)',
            'minValue': 0,
            'maxValue': 23
          },
          {
            'type': 'integer',
            'name': 'event',
            'required': false,
            'description': 'The event to display for',
          },
          {
            'type': 'integer',
            'name': 'pallete',
            'required': false,
            'description': 'The color pallete to use',
            'choices': palatteChoices
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
      'message': 'No data found (have you played a game after linking?)'
    },
  
    'SEKAI_BEST_HOST': 'api.sekai.best'
  }
};