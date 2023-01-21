/**
 * @fileoverview The main code to run when you start the bot
 * @author Potor10
 */

import {DiscordClient} from './client/client.js';
import {loadGameData} from './scripts/loadGameData.js';
import {loadMusicMeta} from './scripts/loadMusicMeta.js';
import {trackGameData} from './scripts/trackGameData.js';
import {trackRankingData} from './scripts/trackRankingData.js';
import {trackCutoffData} from './scripts/trackCutoffData.js';
import {trackUserCutoffs} from './scripts/trackUserCutoffs.js';
import {trackTierData} from './scripts/trackTierData.js';
import fs from 'fs';

loadMusicMeta(0);
loadGameData(0, async () => {
  const client = new DiscordClient();
  client.loadCommands();
  client.loadEvents();
  client.loadDb();
  client.loadCutoffDb();
  client.loadPrayerDb();
  client.loadLogger();

  await client.loadSekaiClient();
  await client.runSekaiRequests();
  await client.login();

  // Begin the scripts
  trackGameData(client);
  trackRankingData(client);
  trackCutoffData(client);
  trackUserCutoffs(client);
  trackTierData(client);


  //This is a very duct tape solution
  if(fs.existsSync('messages.json')) {
    let messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
    Object.keys(messages).forEach((key) => {
      let message = messages[key];
      let channel = client.client.channels.cache.get(key);
      if(channel) {
        channel.send(message);
      }
    });

    fs.unlinkSync('messages.json');
  }
});
