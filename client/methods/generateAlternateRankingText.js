/**
 * @fileoverview An implementation designed to efficiently generate an embed for a
 * leaderboard display, given ranking data along with change over the hour
 * @author Ai0796
 */

const { RESULTS_PER_PAGE } = require('../../constants');
var MAXLENGTH = 42;

/**
 * Generates an ranking embed from the provided params
 * @param {Object} data a collection of player data on the leaderboard
 * @param {Integer} page the current page (if applicable)
 * @param {Integer} target the rank that we will highlight on the embed with a star
 * @param {Object} gamesPlayed an array of old score values correlating to data
 * @param {Boolean} mobile whether it's a mobile display or not
 * @return {MessageEmbed} a generated embed of the current leaderboard
 */
const generateAlternateRankingText = (data, page, target, gamesPlayed, GPH, mobile) => {
    let rankLabel = 'T';
    let nameLabel = 'Name';
    let scoreLabel = 'Score'; 
    let gamesLabel = 'Games';
    let changeLabel = 'GPH';

    //Ignore this
    if(mobile) {
        MAXLENGTH = 30;
    } else {
        MAXLENGTH = 42;
    }

    let maxRankLength = rankLabel.length;
    let maxNameLength = nameLabel.length;
    let maxScoreLength = scoreLabel.length;
    let maxGamesLength = gamesLabel.length;
    let maxChangeLength = changeLabel.length;

    data.forEach((user) => {
        if (user.rank.toString().length > maxRankLength) {
            maxRankLength = user.rank.toString().length;
        }
        if (user.name.length > maxNameLength) {
            maxNameLength = user.name.length;
        }
        if (user.score.toLocaleString().length > maxScoreLength) {
            maxScoreLength = user.score.toLocaleString().length;
        }
    });

    let difference = Math.max(0, (maxRankLength + maxNameLength + maxScoreLength + maxGamesLength + maxChangeLength) - MAXLENGTH);
    maxNameLength -= difference;

    let leaderboardText = '';
    let rank = ' '.repeat(maxRankLength - rankLabel.length) + rankLabel;
    let name = nameLabel + ' '.repeat(maxNameLength - nameLabel.length);
    let score = scoreLabel + ' '.repeat(maxScoreLength - scoreLabel.length);
    let games = ' '.repeat(maxGamesLength - gamesLabel.length) + gamesLabel;
    let change = ' '.repeat(maxChangeLength - changeLabel.length) + changeLabel;
    leaderboardText += `\`${rank} ${name} ${score} ${games} ${change}\``;
    leaderboardText += '\n';
    for (let i = 0; i < RESULTS_PER_PAGE; i++) {
        if (i > data.length) {
            leaderboardText += '\u200b';
            break;
        }

        let rank = ' '.repeat(maxRankLength - data[i].rank.toString().length) + data[i].rank;
        let nameStr = data[i].name.substring(0, maxNameLength).replace('`', '\'');
        let name = nameStr + ' '.repeat(maxNameLength - nameStr.length);
        let score = ' '.repeat(maxScoreLength - data[i].score.toLocaleString().length) +
            data[i].score.toLocaleString();
        var gamesStr;
        if (gamesPlayed[i] == -1) {
            gamesStr = 'N/A';
        } else {
            gamesStr = (gamesPlayed[i]).toLocaleString();
        }
        var changeStr;
        if (GPH[i] == -1) {
            changeStr = 'N/A';
        }
        else {
            changeStr = (GPH[i]).toLocaleString();
        }
        let games = ' '.repeat(maxGamesLength - gamesStr.length) + gamesStr;
        let change = ' '.repeat(maxChangeLength - changeStr.length) + 
            changeStr;

        leaderboardText += `\`${rank} ${name} ${score} ${games} ${change}\``;
        if ((page * RESULTS_PER_PAGE) + i + 1 === target) {
            leaderboardText += '⭐';
        }
        leaderboardText += '\n';
    }

    return leaderboardText;
};

module.exports = generateAlternateRankingText;