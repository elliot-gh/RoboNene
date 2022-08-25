/**
 * @fileoverview Display a graph of the previous ranking trend
 * @author Potor10
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');
const fs = require('fs');

const COMMAND = require('../command_data/graph')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed')

const HOUR = 3600000;

function getEventName(eventID) {
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

function bisect(sortedList, el) {
    if (!sortedList.length) return 0;

    if (sortedList.length == 1) {
        return el > sortedList[0] ? 1 : 0;
    }

    let lbound = 0;
    let rbound = sortedList.length - 1;
    return bisect(lbound, rbound);

    function bisect(lb, rb) {
        if (rb - lb == 1) {
            if (sortedList[lb] < el && sortedList[rb] >= el) {
                return lb + 1;
            }

            if (sortedList[lb] == el) {
                return lb;
            }
        }

        if (sortedList[lb] > el) {
            return 0;
        }

        if (sortedList[rb] < el) {
            return sortedList.length
        }

        let midPoint = lb + (Math.floor((rb - lb) / 2));
        let midValue = sortedList[midPoint];

        if (el <= midValue) {
            rbound = midPoint
        }

        else if (el > midValue) {
            lbound = midPoint
        }

        return bisect(lbound, rbound);
    }
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

        const user = interaction.options.getUser('user');

        if (user) {
            try {
                let data = discordClient.cutoffdb.prepare('SELECT * FROM users ' +
                    'WHERE (discord_id=@discord_id AND EventID=@eventID)').all({
                        discord_id: user.id,
                        eventID: event.id
                    });
                if (data.length) {
                    let name = user.username;
                    let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));\
                    let lastTimestamp = rankData[rankData.length - 1].timestamp
                    console.log(lastTimestamp)
                    let lastHour = rankData[rankData.length - 60] //Assume since data stored every minute one hour is 60 indexes
                    let lastHourIndex = bisect(rankData.map(element => {Data.parse(element.Timestamp)}), )
                    let scoreLastHour = rankData[rankData.length - 1].score - lastHour.score

                    let lastScore = rankData.pop(0)
                    var gamesPlayed = 0

                    rankData.forEach(dataPoint => {
                        if(dataPoint.score > lastScore){
                            gamesPlayed++;
                            lastScore = dataPoint.score;
                        }
                    });
                    interaction.editReply({ content: `"Score Gained in the Last Hour: ${scoreLastHour}` })
                }
                else {
                    interaction.editReply({ content: 'Discord User not found (are you sure that account is linked?)' })
                }
            } catch (err) {
                // Error parsing JSON: ${err}`
            }
        }
    }
};