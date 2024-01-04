/**
 * @fileoverview Displays statistics of a user or tier
 * @author Ai0796
 */

const COMMAND = require('../command_data/stock');

const { stockApiKey } = require('../../config.json');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed');

const Stocks = require('../stock/stock');
const stocks = new Stocks(stockApiKey);

const prskChars = require('../stock/stockTickers.js');

/**
 * Ensures a string is ASCII to be sent through HTML
 * @param {String} str the string to be converted to ASCII 
 * @returns 
 */
async function ensureAtoZ(str) {
    return str.replace(/[^a-zA-Z]/gi, '');
}

async function updatePrays(data, discordClient, id) {
    discordClient.prayerdb.prepare('UPDATE prayers SET ' +
        'luck=@luck, prays=@prays, lastTimestamp=@lastTimestamp, totalLuck = @totalLuck ' +
        'WHERE id=@id').run(
            {
                'id': id,
                'luck': data.luck,
                'prays': data.prays,
                'lastTimestamp': data.lastTimestamp,
                'totalLuck': data.totalLuck
            }
        );
}

async function getStockData(ticker) {
    var swappedTicker = '';
    ticker = await ensureAtoZ(ticker.toUpperCase());
    if (ticker in prskChars) {
        swappedTicker = prskChars[ticker];
    } else {
        swappedTicker = ticker;
    }

    var reply;

    if (!(['BTC', 'ETH'].includes(swappedTicker))) {
        reply = await stocks.getStockData(swappedTicker);
    }

    else {
        reply = await stocks.getCryptoData(swappedTicker);
        reply['Price'] = reply['Exchange Rate'];
    }

    return reply;
}

async function sendInvalidTickerError(interaction, ticker, discordClient) {
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
}

async function sendNoPrayers(interaction, discordClient) {
    await interaction.editReply({
        embeds: [
            generateEmbed({
                name: 'ERROR',
                content: {
                    'type': 'ERROR',
                    'message': 'ERROR, you have not prayed yet'
                },
                client: discordClient.client
            })
        ]
    });
}

