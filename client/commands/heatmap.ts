/**
 * @fileoverview Display a heatmap of a given tier or player
 * @author Ai0796
 */

import { CommandInteraction } from "discord.js";
import { Events } from "../../models/sekai_master";

const { MessageAttachment, MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const { plotlyKey, plotlyUser } = require('../../config.json');
const fs = require('fs');

const COMMAND = require('../command_data/heatmap');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed'); 

const Plotly = require('plotly')(plotlyUser, plotlyKey);

const HOUR = 3600000; 

const formatPallete = (colors) => {
  const formatted = [];
  const distance = 1 / (colors.length - 1);
  colors.forEach((color, i) => {
    formatted.push([(distance * i).toFixed(3), color]);
  });
  return formatted;
};

const standard = formatPallete([
  '#fcd4dc',
  '#ece2f0', 
  '#d0d1e6',
  '#a6bddb',
  '#67a9cf', 
  '#3690c0', 
  '#8B74BD', 
  '#7953A9', 
  '#301934',
]);

const legacy = formatPallete([
  '#f7fbff', 
  '#deebf7', 
  '#c6dbef', 
  '#9ecae1', 
  '#6baed6', 
  '#4292c6', 
  '#2171b5', 
  '#08519c', 
  '#08306b'
]);


const ankoha = formatPallete([
    '#f25e74',
    '#ff8884',
    '#026178',
    '#0682a6',
    '#34a1c7'
]);

const cinema = formatPallete([
  '#8c0d07',
  '#ec7c71',
  '#7ecccc',
  '#2d7d7e'
]);

const shinonome = formatPallete([
  '#ff7722',
  '#ccaa88'
]);

const miraclePaint = formatPallete([
  '#83e4d1',
  '#79c3fd',
  '#89a4fb',
  '#af8efe',
  '#fb8dcc',
  '#ff88ac',
  '#fe8b7f',
  '#fdda99',
  '#810095',
  '#5f01ab',
  '#04186d'
]);

const palettes = [
  standard,
  legacy,
  ankoha,
  cinema,
  shinonome,
  miraclePaint
];


/**
 * Create a graph embed to be sent to the discord interaction
 * @param {string} graphUrl url of the graph we are trying to embed
 * @param {Integer} tier the ranking that the user wants to find
 * @param {DiscordClient} client we are using to interact with discord
 * @return {MessageEmbed} graph embed to be used as a reply via interaction
 */
const generateGraphEmbed = (graphUrl: string, tier: String, discordClient: any) => {
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
function ensureASCII(str: string) {
  return str.replace(/[^a-z0-9&]/gi, ' ');
}

/**
 * Operates on a http request and returns the url embed of the graph using quickchart.io
 * @param {Object} interaction object provided via discord
 * @param {String} tier the ranking that the user wants to find
 * @param {Object} rankData the ranking data obtained
 * @param {DiscordClient} client we are using to interact with discord
 * @error Status code of the http request
 */
const postQuickChart = async (interaction: CommandInteraction, tier: string, rankData: any, eventData: Events, offset: number, pallete: String[][], discordClient: any) => {
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
  
  tier = ensureASCII(tier);

  let lastPoint = 0;
  let pointsPerGame = [];

  rankData.forEach((point: any) => {
    if (point.score > lastPoint) {
      let gain = point.score - lastPoint;
      if (gain < 75000 && gain >= 100) {
        pointsPerGame.push(gain);
      }
      lastPoint = point.score;
    }
  });

  if (pointsPerGame.length == 0) {
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

  let dayData:number[] = [];
  let heatmapData:number[][] = [];
  let gamesPerHour = 0;
  let maxTimestamp = eventData.startAt + HOUR;
  lastPoint = 0;

  for(let i = 0; i < offset; i++){
    dayData.push(null);
  }

  rankData.forEach((point:any) => {
    if (point.timestamp > eventData.aggregateAt) {
      return;
    }
    while (point.timestamp > maxTimestamp) {
      maxTimestamp += HOUR;
      if(dayData.length >= 24) {
        heatmapData.unshift(dayData);
        dayData = [];
      }
      dayData.push(gamesPerHour);
      gamesPerHour = 0;
    }
    if (point.score > lastPoint) {
      let gain = point.score - lastPoint;
      if (gain < 75000 && gain >= 100) {
        gamesPerHour += 1;
      }
      lastPoint = point.score;
    }
  });

  heatmapData.unshift(dayData);

  let xValues = [];
  let yValues = [];

  for(let i = 0; i < 24; i++) {
    xValues.push(i + 0.5);
  }

  for(let i = 0; i < heatmapData.length; i++) {
    yValues.unshift(`Day ${i + 1}`);
  }

  let trace1 = {
    mode: 'markers',
    type: 'heatmap',
    x: xValues,
    y: yValues,
    z: heatmapData,
    ytype: 'array',
    zauto: true,
    opacity: 1,
    visible: true,
    xperiod: 0,
    yperiod: 0,
    zsmooth: false, 
    hoverongaps: false,
    reversescale: true,
    colorscale: pallete,
    xgap: 0.3,
    ygap: 0.3,
    autocolorscale: false,
  };
  
  let layout = {
    title: { text: tier },
    xaxis: {
      title: 'Hour',
      side: 'top',
      dtick: 1
    },
    yaxis: {
      title: 'Day',
      type: 'category'
    },
    legend: { title: { text: '<br>' } },
    autosize: true,
    colorway: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'], 
    dragmode: 'zoom',
    template: {
      data: {
        heatmap: [
          {
            type: 'heatmap',
            colorbar: {
              ticks: '',
              outlinewidth: 0
            },
            autocolorscale: true
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
        font: { color: '#f2f5fa' },
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
        scene: {
          xaxis: {
            ticks: '',
            gridcolor: '#506784',
            gridwidth: 2,
            linecolor: '#506784',
            zerolinecolor: '#C8D4E3',
            showbackground: true,
            backgroundcolor: 'rgb(17,17,17)'
          },
          yaxis: {
            ticks: '',
            gridcolor: '#506784',
            gridwidth: 2,
            linecolor: '#506784',
            zerolinecolor: '#C8D4E3',
            showbackground: true,
            backgroundcolor: 'rgb(17,17,17)'
          },
          zaxis: {
            ticks: '',
            gridcolor: '#506784',
            gridwidth: 2,
            linecolor: '#506784',
            zerolinecolor: '#C8D4E3',
            showbackground: true,
            backgroundcolor: 'rgb(17,17,17)'
          }
        },
        title: { x: 0.05 },
        xaxis: {
          ticks: '',
          gridcolor: '#283442',
          linecolor: '#506784',
          automargin: true,
          zerolinecolor: '#283442',
          zerolinewidth: 2
        },
        yaxis: {
          ticks: '',
          gridcolor: '#283442',
          linecolor: '#506784',
          automargin: true,
          zerolinecolor: '#283442',
          zerolinewidth: 2
        },
        ternary: {
          aaxis: {
            ticks: '',
            gridcolor: '#506784',
            linecolor: '#506784'
          },
          baxis: {
            ticks: '',
            gridcolor: '#506784',
            linecolor: '#506784'
          },
          caxis: {
            ticks: '',
            gridcolor: '#506784',
            linecolor: '#506784'
          },
          bgcolor: 'rgb(17,17,17)'
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
          line: { width: 0 },
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
    hovermode: 'closest',
    colorscale: {
      diverging: [['0', '#40004b'], ['0.1', '#762a83'], ['0.2', '#9970ab'], ['0.3', '#c2a5cf'], ['0.4', '#e7d4e8'], ['0.5', '#f7f7f7'], ['0.6', '#d9f0d3'], ['0.7', '#a6dba0'], ['0.8', '#5aae61'], ['0.9', '#1b7837'], ['1', '#00441b']],
      sequential: [['0', '#000004'], ['0.1111111111111111', '#1b0c41'], ['0.2222222222222222', '#4a0c6b'], ['0.3333333333333333', '#781c6d'], ['0.4444444444444444', '#a52c60'], ['0.5555555555555556', '#cf4446'], ['0.6666666666666666', '#ed6925'], ['0.7777777777777778', '#fb9b06'], ['0.8888888888888888', '#f7d13d'], ['1', '#fcffa4']],
      sequentialminus: [['0', '#0508b8'], ['0.08333333333333333', '#1910d8'], ['0.16666666666666666', '#3c19f0'], ['0.25', '#6b1cfb'], ['0.3333333333333333', '#981cfd'], ['0.4166666666666667', '#bf1cfd'], ['0.5', '#dd2bfd'], ['0.5833333333333334', '#f246fe'], ['0.6666666666666666', '#fc67fd'], ['0.75', '#fe88fc'], ['0.8333333333333334', '#fea5fd'], ['0.9166666666666666', '#febefe'], ['1', '#fec3fe']]
    },
    showlegend: false
  };

  let data = {
    data: [trace1],
    layout: layout
  };

  var pngOptions = {format: 'png', width: 1000, height: 500};
  Plotly.getImage(data, pngOptions, async (err: Error, imageStream: any) => {
    if (err) console.log (err);
    let file = new MessageAttachment(imageStream, 'hist.png');
    await interaction.editReply({ 
      embeds: [generateGraphEmbed('attachment://hist.png', tier, discordClient)], files: [file]
    });
  });

};

function getEventData(eventID: number) {
  const data = JSON.parse(fs.readFileSync('./sekai_master/events.json'));

  return data[eventID - 2];
}

async function noDataErrorMessage(interaction: CommandInteraction, discordClient: any) {
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

async function sendTierRequest(eventId: number, eventName: String, eventData: Events, tier: Number, interaction: CommandInteraction, offset: number, pallete: String[][], discordClient: any) {
  discordClient.addPrioritySekaiRequest('ranking', {
    eventId: eventId,
    targetRank: tier,
    lowerLimit: 0
  }, async (response: any) => {

    let userId = response['rankings'][0]['userId']; //Get the last ID in the list
    
    let data = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
      'WHERE (ID=@id AND EventID=@eventID)').all({
        id: userId,
        eventID: eventId
      });
    if(data.length > 0) {
      let rankData = data.map((x: any) => ({ timestamp: x.Timestamp, score: x.Score }));
      let title = `${eventName} T${tier} ${response['rankings'][0]['name']} Heatmap`;
      rankData.unshift({ timestamp: eventData.startAt, score: 0 });
      rankData.push({ timestamp: Date.now(), score: response['rankings'][0]['score'] });
      rankData.sort((a: any, b: any) => (a.timestamp > b.timestamp) ? 1 : (b.timestamp > a.timestamp) ? -1 : 0);
      postQuickChart(interaction, title, rankData, eventData, offset, pallete, discordClient);
    } else {
      noDataErrorMessage(interaction, discordClient);
    }
  }, (err: any) => {
    console.log(err);
  });
}

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction: CommandInteraction, discordClient: any) {
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

    const tier = interaction.options.getInteger('tier');
    const user = interaction.options.getUser('user');
    const eventId = interaction.options.getInteger('event') || event.id;
    const palleteIndex = interaction.options.getInteger('pallete') || 0;
    let offset = interaction.options.getInteger('offset');

    if (offset == null && offset != 0) offset = 18;

    const pallete = palettes[palleteIndex];

    const eventData = getEventData(eventId);
    const eventName = eventData.name;


    if(tier)
    {
      var data = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
        'WHERE (Tier=@tier AND EventID=@eventID)').all({
          tier: tier,
          eventID: eventId
        });
      if (data.length == 0) {
        noDataErrorMessage(interaction, discordClient);
        return;
      }
      else {
        sendTierRequest(eventId, eventName, eventData, tier, interaction, offset, pallete, discordClient);
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
            eventID: eventId
          });

        if (data.length > 0)
        {
          let name = user.username;
          let rankData = data.map((x: any) => ({ timestamp: x.Timestamp, score: x.Score }));
          rankData.unshift({ timestamp: eventData.startAt, score: 0 });
          postQuickChart(interaction, `${eventName} ${name} Heatmap`, rankData, eventData, offset, pallete, discordClient);
        }
        else
        {
          interaction.editReply({ content: 'Discord User found but no data logged (have you recently linked or event ended?)' });
        }
      } catch (err) {
        // Error parsing JSON: ${err}`
      }
    }
  }
};

export {};