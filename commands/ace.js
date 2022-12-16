require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");
const inbox = require("./inbox")

/**
 * Adds the address sent by the user to the database (so in the notification pool)
 * @param {TelegramBot} bot
 * @param {number} chatId
 * @param {string | undefined} user
 */
const xxxace = (bot, chatId, user) => {
  bot.sendMessage(
    chatId, `Hey @${user}! Please copy and paste here your wallet address to be added to the notification pool`
  );

  const testExp = new RegExp(/0x.{40}/);
  var entryOk = false;

  bot.on("message", async (msg) => {
    const content = msg.text;
    entryOk = testExp.test(content);


    if (!entryOk) {
      bot.sendMessage(
        chatId, `I do not understand, please enter a valid address.`
      );
    } else {

      let newuser = {
        telegram_id: user,
        wallet_address: content,
        chat_id: chatId,
        orders: 0
      };
    
      await new User(newuser).save();
      bot.sendMessage(chatId, `Address ${content} added`);
      return;
    }
  });
};


const ace = async (bot, chatId, user, msg) => {
  bot.sendMessage(
    chatId, `Hey @${user}! Please copy and paste here your wallet address to be added to the notification pool`
  );

  const content = msg.text.toLowerCase();
  
  let regExAddressMatch = content.match(/(\b0x[a-f0-9]{40}\b)/g)
           
  var entryOk = regExAddressMatch && regExAddressMatch.length > 0;
  

  if (!entryOk) {
    bot.sendMessage(
      chatId, `I do not understand, please enter a valid address.`
    );
  } else {
    let walletAddress = regExAddressMatch[0] ;
    let newuser = {
      telegram_id: user,
      wallet_address: walletAddress,
      chat_id: chatId,
      orders: 0
    };
    await new User(newuser).save();
    bot.sendMessage(chatId, `Address ${walletAddress} added`);
    return;
  }

};


module.exports = ace;