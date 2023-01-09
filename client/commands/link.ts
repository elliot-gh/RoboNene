/**
 * @fileoverview The main output when users call for the /link command
 * Shows an prompt for the user to link their account the the bot
 * @author Potor10
 */

const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { ERR_COMMAND, NENE_COLOR, FOOTER } = require('../../constants');

const COMMAND = require('../command_data/link');

const generateSlashCommand = require('../methods/generateSlashCommand');
const generateEmbed = require('../methods/generateEmbed'); 

/**
 * Generates the embed that is used when users request a link
 * @param {String} code the code that the user needs to enter into their profile to link
 * @param {String} accountId the ID of the account that is trying to link to the bot
 * @param {Integer} expires in epochseconds before the linking expires
 * @param {Object} content the message body within the link embed (ex: success, or failure)
 * @param {DiscordClient} client we are using to interact with disc
 * @return {MessageEmbed} embed that we recieve to display to the user
 */
const generateLinkEmbed = ({code, accountId, expires, content, client}) => {
  const linkInformation = {
    type: 'Link Information',
    message: `Link Code: \`${code}\`\n` + 
      `Account ID: \`${accountId}\`\n` + 
      `Expires: <t:${Math.floor(expires/1000)}>`
  };

  const linkEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(COMMAND.INFO.name.charAt(0).toUpperCase() + COMMAND.INFO.name.slice(1))
    .addField(linkInformation.type, linkInformation.message)
    .addField(COMMAND.CONSTANTS.LINK_INSTRUCTIONS.type, COMMAND.CONSTANTS.LINK_INSTRUCTIONS.message)
    .setImage(COMMAND.CONSTANTS.LINK_IMG)
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp()
    .setFooter(FOOTER, client.user.displayAvatarURL());

  if (content) {
    linkEmbed.addField(content.type, content.message);
  }

  return linkEmbed;
};

