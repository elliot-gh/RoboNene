/**
 * @fileoverview Displays statistics of a user or tier
 * @author Ai0796
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');
const fs = require('fs');

const COMMAND = require('../command_data/stock');

const { stockApiKey } = require('../../config.json');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');

const Stocks = require('../stock/stock');
const stocks = new Stocks(stockApiKey);

const prskChars = {
    'MIKU': 'SGAMY',
    'RIN': '',
    'LEN': '',
    'LUKA': 'SPY',
    'MEIK': '',
    'KAIT': '',
    'ICHK': '',
    'SAKI': '',
    'HONA': '',
    'SBIB': '',
    'MINO': '',
    'HARU': '',
    'AIRI': '',
    'SZKU': '',
    'KOHA': 'MC.PA',
    'AN': 'FRCOY',
    'TOE': 'GOOS',
    'TOYA': 'NKE',
    'TSKA': 'BTC',
    'EMU': '',
    'NENE': '',
    'RUI': '',
    'KND': 'TSUKF',
    'MFY': '',
    'ENA': '',
    'MZK': '',
    'BPM': 'CRAI'
};

/**
 * Ensures a string is ASCII to be sent through HTML
 * @param {String} str the string to be converted to ASCII 
 * @returns 
 */
async function ensureAtoZ(str) {
    return str.replace(/[^a-zA-Z]/gi, '')
}

async function sendStockData(ticker, interaction, discordClient) {

    var swappedTicker = '';
    ticker = await ensureAtoZ(ticker.toUpperCase());
    if (ticker in prskChars) {
        swappedTicker = prskChars[ticker];
    } else {
        swappedTicker = ticker;
    }

    let reply = await stocks.getStockData(swappedTicker);
    if (Object.keys(reply).length === 0) {
        await interaction.editReply({
            embeds: [
                generateEmbed({
                    name: `$${ticker}`,
                    content: {
                        'type': 'ERROR',
                        'message': 'Invalid stock ticker'
                    },
                    client: discordClient.client
                })
            ]
        });
        return;
    }

    let returnString = '';

    for (let key in reply) {
        if (key == 'Symbol') {
            continue;
        }
        returnString += key.charAt(0).toUpperCase() + key.slice(1);
        returnString += ': ';
        returnString += reply[key];
        returnString += '\r';
    }

    await interaction.editReply({
        embeds: [
            generateEmbed({
                name: `$${ticker}`,
                content: {
                    'type': 'Stock',
                    'message': returnString
                },
                client: discordClient.client
            })
        ]
    });
}

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        await interaction.deferReply({
            ephemeral: COMMAND.INFO.ephemeral
        });

        const ticker = interaction.options.getString('ticker');

        if (ticker) {
            await sendStockData(ticker, interaction, discordClient);
        }
    }
};