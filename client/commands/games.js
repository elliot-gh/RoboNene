/**
 * @fileoverview Displays statistics of a user or tier
 * @author Ai0796
 */

const COMMAND = require('../command_data/games');

const generateSlashCommand = require('../methods/generateSlashCommand');
const calculateTeam = require('../methods/calculateTeam');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const getEventData = require('../methods/getEventData');

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
 * @return {EmbedBuilder} a generated embed
 */
const generateEmbed = ({ name, client }) => {
    const embed = new EmbedBuilder()
        .setColor(NENE_COLOR)
        .setTitle(name.charAt(0).toUpperCase() + name.slice(1))
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: FOOTER, iconURL: client.user.displayAvatarURL() });

    return embed;
};

function generateEnergyTable(eventPoints) {
    return energyBoost.map(x => x * eventPoints);
}

function calculateEventPoints(score, multiscore, eventBoost, isCheerful) {
    let scorePoints = score / 17500;
    let multiPoints = Math.min(multiscore, 1100000) / 100000;
    let cheerfulPoints = isCheerful ? 50 : 0;
    return (114 + scorePoints + multiPoints + cheerfulPoints) * (1 + eventBoost);
}

function calculateScore(talent) {
    return talent * SONGBIAS;
}

function getEnergyPerGame(energyTable, eventPoints) {
    let index = 0;
    energyTable.forEach((points, i) => {
        if (Math.abs(eventPoints - points[1]) < Math.abs(eventPoints - energyTable[index][1])) {
            index = i;
        }
    });

    return energyTable[index][0];
}

function getLastHour(sortedList, el) {
    for (let i = 0; i < sortedList.length; i++) {
        if (sortedList[i] >= el) {
            return i;
        }
    }
    return 0;
}

function sanityLost(gamesPlayed, finalPoint) {
    let sanity = Math.pow(finalPoint, 0.75) * gamesPlayed;
    let sanityNum = parseInt(Math.log(sanity) / Math.log(1000));
    sanity /= Math.pow(1000, sanityNum);
    let suffix = sanityNum * 3;
    sanity = sanity.toFixed(6);
    return { sanity: sanity, suffix: suffix };
}

async function userStatistics(user, eventId, eventData, discordClient, interaction) {

    let id = discordClient.getId(user.id);

    if (id == -1) {
        interaction.editReply({ content: 'You haven\'t linked to the bot, do you expect GhostNene to just know where you live?' });
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
                rankData.unshift({ timestamp: eventData.startAt, score: 0 });
                try {
                    rankData.push({ timestamp: Date.now(), score: response['rankings'][0]['score'] });
                } catch (e) {
                    null;
                }

                let teamData = calculateTeam(profile, eventId);
                let score = calculateScore(teamData.talent);
                let multiscore = score * 5;
                let eventPoints = calculateEventPoints(score, multiscore, teamData.eventBonus + 1, eventData.eventType === 'cheerful_carnival');
                let pointTable = generateEnergyTable(eventPoints);

                let lastPoint = rankData[0].score;

                let energyUsed = 0;
                let energyCounts = energyBoost.map(() => 0);

                rankData.slice(1).forEach((point) => {
                    if (point.score - lastPoint >= 100) {
                        let tempEnergyTable = [];
                        let gain = point.score - lastPoint;
                        energyBoost.forEach((x, i) => {
                            if (gain % x == 0) {
                                tempEnergyTable.push([i, pointTable[i]]);
                            }
                        });
                        let energyUsedGame = getEnergyPerGame(tempEnergyTable, gain);
                        energyCounts[energyUsedGame]++;
                        energyUsed += energyUsedGame;
                    }
                    lastPoint = point.score;
                });

                let title = `${user.username} Games`;

                let embed = generateEmbed({
                    name: title,
                    client: discordClient.client
                });

                let energyLabel = 'Cost';
                let gamesLabel = 'Games';

                let energyLength = energyLabel.length;
                let gamesLength = gamesLabel.length;

                for (let i = 0; i < energyBoost.length; i++) {
                    if (`x${i}`.length > energyLength) {
                        energyLength = `x${i}`.length;
                    }
                    if (`${energyCounts[i]}`.length > gamesLength) {
                        gamesLength = `${energyCounts[i]}`.length;
                    }
                }

                let embedStr = `\`${energyLabel} ${' '.repeat(energyLength - energyLabel.length)} ${' '.repeat(gamesLength - gamesLabel.length)}${gamesLabel}\`\n`;

                for (let i = 0; i < energyBoost.length; i++) {
                    embedStr += `\`${i}x ${' '.repeat(energyLength - `${i}x`.length)} ${' '.repeat(gamesLength - `${energyCounts[i]}`.length)}${energyCounts[i]}\`\n`;
                }

                //Ignore this entire section
                embed.addFields(
                    { name: 'Energy Usage', value: embedStr },
                    { name: 'Total Energy Used', value: `${energyUsed}` },
                );

                sendEmbed(interaction, embed);
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

async function sendEmbed(interaction, embed) {

    interaction.editReply({
        embeds: [embed],
        fetchReply: true
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

        const user = interaction.options.getUser('user');
        const eventId = interaction.options.getInteger('event') || event.id;

        const eventData = getEventData(eventId);

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

        try {
            userStatistics(user, eventId, eventData, discordClient, interaction);
        } catch (err) {
            console.log(err);
        }
    }
};