const defaultBackgrounds = require("./defaultBackgrounds.js") ; 

const { UNSPLASH_API_KEY } = process.env;
const { BACKGROUND_DISPLAY_MINUTES, BACKGROUND_FETCH_INTERVAL_MINUTES, BACKGROUND_TOPICS } = process.env;


var bgArray = null;
var currentBg = null;
var lastRenewTime = new Date(1999, 11, 16);
var lastApiCall = new Date(1999, 11, 16);
const topics = BACKGROUND_TOPICS.split(',');


const providerUrl = `https://api.unsplash.com/photos/random?query=_QUERY_&count=6&client_id=${UNSPLASH_API_KEY}`


const fetchNew = () => {

    const fetch = require('node-fetch');
    const elapsedMinutes = getElapsedMinutes(lastApiCall);

    if (elapsedMinutes > Number(BACKGROUND_FETCH_INTERVAL_MINUTES)) {
        let queryUrl = providerUrl.replace("_QUERY_", topics[Math.floor(Math.random() * topics.length)]);
        lastApiCall = new Date();
        console.log("fetching from unsplash", queryUrl);

        let settings = { method: "Get" };

        fetch(queryUrl, settings)
            .then(res => {
                try {
                    let ret = res.json() ;
                    console.log("AA - Received from unsplash json", ret);
                    return ret;
                }
                catch (f) {
                    console.log("ERROR", f, "using default image list");
                    return defaultBackgrounds.list ;
                    // bgArray = defaultBackgrounds.list ;
                }
            }
            ).then((json) => {
                console.log("BB - setting bgArray ", json);
                bgArray = json;
            });
    }
    else {
        console.log("I will not call unsplash yet");
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

    currentBg = null == currentBg ? defaultBackgrounds.list[0] : currentBg ; 

    try {
        if ((!currentBg || elapsedMinutes > Number(BACKGROUND_DISPLAY_MINUTES)) && bgArray.length > 0) {
            lastRenewTime = new Date();
            currentBg = bgArray.shift();
            console.log(bgArray.length, "images cached. Now service image for creative mode:", currentBg.id, currentBg.description, currentBg.urls.full);
        }

        if (bgArray.length == 0 || !currentBg) {
            fetchNew();
        }
    }
    catch (exc) {
        console.log("exc", exc);
    }

    return currentBg;
}

fetchNew();

setInterval(fetchNew, 15 * 60 * 1000),


module.exports = { getCurrentBackground };
