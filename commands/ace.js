const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");
const inbox = require("./inbox")

/**
 * Adds the address sent by the user to the database (so in the notification pool)
 * @param {TelegramBot} bot
 * @param {number} chatId
 * @param {string | undefined} user
 */
const ace = (bot, chatId, user) => {
  bot.sendMessage(
    chatId, `Hey @${user}! Please copy and paste here your wallet address to be added to the notification pool`
  );

  const testExp = new RegExp(/0x.{40}/);
  var entryOk = false;
  console.log(entryOk, testExp);

  bot.on("message", async (msg) => {
    const content = msg.text;
    console.log("Received message", content);
    entryOk = testExp.test(content);
    console.log(entryOk);


    if (!entryOk) {
      bot.sendMessage(
        chatId, `I do not understand, please enter a valid address.`
      );
    } else {
      await new User({
        telegram_id: user,
        wallet_address: content,
        chat_id: chatId,
        orders: 0
      }).save();
      bot.sendMessage(chatId, `Address ${content} added`);
      return;
    }
  });
};

module.exports = ace;