function isAdmin(msg) {
  try{
    return msg.member.permissionsIn(msg.channel).has('Administrator');
  }
  catch {
    return false;
  }
}

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    });

    const db = discordClient.db;
    const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'');
    var userId = interaction.options.getString('discordid');

    if (userId && isAdmin(interaction)) {
      // userId = userId.replace(/\D/g, '');
      console.log(userId, accountId);
      db.prepare('REPLACE INTO users (discord_id, sekai_id) ' +
        'VALUES(@discordId, @sekaiId)').run({
          discordId: userId,
          sekaiId: accountId
        });
      await interaction.editReply('Added');
      return;
    }

    if (!accountId) {
      // Do something because there is an empty account id input
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.BAD_ID_ERR, 
            client: discordClient.client
          })
        ]
      });
      return;
    }

    const users = db.prepare('SELECT * FROM users WHERE ' + 
      'discord_id=@discordId OR sekai_id=@sekaiId').all({ 
      discordId: interaction.user.id, 
      sekaiId: accountId
    });

    if (users.length) {
      // User is already linked
      if (users[0].discord_id === interaction.user.id) {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: COMMAND.CONSTANTS.DISCORD_LINKED_ERR, 
              client: discordClient.client
            })
          ]
        });
      } 
      // Sekai id is already linked
      else if (users[0].sekai_id === accountId) {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: COMMAND.CONSTANTS.SEKAI_LINKED_ERR, 
              client: discordClient.client
            })
          ]
        });
      } 
      // General Error
      else {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: ERR_COMMAND, 
              client: discordClient.client
            })
          ]
        });
      }

      return;
    }
    
    if (!discordClient.checkRateLimit(interaction.user.id)) {
      await interaction.editReply({
        embeds: [generateEmbed({
          name: COMMAND.INFO.name,
          content: { 
            type: COMMAND.CONSTANTS.RATE_LIMIT_ERR.type, 
            message: COMMAND.CONSTANTS.RATE_LIMIT_ERR.message + 
              `\n\nExpires: <t:${Math.floor(discordClient.getRateLimitRemoval(interaction.user.id) / 1000)}>`
          },
          client: discordClient.client
        })]
      });
      return;
    }

    // No Errors
    discordClient.addSekaiRequest('profile', {
      userId: accountId
    }, async () => {
      // Generate a new code for the user
      const code = Math.random().toString(36).slice(-5); 
      const expires = Date.now() + COMMAND.CONSTANTS.INTERACTION_TIME;

      const linkButton = new MessageActionRow()
        .addComponents(new MessageButton()
          .setCustomId('link')
          .setLabel('LINK')
          .setStyle('SUCCESS')
          .setEmoji(COMMAND.CONSTANTS.LINK_EMOJI));

      const linkMessage = await interaction.editReply({
        embeds: [
          generateLinkEmbed({
            code: code, 
            accountId: accountId,
            expires: expires,
            client: discordClient.client
          })
        ],
        components: [linkButton],
        fetchReply: true
      });

      let linked = false;
      let limited = false;

      const filter = (i) => {
        return i.customId == 'link';
      };
  
      const collector = linkMessage.createMessageComponentCollector({ 
        filter, 
        time: COMMAND.CONSTANTS.INTERACTION_TIME 
      });
      
      collector.on('collect', async (i) => {
        await i.update({
          embeds: [
            generateLinkEmbed({
              code: code, 
              accountId: accountId,
              expires: expires,
              client: discordClient.client
            })
          ],
          components: []
        });

        if (!discordClient.checkRateLimit(interaction.user.id)) {
          limited = true;

          await interaction.editReply({
            embeds: [
              generateLinkEmbed({
                code: code, 
                accountId: accountId,
                expires: expires,
                content: { 
                  type: COMMAND.CONSTANTS.RATE_LIMIT_ERR.type, 
                  message: COMMAND.CONSTANTS.RATE_LIMIT_ERR.message + 
                    `\n\nExpires: <t:${Math.floor(discordClient.getRateLimitRemoval(interaction.user.id) / 1000)}>`
                },
                client: discordClient.client
              })
            ],
            components: []
          });
          return;
        }

        // We got a response, proceeding to authenticate
        discordClient.addSekaiRequest('profile', {
          userId: accountId
        }, async (response) => {
          if (response.userProfile.word === code) {
            db.prepare('REPLACE INTO users (discord_id, sekai_id) ' + 
              'VALUES(@discordId, @sekaiId)').run({
              discordId: interaction.user.id,
              sekaiId: accountId
            });

            linked = true;

            await interaction.editReply({
              embeds: [
                generateLinkEmbed({
                  code: code, 
                  accountId: accountId,
                  expires: expires,
                  content: COMMAND.CONSTANTS.LINK_SUCC,
                  client: discordClient.client
                })
              ],
              components: []
            });
          } else {
            await interaction.editReply({
              embeds: [
                generateLinkEmbed({
                  code: code, 
                  accountId: accountId,
                  expires: expires,
                  content: COMMAND.CONSTANTS.BAD_CODE_ERR(response.userProfile.word),
                  client: discordClient.client
                })
              ],
              components: [linkButton]
            });
          }
        }, async (err) => {
          // Log the error
          discordClient.logger.log({
            level: 'error',
            timestamp: Date.now(),
            message: err.toString()
          });

          // If the account does not exist (even though we should have checked)
          await interaction.editReply({
            embeds: [
              generateLinkEmbed({
                code: code, 
                accountId: accountId,
                expires: expires,
                content: { type: 'error', message: err.toString() },
                client: discordClient.client
              })
            ],
            components: []
          });
        });
      });

      collector.on('end', async () => {
        // No Response
        if (!linked && !limited) {
          await interaction.editReply({ 
            embeds: [
              generateLinkEmbed({
                code: code, 
                accountId: accountId,
                expires: expires,
                content: COMMAND.CONSTANTS.EXPIRED_CODE_ERR,
                client: discordClient.client
              })
            ], 
            components: []
          });
        }
      });
    }, async (err) => {
      if (err.getCode() === 404) {
        // We got an error trying to find this account
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: COMMAND.CONSTANTS.BAD_ID_ERR, 
              client: discordClient.client
            })
          ]
        });
      } else {
        // Log the error
        discordClient.logger.log({
          level: 'error',
          timestamp: Date.now(),
          message: err.toString()
        });

        await interaction.editReply({
          embeds: [generateEmbed({
            name: COMMAND.INFO.name,
            content: { type: 'error', message: err.toString() },
            client: discordClient.client
          })]
        });
      }
    });
  }
};

export {};