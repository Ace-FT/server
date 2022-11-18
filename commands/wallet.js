const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");


/**
 * Returns the address linked to the user's Telegram account
 * @param {TelegramBot} bot
 * @param {number} chatId
 * @param {string | undefined} user
 */
const wallet = async (bot, chatId, user) => {
  const data = await User.findOne({ telegram_id: user }).exec();
  const res = data.wallet_address;
  console.log("res", res);
  bot.sendMessage(
    chatId, `The wallet address linked to @${user} is ${res}`
  );
};

module.exports = wallet;