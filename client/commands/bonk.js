/**
 * @fileoverview Allows you to bonk a user
 * @author Ai0796
 */


const COMMAND = require('../command_data/bonk');

const generateSlashCommand = require('../methods/generateSlashCommand');
const fs = require('fs');

function getBonks(userId) {
    var bonk = 1;
    var bonkFile;
    try {
        if (!fs.existsSync('bonk.json')) {
            bonkFile = new Object();
        }
        else {
            bonkFile = JSON.parse(fs.readFileSync('bonk.json', 'utf8'));
        }

        if (userId in bonkFile) {
            bonkFile[userId] = bonkFile[userId] + 1;
        }
        else {
            bonkFile[userId] = 1;
        }

        bonk = bonkFile[userId];

        fs.writeFile('bonk.json', JSON.stringify(bonkFile), err => {
            if (err) {
                console.log('Error writing Bonk', err);
            } else {
                console.log('Wrote Bonk Successfully');
            }
        });

        fs.writeFile('backup bonk.json', JSON.stringify(bonkFile), err => {
            if (err) {
                console.log('Error writing Bonk', err);
            } else {
                console.log('Wrote Bonk Successfully');
            }
        });
    } catch (e) {
        console.log('Error occured while writing cutoffs: ', e);
    }

    return bonk;
}

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        // await interaction.reply("test")
        try {
            if (interaction.options._hoistedOptions[0]) {

                let id = interaction.options._hoistedOptions[0].user.id;
                let mention = '<@' + id + '>';

                let bonks = getBonks(id);

                await interaction.reply(`<:emugun:974080545560608778> Bonk ${mention}, go to sleep\n ${mention} has been bonked ${bonks} times`);
            }
        } catch (e) {
            console.log(e);
        } // Due to possible null values add a try catch
    }
};

