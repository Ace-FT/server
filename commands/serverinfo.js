const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");
const DEBUG = process.env.LOGLEVEL == "debug";
var os = require('os');

//Object.keys(os).map((method) => { if (undefined != method) console.log(method + ": " + JSON.stringify(os[method](), 2, true) + "\r\n"); });

Object.keys(os).map((method) => {

  try {
    console.log();
  }
  catch (e) {

  }


});


/**
 * Returns the address linked to the user's Telegram account
 * @param {TelegramBot} bot
 * @param {number} chatId
 * @param {string | undefined} user
 */
const serverinfo = async (bot, chatId, user) => {
  const data = await User.findOne({ telegram_id: user }).exec();
  const address = data.wallet_address;
  let info = "";
  
  console.log("process.env.AUTHORIZED_SERVERINFO_WALLETS", process.env.AUTHORIZED_SERVERINFO_WALLETS) ;

  if (process.env.AUTHORIZED_SERVERINFO_WALLETS.split(',').indexOf(address) > -1) {
    Object.keys(os).map((method) => {
      try {
        info += method + ":" + JSON.stringify(os[method](), null, 1) + "\r\n";
      }
      catch (err) {
      }

    });
  }
  else {
    info = "unauthorized";
  }

  bot.sendMessage(
    chatId, `Bot server info \r\n${info}`
  );
};

module.exports = serverinfo;