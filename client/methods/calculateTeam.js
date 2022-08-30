/**
 * @fileoverview Calculates Team Talent and Event Bonus
 * @author Ai0796
 */

const fs = require('fs');

const MASTERYRANKREWARDS = [0, 50, 100, 150, 200];
const V2MASTERYREWARDS = [0.1, 0.2, 1, 1.5, 2];

/**
 * @typedef {Object} Team
 * @property {number} talent - The Talent of the Team
 * @property {number} eventBonus - The Event Bonus of the team
 */

/**
 * @typedef {Object} Card
 * @property {number} baseTalent - base talent of card before area or character buffs
 * @property {number} talent - the total talent of the card
 * @property {string} type - The Type of the card
 * @property {string} group - the group of the card (or side group if Virtual Singer)
 * @property {number} characterId - the characterId of the character
 * @property {number} mastery
 * @property {number} rarity
 */

/**
 * @param {Object} Default card format from Project Sekai from user.deck
 * @param {Object} read in data about the cards
 * @returns {Card}
 */
const readCardTalent = (card, cards, cardEpisodes, gameCharacters) => {
    let data = cards.find((param) => param.id === card.cardId);
    if (data == undefined)
    {
        return;
    }
    var talent = 0;

    //Get Talent for each parameter
    data.cardParameters.filter((param) => 
    param.cardLevel === card.level)
        .map((param) => talent += param.power);

    talent += card.specialTrainingStatus === 'done' ? data.specialTrainingPower1BonusFixed * 3 : 0;
    if(card.episodes[0].scenarioStatus == 'already_read') {
        let param = cardEpisodes.find((param) => param.cardId === card.cardId && param.seq === 1);
        talent += param.power1BonusFixed * 3;
    }
    if (card.episodes[1].scenarioStatus == 'already_read') {
        let param = cardEpisodes.find((param) => param.cardId === card.cardId && param.seq === 2);
        talent += param.power1BonusFixed * 3;
    }

    talent += card.masterRank * MASTERYRANKREWARDS[data.rarity] * 3;

    var group = null;

    if(data.supportUnit != 'none') {
        group = data.supportUnit;
    } else {
        let chars = gameCharacters.find((char) => char.id == data.characterId);
        group = chars.unit;
    }
    
    let id = gameCharacters.find((char) => char.gameCharacterId == data.characterId && char.unit == group).id;
    
    return {
        baseTalent : talent,
        talent : talent,
        type : data.attr,
        group : group,
        characterId: data.characterId,
        unitId: id,
        mastery: card.masterRank,
        rarity: card.rarity
    };
};

const getAreaItemBonus = (cards, data, areaItemLevels) => {
    let itemLevels = data.userAreaItems.map(param => (param.level));
    cards.forEach(card => {
        let areaItemBuffs = areaItemLevels.filter(param => {
            if ((itemLevels[param.areaItemId - 1] === param.level)) {
                return ((card.type === param.targetCardAttr) ||
                    (card.group === param.targetUnit) ||
                    (card.characterId === param.targetGameCharacterId));
            }

        });

        areaItemBuffs.forEach(element => {
            card.talent += card.baseTalent * element.power1BonusRate / 100.0;
        });
    });
};

const getTypeAreaItem = (type, data, areaItemLevels) => {
    let itemLevels = data.userAreaItems.map(param => (param.level));
    let areaItemBuffs = areaItemLevels.filter(param => {
        if ((itemLevels[param.areaItemId - 1] === param.level)) 
        {
            return (type === param.targetCardAttr);
        }
    });

    var totalBuff = 0;

    areaItemBuffs.forEach(element => {
        totalBuff += element.power1BonusRate / 100.0;
    });

    return totalBuff;
};

const getGroupAreaItem = (group, data, areaItemLevels) => {
    let itemLevels = data.userAreaItems.map(param => (param.level));
    let areaItemBuffs = areaItemLevels.filter(param => {
        if ((itemLevels[param.areaItemId - 1] === param.level)) {
            return (group === param.targetUnit);
        }
    });

    var totalBuff = 0;

    areaItemBuffs.forEach(element => {
        totalBuff += element.power1BonusRate / 100.0;
    });

    return totalBuff;
};

const getCharacterRanks = (cards, data) => {
    cards.forEach(card => {
        let rank = data.userCharacters.find(character => character.characterId == card.characterId).characterRank;

        card.talent += card.baseTalent * (rank / 1000.0);
    });
};

const getEventBonus = (cards, eventBonusCards, eventID) => {
    let eventBonus = 0;
    //Look for a perfect match
    cards.forEach(card => {
        let bonus = eventBonusCards.find(param => {
            if (param.eventId == eventID) {
                return param.gameCharacterUnitId === card.unitId && param.cardAttr === card.type;
            }
        });
        if (bonus) {
            eventBonus += bonus.bonusRate;
        }
        else {
            bonus = eventBonusCards.find(param => {
                if (param.eventId == eventID) {
                    return (param.gameCharacterUnitId === card.unitId || param.cardAttr === card.type) && param.bonusRate < 50;
                }
            });
            if (bonus) {
                eventBonus += bonus.bonusRate;
            }
        }

        if (eventID >= 36) {
            eventBonus += card.mastery * V2MASTERYREWARDS[card.rarity];
        }
    });
    return eventBonus / 100.0;
};

/**
 * 
 * @param {Object} data response from a profile lookup from sekapi
 * @param {number} eventID Event that's currently happening
 * @returns {Team}
 */
const calculateTeam = (data, eventID) => {
    const cards = JSON.parse(fs.readFileSync('./sekai_master/cards.json'));
    const areaItemLevels = JSON.parse(fs.readFileSync('./sekai_master/areaItemLevels.json'));
    const eventBonusCards = JSON.parse(fs.readFileSync('./sekai_master/eventDeckBonuses.json'));
    const episodes = JSON.parse(fs.readFileSync('./sekai_master/cardEpisodes.json'));
    const gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacterUnits.json'));
    let deck = data.userDecks[0];

    var cardIDs = Object.keys(deck).map((key) => {
        return deck[key];
    });
    var cardData = Array();

    for(const idx in data.userCards) {
        if (cardIDs.includes(data.userCards[idx].cardId)) {
            cardData.push(data.userCards[idx]);
        }
    }

    cardData = cardData.map(card => readCardTalent(card, cards, episodes, gameCharacters));

    getAreaItemBonus(cardData, data, areaItemLevels);

    var group = cardData[0].group;
    var type = cardData[0].type;

    cardData.forEach(card => {
        if(card.group != group){
            group = undefined;
        }
        if (card.type != type) {
            type = undefined;
        }
    });

    if (type) {
        let buff = getGroupAreaItem(group, data, areaItemLevels);
        cardData.forEach(card => {
            card.talent += card.baseTalent * buff;
        });
    }

    if (type) {
        let buff = getTypeAreaItem(type, data, areaItemLevels);
        cardData.forEach(card => {
            card.talent += card.baseTalent * buff;
        });
    }

    getCharacterRanks(cardData, data);

    let totalTalent = 0;

    cardData.forEach(card => totalTalent += card.talent);
    let eventBonus = getEventBonus(cardData, eventBonusCards, eventID);

    return {
        talent: totalTalent,
        eventBonus: eventBonus
    };
};

module.exports = calculateTeam;
