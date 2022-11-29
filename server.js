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

const wallet = require("./commands/wallet");
const welcome = require("./commands/welcome");
const ace = require("./commands/ace");
const inbox = require("./commands/inbox.js");
const commands = require("./commands/commands.js")

const { TELEGRAM_TOKEN, SERVER_URL, MONGO_URL, MAX_HISTORY_LENGTH } = process.env;
const TELEGRAM_API_ENDPOINT = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const URI = `/webhook/${TELEGRAM_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;
const FETCHING_DATA_INTERVAL = 30000 // in ms
const DEBUG = process.env.LOGLEVEL=="debug";

// Initialising app
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Initialising NoSQL DB
const client = new MongoClient(MONGO_URL);

const main = async () => {
    await mongoose.connect(MONGO_URL);
    console.log("Connexion OK ✅");
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
    const chatId = msg.chat.id;
    const user = msg.from.username;
    const content = msg.text;
    if (msg.text[0] !== "/") {
        bot.sendMessage(
            chatId,
            `@${user}, I do not understand your message "${msg.text}". Please use / and use one of my commands.`
        );
    }
});

//////////////////////////////////
//////////// COMMANDS ////////////
//////////////////////////////////

// echo command
bot.onText(/\/echo (.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    bot.sendMessage(chatId, resp);
});

// to begin interaction
bot.onText(/\/start/, (msg, match) => {
    const chatId = msg.chat.id;
    const user = msg.from.username;

    welcome(bot, chatId, user);
});

// to see address linked to the user's account
bot.onText(/\/wallet/, (msg, match) => {
    const chatId = msg.chat.id;
    const user = msg.from.username;

    wallet(bot, chatId, user);
});

// to wallet address to database when sending /ace command
bot.onText(/\/ace/, (msg, match) => {
    const chatId = msg.chat.id;
    const user = msg.from.username;
    ace(bot, chatId, user, msg);
});

// get all pending to download files from Ace
bot.onText(/\/inbox/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = msg.from.username;

    var orders = await inbox(user);

    if (orders) {
        const numberOfReceived = orders.length;

        var answerMessage = "";
        var listingAnswerMessage = "";

        for (var i = 0; i < numberOfReceived && i < Number(MAX_HISTORY_LENGTH); i += 1) {
            listingAnswerMessage += `\n${i + 1}. \nFrom: ${orders[i].from}\nPrice: RLC ${orders[i].price}\nStatus: ${orders[i].status}\n`
        }
        if (numberOfReceived === 0) {
            answerMessage = `Sorry @${user}, you do not have any file in your inbox.`;
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
    const chatId = msg.chat.id;
    const user = msg.from.username;

    var orders = await inbox(user);

    if (orders) {

        const numberOfReceived = orders.length;
        var answerMessage = "";
        numberOfReceived === 0 ?
            (answerMessage = `Sorry @${user}, you haven't received any files yet.`) :
            (answerMessage = `Hey @${user}, here is your file history.\n`);


        var answerMessage = "";
        var listingAnswerMessage = "";

        for (var i = 0; i < numberOfReceived && i < Number(process.env.MAX_HISTORY_LENGTH); i += 1) {
            listingAnswerMessage += `\n${i + 1}. \nFrom: ${orders[i].from}\nPrice: RLC ${orders[i].price}\nStatus: ${orders[i].status}\n`
        }
        if (numberOfReceived === 0) {
            answerMessage = `Sorry @${user}, you do not have any file in your inbox.`;
        } else {
            answerMessage = `Hey @${user}, you have ${numberOfReceived} file transfers pending in your inbox.\n`;
        }
        answerMessage += listingAnswerMessage;

        if (DEBUG) console.log(answerMessage);
        bot.sendMessage(chatId, answerMessage);
    } else {
        bot.sendMessage(chatId, `Hey @${user}, There is something wrong. Please try again\n`);
    }

});

bot.onText(/\/commands/, (msg, match) => {
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
app.get("/users", (req, res) => {
    User.find({}).exec((err, users) => {
        err ? res.send("Error occured") : res.json(users);
    });
});

const fetchData = async () => {

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
                    if (DEBUG) console.log("usr", usr, "walletAddress", walletAddress, "telegramId", telegramId, "chatid", chatid);

                    // Safeguard, let's not process it if the TG is added multiple times
                    //if (processedTgIds.indexOf[telegramId] > -1) return;

                    processedTgIds.push(telegramId);

                    var orders = await inbox(telegramId);
                    
                    if (DEBUG) console.log(undefined != orders && null != orders ? orders.length: 0, "orders for ", walletAddress);

                    try {
                        if (undefined !=orders && orders) {
                            const newOrders = orders.length;
                            if (DEBUG) console.log("Number of orders new:", newOrders, "old:", oldOrders);
                            if (newOrders !== oldOrders) {
                                if (newOrders > oldOrders) {
                                    bot.sendMessage(
                                        chatid,
                                        `Good news @${telegramId}, you have received a new file ready to be downloaded on Ace-FT! Enter /inbox to see what you received.`
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

        await fetchData()
    }, FETCHING_DATA_INTERVAL)
};

process.on('uncaughtException', function(err) {
    console.log('Caught exception unhandled exception: ' + err);
    console.error(err) ;
});


const server = app.listen(process.env.PORT || 5001, async () => {
    console.log("🚀 app is running on port ", process.env.PORT || 5001);
    console.log("Running on process id", process.pid);
    //await init();
    await main();
    await fetchData();

});