/**
 * @fileoverview The main implementation towards maintaining our bot with up to data information.
 * Pulls data from Sekai.best once, before executing the callback.
 * @author Potor10
 */

const { DIR_DATA } = require('../constants');
const https = require('https');
const fs = require('fs');

// The location we pull from and data modules we pull 
const GAME_CONSTANTS = {
  'HOST': 'raw.githubusercontent.com',
  'PATH': '/Sekai-World/sekai-master-db-en-diff/main/',
  'JSON': [
    'gameCharacters',
    'gameCharacterUnits',
    'characterProfiles',
    'areas',
    'areaItems',
    'areaItemLevels',
    'events',
    'eventCards',
    'cards',
    'cardEpisodes',
    'musics',
    'eventDeckBonuses'
  ]
};

/**
 * Recursively downloads the data one by one, then executes a callback to confirm all
 * data has been downloaded
 * @param {Integer} idx the current index on that data we have downloaded
 * @param {Function} callback a callback to run upon the successful download of all data
 */
const loadGameData = (idx, callback) => {
  if (idx >= GAME_CONSTANTS.JSON.length) {
    callback();
  } else {
    const filename = GAME_CONSTANTS.JSON[idx];

    const options = {
      host: GAME_CONSTANTS.HOST,
      path: `${GAME_CONSTANTS.PATH}${filename}.json`,
      headers: {'User-Agent': 'request'},
      timeout: 3000
    };
  
    https.get(options, (res) => {
      let json = '';
      res.on('data', (chunk) => {
        json += chunk;
      });
      res.on('end', async () => {
        if (res.statusCode === 200) {
          try {
            fs.writeFileSync(`${DIR_DATA}/${filename}.json`, JSON.stringify(JSON.parse(json)));
            console.log(`${filename}.json Retrieved`);
            loadGameData(idx+1, callback);
          } catch (err) {
            // console.log(`Error parsing JSON: ${err}`)
          }
        } else {
          // console.log(`Error retrieving via HTTPS. Status: ${res.statusCode}`)
        }
      });
      res.on('timeout', async () => {
        res.destroy();
        loadGameData(idx, callback);
      });
    }).on('error', () => {});
  }
};

export { loadGameData };