const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");


/**
 * The welcome message
 * @param {TelegramBot} bot
 * @param {number} chatId
 * @param {string | undefined} user
 */
const welcome = async (bot, chatId, user) => {
  bot.sendMessage(
    chatId, `Hey ${user}, welcome to Ace FT system! 🚀 I'm Mr ACE 🔄, Ace-FT's Telegram bot to interact with you. \nFirst, use /ace command to link your telegram account with your wallet address in order to add yourself to notification pool.\nThen use /commands to see the list of commands you can use with me`
  );
};

module.exports = welcome;