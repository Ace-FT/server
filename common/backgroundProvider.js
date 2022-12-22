const defaultBackgrounds = require("./defaultBackgrounds.js");

const { UNSPLASH_API_KEY } = process.env;
const { BACKGROUND_DISPLAY_MINUTES, BACKGROUND_FETCH_INTERVAL_MINUTES, BACKGROUND_TOPICS } = process.env;
const DEBUG = process.env.LOG_LEVEL_BACKGROUNDPROVIDER == "debug";
const MIN_WIDTH = parseInt(process.env.MIN_WIDTH, 10);
const MIN_HEIGHT = parseInt(process.env.MIN_HEIGHT, 10);


var bgArray = []; //defaultBackgrounds.list;
var currentBg = null;
var lastRenewTime = new Date(1999, 11, 16);
var lastApiCall = new Date(1999, 11, 16);
const topics = BACKGROUND_TOPICS.split(',');


const providerUrl = `https://api.unsplash.com/photos/random?query=_QUERY_&count=10&orientation=landscape&client_id=${UNSPLASH_API_KEY}`


const fetchNew = () => {

    if (bgArray && bgArray.length > 50) { if (DEBUG) console.log(process.pid, "- Not feteching from unsplash, there are enough items in cache", bgArray.length); return; }


    const fetch = require('node-fetch');
    const elapsedMinutes = getElapsedMinutes(lastApiCall);

    if (elapsedMinutes > Number(BACKGROUND_FETCH_INTERVAL_MINUTES)) {
        let queryUrl = providerUrl.replace("_QUERY_", topics[Math.floor(Math.random() * topics.length)]);
        lastApiCall = new Date();
        if (DEBUG) console.log(process.pid, "- fetching from unsplash", queryUrl);

        let settings = { method: "Get" };

        fetch(queryUrl, settings)
            .then(res => {
                try {
                    let ret = res.json();
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
                if (DEBUG) console.log(process.pid, "- setting bgArray with ", json.length, "items");

                const filtered = json.filter(image => {
                    const keep = image.width >= MIN_WIDTH && image.height >= MIN_HEIGHT;
                    if (!keep) {
                        if (DEBUG) console.log(process.pid, "- Excluded image. Not matching criteria", image.id, "w:", image.width, "h:",image.height, "url", image.links.html, )  ;
                    }
                    return keep;
                });

                var unique = [];
                if (filtered.length > 0) {
                    filtered.forEach(receivedImage => {
                        const existing = bgArray.find(cachedImage => { return cachedImage.id === receivedImage.id });
                        if (undefined == existing) {
                            unique.push(receivedImage);
                        }
                        else {
                            console.log(process.pid, "- Image already cached. image id", receivedImage.id, "url", receivedImage.links.html)
                        }
                    });
                    bgArray = bgArray ? bgArray.concat(unique) : unique;
                }
                else
                {
                    console.log(process.pid, "- No image kept from last fetch") ; 
                }

                // shuffle items
                bgArray = bgArray.sort((a, b) => 0.5 - Math.random());
            });
    }
    else {
        if (DEBUG) console.log(`${process.pid} - I will not call unsplash yet. elapsedMinutes ${elapsedMinutes} | Fetch Interval ${BACKGROUND_FETCH_INTERVAL_MINUTES} | Cache size ${bgArray.length}`);
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
            if (DEBUG) console.log(process.pid, "-", bgArray.length, "images cached. Now service image for creative mode:", currentBg.id, currentBg.description, currentBg.urls.full);
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

setInterval(fetchNew, 10 * 60 * 1000),

module.exports = { getCurrentBackground };
