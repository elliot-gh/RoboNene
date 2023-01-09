/**
 * @fileoverview The main output when users call for the /cutoff command
 * Will display detailed information about ranking cutoff 
 * @author Potor10
 */

import { CommandInteraction } from "discord.js";

const { MessageEmbed } = require('discord.js');
const { DIR_DATA, NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');
const fs = require('fs');
const regression = require('regression');

const COMMAND = require('../command_data/cutoff');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');
const binarySearch = require('../methods/binarySearch');

const { Events, EventCards } = require('./models/sekai_master')

interface RankDataType {
  timestamp: number,
  score: number,
}

/**
 * Operates on a http request and returns the current rate being hosted on GH actions.
 * @return {Object} Json object of the ranking rate constants.
 * @error Status code of the http request
 */
const requestRate = () => {
  return new Promise((resolve, reject) => {
    const options = {
      host: COMMAND.CONSTANTS.RATE_HOST,
      path: COMMAND.CONSTANTS.RATE_PATH,
      headers: { 'User-Agent': 'request' }
    };

    https.get(options, (res: any) => {
      let json = '';
      res.on('data', (chunk: any) => {
        json += chunk;
      });
      res.on('end', async () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(json));
          } catch (err) {
            reject(err);
          }
        } else {
          reject(res.statusCode);
        }
      });
    }).on('error', (err: any) => {
      reject(err);
    });
  });
};


/**
 * Calculates the standard error of given data points and model
 * @param {Array} Array of all data points
 * @param {Object} Linear Regression Model
 * @return {Integer} Calculated Standard Error of model
 */
function stdError(data: number[][], model: {equation: number[]}, finalRate: number) {
  let s = 0;

  data.forEach((v) => {
    let duration = v[0];
    let points = v[1];
    let estimate = (model.equation[0] * finalRate * duration) + model.equation[1];

    s += Math.abs(points - estimate);
  });

  return s / data.length;
}

/**
 * Calculates the return embed and sends it via discord interaction
 * @param {Interaction} interaction class provided via discord.js
 * @param {Object} event object that we are investigating
 * @param {Integer} timestamp in epochseconds
 * @param {Integer} tier the ranking that the user wants to find
 * @param {Integer} score of the current cutoff
 * @param {Object} rankData the ranking data obtained
 * @param {boolean} detailed determines if extra information shows
 * @param {DiscordClient} client we are using to interact with disc
 */
