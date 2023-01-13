require("dotenv").config();
const gql = require("graphql-tag");
const ApolloClient = require("apollo-client").ApolloClient;
const fetch = require("node-fetch");
const createHttpLink = require("apollo-link-http").createHttpLink;
const setContext = require("apollo-link-context").setContext;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");

const dataQuery = require("../common/dataQuery") ;

const httpLink = createHttpLink({
  uri: process.env.API_URL,
  fetch: fetch,
});


const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    }
  }
});


/**
 * Returns the pending files at wallet address
 * @param {string | undefined} user
 */
const history = async (user) => {

  const userSubscription = await User.findOne({ telegram_id: user }).exec();

  const walletAddress = userSubscription.wallet_address;

  if (walletAddress) {
    const query = dataQuery.queryAsk(walletAddress);
    const res = client
      .query({
        query: gql(query),
      })
      .then(async (data) => {

        if (data && data.data && data.data.datasets) {
          let pendingItems =  dataQuery.mapInboxOrders(walletAddress, data.data.datasets, true);
          return pendingItems;
        }
      })
      .catch((err) => {
        console.log("Error data fetching", err);
        console.error(err);
      });

    return res;
  }

  return null;

};

module.exports = history;
