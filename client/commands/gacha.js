/**
 * @fileoverview Allows you to gacha
 * @author Ai0796
 */

const COMMAND = require('../command_data/gacha');

const generateSlashCommand = require('../methods/generateSlashCommand');
const fs = require('fs');

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');

/**
 * @typedef {Object} Content
 * @property {String} type the type of message
 * @property {String} message the message
 */

/**
 * Generates an embed from the provided params
 * @param {String} name the name of the command
 * @param {Content} content the content of the message
 * @param {String} image an image URL (if applicable)
 * @param {DiscordClient} client the client we are using to handle Discord requests
 * @return {MessageEmbed} a generated embed
 */
const generateEmbed = ({ name, image, client }) => {
    const embed = new MessageEmbed()
        .setColor(NENE_COLOR)
        .setTitle(name.charAt(0).toUpperCase() + name.slice(1))
        .setTimestamp()
        .setFooter(FOOTER, client.user.displayAvatarURL());

    if (image) {
        embed.setImage(image);
    }

    return embed;
};

function randn_bm() {
    return Math.random();
}

async function updatePrays(data, discordClient) {
    await discordClient.prayerdb.prepare('INSERT OR REPLACE INTO prayers' +
    '(id, luck, prays, lastTimestamp, totalLuck)' + 
    'VALUES (@id, @luck, @prays, @lastTimestamp, @totalLuck);').run(
        {
            id: data.id.toString(),
            luck: data.luck,
            prays: data.prays,
            lastTimestamp: data.lastTimestamp,
            totalLuck: data.totalLuck
        }
    );
}

async function getCards(n, embed) {

    const cardRarities = {
        'rarity_1': '🌟',
        'rarity_2': '🌟🌟',
        'rarity_3': '🌟🌟🌟',
        'rarity_4': '🌟🌟🌟🌟',
        'rarity_birthday': '🎀',
    };

    const cards = JSON.parse(fs.readFileSync('./sekai_master/cards.json'));
    const gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));

    let twoStars = cards.filter(card => card.rarity === 2);
    let threeStars = cards.filter(card => card.rarity === 3);
    let fourStars = cards.filter(card => card.rarity === 4);

    var returnString = '';
    var rarityString = '';
    const randomVal = randn_bm();

    for (let i = 0; i < n; i++) {
        var randomCard;
        if (randomVal < 0.06) {
            randomCard = fourStars[Math.floor(Math.random() * fourStars.length)];
        } else if (randomVal < 0.145) {
            randomCard = threeStars[Math.floor(Math.random() * threeStars.length)];
        } else {
            randomCard = twoStars[Math.floor(Math.random() * twoStars.length)];
        }
        let firstName = gameCharacters[randomCard.characterId - 1].firstName;
        let lastName = gameCharacters[randomCard.characterId - 1].givenName;

        var cardStr;
        let rarity = `${cardRarities[randomCard.cardRarityType]}`;
        if (firstName) {
            cardStr = `${randomCard.prefix} ${firstName} ${lastName}`;
        } else {
            cardStr = `${randomCard.prefix} ${lastName}`;
        }

        rarityString += rarity;
        rarityString += '\n';
        
        returnString += cardStr;
        returnString += '\n';
    }

    embed.addFields(
        { name: 'Rarity', value: rarityString, inline: true },
        { name: 'Card', value: returnString, inline: true },
    );

    return returnString;
}

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        await interaction.deferReply({ ephemeral: false });
        try {

            let single = interaction.options.getBoolean('single') || false;

            var n;

            if (single) {
                n = 1;
            } else {
                n = 10;
            }

            let embed = generateEmbed({name: COMMAND.INFO.name, client: discordClient.client});

            await getCards(n, embed);

            await interaction.editReply({embeds: [embed]});
        } catch (e) {
            console.log(e);
        } // Due to possible null values add a try catch
    }
};

