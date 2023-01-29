const { TwitterApi } = require('twitter-api-v2');
    
const { TwitterApiKey, TwitterApiKeySecret, TwitterAccessToken, TwitterAccessTokenSecret } = require('../config');
const { TWITTER_INTERVAL } = require('../constants');

const client = new TwitterApi({
    appKey: TwitterApiKey,
    appSecret: TwitterApiKeySecret,
    accessToken: TwitterAccessToken,
    accessSecret: TwitterAccessTokenSecret,
});

const fp = './JSONs/twitter.json';

const collectTwitter = async (data, discordClient) => {

    const username = data.username;
    const channelid = data.channel;
    const id = data.id;
  
    let date = new Date();
    let hour = date.getHours();
    let minute = date.getMinutes();
    if (minute - 5 < 0) {
      hour -= 1;
      minute = 60 + (minute - 5);
    } else {
      minute -= 5;
    }
    date.setHours(hour);
    date.setMinutes(minute);
  
    const user = await client.v2.userTimeline(id, {'start_time': date.toISOString()});
    const tweets = [];
  
    for (const tweet of user) {
        tweets.unshift(tweet);
    }
    for (let i = 0; i < tweets.length; i++) {
        if (!(data.tweets.includes(tweets[i].id))) {
            data.tweets.push(tweets[i].id);

            let channel = discordClient.client.channels.cache.get(channelid);
            let str = `https://twitter.com/${username}/status/${tweets[i].id}`;

            if (data.role) {
                str = `<@&${data.role}> ${str}`;
            }
            channel.send(str);
        }
    }

    return data;
};

const readTwitterData = () => {
    const fs = require('fs');
    if (fs.existsSync(fp)) {
        const data = JSON.parse(fs.readFileSync(fp));
        return data;
    }
    return [];
};

const writeTwitterData = (data) => {
    const fs = require('fs');
    fs.writeFileSync(fp, JSON.stringify(data));
};

const addTwitterData = async (username, channelid, role) => {
    const data = readTwitterData();
    const user = await client.v2.userByUsername(username);
    const id = user.data.id;

    for (const item of data) {
        if (item.username === username && item.channel === channelid) {
            return false;
        }
    }

    data.push({
        username: username,
        channel: channelid,
        id: id,
        role: role,
        tweets: []
    });
    writeTwitterData(data);
    return true;
};

const removeTwitterData = (username, channelid) => {
    const data = readTwitterData();
    for (let i = 0; i < data.length; i++) {
        if (data[i].username === username && data[i].channel === channelid) {
            data.splice(i, 1);
            writeTwitterData(data);
            return true;
        }
    }
    return false;
};

const collectTwitterData = async (discordClient) => {
    let data = readTwitterData();
    for (let i = 0; i < data.length; i++) {
        data[i] = await collectTwitter(data[i], discordClient);
    };
    writeTwitterData(data);
};

const getRecentTweet = async (username, discordClient) => {
    const user = await client.v2.userByUsername(username);
    const id = user.data.id;
    const tweets = await client.v2.userTimeline(id, {'max_results': 5});
    for (const tweet of tweets) {
        return `https://twitter.com/${username}/status/${tweet.id}`;
    }
};

/**
 * Continaully grabs and updates the Cutoff data
 * @param {DiscordClient} discordClient the client we are using 
 */
const trackTwitterData = async (discordClient) => {
    let dataUpdater = setInterval(collectTwitterData, TWITTER_INTERVAL, discordClient);
    collectTwitterData(discordClient); //Run function once since setInterval waits an interval to run it
};

module.exports = {trackTwitterData, addTwitterData, removeTwitterData, getRecentTweet};