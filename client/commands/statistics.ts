/**
 * @fileoverview Displays statistics of a user or tier
 * @author Ai0796
 */

const fs = require('fs');

const COMMAND = require('../command_data/statistics');

const generateSlashCommand = require('../methods/generateSlashCommand');
const calculateTeam = require('../methods/calculateTeam');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');

const HOUR = 3600000;
const SONGBIAS = 8.00; //Multiplier for Talent to get score

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
 * Generates an embed from the provided params
 * @param {String} name the name of the command
 * @param {Object} content the content of the message
 * @param {String} image an image URL (if applicable)
 * @param {DiscordClient} client the client we are using to handle Discord requests
 * @return {MessageEmbed} a generated embed
 */
const generateEmbed = ({ name, client }) => {
    const embed = new MessageEmbed()
        .setColor(NENE_COLOR)
        .setTitle(name.charAt(0).toUpperCase() + name.slice(1))
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp()
        .setFooter(FOOTER, client.user.displayAvatarURL());

    return embed;
};

module.exports = generateEmbed;

function getEventData(eventID) {
    const data = JSON.parse(fs.readFileSync('./sekai_master/events.json'));

    return data[eventID - 2];
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
        if(sortedList[i] >= el) {
            return i;
        }
    }
    return 0;
}

function sanityLost(gamesPlayed, finalPoint)
{
    let sanity =  Math.pow(finalPoint, 0.75) * gamesPlayed;
    let sanityNum = parseInt(Math.log(sanity) / Math.log(1000));
    sanity /= Math.pow(1000, sanityNum);
    let suffix = sanityNum * 3;
    sanity = sanity.toFixed(6);
    return {sanity : sanity, suffix: suffix};
}

