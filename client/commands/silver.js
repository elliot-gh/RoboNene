/**
 * @fileoverview Tracks Silvers APs
 * @author Ai0796
 */

const COMMAND = require('../command_data/silver');

const generateSlashCommand = require('../methods/generateSlashCommand');
const fs = require('fs');

function getBonks(reset) {
    var bonk = 1;
    var bonkFile;
    try {
        if (!fs.existsSync('silver.json') || reset) {
            bonkFile = [];
        }
        else {
            bonkFile = JSON.parse(fs.readFileSync('silver.json', 'utf8'));
        }

        if (bonkFile.length > 0) {
            bonkFile[0] += 1;
        }
        else {
            bonkFile.push(1);
        }

        bonk = bonkFile[0];

        fs.writeFile('silver.json', JSON.stringify(bonkFile), err => {
            if (err) {
                console.log('Error writing Silver', err);
            } else {
                // console.log(`Wrote Silver Successfully`);
            }
        });
    } catch (e) {
        console.log('Error occured while writing Silver: ', e);
    }

    return bonk;
}

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        // await interaction.reply("test")
        var bonks;
        if (interaction.options._hoistedOptions.length > 0) {
            bonks = getBonks(interaction.options._hoistedOptions[0].value);

            await interaction.reply(`Silver got another AP\nSilver has APed ${bonks} times in a row`);
        } else {
            bonks = getBonks();

            await interaction.reply(`Silver got another AP\nSilver has APed ${bonks} times in a row`);
        }
    }
};

