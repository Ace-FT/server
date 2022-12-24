require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");
const inbox = require("./inbox")


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

    let walletAddress = regExAddressMatch[0];

    let msg;
    let doc;

    const existing = await User.findOne({ telegram_id: user }).exec();

    if (existing) {
      doc = existing;
      msg = `Cool 😎, I have updated the wallet address associated with this chat to ${walletAddress}.`;
      doc.wallet_address = walletAddress;
    }
    else {
      doc = {
        telegram_id: user,
        wallet_address: walletAddress,
        chat_id: chatId,
        orders: 0
      };
      msg = `Address ${walletAddress} added`;
      await new User(newuser).update();
    }
    doc.save() ;
    bot.sendMessage(chatId, msg);

    return;
  }

};


module.exports = ace;