/**
 * @fileoverview Allows you to gacha
 * @author Ai0796
 */

import { CommandInteraction } from "discord.js";
import { Cards, GameCharacters } from "../../models/sekai_master";

const COMMAND = require('../command_data/gacha');

const generateSlashCommand = require('../methods/generateSlashCommand');
const fs = require('fs');
const client = require('https');
const Axios = require('axios');
const sharp = require('sharp');

const { MessageEmbed, MessageAttachment } = require('discord.js');
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
const generateEmbed = Object.assign((
    name: string,
    image: any,
    client: any
) => {
    const embed = new MessageEmbed()
        .setColor(NENE_COLOR)
        .setTitle(name.charAt(0).toUpperCase() + name.slice(1))
        .setTimestamp()
        .setFooter(FOOTER, client.user.displayAvatarURL());

    if (image) {
        embed.setImage(image);
    }

    return embed;
});

function randn_bm() {
    return Math.random();
}

async function downloadImage(url: string, filepath: string) {
    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath));
    });
}

/**
 * @typedef {Object} PRSKImage
 * @property {String} normal the normal image
 * @property {String} trained the trained image
 */

/**
 * @returns {Promise<PRSKImage>}
 * @param {sharp} assetBundleName 
 * @param {sharp} rarity 
 */
async function getImage(assetBundleName: string, rarityType: string) {

    let images: {normal:typeof sharp | null; trained:typeof sharp | null} = {normal: null, trained: null};
    
    if (fs.existsSync(`./gacha/cached_images/${assetBundleName}_normal.png`)) {

        images.normal = sharp(`./gacha/cached_images/${assetBundleName}_normal.png`);

    } else {

        let normalImage = `https://storage.sekai.best/sekai-assets/thumbnail/chara_rip/${assetBundleName}_normal.webp`;
        await downloadImage(normalImage, `./gacha/cached_images/${assetBundleName}_normal.png`);
        images.normal = sharp(`./gacha/cached_images/${assetBundleName}_normal.png`);
    }
    
    if (rarityType == 'rarity_3' || rarityType == 'rarity_4') {

        if (fs.existsSync(`./gacha/cached_images/${assetBundleName}_after_training.png`)) {
            images.trained = sharp(`./gacha/cached_images/${assetBundleName}_after_training.png`);
        } else {

            let trainedImage = `https://storage.sekai.best/sekai-assets/thumbnail/chara_rip/${assetBundleName}_after_training.webp`;
            await downloadImage(trainedImage, `./gacha/cached_images/${assetBundleName}_after_training.png`);
            images.trained = sharp(`./gacha/cached_images/${assetBundleName}_after_training.png`);
        }
    }
        

    return images;
}

async function overlayCard(image: typeof sharp, rarityType: string, attributeType: string) {
    const rarityStarsDic : {[key:string]:string} = 
    {
        'rarity_1': 'rarity_star_normal',
        'rarity_2': 'rarity_star_normal',
        'rarity_3': 'rarity_star_normal',
        'rarity_4': 'rarity_star_normal',
        'rarity_birthday': 'rarity_birthday',
    };

    const framesDic : {[key:string]:string} =
    {
        'rarity_1': 'cardFrame_S_1',
        'rarity_2': 'cardFrame_S_2',
        'rarity_3': 'cardFrame_S_3',
        'rarity_4': 'cardFrame_S_4',
        'rarity_birthday': 'cardFrame_S_bd',
    };

    const numStarsDic : {[key:string]:number} = 
    {
        'rarity_1': 1,
        'rarity_2': 2,
        'rarity_3': 3,
        'rarity_4': 4,
        'rarity_birthday': 1,
    };

    let framePath = `./gacha/frames/${framesDic[rarityType]}.png`;
    let attributePath = `./gacha/attributes/icon_attribute_${attributeType}.png`;
    let rarityPath = `./gacha/rarity/${rarityStarsDic[rarityType]}.png`;

    let frame = sharp(framePath);

    image = await image
        .resize(140, 140)
        .toBuffer();
    let attribute = await sharp(attributePath)
        .resize(35, 35)
        .toBuffer();
    let star = await sharp(rarityPath)
        .resize(28, 28)
        .toBuffer();
    let numStars = numStarsDic[rarityType];

    let composites = [
        { input: image, top: 8, left: 8 },
        { input: attribute, top: 1, left: 1 }
    ];

    for (let i = 0; i < numStars; i++) {
        composites.push({ input: star, top: 118, left: 10 + 26 * i });
    }

    let finalImage = frame.composite(composites);
    
    return finalImage;
}

async function overlayPulls(cards: typeof sharp[]) {

    let frame = sharp('./gacha/pull_frame.png');

    let composites = [];

    var row, col;

    for (let i = 0; i < cards.length; i++) {
        row = Math.floor(i / 5);
        col = i % 5;
        let card = cards[i];
        composites.push({ input: await card.toBuffer(), top: 41 + row * 175, left: 41 + 175 * col });
    }

    let finalImage = frame.composite(composites);

    return finalImage;
}

async function getCards(n: number, embed: typeof MessageEmbed) {

    const cardRarities = {
        'rarity_1': '🌟',
        'rarity_2': '🌟🌟',
        'rarity_3': '🌟🌟🌟',
        'rarity_4': '🌟🌟🌟🌟',
        'rarity_birthday': '🎀',
    };

    const cards:Cards[] = JSON.parse(fs.readFileSync('./sekai_master/cards.json'));
    const gameCharacters:GameCharacters[] = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));

    let twoStars = cards.filter(card => card.cardRarityType === 'rarity_2');
    let threeStars = cards.filter(card => card.cardRarityType === 'rarity_3' || card.cardRarityType === 'rarity_birthday');
    let fourStars = cards.filter(card => card.cardRarityType === 'rarity_4');

    var returnString = '';
    var rarityString = '';
    var no3Star = true;
    var cardImages = [];

    for (let i = 0; i < n; i++) {
        var randomCard;
        let randomVal = randn_bm();
        if (randomVal < 0.06) {
            randomCard = fourStars[Math.floor(Math.random() * fourStars.length)];
            no3Star = false;
        } else if (randomVal < 0.145) {
            randomCard = threeStars[Math.floor(Math.random() * threeStars.length)];
            no3Star = false;
        } else {
            randomCard = twoStars[Math.floor(Math.random() * twoStars.length)];
        }

        if (i + 1 == n && no3Star && n >= 10) { 
            if (randomVal < 0.06) {
                randomCard = fourStars[Math.floor(Math.random() * fourStars.length)];
            } else {
                randomCard = threeStars[Math.floor(Math.random() * threeStars.length)];
            }
        }

        let assetBundleName = randomCard.assetbundleName;

        let attribute = randomCard.attr;
        let rarityType = randomCard.cardRarityType;
        
        let images = await getImage(assetBundleName, rarityType);

        let postImage = await overlayCard(images.normal, rarityType, attribute);
        cardImages.push(postImage);
    }

    let pullImage = await overlayPulls(cardImages);

    let file = new MessageAttachment(await pullImage.toBuffer(), 'pull.png');
    embed.setImage('attachment://pull.png');

    return file;
}

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction: CommandInteraction, discordClient: any) {
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

            let file = await getCards(n, embed);

            await interaction.editReply({ embeds: [embed], files: [file] });
        } catch (e) {
            console.log(e);
        } // Due to possible null values add a try catch
    }
};

export {};