require("dotenv").config();
const gql = require("graphql-tag");
const ApolloClient = require("apollo-client").ApolloClient;
const fetch = require("node-fetch");
const createHttpLink = require("apollo-link-http").createHttpLink;
const setContext = require("apollo-link-context").setContext;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");
const dataQuery = require("../common/dataQuery");
const DEBUG = process.env.LOGLEVEL_THEGRAPH == "debug";

const linkConfig = {
    uri: process.env.API_URL,
    fetch: fetch,
}

const httpLink = createHttpLink(linkConfig);

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
const pending = async(user) => {

    const userSubscription = await User.findOne({ telegram_id: user }).exec();
    const walletAddress = userSubscription.wallet_address;

    if (DEBUG) console.log("userSubscription", userSubscription, "WA", walletAddress);

    if (walletAddress) {
        const query = dataQuery.queryAsk(walletAddress);
        if (DEBUG) console.log(process.pid, "- The graph inbox query. user:", walletAddress , "query:", query);

        const res = client
            .query({
                query: gql(query),
            })
            .then(async(data) => {

                if (data && data.data && data.data.datasets) {
                    let pendingItems = dataQuery.mapInboxOrders(walletAddress, data.data.datasets,false);
                    return pendingItems;
                }
                else
                {
                    if (DEBUG) console.log(process.pid, "- No inbox data found. user:", walletAddress);
                }
            })
            .catch((err) => {
                console.error(process.pid, "- Error data fetching", err);
            });

        return res;
    }

    return null;

};

module.exports = pending;