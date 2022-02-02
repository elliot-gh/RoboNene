module.exports = {
  'INFO': {
    'name': 'link',
    'utilization': '/link',
    'description': 'Link your Project Sekai account to Robo Nene!',
    'params': [
      {
        'type': 'string',
        'name': 'id',
        'required': true,
        'description': 'The ID of the Project Sekai account you are trying to link.'
      }
    ]
  },

  'CONSTANTS': {
    'LINK_INSTRUCTIONS': {
      'type': 'Instructions',
      'message': '1. Go to your profile in Project Sekai.\n' +
        '2. Copy and paste the \`\`Link Code\`\` into your profile comment.\n' +
        '3. Press back to save the change to your profile.\n' +
        '4. Press the green ✅ Link button!'
    },

    'DISCORD_LINKED_ERR': {
      'type': 'Error',
      'message': 'Your Discord account is already linked to a Project Sekai account.'
    },
  
    'SEKAI_LINKED_ERR': {
      'type': 'Error',
      'message': 'That Project Sekai account is already linked to another Discord account.'
    },
  
    'LINK_SUCC': {
      'type': 'Success',
      'message': 'Your account is now linked.'
    },
  
    'BAD_ID_ERR': {
      'type': 'Error', 
      'message': 'You have provided an invalid ID.'
    },
  
    'BAD_ACC_ERR': {
      'type': 'Error',
      'message': 'There was an issue in finding this account. Please request a new link code.\n' +
        'Make sure all the digits are typed correctly.'
    },
  
    'EXPIRED_CODE_ERR': {
      'type': 'Error',
      'message': 'Your link code has expired.'
    },
  
    'BAD_CODE_ERR': (code) => {
      return {
        'type': 'Error',
        'message': `Invalid code \`\`${code}\`\` found on Project Sekai profile.\n` + 
          'Did you remember to press back on your profile to save the changes?'
      }
    },
  
    'NO_CODE_ERR': {
      'type': 'Error', 
      'message': 'Please request a link code first.'
    },

    'INTERACTION_TIME': 30000,
    'LINK_EMOJI': '✅'
  }
}