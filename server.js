require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const User = require("./models/user");
const TelegramBot = require("node-telegram-bot-api");

const wallet = require("./commands/wallet");
const welcome = require("./commands/welcome");
const ace = require("./commands/ace");
const inbox = require("./commands/inbox.js");

const { TELEGRAM_TOKEN, SERVER_URL, MONGO_URL } = process.env;
const TELEGRAM_API_ENDPOINT = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const URI = `/webhook/${TELEGRAM_TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;
const FETCHING_DATA_INTERVAL = 60000 // in ms

// Initialising app
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Initialising NoSQL DB
const client = new MongoClient(MONGO_URL);

const main = async () => {
  //   await client.connect();
  //   console.log("Connexion OK ✅");
  //   const db = client.db("Ace");
  //   const collection = db.collections("Users");
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
  console.log(res.data);
};

// reaction on receiving message without command
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from.username;
  const content = msg.text;
  console.log("Received message", content);
  if (msg.text[0] !== "/") {
    bot.sendMessage(
      chatId,
      `@${user}, I do not understand your message. Please use / and use one of my commands.`
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

  ace(bot, chatId, user);
});

// get all pending to download files from Ace
bot.onText(/\/inbox/, async (msg, match) => {
  const chatId = msg.chat.id;
  const user = msg.from.username;

  var orders = await inbox(user);
  //console.log("Orders\n", orders);
  const numberOfReceived = orders.length;
  console.log("Number of orders", numberOfReceived);

  var answerMessage = "";
  var listingAnswerMessage = "";
  var ordersInInbox = 0;
  for (var i = 0; i < numberOfReceived; i += 1) {
    const dataset = orders[i];
    console.log("dataset\n", dataset);
    var owner = "";
    var dealStatus = "";
    var name = "";
    var price = "";

    if (
      !(
        dataset.deals &&
        dataset.deals[0] &&
        dataset.deals[0].tasks &&
        dataset.deals[0].tasks[0] &&
        dataset.deals[0].tasks[0].status === "COMPLETED"
      )
    ) {
      ordersInInbox += 1;
      if (
        dataset.dataset &&
        dataset.dataset.owner &&
        dataset.dataset.owner.id
      ) {
        owner = dataset.dataset.owner.id;
        console.log("owner", owner);
      }
      if (dataset.dataset && dataset.dataset.name) {
        name = dataset.dataset.name;
        console.log("name", name);
      }
      if (dataset.datasetprice) {
        price = dataset.datasetprice;
        console.log("price", price);
      }
      dealStatus = dataset.deals[0].tasks[0].status;
      console.log("tasks status \n", dealStatus);

      listingAnswerMessage =
        listingAnswerMessage +
        `\n${i + 1}. ${name}\nFrom: ${owner}\nPrice: RLC ${price}\nStatus: ${dealStatus}\n`;
    }
  }

  if (numberOfReceived === 0 || ordersInInbox === 0) {
    answerMessage = `Sorry @${user}, you do not have any file in your inbox.`;
  } else {
    answerMessage = `Hey @${user}, you have ${ordersInInbox} files in your inbox.\n`;
  }
  answerMessage = answerMessage + listingAnswerMessage;

  console.log(answerMessage);
  bot.sendMessage(chatId, answerMessage);
});

// get all received files from Ace
bot.onText(/\/history/, async (msg, match) => {
  const chatId = msg.chat.id;
  const user = msg.from.username;

  var orders = await inbox(user);
  //console.log("Orders \n", orders);
  const numberOfReceived = orders.length;
  console.log("Number of orders", numberOfReceived);
  var answerMessage = "";
  numberOfReceived === 0
    ? (answerMessage = `Sorry @${user}, you haven't received any files yet.`)
    : (answerMessage = `Hey @${user}, here is your file history.\n`);

  for (var i = 0; i < numberOfReceived; i += 1) {
    const dataset = orders[i];
    var owner = "";
    var dealStatus = "";
    var name = "";
    var price = "";
    if (dataset.dataset && dataset.dataset.owner && dataset.dataset.owner.id) {
      owner = dataset.dataset.owner.id;
      console.log("owner", owner);
    }
    if (dataset.dataset && dataset.dataset.name) {
      name = dataset.dataset.name;
      console.log("name", name);
    }
    if (dataset.datasetprice) {
      price = dataset.datasetprice;
      console.log("price", price);
    }
    if (
      dataset.deals &&
      dataset.deals[0] &&
      dataset.deals[0].tasks &&
      dataset.deals[0].tasks[0]
    ) {
      dealStatus = dataset.deals[0].tasks[0].status;
      console.log("tasks status \n", dealStatus);
    }
    answerMessage =
      answerMessage +
      `\n${
        i + 1
      }. ${name}\nFrom: ${owner}\nPrice: RLC ${price}\nStatus: ${dealStatus}\n`;
  }

  console.log(answerMessage);
  bot.sendMessage(chatId, answerMessage);
});

/////////////////////////////////
///////// API ENDPOINTS /////////
/////////////////////////////////

// hello world
app.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// for fetching users
app.get("/users", (req, res) => {
  User.find({}).exec((err, users) => {
    err ? res.send("Error occured") : res.json(users);
  });
});

const fetchData = async () => {
  setTimeout(async () => {
    var data = null;
    const users = await User.find();
    console.log("length", users.length);
    users.forEach(async (usr) => {
      var oldOrders = usr.orders;
      var chatid = usr.chat_id;
      const telegramId = usr.telegram_id;
      const walletAddress = usr.wallet_address;
      console.log(usr);
      console.log(walletAddress);
      console.log(telegramId);
      console.log(chatid);
  
      var orders = await inbox(telegramId);
      //console.log("Orders\n", orders);
      const newOrders = orders.length;
      console.log("New Number of orders", newOrders);
      console.log("Old number of orders", oldOrders);
      if (newOrders !== oldOrders) {
        if (newOrders > oldOrders) {
          bot.sendMessage(
            chatid,
            `Good news ${telegramId}, you have received a new file ready to be downloaded on Ace-FT! Enter /inbox to see what you received.`
          );
        }
        usr.orders = newOrders;
        await usr.save();
      }
      console.log("\n");
    });

    await fetchData()
  }, FETCHING_DATA_INTERVAL)
};

const server = app.listen(process.env.PORT || 5001, async () => {
  console.log("🚀 app is running on port ", process.env.PORT || 5001);
  console.log("Running on process id", process.pid);
  await init();
  await main();
  await fetchData();

});