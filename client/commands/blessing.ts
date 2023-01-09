/**
 * @fileoverview BLESSING
 * @author Ai0796
 */

import { CommandInteraction } from "discord.js";


const COMMAND = require('../command_data/blessing');

const generateSlashCommand = require('../methods/generateSlashCommand');
const fs = require('fs');

const fp = './JSONs/blessing.json';

const blessingLyrics = [
    'Blessings for your birthday',
    'Blessings for your everyday',
    'saigo no ichibyou made mae o muke',
    'hagashite mo naze da ka fueteku tagu to',
    'ranku zuke sareteku rifujin na kachi',
    'sonna mono de hito o oshihakaranaide to',
    'tobikau kotoba o te de ooikakushita',
    'Oh… It\'s time to get up tomoshibi o kesu mae ni',
    'Oh… It\'s time to get up ashimoto o terase!',
    'hora koko o jitto mitsumete mite',
    'saikou no mikata ga utsutteru desho?',
    'sore wa inochi no akashi',
    'Blessings for your birthday',
    'Blessings for your everyday',
    'tatoe ashita sekai ga horonde mo',
    'Blessings for your birthday',
    'Blessings for your everyday',
    'saigo no ichibyou made mae o muke',
    'Hip hip HOORAY',
    'kore kara saki mo',
    'Hip hip HOORAY',
    'kimi ni sachi are',
    'zero kara ichi o umu no wa tayasukunai koto',
    'kanjin na mono wa mienai shi sawarenai koto',
    'fukou to wa shiawase da to kizukenai koto',
    'mainichi ga tanjoubi de meinichi na koto',
    'Oh… Stand up take action doronuma o kakiwakete',
    'Oh… Stand up take action hachisu no hana wa saku!',
    'hora koko ni te o kasanete mite',
    'nukumori ga tsutawatte kuru desho?',
    'sore wa inochi no akashi',
    'Blessings for your birthday',
    'Blessings for your everyday',
    'tatoe kireigoto datte kamawanai',
    'Blessings for your birthday',
    'Blessings for your everyday',
    'kono yo ni umarete kurete arigatou',
    'Hip hip HOORAY',
    'kore kara saki mo',
    'Hip hip HOORAY',
    'kimi ni sachi are',
    'saa saa yotterasshai miterasshai',
    'rokku de ittara konna fuu',
    'Like this Like this Yeah',
    'akapera de ittara konna fuu',
    'Like this Like this Yeah',
    'geemu de ittara konna fuu',
    'Like this Like this Yeah',
    'dansu de ittara konna fuu',
    'Da da da da da',
    'yoku tabete',
    'yoku nemutte',
    'yoku asonde',
    'yoku manade',
    'yoku shabette',
    'yoku kenka shite',
    'goku futsuu na mainichi o',
    'nakenakute mo',
    'waranakute mo',
    'utaenakute mo',
    'nani mo nakute mo',
    'aisenakute mo',
    'aisarenakute mo',
    'soredemo ikite hoshii',
    'Blessings for your birthday',
    'Blessings for your everyday',
    'tatoe ashita sekai ga horonde mo',
    'Blessings for your birthday',
    'Blessings for your everyday',
    'saigo no ichibyou made mae o muke',
    'If you\'re alive',
    'ano ko ga furimuku kamo',
    'If you\'re alive',
    'takarakuji ataru kamo',
    'If you\'re alive',
    'futatabi hajimaru kamo',
    'ikinuku tame nara',
    'bou ni fure',
    'mizu o sase',
    'kemuri ni make',
    'abura o ure',
    'utsutsu o nukase',
    'soshite raishuu mo',
    'raigetsu mo',
    'rainen mo',
    'raise mo',
    'issho ni iwaou',
    'Blessings for your birthday',
    'Blessings for your everyday',
    'taoe kireigoto datte kamawani',
    'Blessings for your birthday',
    'Blessings for your everyday',
    'koko ni tsudoeta kiseki ni arigatou',
    'Hip hip HOORAY',
    'kore kara saki mo',
    'Hip hip HOORAY',
    'kimi ni sachi are',
    'Hip hip HOORAY',
    'kore kara saki mo',
    'Hip hip HOORAY',
    'kimi ni sachi are',
    '🎉🎊✨🎂 Hip hip HOORAY!!! 🎂✨🎊🎉',
];

function getBonks() {
    var bonk = 0;
    var bonkFile;
    try {
        if (!fs.existsSync(fp)) {
            bonkFile = new Object();
        }
        else {
            bonkFile = JSON.parse(fs.readFileSync(fp, 'utf8'));
        }

        if ('blessings' in bonkFile) {
            bonkFile['blessings'] = bonkFile['blessings'] + 1;
        }
        else {
            bonkFile['blessings'] = 0;
        }

        bonk = bonkFile['blessings'];

        fs.writeFile(fp, JSON.stringify(bonkFile), (err:Error) => {
            if (err) {
                console.log('Error writing Bonk', err);
            } else {
                console.log('Wrote Bonk Successfully');
            }
        });
    } catch (e) {
        console.log('Error occured while writing cutoffs: ', e);
    }

    return bonk;
}

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction: CommandInteraction, discordClient: any) {
        // await interaction.reply("test")
        try {

            let bonks = getBonks();

            await interaction.reply(blessingLyrics[bonks % blessingLyrics.length]);
        } catch (e) {
            console.log(e);
        } // Due to possible null values add a try catch
    }
};

export {};