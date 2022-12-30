/**
 * @fileoverview Generates Object pair of timezone names with their offsets for use with commands
 * @author Ai0796
 */

const { DateTime, Duration }  = require('luxon');

const HOUR = Duration.fromObject({'hours': 1});

/**
 * Generates an embed from the provided params
 * @return {Array} an Object of UTC-XX to the current time pairs
 */
const generateTimeZones = () => {
    var now = DateTime.now();
    const timezones = [];

    now = now.minus(Duration.fromObject({'hours': 11}));

    console.log(now.toLocaleString());

    for(let i = -11; i < 12; i++) {
        timezones.push([`${now.toLocaleString(DateTime.TIME_24_SIMPLE)} (UTC${(i <= 0 ? '' : '+')}${i})`, i]);
        now = now.plus(HOUR);
    }

    return timezones;
};

module.exports = generateTimeZones;