async function userStatistics(user, eventId, eventData, discordClient, interaction) {

    let id = discordClient.getId(user.id);

    if(id == -1) {
        interaction.editReply({ content: 'Discord User not found (are you sure that account is linked?)' });
        return;
    }

    let data = discordClient.cutoffdb.prepare('SELECT * FROM users ' +
        'WHERE (id=@id AND EventID=@eventID)').all({
            id: id,
            eventID: eventId
        });
    let userData = discordClient.db.prepare('SELECT * FROM users ' +
        'WHERE (discord_id=@discord_id)').all({
          discord_id: user.id,
        });
    if (data.length) {
        discordClient.addPrioritySekaiRequest('profile', {
            userId: userData[0].sekai_id
        }, async (profile) => {
            let rankData = data.map(x => ({ timestamp: x.Timestamp, score: x.Score }));
            discordClient.addPrioritySekaiRequest('ranking', {
                eventId: eventId,
                targetUserId: userData[0].sekai_id,
                lowerLimit: 0
            }, async (response) => {
                rankData.unshift({ timestamp: eventData.startAt, score: 0});
                rankData.push({ timestamp: Date.now(), score: response['rankings'][0]['score'] });
                let lastTimestamp = rankData[rankData.length - 1].timestamp;
                let timestamps = rankData.map(x => x.timestamp);
                let lastHourIndex = getLastHour(timestamps, lastTimestamp - HOUR);

                let lastHour = rankData[lastHourIndex];
                let scoreLastHour = rankData[rankData.length - 1].score - lastHour.score;

                let teamData = calculateTeam(profile, eventId);
                let score = calculateScore(teamData.talent);
                let multiscore = score * 5;
                let eventPoints = calculateEventPoints(score, multiscore, teamData.eventBonus + 1, eventData.eventType === 'cheerful_carnival');
                let pointTable = generateEnergyTable(eventPoints);

                let lastPoint = rankData[0].score;

                let energyUsed = 0;
                let gamesPlayed = 0;
                let energyUsedHr = 0;
                let gamesPlayedHr = 0;
                let pointsPerGame = [];
                let timestampIndex = 0;
                let movingWindowSpeeds = [];

                rankData.slice(1).forEach((point, i) => {
                    if (point.score - lastPoint >= 100) {
                        let tempEnergyTable = [];
                        let gain = point.score - lastPoint;
                        let windowIndex = getLastHour(timestamps, point.timestamp - HOUR);
                        timestamps = timestamps.slice(windowIndex);
                        timestampIndex += windowIndex;
                        movingWindowSpeeds.push(point.score - rankData[Math.max(timestampIndex - 1, 0)].score);
                        energyBoost.forEach((x, i) => {
                            if (gain % x == 0) {
                                tempEnergyTable.push([i, pointTable[i]]);
                            }
                        });
                        let energyUsedGame = getEnergyPerGame(tempEnergyTable, gain);
                        energyUsed += energyUsedGame;
                        gamesPlayed++;
                        pointsPerGame.push({points: gain, energy: energyUsedGame, timestamp: parseInt(point.timestamp/1000)});
                        if (i >= lastHourIndex) {
                            energyUsedHr += energyUsedGame;
                            gamesPlayedHr++;
                        }
                    }
                    lastPoint = point.score;
                });

                let timestamp = parseInt(rankData[rankData.length - 1].timestamp / 1000);

                let sanity = sanityLost(gamesPlayed, rankData[rankData.length - 1].score);

                let scorePerGame = parseFloat(scoreLastHour / gamesPlayedHr).toFixed(2);
                let peakSpeed = Math.max(...movingWindowSpeeds);

                let title = `${user.username} Statistics`;

                let embed = generateEmbed({
                    name: title,
                    client: discordClient.client
                });

                //Ignore this entire section
                embed.addFields(
                    { name: 'Current Event Points', value: rankData[rankData.length - 1].score.toLocaleString() },
                    { name: 'Event Points Gained in the Last Hour', value: scoreLastHour.toLocaleString() },
                    { name: 'Games Played in the Last Hour', value: `${gamesPlayedHr.toLocaleString()}`, inline: true },
                    { name: 'Total Games Played', value: `${gamesPlayed.toLocaleString()}`, inline: true },
                    { name: 'Average Score per Game over the hour', value: scorePerGame.toLocaleString() },
                    { name: 'Energy Used in the Last Hour', value: energyUsedHr.toLocaleString(), inline: true },
                    { name: 'Total Energy Used', value: energyUsed.toLocaleString(), inline: true },
                    { name: 'Peak Speed over an hour', value: peakSpeed.toLocaleString() },
                    { name: 'Estimated Talent', value: `${Math.round(teamData.talent).toLocaleString()}`, inline: true },
                    { name: 'Estimated Event Bonus', value: `${(teamData.eventBonus * 100).toFixed(2) }%`, inline: true },
                    { name: 'Sanity Lost', value: `${sanity.sanity}e${sanity.suffix} <:sparkles:1012729567615656066>` }
                );

                for (let i = 1; i < Math.min(7, pointsPerGame.length + 1); i++) {
                    let game = pointsPerGame[pointsPerGame.length - i];
                    embed.addFields({ name: `**Game ${i}:**`, value: `${game.points}\n<t:${game.timestamp}:R>`, inline: true });
                }

                embed.addFields({ name: 'Updated:', value: `<t:${timestamp}:R>` });

                if (user.id == '475083312772415489' || user.id == '327997209666912256') {
                    embed.addFields({ name: 'People Kiled:', value: '1' });
                }

                else if (user.id == '530650499465216000') {
                    embed.addFields({ name: 'Hearts Broken:', value: '6' });
                }

                else if (user.id == '178294808429723648') {
                    embed.addFields({ name: 'Broken Hearts', value: '6' });
                }

                let reply = `Current Event Points: ${rankData[rankData.length - 1].score.toLocaleString()}\n` +
                    `Event Points Gained in the Last Hour: ${scoreLastHour}\n` +
                    `Games Played in the Last Hour: ${gamesPlayedHr} (${gamesPlayed} Total)\n` +
                    'Average Score per Game over the hour: ' + scorePerGame + '\n' +
                    `Estimated Energy used over the hour: ${energyUsedHr} (${energyUsed} Total)\n` +
                    `Peak Speed over an hour: ${peakSpeed}\n` +
                    `Sanity Lost: ${sanity.sanity}e${sanity.suffix} <:sparkles:1012729567615656066>\n` +
                    `Estimated Talent: ${Math.round(teamData.talent)}\n` +
                    `Estimated Event Bonus: ${(teamData.eventBonus * 100).toFixed(2)}%\n` +
                    'Last 5 Games:\n';

                var game;
                for (let i = 1; i < Math.min(6, pointsPerGame.length + 1); i++) {
                    game = pointsPerGame[pointsPerGame.length - i];
                    reply += `**Game ${i}:** ${game.points} <t:${game.timestamp}:R> (Energy Used: ${game.energy})\n`;
                }

                reply += `Updated: <t:${timestamp}:R>`;

                if (user.id == '475083312772415489' || user.id == '327997209666912256') {
                    reply += '\nPeople Killed: 1';
                }

                else if (user.id == '530650499465216000') {
                    reply += '\nHearts Broken: 6';
                }

                else if (user.id == '178294808429723648') {
                    reply += '\nBroken Hearts: 6';
                }

                let mobileEmbed = generateEmbed({
                    name: title,
                    client: discordClient.client
                });

                mobileEmbed.addFields(
                    { name: title, value: reply }
                );

                sendEmbed(interaction, embed, mobileEmbed);
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
        interaction.editReply({ content: 'Discord User found but no data logged (have you recently linked or event ended?)' });
    }
}

async function tierStatistics(tier, eventId, eventData, discordClient, interaction) {

    discordClient.addPrioritySekaiRequest('ranking', {
        eventId: eventId,
        targetRank: tier,
        lowerLimit: 0
    }, async (response) => {
        let data = discordClient.cutoffdb.prepare('SELECT Timestamp, Score FROM cutoffs ' +
            'WHERE (EventID=@eventID AND ID=@id)').all({
                id: response['rankings'][0]['userId'],
                eventID: eventId
            });

        if (data.length == 0) {
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

        let points = new Set();
        let rankData = [];

        data.forEach(x => {
            if(!points.has(x.Score)){
                rankData.push({ timestamp: x.Timestamp, score: x.Score });
                points.add(x.Score);
            }
        });
        rankData.unshift({ timestamp: eventData.startAt, score: 0 });
        rankData.push({ timestamp: Date.now(), score: response['rankings'][0]['score'] });
        rankData.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : (b.timestamp > a.timestamp) ? -1 : 0);
            
        let lastTimestamp = rankData[rankData.length - 1].timestamp;
        let timestamps = rankData.map(x => x.timestamp);
        let lastHourIndex = getLastHour(timestamps, lastTimestamp - HOUR);

        let lastHour = rankData[lastHourIndex];
        let scoreLastHour = rankData[rankData.length - 1].score - lastHour.score;

        let lastPoint = rankData[0].score;

        let gamesPlayed = 0;
        let gamesPlayedHr = 0;
        let pointsPerGame = [];
        let energyPossibilities = energyBoost.map(() => 0);
        let energyPossiblitiesHour = energyBoost.map(() => 0);
        let timestampIndex = 0;
        let movingWindowSpeeds = [];

        rankData.slice(1).forEach((point, i) => {
            if (point.score - lastPoint >= 100) {
                let gain = point.score - lastPoint;
                let windowIndex = getLastHour(timestamps, point.timestamp - HOUR);
                timestamps = timestamps.slice(windowIndex);
                timestampIndex += windowIndex;
                movingWindowSpeeds.push(point.score - rankData[timestampIndex].score);
                energyBoost.forEach((x, idx) => {
                    if (x != 1 && gain % x == 0 && gain < 2000 * x) {
                        energyPossibilities[idx] += 1;
                        if (i >= lastHourIndex) {
                            energyPossiblitiesHour[idx] += 1;
                        }
                    }
                });
                gamesPlayed++;
                pointsPerGame.push({ points: gain, timestamp: parseInt(point.timestamp / 1000) });
                if (i >= lastHourIndex) {
                    gamesPlayedHr++;
                }
                lastPoint = point.score;
            }
        });

        let timestamp = parseInt(rankData[rankData.length - 1].timestamp / 1000);

        let sanity = sanityLost(gamesPlayed, rankData[rankData.length - 1].score);

        let scorePerGame = parseFloat(scoreLastHour / gamesPlayedHr).toFixed(2);

        let estimatedEnergy = energyPossibilities.indexOf(Math.max(...energyPossibilities));
        let estimatedEnergyHour = energyPossiblitiesHour.indexOf(Math.max(...energyPossiblitiesHour));
        let peakSpeed = Math.max(...movingWindowSpeeds);

        let title = `T${tier} ${response['rankings'][0].name} Statistics`;

        let embed = generateEmbed({
            name: title,
            client: discordClient.client
        });

        // Embed Reply
        embed.addFields(
            { name: 'Current Event Points', value: rankData[rankData.length - 1].score.toLocaleString()},
            { name: 'Event Points Gained in the Last Hour', value: scoreLastHour.toLocaleString() },
            { name: 'Games Played in the Last Hour', value: `${gamesPlayedHr.toLocaleString()}`, inline: true },
            { name: 'Games Played', value: `${gamesPlayed.toLocaleString()}`, inline: true },
            { name: 'Average Score per Game over the hour', value: scorePerGame.toLocaleString() },
            { name: 'Peak Speed over an hour', value: peakSpeed.toLocaleString() },
            { name: 'Estimated Energy usage', value: `${estimatedEnergy}x`},
            { name: 'Estimated Energy usage over the hour', value: `${estimatedEnergyHour}x` },
            { name: 'Sanity Lost', value: `${sanity.sanity}e${sanity.suffix} <:sparkles:1012729567615656066>` },
        );

        //Ignore this entire section
        let reply = `Current Event Points: ${rankData[rankData.length - 1].score.toLocaleString()}\n` +
            `Event Points Gained in the Last Hour: ${scoreLastHour}\n` +
            `Games Played in the Last Hour: ${gamesPlayedHr} (${gamesPlayed} Total)\n` +
            `Average Score per Game over the hour: ${scorePerGame}\n` +
            `Peak Speed over an hour: ${peakSpeed}\n` +
            `Estimated Energy usage: ${estimatedEnergy}\n` +
            `Estimated Energy usage over the hour: ${estimatedEnergyHour}\n` +
            `Sanity Lost: ${sanity.sanity}e${sanity.suffix} <:sparkles:1012729567615656066>\n` +
            'Last 5 Games:\n';

        for (let i = 1; i < Math.min(6, pointsPerGame.length + 1); i++) {
            let game = pointsPerGame[pointsPerGame.length - i];
            reply += `**Game ${i}:** ${game.points} <t:${game.timestamp}:R> \n`;
        }

        reply += `Updated: <t:${timestamp}:R>`;

        let mobileEmbed = generateEmbed({
            name: title,
            client: discordClient.client
        });

        mobileEmbed.addFields(
            {name: title, value: reply}
        );

        for (let i = 1; i < Math.min(7, pointsPerGame.length + 1); i++) {
            let game = pointsPerGame[pointsPerGame.length - i];
            embed.addFields({name: `**Game ${i}:**`, value: `${game.points}\n<t:${game.timestamp}:R>`, inline: true});
        }

        embed.addFields({name: 'Updated:', value: `<t:${timestamp}:R>`});

        sendEmbed(interaction, embed, mobileEmbed);

    }, (err) => {
        discordClient.logger.log({
            level: 'error',
            message: err.toString()
        });
    });
}

async function sendEmbed(interaction, embed, mobileEmbed) {
    const statisticsButtons = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('condensed')
                .setLabel('CONDENSED')
                .setStyle('SECONDARY')
                .setEmoji(COMMAND.CONSTANTS.CONDENSED)
        );

    const statisticsMessage = await interaction.editReply({
        embeds: [embed],
        components: [statisticsButtons],
        fetchReply: true
    });

    // Create a filter for valid responses
    const filter = (i) => {
        return i.customId == 'condensed';
    };

    const collector = statisticsMessage.createMessageComponentCollector({
        filter,
        time: COMMAND.CONSTANTS.INTERACTION_TIME
    });

    // Collect user interactions with the prev / next buttons
    var condensed = false;
    collector.on('collect', async (i) => {
        if (i.customId === 'condensed') {
            condensed = !condensed;
        }

        if (condensed) {
            await i.update({
                embeds: [mobileEmbed],
                components: [statisticsButtons]
            });
        }
        else {
            await i.update({
                embeds: [embed],
                components: [statisticsButtons]
            });
        }
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

        const user = interaction.options.getUser('user');
        const tier = interaction.options.getInteger('tier');
        const eventId = interaction.options.getInteger('event') || event.id;

        const eventData = getEventData(eventId);

        if (user) {
            try {
                userStatistics(user, eventId, eventData, discordClient, interaction);
            } catch (err) {
                console.log(err);
            }
        }

        else if (tier) {
            try {
                tierStatistics(tier, eventId, eventData, discordClient, interaction);
            } catch (err) {
                console.log(err);
            }
        }
    }
};

export {};