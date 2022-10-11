/**
 * @fileoverview Display a graph of the previous ranking trend
 * @author Potor10
 */

const { MessageAttachment, MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const { plotlyKey, plotlyUser } = require("../../config.json")
const https = require('https');
const fs = require('fs');

const COMMAND = require('../command_data/hist')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

const Plotly = require("plotly")(plotlyUser, plotlyKey)

const HOUR = 3600000; 

const energyBoost = [
  1,
  5,
  10,
  15,
  19,
  23,
  26,
  29,
  31,
  33,
  35
];

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

  return graphEmbed
}

/**
 * Ensures a string is ASCII to be sent through HTML
 * @param {String} str the string to be converted to ASCII 
 * @returns 
 */
function ensureASCII(str) {
  return str.replace(/[^a-z0-9&]/gi, ' ')
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
    return
  }

  graphData = []
  const event = discordClient.getCurrentEvent()
  
  let pointsPerGame = [];
  let energyPossibilities = energyBoost.map((x) => 0)
  let lastPoint = 0;
  tier = ensureASCII(tier);

  rankData.forEach(point => {
    if(point.score > lastPoint) {
      let gain = point.score - lastPoint
      if (gain < 75000 && gain >= 100)
      {
        pointsPerGame.push(gain);
        energyBoost.forEach((x, idx) => {
          if (x == 1) { }
          else if (gain % x == 0 && gain < 2000 * x) {
            energyPossibilities[idx] += 1;
          }
        })
      }
      lastPoint = point.score;
    }
  })

  if(pointsPerGame.length == 0) {
    await interaction.editReply({
      embeds: [
        generateEmbed({
          name: COMMAND.INFO.name,
          content: COMMAND.CONSTANTS.NO_DATA_ERR,
          client: discordClient.client
        })
      ]
    });
    return
  }

  let estimatedEnergy = energyPossibilities.indexOf(Math.max(...energyPossibilities));
  let binsize = Math.max(5, energyBoost[estimatedEnergy]);

  const average = (pointsPerGame.reduce((a, b) => a + b) / pointsPerGame.length).toFixed(2);

  let layout = {
    title: tier,
    xaxis: {title: "Event Points"},
    yaxis: {title: "Count"},
    bargap: 0.25,
    template: {
      data: {
        histogram: [
          {
            type: 'histogram', 
            marker: {colorbar: {
                ticks: ''
              }}
          }
        ]
      }, 
      layout: {
        geo: {
          bgcolor: 'rgb(17,17,17)', 
          showland: true, 
          lakecolor: 'rgb(17,17,17)', 
          landcolor: 'rgb(17,17,17)', 
          showlakes: true, 
          subunitcolor: '#506784'
        }, 
        font: {color: '#f2f5fa'}, 
        polar: {
          bgcolor: 'rgb(17,17,17)', 
          radialaxis: {
            ticks: '', 
            gridcolor: '#506784', 
            linecolor: '#506784'
          }, 
          angularaxis: {
            ticks: '', 
            gridcolor: '#506784', 
            linecolor: '#506784'
          }
        }, 
        
        colorway: ['#636efa', '#EF553B', '#00cc96', '#ab63fa', '#19d3f3', '#e763fa', '#fecb52', '#ffa15a', '#ff6692', '#b6e880'], 
        hovermode: 'closest', 
        colorscale: {
          diverging: [['0', '#8e0152'], ['0.1', '#c51b7d'], ['0.2', '#de77ae'], ['0.3', '#f1b6da'], ['0.4', '#fde0ef'], ['0.5', '#f7f7f7'], ['0.6', '#e6f5d0'], ['0.7', '#b8e186'], ['0.8', '#7fbc41'], ['0.9', '#4d9221'], ['1', '#276419']], 
          sequential: [['0', '#0508b8'], ['0.0893854748603352', '#1910d8'], ['0.1787709497206704', '#3c19f0'], ['0.2681564245810056', '#6b1cfb'], ['0.3575418994413408', '#981cfd'], ['0.44692737430167595', '#bf1cfd'], ['0.5363128491620112', '#dd2bfd'], ['0.6256983240223464', '#f246fe'], ['0.7150837988826816', '#fc67fd'], ['0.8044692737430168', '#fe88fc'], ['0.8938547486033519', '#fea5fd'], ['0.9832402234636871', '#febefe'], ['1', '#fec3fe']], 
          sequentialminus: [['0', '#0508b8'], ['0.0893854748603352', '#1910d8'], ['0.1787709497206704', '#3c19f0'], ['0.2681564245810056', '#6b1cfb'], ['0.3575418994413408', '#981cfd'], ['0.44692737430167595', '#bf1cfd'], ['0.5363128491620112', '#dd2bfd'], ['0.6256983240223464', '#f246fe'], ['0.7150837988826816', '#fc67fd'], ['0.8044692737430168', '#fe88fc'], ['0.8938547486033519', '#fea5fd'], ['0.9832402234636871', '#febefe'], ['1', '#fec3fe']]
        }, 
        plot_bgcolor: 'rgb(17,17,17)', 
        paper_bgcolor: 'rgb(17,17,17)', 
        shapedefaults: {
          line: {width: 0}, 
          opacity: 0.4, 
          fillcolor: '#f2f5fa'
        }, 
        sliderdefaults: {
          bgcolor: '#C8D4E3', 
          tickwidth: 0, 
          bordercolor: 'rgb(17,17,17)', 
          borderwidth: 1
        }, 
        annotationdefaults: {
          arrowhead: 0, 
          arrowcolor: '#f2f5fa', 
          arrowwidth: 1
        }, 
        updatemenudefaults: {
          bgcolor: '#506784', 
          borderwidth: 0
        }
      }, 
      themeRef: 'PLOTLY_DARK'
    },
    showlegend: true,
    legend: {title: {text: `n=${pointsPerGame.length}<br>` +
    `Max Score: ${Math.max(...pointsPerGame)}<br>` +
    `Average Score: ${average}`}}
  }

  var data = {
    data: [
      {
        name: `${tier}`,
        x: pointsPerGame,
        mode: 'markers', 
        type: "histogram",
        marker: {
          color: "rgb(141,211,199)",
          line: {
            color: "rgb(141,211,199)"
          }
        },
        autobinx: false,
        xbins: {
          start: Math.min(...pointsPerGame),
          end: Math.max(...pointsPerGame),
          size: binsize
        },
      }
    ],
    layout: layout
  };

  var pngOptions = {format: 'png', width: 1000, height: 500};
  Plotly.getImage(data, pngOptions, async (err, imageStream) => {
    if (err) console.log (err);
    let file = new MessageAttachment(imageStream, 'hist.png')
    await interaction.editReply({ 
      embeds: [generateGraphEmbed("attachment://hist.png", tier, discordClient)], files: [file]
    })
  });

}

