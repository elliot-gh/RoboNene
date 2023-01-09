/**
 * @fileoverview Command Data & Constants Related to the /profile command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants values used exclusively in the /profile command.
 * @author Potor10
 */

module.exports = {
  'INFO': {
    'name': 'profile',
    'utilization': '/profile',
    'description': 'Display your project sekai profile.',
    'ephemeral': false,
    'params': [
      {
        'type': 'string',
        'name': 'id',
        'required': false,
        'description': 'An optional Project Sekai user ID target'
      }
    ],

    'requiresLink': true
  },

  'CONSTANTS': {
    'RATE_LIMIT_ERR': {
      'type': 'Error', 
      'message': 'You have reached the maximum amount of requests to the API. ' + 
        'You have been temporarily rate limited.'
    },

    'NO_ACC_ERR': {
      'type': 'Error',
      'message': 'This user does not have an account with the bot'
    },
  
    'BAD_ID_ERR': {
      'type': 'Error', 
      'message': 'You have provided an invalid ID.'
    },
  
    'BAD_ACC_ERR': {
      'type': 'Error',
      'message': 'There was an issue in finding this account. Please try again with the correct id'
    },
  
    'cool': '<:attCool:930717822756204575>',
    'cute': '<:attCute:930717822529732659>',
    'happy': '<:attHappy:930717823066595358>',
    'mysterious': '<:attMysterious:930717823217582080>',
    'pure': '<:attPure:930717823414714438>',
    'BLANK_EMOJI': '<:blank:930716814986588170>'
  }
};