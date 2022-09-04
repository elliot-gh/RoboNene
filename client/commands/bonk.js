/**
 * @fileoverview The main output when users call for the /about command
 * Will create a scrollable leaderboard elaborating about the bot and other features
 * @author Potor10
 */

const { MessageActionRow, MessageButton } = require('discord.js');
const { BOT_NAME } = require('../../constants');

const COMMAND = require('../command_data/bonk')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed')
const fs = require('fs');

function getBonks(userId) {
    var bonk = 1
    try {
        if (!fs.existsSync(`bonk.json`)) {
            bonkFile = new Object();
        }
        else {
            bonkFile = JSON.parse(fs.readFileSync(`bonk.json`, 'utf8'));
        }

        if (userId in bonkFile) {
            bonkFile[userId] = bonkFile[userId] + 1
        }
        else {
            bonkFile[userId] = 1
        }

        bonk = bonkFile[userId]

        fs.writeFile(`bonk.json`, JSON.stringify(bonkFile), err => {
            if (err) {
                console.log('Error writing Bonk', err);
            } else {
                console.log(`Wrote Bonk Successfully`);
            }
        });

        fs.writeFile(`backup bonk.json`, JSON.stringify(bonkFile), err => {
            if (err) {
                console.log('Error writing Bonk', err);
            } else {
                console.log(`Wrote Bonk Successfully`);
            }
        });
    } catch (e) {
        console.log('Error occured while writing cutoffs: ', e);
    }

    return bonk
}


/**
 * Obtain the account statistics of the user (if it exists)
 * @param {Object} account of the Id being bonked
 * @param {DiscordClient} discordClient the client we are using to serve requests
 * @return {Object} an object containing the overall stats of the user
 */
const updateAccount = (account, discordClient) => {
    discordClient.db.prepare('UPDATE users SET bonk=@bonk, ' +
        'WHERE discord_id=@discordId').run({
            bonk: account.bonk + 1,
            discordId: interaction.user.id
        })

}

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        // await interaction.reply("test")
        try {
            if (interaction.options._hoistedOptions[0]) {

                let id = interaction.options._hoistedOptions[0].user.id
                let mention = "<@" + id + ">";

                bonks = getBonks(id)

                await interaction.reply(`<:emugun:974080545560608778> Bonk ${mention}, go to sleep\n ${mention} has been bonked ${bonks} times`);
            }
        } catch (e) {
            console.log(e);
        } // Due to possible null values add a try catch
    }
};

