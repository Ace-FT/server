require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const User = require("./models/user");
const TelegramBot = require("node-telegram-bot-api");
const backgroundProvider = require('./common/backgroundProvider');

const ace = require("./commands/ace");
const commands = require("./commands/commands.js");
const history = require("./commands/history.js");
const pending = require("./commands/pending.js");
const serverinfo = require("./commands/serverinfo");
const wallet = require("./commands/wallet");
const welcome = require("./commands/welcome");


const { TELEGRAM_TOKEN, SERVER_URL, MONGO_URL, MAX_HISTORY_LENGTH } = process.env;
const TELEGRAM_API_ENDPOINT = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const URI = `/webhook/${TELEGRAM_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;
const FETCHING_DATA_INTERVAL = 30000 // in ms
const DEBUG = process.env.LOGLEVEL == "debug";
const DEBUG_BOT = process.env.LOGLEVEL_BOT == "debug";
const DEBUG_BACKGROUNDPROVIDER = process.env.LOG_LEVEL_BACKGROUNDPROVIDER == "debug";
const VALID_BOT_COMMANDS = ["/ace", "/wallet", "/history", "/pending", "/serverinfo", "/commands"]
// const bodyParser = require('body-parser');

// Initialising app
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// Initialising NoSQL DB
const client = new MongoClient(MONGO_URL);

const main = async () => {
    await mongoose.connect(MONGO_URL);
    console.log(process.pid, "- Mongo db Connexion OK ✅");
};

// Initialising Telegram bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// initialise webhook and check if set
const init = async () => {
    const res = await axios.get(
        `${TELEGRAM_API_ENDPOINT}/setWebhook?url=${WEBHOOK_URL}`
    );
};

// reaction on receiving message without command
bot.on("message", (msg) => {
    //if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username) ;
    const chatId = msg.chat.id;
    const user = msg.from.username;
    const content = msg.text.trim();
    let isValid = true;

    if (msg.text[0] !== "/") {
        isValid = false;
    }
    else {
        if (VALID_BOT_COMMANDS.indexOf(msg.text.split(' ')[0].toLocaleLowerCase()) == -1)
            isValid = false;
    }

    if (!isValid) bot.sendMessage(chatId, `@${user}, I do not understand your message "${msg.text}". Please use / and use one of my commands.`);

});

//////////////////////////////////
//////////// COMMANDS ////////////
//////////////////////////////////

// echo command
bot.onText(/\/echo (.*)/, (msg, match) => {
    if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username);
    const chatId = msg.chat.id;
    const resp = match[1];
    bot.sendMessage(chatId, resp);
});

// to begin interaction
bot.onText(/\/start/, (msg, match) => {
    if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username);
    const chatId = msg.chat.id;
    const user = msg.from.username;

    welcome(bot, chatId, user);
});

// to see address linked to the user's account
bot.onText(/\/wallet/, (msg, match) => {
    if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username);
    const chatId = msg.chat.id;
    const user = msg.from.username;

    wallet(bot, chatId, user);
});


// to see address linked to the user's account
bot.onText(/\/serverinfo/, (msg, match) => {
    if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username);
    const chatId = msg.chat.id;
    const user = msg.from.username;

    serverinfo(bot, chatId, user);
});


// to wallet address to database when sending /ace command
bot.onText(/\/ace/, (msg, match) => {
    if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username);
    const chatId = msg.chat.id;
    const user = msg.from.username;
    ace(bot, chatId, user, msg);
});

const inboxChatFormatter = function (order, i) {
    let ret = "";
    let receivedDateStr = `🗓 ${order.sendDate.toLocaleDateString('en-UK')}`;
    let receivedTimeStr = `${order.sendDate.toLocaleTimeString('en-UK')}`.substring(0, 5);
    ret += `\n${i + 1}. ${receivedDateStr} ${receivedTimeStr} From: ${order.from}`
    if (order.downloadDate) {
        let dlDateStr = `${order.downloadDate.toLocaleDateString('en-UK')}`;
        let dlTimeStr = `${order.downloadDate.toLocaleTimeString('en-UK')}`.substring(0, 5);
        ret += ` ✔️ You downloaded it on ${dlDateStr} ${dlTimeStr}\n`;
    }
    else {
        ret += ` ⬇️ Available for download \n`;
    }
    return ret;
}

// get all pending to download files from Ace
bot.onText(/\/pending/, async (msg, match) => {
    if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username);
    const chatId = msg.chat.id;
    const user = msg.from.username;

    var orders = await pending(user);
 console.log("ORDERS PENDING", orders) ; 
    if (orders) {
        const numberOfReceived = orders.length;

        var answerMessage = "";
        var listingAnswerMessage = "";

        for (var i = 0; i < numberOfReceived && i < Number(MAX_HISTORY_LENGTH); i += 1) {
            listingAnswerMessage += inboxChatFormatter(orders[i], i) ;
        }
        if (numberOfReceived === 0) {
            answerMessage = `Sorry @${user}, you do not have any pending item in your inbox.`;
        } else {
            answerMessage = `Hey @${user}, you have ${numberOfReceived} file transfers pending in your inbox.\n`;
        }
        answerMessage = answerMessage + listingAnswerMessage;

        bot.sendMessage(chatId, answerMessage);
    } else {
        bot.sendMessage(chatId, `Hey @${user}, There is something wrong. Please try again\n`);
    }

});

// get all received files from Ace
bot.onText(/\/history/, async (msg, match) => {
    if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username);
    const chatId = msg.chat.id;
    const user = msg.from.username;

    var orders = await history(user);

    if (orders) {

        const numberOfReceived = orders.length;
        var answerMessage = "";
        numberOfReceived === 0 ?
            (answerMessage = `Sorry @${user}, you haven't received any files yet.`) :
            (answerMessage = `Hey @${user}, here is your file history.\n`);


        var answerMessage = "";
        var listingAnswerMessage = "";

        for (var i = 0; i < numberOfReceived && i < Number(process.env.MAX_HISTORY_LENGTH); i += 1) {
            //listingAnswerMessage += `\n${i + 1}. \nFrom: ${orders[i].from}\nPrice: RLC ${orders[i].price}\nStatus: ${orders[i].status}\n`
            console.log("orders[i]", orders[i]);
            listingAnswerMessage += inboxChatFormatter(orders[i], i) ;
        }
        if (numberOfReceived === 0) {
            answerMessage = `Sorry @${user}, you do not have any file in your inbox.`;
        } else {
            answerMessage = `Hey @${user}, you have ${numberOfReceived} file in your inbox history.\n`;
        }
        answerMessage += listingAnswerMessage;

        if (DEBUG) console.log(answerMessage);
        bot.sendMessage(chatId, answerMessage);
    } else {
        bot.sendMessage(chatId, `Hey @${user}, There is something wrong. Please try again\n`);
    }

});

