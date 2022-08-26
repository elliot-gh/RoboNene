/**
 * @fileoverview Display a graph of the previous ranking trend
 * @author Potor10
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');
const fs = require('fs');

const COMMAND = require('../command_data/statistics');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');
const calculateTeam = require('../methods/calculateTeam');

const HOUR = 3600000;
const SONGBIAS = 3.36 * 4.0; //Multiplier for Talent to get score

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

function generateEnergyTable(eventPoints)
{
    return energyBoost.map(x => x * eventPoints);
}

function calculateEventPoints(score, multiscore, eventBoost, isCheerful=false)
{
    let scorePoints = score / 20000;
    let multiPoints = Math.min(multiscore, 11000000) / 1000000;
    let cheerfulPoints = isCheerful ? 50 : 0;
    return (100 + scorePoints + multiPoints + cheerfulPoints) * eventBoost;
}

function calculateScore(talent)
{
    return talent * SONGBIAS;
}

function getEnergyPerGame(energyTable, eventPoints)
{
    let index = 0;
    energyTable.forEach((points, i) => {
        if(Math.abs(eventPoints - points) < Math.abs(eventPoints - energyTable[index])){
            index = i;
        }
    });

    return index;
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

        const eventData = getEventData(event.id);

        const user = interaction.options.getUser('user');

        if (user) {
            try {
                let data = discordClient.cutoffdb.prepare('SELECT * FROM users ' +
                    'WHERE (discord_id=@discord_id AND EventID=@eventID)').all({
                        discord_id: user.id,
                        eventID: event.id
                    });
                let userData = discordClient.db.prepare('Select * FROM users WHERE ' +
                    'discord_id=@discordid').all({
                        discordid: user.id
                    });
                if (data.length && userData.length) {
                    discordClient.addSekaiRequest('profile', {
                        userId: userData[0].sekai_id
                    }, async(response) => {
                        let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
                        let lastTimestamp = rankData[rankData.length - 1].timestamp;
                        let timestamps = rankData.map(x => x.timestamp);
                        let lastHourIndex = bisect(timestamps, lastTimestamp - HOUR);
                        let lastHour = rankData[lastHourIndex];
                        let scoreLastHour = rankData[rankData.length - 1].score - lastHour.score;

                        let teamData = calculateTeam(response, event.id);
                        console.log(teamData);
                        let score = calculateScore(teamData.talent);
                        let multiscore = score * 5;
                        let eventPoints = calculateEventPoints(score, multiscore, teamData.eventBonus, eventData.eventType === 'cheerful_carnival');
                        let pointTable = generateEnergyTable(eventPoints);

                        let lastPoint = rankData[0].score;

                        let energyUsed = 0;
                        let gamesPlayed = 0;

                        rankData.slice(1).forEach(point => {
                            if(lastPoint != point.score)
                            {
                                energyUsed += getEnergyPerGame(pointTable, point.score - lastPoint);
                                gamesPlayed++;
                            }
                            lastPoint = point.score;
                        });
                        
                        let reply = `Event Points Gained in the Last Hour: ${scoreLastHour}\n` +
                        `Games Played in the Last Hour: ${gamesPlayed}\n` +
                        `Predicted Energy Used (with current main team): ${energyUsed}`;

                        interaction.editReply({ content: reply});
                    });
                }
                else {
                    interaction.editReply({ content: 'Discord User not found (are you sure that account is linked?)' });
                }
            } catch (err) {
                console.log(err);
            }
        }
    }
};