async function sendStockData(ticker, interaction, discordClient) {
    ticker = await ensureAtoZ(ticker.toUpperCase());
    let reply = await getStockData(ticker);
    if (Object.keys(reply).length === 0) {
        await sendInvalidTickerError(interaction, ticker, discordClient);
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

async function buyStock(ticker, amount, interaction, discordClient) {
    ticker = await ensureAtoZ(ticker.toUpperCase());
    let reply = await getStockData(ticker);

    if (Object.keys(reply).length === 0) {
        await sendInvalidTickerError(interaction, ticker, discordClient);
        return;
    }

    let praydata = discordClient.prayerdb.prepare('SELECT * FROM prayers ' +
        'WHERE (id=@id)').all({
            id: interaction.user.id
        });

    if (praydata.length > 0) {
        praydata = praydata[0];
    } else {
        await sendNoPrayers(interaction, discordClient);
        return;
    }

    let luck = praydata.luck;
    let price = parseFloat(reply.Price);

    if (price * amount > luck) {
        await interaction.editReply({
            embeds: [
                generateEmbed({
                    name: 'ERROR',
                    content: {
                        'type': 'ERROR',
                        'message': `ERROR, you do not have enough luck to buy this stock\n cost: ${price * amount}\nluck: ${luck}`
                    },
                    client: discordClient.client
                })
            ]
        });
        return;
    }

    let data = await discordClient.stockdb.ref(`stocks/${interaction.user.id}`).get();
    if (data.exists()) {
        data = data.val();
    }
    else {
        data = {};
    }

    if (ticker in data && (typeof data[ticker] != 'object' || !('average' in data[ticker]))) {
        var tempamount;
        if (typeof data[ticker] == 'object') {
            tempamount = data[ticker]['amount'];
        } else {
            tempamount = data[ticker];
        }
        data[ticker] = {};
        data[ticker]['average'] = price;
        data[ticker]['amount'] = tempamount;
    }

    if (ticker in data) {
        data[ticker]['average'] = (data[ticker]['average'] * data[ticker]['amount'] + price * amount) / (data[ticker]['amount'] + amount);
        data[ticker]['amount'] += amount;
    } else {
        data[ticker] = {};
        data[ticker]['average'] = price;
        data[ticker]['amount'] = amount;
    }
    
    let message = `You have bought ${amount} shares of ${ticker} @ ${price.toFixed(2)} for ${(price * amount).toFixed(2)} luck.\n` + 
        `You now have ${(luck - price * amount).toFixed(2)} luck left.\n` +
        `You now have ${data[ticker]['amount']} shares of ${ticker}.`;

    await interaction.editReply({
        embeds: [
            generateEmbed({
                name: `$${ticker}`,
                content: {
                    'type': 'Stock',
                    'message': message
                },
                client: discordClient.client
            })
        ]
    });

    praydata.luck -= price * amount;

    await updatePrays(praydata, discordClient, interaction.user.id);
    discordClient.stockdb.ref(`stocks/${interaction.user.id}`).set(data);
}

async function sellStock(ticker, amount, interaction, discordClient) {
    ticker = await ensureAtoZ(ticker.toUpperCase());
    let reply = await getStockData(ticker);

    if (Object.keys(reply).length === 0) {
        await sendInvalidTickerError(interaction, ticker, discordClient);
        return;
    }

    let praydata = discordClient.prayerdb.prepare('SELECT * FROM prayers ' +
        'WHERE (id=@id)').all({
            id: interaction.user.id
        });

    if (praydata.length > 0) {
        praydata = praydata[0];
    } else {
        await sendNoPrayers(interaction, discordClient);
        return;
    }

    let luck = praydata.luck;
    let price = parseFloat(reply.Price);

    let data = await discordClient.stockdb.ref(`stocks/${interaction.user.id}`).get();

    if (data.exists()) {
        data = data.val();
    }
    else {
        data = {};
    }

    if (ticker in data && (typeof data[ticker] != 'object' || !('average' in data[ticker]))) {
        var tempamount;
        if (typeof data[ticker] == 'object') {
            tempamount = data[ticker]['amount'];
        } else {
            tempamount = data[ticker];
        }
        data[ticker] = {};
        data[ticker]['average'] = price;
        data[ticker]['amount'] = tempamount;
    }

    if (!(ticker in data) || data[ticker].amount < amount) {
        let amountHeld = data[ticker].amount || 0;
        await interaction.editReply({
            embeds: [
                generateEmbed({
                    name: 'ERROR',
                    content: {
                        'type': 'ERROR',
                        'message': `ERROR, you do not have enough of this stock to sell\n given: ${amount}\nheld: ${amountHeld}`
                    },
                    client: discordClient.client
                })
            ]
        });
        return;
    }

    data[ticker]['amount'] -= amount;

    let message = `You have sold ${amount} shares of ${ticker} @ ${price.toFixed(2)} for ${(price * amount).toFixed(2)} luck.\n` +
        `You now have ${(luck + price * amount).toFixed(2)} luck.\n` +
        `You now have ${data[ticker]['amount']} shares of ${ticker}.`;

    await interaction.editReply({
        embeds: [
            generateEmbed({
                name: `$${ticker}`,
                content: {
                    'type': 'Stock',
                    'message': message
                },
                client: discordClient.client
            })
        ]
    });

    praydata.luck += price * amount;

    await updatePrays(praydata, discordClient, interaction.user.id);
    discordClient.stockdb.ref(`stocks/${interaction.user.id}`).set(data);
}

async function getStocks(interaction, user, discordClient) {
    let data = await discordClient.stockdb.ref(`stocks/${user.id}`).get();

    if (data.exists()) {
        data = data.val();
    }
    else {
        data = {};
    }

    let message = '';
    let keys = Object.keys(data);
    keys.sort();
    for(let i = 0; i < keys.length; i++) {
        if (typeof data[keys[i]] != 'object' || !('average' in data[keys[i]])) {
            let tempamount = data[keys[i]];
            data[keys[i]] = {};
            data[keys[i]]['amount'] = tempamount;
        }
        if (data[keys[i]]['amount'] == 0) {
            continue;
        }
        message += `${keys[i]}: ${data[keys[i]]['amount']} @ ${(data[keys[i]]['average'] || 0.00).toFixed(2)}\r\n`;
    }

    if (message === '') {
        message = `${user.displayName} has no stocks.`;
    }

    await interaction.editReply({
        embeds: [
            generateEmbed({
                name: `${user.displayName}'s Stocks`,
                content: {
                    'type': 'Stock',
                    'message': message
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

        if (interaction.options.getSubcommand() === 'list') {
            let stockList = '';
            let keys = Object.keys(prskChars);
            keys.sort();
            for(let i = 0; i < keys.length; i++) {
                stockList += keys[i];
                stockList += '\r\n';
            }
            await interaction.editReply({
                embeds: [generateEmbed({
                    name: 'Stocks List',
                    content: {
                        'type': 'Symbols',
                        'message': stockList
                    },
                    client: discordClient.client
                })]
            });
            return;
        }

        else if (interaction.options.getSubcommand() === 'get') {
            const ticker = interaction.options.getString('symbol');

            if (ticker) {
                await sendStockData(ticker, interaction, discordClient);
            }
        }

        else if (interaction.options.getSubcommand() === 'buy') {
            const ticker = interaction.options.getString('symbol');
            const amount = interaction.options.getInteger('amount');

            if (ticker) {
                await buyStock(ticker, amount, interaction, discordClient);
            }
        }

        else if (interaction.options.getSubcommand() === 'sell') {
            const ticker = interaction.options.getString('symbol');
            const amount = interaction.options.getInteger('amount');

            if (ticker) {
                await sellStock(ticker, amount, interaction, discordClient);
            }
        } 

        else if (interaction.options.getSubcommand() === 'portfolio') {

            const user = interaction.options.getMember('user') || interaction.user;

            await getStocks(interaction, user, discordClient);
        }
    }
};