/**
 * @fileoverview Display a graph of the previous ranking trend
 * @author Potor10
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');

const COMMAND = require('../command_data/graph');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed'); 

/**
 * Create a graph embed to be sent to the discord interaction
 * @param {string} graphUrl url of the graph we are trying to embed
 * @param {Integer} tier the ranking that the user wants to find
 * @param {DiscordClient} client we are using to interact with discord
 * @return {MessageEmbed} graph embed to be used as a reply via interaction
 */
const generateGraphEmbed = (graphUrl, tier, discordClient) => {
  const graphEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${tier}`)
    .setDescription(`**Requested:** <t:${Math.floor(Date.now()/1000)}:R>`)
    .setThumbnail(discordClient.client.user.displayAvatarURL())
    .setImage(graphUrl)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  return graphEmbed;
};

/**
 * Ensures a string is ASCII to be sent through HTML
 * @param {String} str the string to be converted to ASCII 
 * @returns 
 */
function ensureASCII(str) {
  return str.replace(/[^a-z0-9&]/gi, ' ');
}

/**
 * Operates on a http request and returns the url embed of the graph using quickchart.io
 * @param {Object} interaction object provided via discord
 * @param {Integer} tier the ranking that the user wants to find
 * @param {Object} rankData the ranking data obtained
 * @param {DiscordClient} client we are using to interact with discord
 * @error Status code of the http request
 */
const postQuickChart = async (interaction, tier, rankData, discordClient) => {
  if (!rankData) {
    await interaction.editReply({
      embeds: [
        generateEmbed({
          name: COMMAND.INFO.name, 
          content: COMMAND.CONSTANTS.NO_DATA_ERR, 
          client: discordClient.client
        })
      ]
    });
    return;
  }

  let graphData:any[] = [];
  const event = discordClient.getCurrentEvent();
  tier = ensureASCII(tier);

  rankData.forEach(point => {
    graphData.push({
      x: point.timestamp - event.startAt,
      y: point.score
    });
  });

  let postData = JSON.stringify({
    'backgroundColor': '#FFFFFF',
    'format': 'png',
    'chart': {
      'type': 'line', 
      'data': {
        'datasets': [{
          'label': `${tier}`, 
          'fill': false,
          'data': graphData
        }]
      },
      'options': {
        'scales': {
          'xAxes': [{
            'type': 'time',
            'distribution': 'linear',
            'time': {
              'displayFormats': {
                'hour': '[Day] D HH'
              },
              'unit': 'hour',
              'stepSize': 3
            }
          }]
        }
      }
    }
  });

  const options = {
    host: 'quickchart.io',
    port: 443,
    path: '/chart/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    let json = '';
    res.on('data', (chunk) => {
      json += chunk;
    });
    res.on('end', async () => {
      if (res.statusCode === 200) {
        try {
          console.log(JSON.stringify(JSON.parse(json)));
          await interaction.editReply({ 
            embeds: [generateGraphEmbed(JSON.parse(json).url, tier, discordClient)]
          });
        } catch (err) {
          // Error parsing JSON: ${err}`
          console.log(`ERROR 1 ${err}`);
        }
      } else {
        // Error retrieving via HTTPS. Status: ${res.statusCode}
        console.log(`Error retrieving via HTTPS ${res.statusCode}`);
      }
    });
  }).on('error', () => {});

  req.write(postData);
  req.end();
};

async function noDataErrorMessage(interaction, discordClient) {
  let reply = 'Please input a tier in the range 1-100 or input 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000, 40000, or 50000';
  let title = 'Tier Not Found';

  await interaction.editReply({
    embeds: [
      generateEmbed({
        name: title,
        content: {
          'type': 'ERROR',
          'message': reply
        },
        client: discordClient.client
      })
    ]
  });
  return;
}

async function sendTierRequest(eventId, eventName, eventData, tier, interaction, discordClient) {
  discordClient.addPrioritySekaiRequest('ranking', {
    eventId: eventId,
    targetRank: tier,
    lowerLimit: 0
  }, async (response) => {

    let userId = response['rankings'][0]['userId'];//Get the last ID in the list
    let data = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
      'WHERE (ID=@id AND EventID=@eventID)').all({
        id: userId,
        eventID: eventId
      });
    if (data.length > 0) {
      let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
      rankData.unshift({ timestamp: eventData.startAt, score: 0 });
      rankData.push({ timestamp: Date.now(), score: response['rankings'][0]['score'] });
      rankData.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : (b.timestamp > a.timestamp) ? -1 : 0);
      postQuickChart(interaction, `${eventName} T${tier} ${response['rankings'][0]['name']} Cutoffs`, rankData, discordClient);
    } else {
      noDataErrorMessage(interaction, discordClient);
    }
  }, (err) => {
    console.log(err);
  });
}

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    });
    
    const event = discordClient.getCurrentEvent();
    if (event.id === -1) {
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.NO_EVENT_ERR, 
            client: discordClient.client
          })
        ]
      });
      return;
    }

    const eventName = event.name;

    const tier = interaction.options.getInteger('tier');
    const user = interaction.options.getUser('user');

    if(tier)
    {
      var data = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
        'WHERE (Tier=@tier AND EventID=@eventID)').all({
          tier: tier,
          eventID: event.id
        });
      if (data.length == 0) {
          
        noDataErrorMessage(interaction, discordClient);
        return;

      } else {
        sendTierRequest(event.id, eventName, event, tier, interaction, discordClient);
      }
    } else if (user) {
      try {
        let id = discordClient.getId(user.id);

        if (id == -1) {
          interaction.editReply({ content: 'Discord User not found (are you sure that account is linked?)' });
          return;
        }

        let data = discordClient.cutoffdb.prepare('SELECT * FROM users ' +
          'WHERE (id=@id AND EventID=@eventID)').all({
            id: id,
            eventID: event.id
          });
        if (data.length>0)
        {
          let name = user.username;
          let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
          rankData.unshift({ timestamp: event.startAt, score: 0 });
          postQuickChart(interaction, `${eventName} ${name} Event Points`, rankData, discordClient);
        }
        else {
          interaction.editReply({ content: 'Discord User found but no data logged (have you recently linked or event ended?)' });
        }
      } catch (err) {
        // Error parsing JSON: ${err}`
      }
    }
  }
};

export {};