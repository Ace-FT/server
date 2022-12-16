const defaultBackgrounds = require("./defaultBackgrounds.js");

const { UNSPLASH_API_KEY } = process.env;
const { BACKGROUND_DISPLAY_MINUTES, BACKGROUND_FETCH_INTERVAL_MINUTES, BACKGROUND_TOPICS } = process.env;
const DEBUG = process.env.LOGLEVEL == "debug";


var bgArray = []; //defaultBackgrounds.list;
var currentBg = null;
var lastRenewTime = new Date(1999, 11, 16);
var lastApiCall = new Date(1999, 11, 16);
const topics = BACKGROUND_TOPICS.split(',');


const providerUrl = `https://api.unsplash.com/photos/random?query=_QUERY_&count=3&client_id=${UNSPLASH_API_KEY}`


const fetchNew = () => {

    if (bgArray && bgArray.length > 20) { if (DEBUG) console.log("Not feteching from unsspash, there are enough items in cache", bgArray.length); return ; }


    const fetch = require('node-fetch');
    const elapsedMinutes = getElapsedMinutes(lastApiCall);

    if (elapsedMinutes > Number(BACKGROUND_FETCH_INTERVAL_MINUTES)) {
        let queryUrl = providerUrl.replace("_QUERY_", topics[Math.floor(Math.random() * topics.length)]);
        lastApiCall = new Date();
        if (DEBUG) console.log("fetching from unsplash", queryUrl);

        let settings = { method: "Get" };

        fetch(queryUrl, settings)
            .then(res => {
                try {
                    let ret = res.json();
                    if (DEBUG) console.log("AA - Received from unsplash json", ret);
                    return ret;
                }
                catch (f) {
                    console.log("ERROR", f, "using default image list");
                    console.error(f);
                    return defaultBackgrounds.list;
                    // bgArray = defaultBackgrounds.list ;
                }
            }
            ).then((json) => {
                if (DEBUG) console.log("BB - setting bgArray ", json);
                bgArray =  bgArray ? bgArray.concat(json) : json;

                // shuffle items
                bgArray = bgArray.sort((a, b) => 0.5 - Math.random());
            });
    }
    else {
        if (DEBUG) console.log("I will not call unsplash yet. elapsedMinutes", elapsedMinutes, " BACKGROUND_FETCH_INTERVAL_MINUTES", BACKGROUND_FETCH_INTERVAL_MINUTES);
    }
}

function getElapsedMinutes(dt) {
    now = new Date();
    var timeDiff = now - dt; //in ms
    timeDiff /= 1000;
    var seconds = Math.round(timeDiff);
    return seconds / 60.0;
}


function getCurrentBackground() {

    const elapsedMinutes = getElapsedMinutes(lastRenewTime);

    currentBg = null == currentBg ? defaultBackgrounds.list[0] : currentBg;

    try {

        bgArray = undefined == bgArray || null == bgArray ? defaultBackgrounds.list : bgArray;

        if ((!currentBg || elapsedMinutes > Number(BACKGROUND_DISPLAY_MINUTES)) && bgArray.length > 0) {
            lastRenewTime = new Date();
            currentBg = bgArray.shift();
            if (DEBUG) console.log(bgArray.length, "images cached. Now service image for creative mode:", currentBg.id, currentBg.description, currentBg.urls.full);
        }

        if (bgArray.length == 0 || !currentBg) {
            fetchNew();
        }
    }
    catch (exc) {
        console.log("exc", exc);
        console.error(exc);
    }

    return currentBg;
}

fetchNew();

setInterval(fetchNew, 5 * 60 * 1000),


module.exports = { getCurrentBackground };
