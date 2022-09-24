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

function calculateEventPoints(score, multiscore, eventBoost, isCheerful)
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
        if(Math.abs(eventPoints - points[1]) < Math.abs(eventPoints - energyTable[index][1])){
            index = i;
        }
    });

    return energyTable[index][0];
}

function getLastHour(sortedList, el) {
    for(let i = 0; i < sortedList.length; i++) {
        if(sortedList[i] > el) {
            return i;
        }
    }
    return 0
}

function sanityLost(gamesPlayed, finalPoint)
{
    let sanity =  Math.pow(finalPoint, 0.75) * gamesPlayed
    let sanityNum = parseInt(Math.log(sanity) / Math.log(1000));
    sanity /= Math.pow(1000, sanityNum)
    let suffix = sanityNum * 3;
    sanity = sanity.toFixed(6);
    return sanity, suffix
}

async function userStatistics(user, event, eventData, discordClient, interaction) {
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
        discordClient.addPrioritySekaiRequest('profile', {
            userId: userData[0].sekai_id
        }, async (profile) => {
            let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
            discordClient.addPrioritySekaiRequest('ranking', {
                eventId: event.id,
                targetUserId: userData[0].sekai_id,
                lowerLimit: 0
            }, async (response) => {
                rankData.push({ timestamp: Date.now(), score: response['rankings'][0]['score'] });
                let lastTimestamp = rankData[rankData.length - 1].timestamp;
                let timestamps = rankData.map(x => x.timestamp);
                let lastHourIndex = getLastHour(timestamps, lastTimestamp - HOUR);

                let lastHour = rankData[lastHourIndex];
                let scoreLastHour = rankData[rankData.length - 1].score - lastHour.score;

                let teamData = calculateTeam(profile, event.id);
                let score = calculateScore(teamData.talent);
                let multiscore = score * 5;
                let eventPoints = calculateEventPoints(score, multiscore, teamData.eventBonus + 1, eventData.eventType === 'cheerful_carnival');
                let pointTable = generateEnergyTable(eventPoints);

                let lastPoint = rankData[0].score;

                let energyUsed = 0;
                let gamesPlayed = 0;
                let energyUsedHr = 0;
                let gamesPlayedHr = 0;
                let pointsPerGame = []

                rankData.slice(1).forEach((point, i) => {
                    if (lastPoint < point.score) {
                        let tempEnergyTable = [];
                        let gain = point.score - lastPoint
                        energyBoost.forEach((x, i) => {
                            if (gain % x == 0) {
                                tempEnergyTable.push([i, pointTable[i]]);
                            }
                        })
                        let energyUsedGame = getEnergyPerGame(tempEnergyTable, gain);
                        energyUsed += energyUsedGame;
                        gamesPlayed++
                        pointsPerGame.push({points: gain, energy: energyUsedGame});
                        if (i >= lastHourIndex) {
                            energyUsedHr += energyUsedGame;
                            gamesPlayedHr++;
                        }
                    }
                    lastPoint = point.score;
                });

                let timestamp = parseInt(rankData[rankData.length - 1].timestamp / 1000)

                let sanity, suffix = sanityLost(gamesPlayed, rankData[rankData.length - 1].score)

                let scorePerGame = parseFloat(scoreLastHour / gamesPlayedHr).toFixed(2);

                let reply = `Event Points Gained in the Last Hour: ${scoreLastHour}\n` +
                    `Games Played in the Last Hour: ${gamesPlayedHr} (${gamesPlayed} Total)\n` +
                    `Average Score per Game over the hour: ` + scorePerGame + '\n' +
                    `Estimated Energy used over the hour: ${energyUsedHr} (${energyUsed} Total)\n` +
                    `Sanity Lost: ${sanity}e${suffix} <:sparkles:1012729567615656066>\n` +
                    `Last 5 Games:\n`

                var game;
                for (let i = 1; i < 6; i++) {
                    game = pointsPerGame[pointsPerGame.length - i]
                    reply += `**Game ${i}:** ${game.points} (Energy Used: ${game.energy})\n`
                }

                reply += `Updated: <t:${timestamp}:R>`

                let title = `${user.username} Statistics`

                if (user.id == '475083312772415489') {
                    reply += '\nPeople Killed: 1';
                }

                await interaction.editReply({
                    embeds: [
                        generateEmbed({
                            name: title,
                            content: {
                                'type': 'Statistics',
                                'message': reply
                            },
                            client: discordClient.client
                        })
                    ]
                });
            },
                (err) => {
                    discordClient.logger.log({
                        level: 'error',
                        message: err.toString()
                    });
                });
        });
    }
    else {
        interaction.editReply({ content: 'Discord User not found (are you sure that account is linked?)' });
    }
}

