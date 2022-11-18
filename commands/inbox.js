require("dotenv").config();
const gql = require("graphql-tag");
const ApolloClient = require("apollo-client").ApolloClient;
const fetch = require("node-fetch");
const createHttpLink = require("apollo-link-http").createHttpLink;
const setContext = require("apollo-link-context").setContext;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;

const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");

const httpLink = createHttpLink({
  uri: process.env.API_URL,
  fetch: fetch,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

const queryAsk = (requester) => {
  return `
    {
        datasetOrders(
              where: {apprestrict: "${process.env.APP_ADDRESS}", requesterrestrict: "${requester}"}
        ) {
            dataset {
              id
              owner {
                id
              }
              name
              timestamp
            }
            datasetprice
            deals {
              id
              tasks {
                id,
                status
              }
            }
      }
    }`;
};

/**
 * Returns the pending files at wallet address
 * @param {string | undefined} user
 */
const inbox = async (user) => {
  const data = await User.findOne({ telegram_id: user }).exec();
  //console.log(data);
  const walletAddress = data.wallet_address;
  const query = queryAsk(walletAddress);

  const res = client
    .query({
      query: gql(query),
    })
    .then(async (data) => {
      if (data && data.data && data.data.datasetOrders) {
        //console.log("\nDataset orders\n", data.data.datasetOrders);
        return data.data.datasetOrders;
      }
    })
    .catch((err) => {
      console.log("Error data fetching", err);
    });

  return res;
};

module.exports = inbox;