const generateCutoff = async (interaction: CommandInteraction, event: typeof Events,
  timestamp: number, tier: number, score: number, rankData: any, detailed: boolean, discordClient: any ) => {

  // If rank data does not exist then send an error
  if (!rankData.length) {
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

  const msTaken = timestamp - event.startAt;
  const duration = event.aggregateAt - event.startAt;

  // Overall score gain per hour
  const scorePH = Math.round(score * 3600000 / msTaken);

  let lastHourPt = (rankData) ? rankData[0] : {
    timestamp: (new Date(timestamp)).toISOString(),
    score: score
  };

  // Every point is spaced by 1 minute intervals (assuming that there isn't any downtime)
  // Otherwise there maybe a difference of 1-2 minutes, but that's still generally ok for calculating
  if (rankData.length > 60) {
    lastHourPt = rankData[rankData.length - 60];
  }

  // Estimate texts used in the embed
  let noSmoothingEstimate = 'N/A';
  let smoothingEstimate = 'N/A';
  let noSmoothingError = 'N/A';
  let smoothingError = 'N/A';

  // The string we show that highlights the equation we use in detailed
  let linEquationStr = '';

  // Saved indices of critical timestamps
  let oneDayIdx = -1;
  let halfDayIdx = -1;
  let lastDayIdx = rankData.length;

  // Find the index where 12 and 24 hours have passed into the event (or the latest timestamp)
  for (let i = 0; i < rankData.length; i++) {
    const currentEventTime = (new Date(rankData[i].timestamp)).getTime();
    if (halfDayIdx === -1 && currentEventTime >= event.startAt + 43200000) {
      halfDayIdx = i;
    }
    if (currentEventTime >= event.startAt + 86400000) {
      oneDayIdx = i;
      break;
    }
  }

  // Find the index where less than 24 hours left in the event (or the latest timestamp)
  if (timestamp >= event.aggregateAt - 86400000) {
    for (let i = 0; i < rankData.length; i++) {
      const currentEventTime = (new Date(rankData[i].timestamp)).getTime();
      lastDayIdx = i;
      if (currentEventTime >= event.aggregateAt - 86400000) {
        break;
      }
    }
  }

  // If we are at least 1 day into the event
  if (oneDayIdx !== -1) {
    // Get game information from saved json files
    const rate:any = await requestRate();
    const eventCards:any = JSON.parse(fs.readFileSync(`${DIR_DATA}/eventCards.json`));
    const cards:any = JSON.parse(fs.readFileSync(`${DIR_DATA}/cards.json`));

    const characterIds: number[] = [];

    // Find the characters relevant to the event
    eventCards.forEach((card:typeof EventCards) => {
      if (card.eventId == event.id) {
        const cardInfo = binarySearch(card.cardId, 'id', cards);
        characterIds.push(cardInfo.characterId);
      }
    });

    // Values used to calculate the c constant in y = (c * m)x + b
    let totalRate = 0;
    let totalSimilar = 0;

    let allTotalRate = 0;
    let rateCount = 0;

    // Calculate the idx of our rate (based on time into event)
    // Each index starts from 1 day into the event -> the end of the event, with 30 minute intervals
    const rateIdx = Math.floor((timestamp - 86400000) / 1800000);

    // Obtain The Event Type of the Current Event
    let currentEventType = discordClient.getCurrentEvent().eventType;

    // Identify a constant c used in y = (c * m)x + b that can be used via this event
    for (const eventId in rate) {
      if (rate[eventId].eventType !== currentEventType) {
        continue;
      }

      const similarity = characterIds.filter(el => { return rate[eventId].characterIds.indexOf(el) >= 0; }).length;
      if (rate[eventId][tier]) {
        // Make sure our idx is within bounds
        const eventRateIdx = Math.min(rateIdx, rate[eventId][tier].length - 1);

        // Calculate recency factor
        const eventWeight = parseInt(eventId, 10) / event.id;

        // Total Rate = Rate * # of similar characters * recency of event
        totalRate += rate[eventId][tier][eventRateIdx] * similarity * eventWeight;
        totalSimilar += similarity * eventWeight;

        allTotalRate += rate[eventId][tier][eventRateIdx];
        rateCount += 1;
      }
    }

    // Determine the final rate depending on if there was a previous event with similar chara, 
    // otherwise use the average of all events of same type
    // If there is no data to go off of, we use 1
    const finalRate = (totalSimilar) ? (totalRate / totalSimilar) : ((rateCount) ? (allTotalRate / rateCount) : 1);
    console.log(`The Final Rate is ${finalRate}`);

    const points:number[][] = [];

    // Only get data points past 12 hours and before last 24 hours
    rankData.slice(halfDayIdx, lastDayIdx).forEach((point:RankDataType) => {
      points.push([(new Date(point.timestamp)).getTime() - event.startAt, point.score]);
    });

    // Create a linear regression model with our data points
    const model = regression.linear(points, { precision: 100 });
    const predicted = (model.equation[0] * finalRate * duration) + model.equation[1];

    // Calculate Error 
    const error = stdError(points, model, finalRate) * (duration / points[points.length - 1][0]);

    // Final model without smoothing
    noSmoothingEstimate = Math.round(predicted).toLocaleString();
    noSmoothingError = Math.round(error).toLocaleString();

    // Generate the string for the equation
    linEquationStr = `\n*${+(model.equation[0]).toFixed(5)} \\* ` +
      `${+(finalRate).toFixed(2)} \\* ms into event + ${+(model.equation[1]).toFixed(2)}*`;

    // Calculate smoothed result
    let totalWeight = 0;
    let totalTime = 0;

    //Stores error
    let errorSmoothed = 0;

    // Grab 1 Estimate Every 60 Minutes For Smoothing
    const smoothingPoints:number[][] = [];

    rankData.slice(halfDayIdx, oneDayIdx).forEach((point:RankDataType) => {
      smoothingPoints.push([(new Date(point.timestamp)).getTime() - event.startAt, point.score]);
    });

    let lastIdx = oneDayIdx;

    for (let i = oneDayIdx; i < lastDayIdx; i += 60) {
      // console.log(`Added ${rankData.slice(lastIdx, i).length} points to the smoothingPts`)
      rankData.slice(lastIdx, i).forEach((point:RankDataType) => {
        smoothingPoints.push([(new Date(point.timestamp)).getTime() - event.startAt, point.score]);
      });

      lastIdx = i;
      // TODO: Add error checking if smoothingPoints remains empty after this

      // Create a linear regression model with the current data points
      const modelSmoothed = regression.linear(smoothingPoints, { precision: 100 });
      const predictedSmoothed = (modelSmoothed.equation[0] * finalRate * duration) + modelSmoothed.equation[1];

      // Calculate Error 
      errorSmoothed = stdError(points, model, finalRate) * (duration / points[points.length - 1][0]);

      var amtThrough = 0;

      // Calculate the % through the event, we will use this as a weight for the estimation
      // If no indexes then crash and set amtThrough to 0
      if (smoothingPoints.length > 0) {
        amtThrough = (smoothingPoints[smoothingPoints.length - 1][0]) / duration;
      }

      // console.log(`last point ts ${smoothingPoints[smoothingPoints.length-1][0]}`)

      // Total score of all of our estimates with account to weight
      if(!isNaN(predictedSmoothed))
      {
        totalWeight += predictedSmoothed * Math.pow(amtThrough, 2);
      }

      // Total time weights
      totalTime += Math.pow(amtThrough, 2);
    }

    smoothingEstimate = Math.round(totalWeight / totalTime).toLocaleString();
    smoothingError = Math.round(errorSmoothed).toLocaleString();
  }

  // Generate the cutoff embed
  const lastHourPtTimeMs = new Date(lastHourPt.timestamp).getTime();
  const lastHourPtTime = (timestamp > event.aggregateAt) ? Math.floor(timestamp / 1000) :
    Math.floor(lastHourPtTimeMs / 1000);
  const lastHourPtSpeed = (timestamp > event.aggregateAt) ? 0 :
    Math.round((score - lastHourPt.score) * 3600000 / (timestamp - lastHourPtTimeMs));

  const eventPercentage = Math.min((timestamp - event.startAt) * 100 / duration, 100);

  const cutoffEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${event.name} T${tier} Cutoff`)
    .setDescription(`**Requested:** <t:${Math.floor(timestamp / 1000)}:R>`)
    .setThumbnail(event.banner)
    .addField('Cutoff Statistics', `Points: \`\`${score.toLocaleString()}\`\`\n` +
      `Avg. Speed (Per Hour): \`\`${scorePH.toLocaleString()}/h\`\`\n` +
      `Avg. Speed [<t:${lastHourPtTime}:R> to <t:${Math.floor(timestamp / 1000)}:R>] (Per Hour): \`\`${lastHourPtSpeed.toLocaleString()}/h\`\`\n`)
    .addField('Event Information', `Ranking Started: <t:${Math.floor(event.startAt / 1000)}:R>\n` +
      `Ranking Ends: <t:${Math.floor(event.aggregateAt / 1000)}:R>\n` +
      `Percentage Through Event: \`\`${+(eventPercentage).toFixed(2)}%\`\`\n`)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  if (tier < 100) {
    cutoffEmbed.addField('Warning', `*${COMMAND.CONSTANTS.PRED_WARNING}*`);
  }

  cutoffEmbed.addField('Point Estimation (Predictions)', `Estimated Points: \`\`${noSmoothingEstimate}` +
    ` ± ${noSmoothingError}\`\`\n` +
    ((detailed) ? `*${COMMAND.CONSTANTS.PRED_DESC}*${linEquationStr}\n\n` : '') +
    `Estimated Points (Smoothing): \`\`${smoothingEstimate}` +
    ` ± ${smoothingError}\`\`\n` +
    ((detailed) ? `*${COMMAND.CONSTANTS.SMOOTH_PRED_DESC}*\n` : ''));


  // Add a Naive Estimate if the user requests detailed information
  if (detailed) {
    const naiveEstimate = (oneDayIdx === -1) ? 'N/A' :
      Math.round(score + Math.max((event.aggregateAt - timestamp), 0) * (scorePH / 3600000)).toLocaleString();
    const naiveLastHrEstimate = (oneDayIdx === -1) ? 'N/A' :
      Math.round(score + Math.max((event.aggregateAt - timestamp), 0) * (lastHourPtSpeed / 3600000)).toLocaleString();

    cutoffEmbed.addField('Naive Estimation (Predictions)', `Naive Estimate: \`\`${naiveEstimate}\`\`\n` +
      `*${COMMAND.CONSTANTS.NAIVE_DESC}*\n\n` +
      `Naive Estimate (Last Hour): \`\`${naiveLastHrEstimate}\`\`\n` +
      `*${COMMAND.CONSTANTS.NAIVE_LAST_HR_DESC}*\n`);
  }

  await interaction.editReply({
    embeds: [cutoffEmbed]
  });
};

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

    if (!discordClient.checkRateLimit(interaction.user.id)) {
      await interaction.editReply({
        embeds: [generateEmbed({
          name: COMMAND.INFO.name,
          content: {
            type: COMMAND.CONSTANTS.RATE_LIMIT_ERR.type,
            message: COMMAND.CONSTANTS.RATE_LIMIT_ERR.message +
              `\n\nExpires: <t:${Math.floor(discordClient.getRateLimitRemoval(interaction.user.id) / 1000)}>`
          },
          client: discordClient.client
        })]
      });
      return;
    }

    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      targetRank: tier,
      lowerLimit: 0
    }, async (response: any) => {
      // Check if the response is valid
      if (!response.rankings) {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.commandName,
              content: COMMAND.CONSTANTS.NO_RESPONSE_ERR,
              client: discordClient.client
            })
          ]
        });
        return;
      } else if (response.rankings.length === 0) {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.commandName,
              content: COMMAND.CONSTANTS.BAD_INPUT_ERROR,
              client: discordClient.client
            })
          ]
        });
        return;
      }

      const timestamp = Date.now();
      const score = response.rankings[0].score;

      let paramCount = interaction.options._hoistedOptions.length;
      let detailed = (paramCount === 1) ? false : interaction.options._hoistedOptions[1].value;

      try {

        let cutoffs = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
          'WHERE (EventID=@eventID AND Tier=@tier)').all({
            eventID: event.id,
            tier: tier
          });
        let rankData = cutoffs.map((x: any) => ({ timestamp: x.Timestamp, score: x.Score }));
        console.log('Data Read, Generating Internal cutoff');
        generateCutoff(
          interaction,
          event,
          timestamp,
          tier,
          score,
          rankData,
          detailed,
          discordClient
        );

      } catch (err:any) {
        console.log(err);
        discordClient.logger.log({
          level: 'error',
          timestamp: Date.now(),
          message: `Error parsing JSON data from cutoff: ${err}`
        });
      }
    }, async (err:any) => {
      // Log the error
      discordClient.logger.log({
        level: 'error',
        timestamp: Date.now(),
        message: err.toString()
      });

      await interaction.editReply({
        embeds: [generateEmbed({
          name: COMMAND.INFO.name,
          content: { type: 'error', message: err.toString() },
          client: discordClient.client
        })]
      });
    });
  }
};

export {};