bot.onText(/\/commands/, (msg, match) => {
    if (DEBUG || DEBUG_BOT) console.log(process.pid, "- Bot received", msg.text, "chatid", msg.from.username);
    const chatId = msg.chat.id;
    const user = msg.from.username;
    commands(bot, chatId, user);
});

/////////////////////////////////
///////// API ENDPOINTS /////////
/////////////////////////////////

// hello world
app.get("/", (req, res) => {
    res.json({ message: "Hello from server!" });
});

app.get("/background", (req, res) => {
    res.json(backgroundProvider.getCurrentBackground());
});


// for fetching users
//app.get("/users", (req, res) => {
//    User.find({}).exec((err, users) => {
//        err ? res.send("Error occured") : res.json(users);
//    });
//});

const fetchData = async (isFirst) => {

    isFirst = undefined === isFirst ? false : isFirst;

    setTimeout(async () => {

        var processedTgIds = [];
        var data = null;
        const users = await User.find();

        if (users && users.length > 0) {
            users.forEach(async (usr) => {

                try {
                    var oldOrders = usr.orders;
                    var chatid = usr.chat_id;
                    const telegramId = usr.telegram_id;
                    const walletAddress = usr.wallet_address;
                    if (DEBUG) console.log(process.pid, "- usr", usr, "walletAddress", walletAddress, "telegramId", telegramId, "chatid", chatid);

                    // Safeguard, let's not process it if the TG is added multiple times
                    //if (processedTgIds.indexOf[telegramId] > -1) return;

                    processedTgIds.push(telegramId);

                    var orders = await pending(telegramId);

                    if (DEBUG) console.log(undefined != orders && null != orders ? orders.length : 0, "orders for ", walletAddress);

                    try {
                        if (undefined != orders && orders) {
                            const newOrders = orders.length;
                            if (DEBUG) console.log(process.pid, "- Number of orders new:", newOrders, "old:", oldOrders);
                            if (newOrders !== oldOrders) {
                                if (newOrders > oldOrders && false == isFirst) {
                                    bot.sendMessage(
                                        chatid,
                                        `Good news @${telegramId}, you have received a new file ready to be downloaded on Ace-FT! Enter /pending to see what you received.`
                                    );
                                }
                                usr.orders = newOrders;
                                await usr.save();
                            }
                        }
                        else {
                            usr.orders = 0;
                            await usr.save();
                        }
                    }
                    catch (excep) {
                        console.log(excep);
                    }


                } catch (exc) {
                    console.log(exc);
                }

            });
        }

        await fetchData(false);
    }, FETCHING_DATA_INTERVAL)
};


process.on('uncaughtException', function (err) {
    console.error(process.pid, '- Caught exception unhandled exception: ', err);
});

process.on('unhandledRejection', function (error, p) {
    console.error(process.pid, "- \x1b[31m", "Error: ", error.message, "\x1b[0m");
});

/*
(async ()=>{
    await main();
    const users =  await User.find();
    console.log(users) ;
    
})();

return ;  */

const server = app.listen(process.env.PORT || 5001, async () => {
    console.log("🚀 app is running on port ", process.env.PORT || 5001);
    console.log("Running on process id", process.pid);
    console.log("LOGLEVEL:", process.env.LOGLEVEL, "DEBUG", DEBUG);
    console.log("LOGLEVEL_BOT:", process.env.LOGLEVEL_BOT, "DEBUG_BOT", DEBUG_BOT);
    console.log("LOG_LEVEL_BACKGROUNDPROVIDER:", process.env.LOG_LEVEL_BACKGROUNDPROVIDER, "DEBUG_BACKGROUNDPROVIDER", DEBUG_BACKGROUNDPROVIDER);
    console.log("TELEGRAM_TOKEN:", process.env.TELEGRAM_TOKEN)

    //await init();
    await main();
    await fetchData(true);

});