async function tierStatistics(tier, event, eventData, discordClient, interaction) {
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

        return
    }
    else {
        let userId = data[data.length - 1].ID
        data = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
            'WHERE (ID=@id AND EventID=@eventID)').all({
                id: userId,
                eventID: event.id
            });
    }
    discordClient.addPrioritySekaiRequest('ranking', {
        eventId: event.id,
        targetRank: tier,
        lowerLimit: 0
    }, async (response) => {
        let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
        discordClient.addPrioritySekaiRequest('ranking', {
            eventId: event,
            targetRank: tier,
            lowerLimit: 0
        }, async (response) => {
            rankData.push({ timestamp: Date.now(), score: response['rankings'][0]['score']});
            rankData.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : (b.timestamp > a.timestamp) ? -1 : 0);
            let lastTimestamp = rankData[rankData.length - 1].timestamp;
            let timestamps = rankData.map(x => x.timestamp);
            let lastHourIndex = getLastHour(timestamps, lastTimestamp - HOUR);

            let lastHour = rankData[lastHourIndex];
            let scoreLastHour = rankData[rankData.length - 1].score - lastHour.score;

            let lastPoint = rankData[0].score;

            let gamesPlayed = 0;
            let gamesPlayedHr = 0;
            let pointsPerGame = []

            rankData.slice(1).forEach((point, i) => {
                if (lastPoint < point.score) {
                    gamesPlayed++;
                    pointsPerGame.push(point.score - lastPoint)
                    if (i >= lastHourIndex) {
                        gamesPlayedHr++;
                    }
                }
                lastPoint = point.score;
            });

            let timestamp = parseInt(rankData[rankData.length - 1].timestamp / 1000)

            let sanity = sanityLost(gamesPlayed, rankData[rankData.length - 1].score)

            let scorePerGame = parseFloat(scoreLastHour / gamesPlayedHr).toFixed(2);

            let reply = `Event Points Gained in the Last Hour: ${scoreLastHour}\n` +
                `Games Played in the Last Hour: ${gamesPlayedHr} (${gamesPlayed} Total)\n` +
                `Average Score per Game over the hour: ` + scorePerGame + '\n' +
                `Sanity Lost: ${sanity}e${suffix} <:sparkles:1012729567615656066>\n` +
                `Last 5 Games:\n`

            for (let i = 1; i < 6; i++) {
                reply += `**Game ${i}:** ${pointsPerGame[pointsPerGame.length - i]}\n`
            }

            reply += `Updated: <t:${timestamp}:R>`

            let title = `T${tier} ${response["rankings"][0].name} Statistics`;

            await interaction.editReply({
                embeds: [
                    generateEmbed({
                        name: title,
                        content: {
                            'type': 'Statistics',
                            'message': reply
                        },
                        client: discordClient.client
                    })
                ]
            });
        }, (err) => {
            discordClient.logger.log({
                level: 'error',
                message: err.toString()
            });
        });
    },
    (err) => {
        discordClient.logger.log({
            level: 'error',
            message: err.toString()
        });
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

        const eventData = getEventData(event.id);

        const user = interaction.options.getUser('user');
        const tier = interaction.options.getInteger('tier');

        if (user) {
            try {
                userStatistics(user, event, eventData, discordClient, interaction)
            } catch (err) {
            console.log(err);
            }
        }

        else if (tier) {
            try {
                tierStatistics(tier, event, eventData, discordClient, interaction)
            } catch (err) {
                console.log(err);
            }
        }
    }
};