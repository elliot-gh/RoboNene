/**
 * @fileoverview Command Data & Constants Related to the /quiz command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants values used exclusively in the /quiz command.
 * @author Potor10
 */

module.exports = {
  'INFO': {
    'name': 'quiz',
    'utilization': '/quiz',
    'description': 'A Fun Project Sekai Quiz!',
    'ephemeral': false
  },

  'CONSTANTS': {
    'WRONG_USER_ERR': {
      'type': 'Error',
      'message': 'You are not the intended user for this interaction.\nPlease use /quiz to start your own quiz.'
    },
  
    'QUESTION_RIGHT_TYPE': 'Correct ✅',
    'QUESTION_RIGHT_MSG': 'You have answered the question **correctly**!',
  
    'QUESTION_WRONG_TYPE': 'Incorrect ❌',
    'QUESTION_WRONG_MSG': 'You have answered the question **incorrectly**!',

    'QUESTION_TIMEOUT_TYPE': 'Timeout ❌',
    'QUESTION_TIMEOUT_MSG': 'There was no response within the alotted time.',

    'LINK_MSG': 'Link an account to save your progress',

    'INTERACTION_TIME': 30000,
  
    '1': '1️⃣',
    '2': '2️⃣',
    '3': '3️⃣', 
    '4': '4️⃣'
  }
};