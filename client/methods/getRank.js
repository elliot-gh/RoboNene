const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, RESULTS_PER_PAGE } = require('../../constants');
const generateRankingText = require('../methods/generateRankingText')
const generateEmbed = require('../methods/generateEmbed') 

const RANK_CONSTANTS = {
  'BAD_INPUT_ERROR': {
    type: 'Error',
    message: 'There was an issue with your input parameters. Please try again.'
  },

  "NO_EVENT_ERR": {
    type: 'Error',
    message: "There is currently no event going on",
  },

  'HIGHER_LIMIT': (RESULTS_PER_PAGE%2) ? Math.floor(RESULTS_PER_PAGE/2) : Math.floor(RESULTS_PER_PAGE/2)-1,
  'LOWER_LIMIT':  Math.floor(RESULTS_PER_PAGE/2)
};

const getRank = async (commandName, deferredResponse, discordClient, requestParams) => {
  const event = discordClient.getCurrentEvent()

  if (event.id === -1) {
    await deferredResponse.edit({
      embeds: [generateEmbed(commandName, RANK_CONSTANTS.NO_EVENT_ERR, discordClient)]
    });
    return
  }

  discordClient.addSekaiRequest('ranking', {
    eventId: event.id,
    ...requestParams
  }, async (response) => {
    if (response.rankings.length === 0) {
      await deferredResponse.edit({
        embeds: [generateEmbed(commandName, RANK_CONSTANTS.BAD_INPUT_ERROR, discordClient)]
      });
      return
    }

    let higherLimit = RANK_CONSTANTS.HIGHER_LIMIT
    let lowerLimit = RANK_CONSTANTS.LOWER_LIMIT

    if (response.rankings[0].rank < RANK_CONSTANTS.HIGHER_LIMIT + 1) {
      const diff = RANK_CONSTANTS.HIGHER_LIMIT + 1 - response.rankings[0].rank
      higherLimit -= diff
      lowerLimit += diff
    }

    requestParams.higherLimit = higherLimit
    requestParams.lowerLimit = lowerLimit

    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      ...requestParams
    }, async (response) => {
      const timestamp = Date.now()    
  
      let leaderboardText = generateRankingText(response.rankings, 0, requestParams.higherLimit+1)
      const leaderboardEmbed = new MessageEmbed()
        .setColor(NENE_COLOR)
        .setTitle(`${event.name}`)
        .addField(`**Requested:** <t:${Math.floor(timestamp/1000)}:R>`, leaderboardText, false)
        .setThumbnail(event.banner)
        .setTimestamp()
        .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());
  
      await deferredResponse.edit({ 
        embeds: [leaderboardEmbed]
      });
    })
  })
}

module.exports = getRank