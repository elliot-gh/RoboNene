/**
 * @fileoverview Display a graph of the previous ranking trend
 * @author Potor10
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');
const fs = require('fs');

const COMMAND = require('../command_data/id');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        let ephemeral = interaction.options.getBoolean('show');
        console.log(ephemeral)
        if(ephemeral == null) {
            ephemeral = true
        }
        else {
            ephemeral = !ephemeral
        }
        await interaction.deferReply({
            ephemeral: ephemeral
        });

        try {
            let id = interaction.member.user.id; 
            let name = interaction.member.user.username;
            let sendName = `${name}'s Sekai ID`
            let userData = discordClient.db.prepare('Select * FROM users WHERE ' +
                'discord_id=@discordid').all({
                    discordid: id
                });
            if (userData.length > 0) {
                let sekaiID = userData[0].sekai_id
                await interaction.editReply({
                    embeds: [
                        generateEmbed({
                            name: sendName.toString(),
                            content: {
                                'type': 'Sekai ID',
                                'message': sekaiID
                            },
                            client: discordClient.client
                        })
                    ]
                });
            }
            else {
                interaction.editReply({ content: 'Discord User not found (are you sure that account is linked?)' });
            }
        } catch (err) {
            console.log(err);
        }
    }
};