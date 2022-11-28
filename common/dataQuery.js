require("dotenv").config();
const crypto = require("crypto-browserify");
const { IExec, utils } = require('iexec');

const { APP_ADDRESS, PRIVATE_KEY, TEE_TAG } = process.env;

const ethProvider = utils.getSignerFromPrivateKey(
  'https://bellecour.iex.ec', // blockchain node URL
  PRIVATE_KEY,
);
const iexec = new IExec({
  ethProvider,
});



function generateDatasetNameLookup(requester) {
    let str = `${APP_ADDRESS}${requester}`.toLowerCase();
    return crypto.createHash('sha256').update(str).digest('hex');
}

async function mapInboxOrders(walletAddress, datasets, isHistory) {

    console.log("mapInboxOrders", walletAddress, "datasets.length", datasets.length ) ; 

    isHistory = isHistory ? isHistory : false ; 
    let mapped = await Promise.all(datasets.map(async (item) => {

        var inboxItem = {
            "id": item.id,
            "name": item.name,
            "from": item.owner.id,
            "to": "",
            "status": "",
            "sendDate": "",
            "orderHash": "",
            "price": 0,
            "downloadDate": "",
            "taskid": "",
            "dealid": ""
        };

        var options = {
            app: APP_ADDRESS,
            requester: walletAddress,
            minTag: TEE_TAG,
            maxTag: TEE_TAG
        };

        var orderBook = await iexec.orderbook.fetchDatasetOrderbook(
            item.id, options
        );


        if (orderBook && orderBook.orders.length > 0) {
            console.log("ORDER BOOK", JSON.stringify(orderBook, null, 2));
            inboxItem.status = orderBook.orders[0].status;
            inboxItem.to = orderBook.orders[0].order.requesterrestrict;
            inboxItem.orderHash = orderBook.orders[0].orderHash;
            inboxItem.sendDate = new Date(orderBook.orders[0].publicationTimestamp);
            inboxItem.price = orderBook.orders[0].order.datasetprice;
            inboxItem.tag = orderBook.orders[0].order.tag;
            inboxItem.workerpoolrestrict = orderBook.orders[0].order.workerpoolrestrict;


            if (item.orders &&
                item.orders.length > 0 &&
                item.orders[0].deals &&
                item.orders[0].deals.length > 0
            ) {

                if (!isHistory) {
                  console.log("Ignored this dataset ", item.id) ;
                  return null;
                }

                inboxItem.dealid = item.orders[0].deals[0].id;
                inboxItem.downloadDate = new Date(Number(item.orders[0].deals[0].startTime) * 1000);
                inboxItem.status = "ACTIVE";

                if (item.orders[0].deals[0].tasks && item.orders[0].deals[0].tasks.length > 0) {
                    inboxItem.status = item.orders[0].deals[0].tasks[0].status;
                    inboxItem.taskid = item.orders[0].deals[0].tasks[0].id;
                }

            }

            return inboxItem
        }

    }));

    mapped = mapped.filter((item) => {
        return null != item && item.to && item.to.toLowerCase() === walletAddress.toLowerCase();
    })

    return mapped;
}

const queryAsk = (requester) => {


    const datasetNameLookup = generateDatasetNameLookup(requester);

    const query = `
    {
      datasets(
        where: {name_contains: "${datasetNameLookup}"}
      ) {
        id
        name
        owner {
          id
        }
        orders {
          id
          deals {
            id
            startTime
            tasks(first: 1) {
              id,
              status
            }
          }
        }
      }
    }`;


    return query;

};


module.exports = { queryAsk, mapInboxOrders };