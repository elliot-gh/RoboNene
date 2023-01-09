/**
 * @fileoverview Command Data & Constants Related to the /unlink command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants values used exclusively in the /unlink command.
 * @author Potor10
 */

module.exports = {
  'INFO': {
    'name': 'unlink',
    'utilization': '/unlink',
    'description': 'Unlink a Discord account from your Project Sekai account!',
    'ephemeral': true,
    'params': [
      {
        'type': 'string',
        'name': 'id',
        'required': true,
        'description': 'Your Project Sekai user ID.'
      }
    ]
  },

  'CONSTANTS': {
    'UNLINK_IMG': 'https://media.discordapp.net/attachments/883062753294704681/964272786535235654/IMG_0037.png',

    'UNLINK_INSTRUCTIONS': {
      'type': 'Instructions',
      'message': '1. Go to your profile in Project Sekai.\n' +
        '2. Copy and paste the ``Unlink Code`` into your profile comment.\n' +
        '3. Press back to save the change to your profile.\n' +
        '4. Press the red ❌ Unlink button!'
    },

    'RATE_LIMIT_ERR': {
      'type': 'Error', 
      'message': 'You have reached the maximum amount of requests to the API. ' + 
        'You have been temporarily rate limited.'
    },

    'EXPIRED_CODE_ERR': {
      'type': 'Error',
      'message': 'Your link code has expired'
    },
  
    'BAD_CODE_ERR': (code) => {
      return {
        'type': 'Error',
        'message': `Invalid code \`\`${code}\`\` found on Project Sekai profile.\n` + 
          'Did you remember to press back on your profile to save the changes?'
      };
    },
  
    'NO_CODE_ERR': {
      'type': 'Error',
      'message': 'Please request a link code first.'
    },
  
    'NO_SEKAI_ERR': {
      'type': 'Error',
      'message': 'This Project Sekai account is not linked to any Discord account.'
    },
  
    'NO_DISCORD_LINK': {
      'type': 'Error',
      'message': 'This Discord account is not linked to any Project Sekai account.'
    },
  
    'BAD_ID_ERR': {
      'type': 'Error', 
      'message': 'You have provided an invalid ID.'
    },
  
    'BAD_ACC_ERR': {
      'type': 'Error',
      'message': 'There was an issue in finding this account. Please request a new link code. \nMake sure all the digits are typed correctly.'
    },
  
    'UNLINK_SUCC': {
      'type': 'Success',
      'message': 'Your account is now unlinked.'
    },

    'INTERACTION_TIME': 30000,
    'UNLINK_EMOJI': '❌'
  }
};