function getEventName(eventID) 
{
  const data = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
  let currentEventIdx = -1;
  let currentDate = new Date();

  for (let i = 0; i < data.length; i++) {
    if (Math.floor(data[i].closedAt / 1000) > Math.floor(currentDate / 1000) &&
      Math.floor(data[i].startAt / 1000) < Math.floor(currentDate / 1000)) {
      currentEventIdx = i;
    }
  }
  
  return data[currentEventIdx].name
}

function getEventData(eventID) {
  const data = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
  let currentEventIdx = -1;
  let currentDate = new Date();

  for (let i = 0; i < data.length; i++) {
      if (Math.floor(data[i].closedAt / 1000) > Math.floor(currentDate / 1000) &&
          Math.floor(data[i].startAt / 1000) < Math.floor(currentDate / 1000)) {
          currentEventIdx = i;
      }
  }

  return data[currentEventIdx];
}

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    })
    
    const event = discordClient.getCurrentEvent()
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
      return
    }

    const eventName = getEventName(event.id)
    const eventData = getEventData(event.id);

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
          let reply = `Please input a tier in the range 1-100 or input 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000, 40000, or 50000`;

          let title = `Tier Not Found`;

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
      } else {
        let userId = data[data.length - 1].ID
        data = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
          'WHERE (ID=@id AND EventID=@eventID)').all({
            id: userId,
            eventID: event.id
          });
      }
      let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
      rankData.unshift({ timestamp: eventData.startAt, score: 0 })
      rankData.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : (b.timestamp > a.timestamp) ? -1 : 0);
      postQuickChart(interaction, `${eventName} T${tier} Cutoffs`, rankData, discordClient);
    } else if (user) {
      try {
        let data = discordClient.cutoffdb.prepare('SELECT * FROM users ' +
          'WHERE (discord_id=@discord_id AND EventID=@eventID)').all({
            discord_id: user.id,
            eventID: event.id
          });
        if (data.length)
        {
          let name = user.username;
          let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
          rankData.unshift({ timestamp: eventData.startAt, score: 0 })
          postQuickChart(interaction, `${eventName} ${name} Event Points`, rankData, discordClient);
        }
        else
        {
          interaction.editReply({content: 'Discord User not found (are you sure that account is linked?)'})
        }
      } catch (err) {
        // Error parsing JSON: ${err}`
      }
    }
  }
};