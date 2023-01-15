/**
 * 
 * @param {Integer} eventID 
 * @returns {Object} Event Data
 */

const fs = require('fs');

function getEventData(eventID) {
    const data = JSON.parse(fs.readFileSync('./sekai_master/events.json'));

    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].id == eventID) {
            return data[i];
        }
    }

    return null;
}

module.exports = getEventData;