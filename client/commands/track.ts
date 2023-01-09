/**
 * @fileoverview Display a graph of the previous ranking trend
 * @author Potor10
 */
const fs = require('fs');

const COMMAND = require('../command_data/track');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');

const fp = './JSONs/track.json';

function addTrack(tier, score, mention, channel) {
    tier = tier.toString();
    var trackFile;
    try {
        if (!fs.existsSync(fp)) {
            trackFile = new Object();
        }
        else {
            trackFile = JSON.parse(fs.readFileSync(fp, 'utf8'));
        }

        if (tier in trackFile && score in trackFile[tier]) {
            trackFile[tier][score].push([channel, mention]);
        }
        else {
            if(!(tier in trackFile))
            {
                trackFile[tier] = new Object();
            }
            trackFile[tier][score] = [[channel, mention]];
        }

        fs.writeFile(fp, JSON.stringify(trackFile), err => {
            if (err) {
                console.log('Error writing Tracking', err);
            } else {
                console.log('Wrote Tracking Successfully');
            }
        });
    } catch (e) {
        console.log('Error occured while writing Tracking: ', e);
    }
}

/**
 * Obtains the current event within the ranking period
 * @return {Object} the ranking event information
 */
const getRankingEvent = () => {
    const events = JSON.parse(fs.readFileSync('sekai_master/events.json'));
    const currentTime = Date.now();

    for (let i = events.length - 1; i >= 0; i--) {
        //Time of Distribution + buffer time of 15 minutes to get final cutoff
        if (events[i].startAt < currentTime && events[i].aggregateAt > currentTime) {
            return {
                id: events[i].id,
                banner: 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' +
                    `${events[i].assetbundleName}/logo_rip/logo.webp`,
                name: events[i].name,
                startAt: events[i].startAt,
                aggregateAt: events[i].aggregateAt,
                closedAt: events[i].closedAt,
                eventType: events[i].eventType
            };
        }
    }

    return {
        id: -1,
        banner: '',
        name: ''
    };
};

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        await interaction.deferReply({
            ephemeral: COMMAND.INFO.ephemeral
        });

        const event = getRankingEvent();
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
        const cutoff = interaction.options.getInteger('cutoff');

        console.log(cutoff);

        if(tier > 100000) {
            await interaction.editReply({
                embeds: [
                    generateEmbed({
                        name: COMMAND.INFO.name,
                        content: COMMAND.CONSTANTS.TIER_ERR,
                        client: discordClient.client
                    })
                ]
            });
        }

        else {
            try {
                discordClient.addPrioritySekaiRequest('ranking', {
                    eventId: event.id,
                    targetRank: tier,
                    lowerLimit: 0
                }, async (response) => {
                    try {
                        let score = response['rankings'][0]['score'];
                        if(cutoff != undefined){
                            score = cutoff;
                        } else {
                            score += 1;
                        }
                        let id = interaction.member.user.id;
                        let mention = '<@' + id + '>';
                        let channel = interaction.channelId;
                        addTrack(tier, score, mention, channel);

                        let message = {
                            'type': 'Success',
                            'message': `Starting to track tier ${tier} for ${mention}\nCutoff: ${score.toLocaleString() }`
                        };

                        await interaction.editReply({
                            embeds: [
                                generateEmbed({
                                    name: COMMAND.INFO.name,
                                    content: message,
                                    client: discordClient.client
                                })
                            ]
                        });
                    } catch (e) {
                        console.log('Error occured while adding tracking data: ', e);
                    }
                }, (err) => {
                    discordClient.logger.log({
                        level: 'error',
                        message: err.toString()
                    });
                });
            } catch (e) {
                console.log('Error occured while adding tracking data: ', e);
            }          
        }
    }
};

export {};