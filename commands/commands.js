require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");

/**
 * Returns the list of available commands in the bot
 * @param {TelegramBot} bot 
 * @param {number} chatId 
 * @param {string | undefined} user 
 */
const commands = async (bot, chatId, user) => {
  var message = `Here are all the available commands that I can understand\n`;
  message += `- /ace <0x.......> - Link your wallet and add your address to notification pool\n`;
  message += `- /inbox - See all the pending files you haven't dowloaded yet\n`;
  message += `- /history - See the history of all the files you received\n`;
  message += `- /wallet - get the wallet address linked to Telegram pool\n`;
  bot.sendMessage(chatId, `${message}`);
};

module.exports = commands;