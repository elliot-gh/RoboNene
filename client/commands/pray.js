/**
 * @fileoverview Allows you to pray to Kohane
 * @author Ai0796
 */

const { MessageActionRow, MessageButton } = require('discord.js');
const { BOT_NAME } = require('../../constants');

const COMMAND = require('../command_data/pray');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');
const fs = require('fs');

const getTimeTrunc = async () => {
    const date = new Date();
    date.setMinutes(0, 0, 0);
    return date.getTime();
};

function randn_bm() {
    return Math.random();
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return randn_bm(); // resample between 0 and 1
    return num;
}

const HOUR = 3600000;
const badPrays = [
    "You pray to {}, but she doesn't respond. You feel like you've been ignored. You lose one luck",
    "You pray to {}, but it was actually Akito. You lose one luck.",
    "You pray to {}, but she knows you ship ak*koha. You lose one luck.",
    "You pray to {}, but passed a hamster without patting it first. You lose one luck.",
    "You pray to {}, but she's too busy playing with her snake. You lose one luck.",
    "You pray to {}, but you should be sleeping. You lose one luck.",
    "You pray to {}, but spent all your crystals on the evillous banner. You lose one luck.",
]

const goodPrays = [
    "You pray to {} and Pope Lemo. You gain 20 luck.",
    "You pray to {} after patting a hamster. You gain 20 luck.",
    "You pray to {}, but it was actually An. You gain 20 luck.",
    "You pray to {} and sacrifice a peach bun. You gain 20 luck.",
    "You pray to {} after a healthy tiering session. You gain 20 luck.",
    "You pray to {} after filling for Lemo. You gain 20 luck." ,
    "You pray to {}, but it was actually Toya. You gain 20 luck.",
    "You pray to {}, but it was actually Kanade. Mack is jealous. You gain 20 luck.",
    "You pray to {}, but it was actually Kaito. You gain 20 luck",
    "You pray to {}, but it was actually Luka. Ai0 wants to know your location. You gain 20 luck.",
    "You pray to {}, but it was actually Miku. You gain 20 luck and a min roll.",
    "You pray to {}, but it was actually Ichika. You gain 20 luck",
    "You pray to {}, but it was actually Minorin. You gain 20 luck",
    "You pray to {}, but it was actually Haruka. You gain 20 luck",
    "你向小羽祈祷。你获得 20 点幸运",
    "こはねに祈る。幸運を20得る"
]

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};

async function getPray(userId, character) {
    let pray = 0;
    var returnQuote;
    try {
        var prayFile;
        if (!fs.existsSync(`pray.json`)) {
            prayFile = new Object();
        }
        else {
            prayFile = JSON.parse(fs.readFileSync(`pray.json`, 'utf8'));
        }

        let time = await getTimeTrunc();

        if (userId in prayFile && prayFile[userId].timestamp < time) {
            let val = randn_bm();
            val *= 15;

            val = Math.round(val);

            if (val >= 14) {
                if (randn_bm() > 0.95) {
                    val = 75;
                    returnQuote = "You pray to Mochi and Ai0. You gain 75 luck."
                } else if (randn_bm() > 0.90) {
                    val = 80;
                    returnQuote = "You pray to Pocket and Ai0. You gain 80 luck.";
                }
                else {
                    val = 50;
                    returnQuote = "You pray to Kohane, but she was on a double date An, Haruka and Minori. You gain 50 luck."
                }
                
            } else if (val == 0) {
                if (randn_bm() > 0.8){
                    val = -50;
                    returnQuote = "You pray to {}, but it's actually Akito fifthwheeling An, Kohane, Haruka, and Minori. You lose 50 luck."
                } else {
                    val = 30;
                    returnQuote = "You pray to {}, but it's actually Akito and Toya on a date. you gain 30 luck."
                }
                
            }
            else if (val <= 2) {
                val = -1;

                returnQuote = badPrays[Math.floor(Math.random() * badPrays.length)];
            } else if (val >= 10) {
                val = 20;
                returnQuote = goodPrays[Math.floor(Math.random() * goodPrays.length)];
            } else {
                returnQuote = `You pray to {}. You gain ${val} luck.`;
            }
            prayFile[userId].pray += val;
            prayFile[userId].timestamp = Date.now();
            if (prayFile[userId].count == null) {
                prayFile[userId].count = 0;
            }
            prayFile[userId].count++;
        }
        else if (!(userId in prayFile)) {
            let val = randn_bm();
            val *= 15;
            val = Math.round(val);

            if (val <= 1) {
                val = -1;

                returnQuote = badPrays[Math.floor(Math.random() * badPrays.length)];
            } else if (val >= 13) {
                val = 20;
                returnQuote = goodPrays[Math.floor(Math.random() * goodPrays.length)];
            } else {
                returnQuote = `You pray to ${character}. You gain ${val} luck.`;
            }
            prayFile[userId] = {"pray": val, "timestamp": Date.now(), "count": 1};
        } 
        else if (prayFile[userId].timestamp > time) {
            returnQuote = `You have already prayed to {} this hour, you may pray again <t:${Math.floor((time + HOUR) / 1000)}:R>!`;
        }

        fs.writeFile(`pray.json`, JSON.stringify(prayFile), err => {
            if (err) {
                console.log('Error writing Pray File', err);
            } else {
                console.log(`Wrote Pray File Successfully`);
            }
        });
    } catch (e) {
        console.log('Error occured while writing cutoffs: ', e);
    }

    returnQuote += ` You have ${prayFile[userId].pray} luck and have prayed ${prayFile[userId].count} times.`;
    return returnQuote.format(character);
}

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        try {

            let id = interaction.user.id;

            let character = interaction.options.getString('character') || 'Kohane';
            let pray = await getPray(id, character);

            await interaction.reply(pray);
        } catch (e) {
            console.log(e);
        } // Due to possible null values add a try catch
    }
};

