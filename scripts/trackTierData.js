/**
 * @fileoverview Main tracker of all cutoff data for internal storage in case Sekai.Best goes down
 * @author Ai0796
 */

const { CUTOFF_INTERVAL, CUTOFF_DATA } = require('../constants');
const fs = require('fs');

/**
 * Writes JSON response from Project Sekai servers to local JSON
 * @param {Object} response from project sekai client
*/

function clearFile() {
    try {
        if (fs.existsSync(`track.json`)) {
            fs.unlink('track.json');
        }
    } catch (e) {
        console.log('Error occured while writing Tracking: ', e);
    }
}

function readTiers() {
    var trackFile;
    try {
        if (!fs.existsSync(`track.json`)) {
            trackFile = new Object();
        }
        else {
            trackFile = JSON.parse(fs.readFileSync(`track.json`, 'utf8'));
        }

        console.log(trackFile);

        return Object.keys(trackFile);

    } catch (e) {
        console.log('Error occured while writing Tracking: ', e);
    }
}

function readScores(tier) {
    tier = tier.toString();
    var trackFile;
    try {
        if (!fs.existsSync(`track.json`)) {
            trackFile = new Object();
        }
        else {
            trackFile = JSON.parse(fs.readFileSync(`track.json`, 'utf8'));
        }

        if (tier in trackFile) {
            return Object.keys(trackFile[tier]);
        }

    } catch (e) {
        console.log('Error occured while writing Tracking: ', e);
    }

    return [];
}

function getUsers(tier, score) {
    tier = tier.toString();
    var users = [];
    var trackFile;
    try {
        if (!fs.existsSync(`track.json`)) {
            trackFile = new Object();
        }
        else {
            trackFile = JSON.parse(fs.readFileSync(`track.json`, 'utf8'));
        }

        if (tier in trackFile) {
            users = trackFile[tier][score];
            delete trackFile[tier][score];
            if (trackFile[tier].length <= 0) {
                delete trackFile[tier];
            }
        }

        fs.writeFile(`track.json`, JSON.stringify(trackFile), err => {
            if (err) {
                console.log('Error writing Tracking', err);
            } else {
                console.log(`Wrote Tracking Successfully`);
            }
        });
    } catch (e) {
        console.log('Error occured while writing Tracking: ', e);
    }

    return users;
}

/**
 * Recurvsively adds cutoff tracks to queue
 * @param {Integer} target index of cutoff in a cutoff list
 * @param {Integer} target event, if -1 calculates the event based on current time
 * @param {DiscordClient} discordClient the client we are using 
*/
async function getCutoffs(discordClient) {
    async function checkResults(response) {
        try {
            let event = getRankingEvent().id;
            if (response['rankings'][0] != null && event != -1) {
                let score = response['rankings'][0]['score'];
                let rank = response['rankings'][0]['rank'];
                let scoreList = readScores(rank);

                scoreList.forEach(oldScore => {
                    if (score != oldScore) {
                        let users = getUsers(rank, oldScore);

                        if (users != undefined) {
                            users.forEach((pair) => {
                                let channel = discordClient.client.channels.cache.get(pair[0]);
                                channel.send(`${pair[1]} T${rank} Has started moving, they are now at ${score} EP\nYou tracked ${oldScore}`);
                            });
                        }
                    }
                });
            }
        } catch (e) {
            console.log('Error occured while adding cutoffs: ', e);
        }
    }
    try {
        let event = getRankingEvent().id;
        if (event == -1) {
            clearFile();
            return -1;
        } else {
            let tiers = readTiers();
            tiers.forEach(cutoff => {
                discordClient.addPrioritySekaiRequest('ranking', {
                    eventId: event,
                    targetRank: cutoff,
                    lowerLimit: 0
                }, checkResults, (err) => {
                    discordClient.logger.log({
                        level: 'error',
                        message: err.toString()
                    });
                });
            });
        }
    } catch (error) {
        console.log(error);
        console.log('Connection Error, Retrying');
        return;
    }
}

/**
 * Obtains the current event within the ranking period
 * @return {Object} the ranking event information
 */
const getRankingEvent = () => {
    const events = JSON.parse(fs.readFileSync('sekai_master/events.json'));
    const currentTime = Date.now();

    for (let i = events.length - 1; i >= 0; i--) {
        //Time of Distribution + buffer time of 15 minutes to get final cutoff
        if (events[i].startAt < currentTime && events[i].aggregateAt > currentTime) {
            return {
                id: events[i].id,
                banner: 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' +
                    `${events[i].assetbundleName}/logo_rip/logo.webp`,
                name: events[i].name,
                startAt: events[i].startAt,
                aggregateAt: events[i].aggregateAt,
                closedAt: events[i].closedAt,
                eventType: events[i].eventType
            };
        }
    }

    return {
        id: -1,
        banner: '',
        name: ''
    };
};

/**
 * Continaully grabs and updates the Cutoff data
 * @param {DiscordClient} discordClient the client we are using 
 */
const trackTierData = async (discordClient) => {
    let dataUpdater = setInterval(getCutoffs, CUTOFF_INTERVAL, discordClient);
    getCutoffs(discordClient); //Run function once since setInterval waits an interval to run it
};

module.exports = trackTierData;