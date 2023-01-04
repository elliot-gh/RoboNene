/**
 * @fileoverview Allows you to bonk a user
 * @author Ai0796
 */

const COMMAND = require('../command_data/rm');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');

const timeout = 600000;
const channels = {};

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = '0' + num;
    return num;
}

async function verify(channelName) {
    let regex = /^.*-[0-9x]{5}.*/g;
    let match = channelName.match(regex);
    if (match != null) {
        return match[0] === channelName;
    } else {
        return false;
    }
}

const checkTimeout = async (channelid) => {
    let time = Date.now();
    if (channels[channelid]) {
        if (time - channels[channelid][0] > timeout && channels[channelid].length >= 2) {
            channels[channelid].shift();
            channels[channelid].push(time);
            return true;
        } else if (channels[channelid].length < 2) {
            channels[channelid].push(time);
            return true;
        }
        else {
            return false;
        }
    } else {
        channels[channelid] = [time];
        return true;
    }
};

const changeName = async (interaction, channelName, discordClient) => {
    if (channelName == interaction.channel.name) return true;
    if (await checkTimeout(interaction.channel.id)) {
        await interaction.channel.setName(channelName);
        return true;
    } else {
        await interaction.editReply({
            embeds: [
                generateEmbed({
                    name: COMMAND.INFO.name,
                    content: {
                        'type': 'error',
                        'message': `You can only change the name of a channel twice every 10 minutes.\nNext change <t:${Math.floor((channels[interaction.channel.id][0] + timeout) / 1000)}:R>\nChannel Name: \`${channelName}\``,
                    },
                    client: discordClient.client
                })
            ]
        });
        return false;
    }
};

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        await interaction.deferReply({
            ephemeral: COMMAND.INFO.ephemeral
        });

        let code = interaction.options.getInteger('code');
        let players = interaction.options.getInteger('players');

        if (!(await verify(interaction.channel.name))) {
            await interaction.editReply({
                embeds: [
                    generateEmbed({
                        name: COMMAND.INFO.name,
                        content: COMMAND.CONSTANTS.WRONG_FORMAT,
                        client: discordClient.client
                    })
                ]
            });
            return;
        }

        try {
            var channelName;
            if (code || players) {
                let nameSplit = interaction.channel.name.split('-');

                let name = nameSplit[0];
                code = code || nameSplit[1];
                code = pad(code, 5);
                if (players == 0) {
                    players = 'f';
                }
                players = players || nameSplit[2];
                
                if (`${code}`.length != 5) {
                    await interaction.editReply({
                        embeds: [
                            generateEmbed({
                                name: COMMAND.INFO.name,
                                content: COMMAND.CONSTANTS.WRONG_CODE_LENGTH,
                                client: discordClient.client
                            })
                        ]
                    });
                    return;
                }

                if (players) {
                    channelName = `${name}-${code}-${players}`;
                } else {
                    channelName = `${name}-${code}`;
                }

            } else {
                let nameSplit = interaction.channel.name.split('-');

                let name = nameSplit[0];
                channelName = `${name}-xxxxx`;
            }

            if (await changeName(interaction, channelName, discordClient)) {
                await interaction.editReply({
                    embeds: [
                        generateEmbed({
                            name: COMMAND.INFO.name,
                            content: {
                                'type': 'Success',
                                'message': `Channel name changed to ${channelName}`
                            },
                            client: discordClient.client
                        })
                    ]
                });
            }
            
        } catch (e) {
            console.log(e);
            await interaction.editReply({
                embeds: [
                    generateEmbed({
                        name: COMMAND.INFO.name,
                        content: COMMAND.CONSTANTS.ERROR,
                        client: discordClient.client
                    })
                ]
            });
        } // Due to possible null values add a try catch
    }
};

