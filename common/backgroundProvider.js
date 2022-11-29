const { UNSPLASH_API_KEY } = process.env;
const { BACKGROUND_DISPLAY_MINUTES, BACKGROUND_FETCH_INTERVAL_MINUTES,BACKGROUND_TOPICS } = process.env;


var bgArray = null;
var currentBg = null;
var lastRenewTime = new Date(1999, 11, 16);
var lastApiCall = new Date(1999, 11, 16);
const topics = BACKGROUND_TOPICS.split(',') ; 


const providerUrl = `https://api.unsplash.com/photos/random?query=_QUERY_&count=6&client_id=${UNSPLASH_API_KEY}`


const fetchNew = () => {

    const fetch = require('node-fetch');
    const elapsedMinutes = getElapsedMinutes(lastApiCall);

    if (elapsedMinutes > Number(BACKGROUND_FETCH_INTERVAL_MINUTES)) {
        let queryUrl = providerUrl.replace("_QUERY_", topics[ Math.floor(Math.random() * topics.length) ]  ) ; 
        lastApiCall = new Date();
        console.log("fetching from unsplash", queryUrl);

        let settings = { method: "Get" };

        fetch(queryUrl, settings)
            .then(res => {
                try {
                    return res.json()
                }
                catch (f) {
                    console.log("ERROR");
                    bgArray=[{
                        "id": "aUPoSbfWmr8",
                        "created_at": "2021-06-12T19:10:28Z",
                        "updated_at": "2022-11-28T05:18:37Z",
                        "promoted_at": "2021-06-13T08:30:02Z",
                        "width": 5127,
                        "height": 2881,
                        "color": "#d9f3f3",
                        "blur_hash": "L-L=2txFkCj[?wofoJayM{ayayj[",
                        "description": "Clean energy with wind turbine along the beach",
                        "alt_description": null,
                        "urls": {
                            "raw": "https://images.unsplash.com/photo-1623524137892-4add9afb3c78?ixid=MnwzNzMyNjF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2Njk2NTg2ODA&ixlib=rb-4.0.3",
                            "full": "https://images.unsplash.com/photo-1623524137892-4add9afb3c78?crop=entropy&cs=tinysrgb&fm=jpg&ixid=MnwzNzMyNjF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2Njk2NTg2ODA&ixlib=rb-4.0.3&q=80",
                            "regular": "https://images.unsplash.com/photo-1623524137892-4add9afb3c78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzMyNjF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2Njk2NTg2ODA&ixlib=rb-4.0.3&q=80&w=1080",
                            "small": "https://images.unsplash.com/photo-1623524137892-4add9afb3c78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzMyNjF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2Njk2NTg2ODA&ixlib=rb-4.0.3&q=80&w=400",
                            "thumb": "https://images.unsplash.com/photo-1623524137892-4add9afb3c78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzMyNjF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2Njk2NTg2ODA&ixlib=rb-4.0.3&q=80&w=200",
                            "small_s3": "https://s3.us-west-2.amazonaws.com/images.unsplash.com/small/photo-1623524137892-4add9afb3c78"
                        },
                        "links": {
                            "self": "https://api.unsplash.com/photos/aUPoSbfWmr8",
                            "html": "https://unsplash.com/photos/aUPoSbfWmr8",
                            "download": "https://unsplash.com/photos/aUPoSbfWmr8/download?ixid=MnwzNzMyNjF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2Njk2NTg2ODA",
                            "download_location": "https://api.unsplash.com/photos/aUPoSbfWmr8/download?ixid=MnwzNzMyNjF8MHwxfHJhbmRvbXx8fHx8fHx8fDE2Njk2NTg2ODA"
                        },
                        "likes": 34,
                        "liked_by_user": false,
                        "current_user_collections": [],
                        "sponsorship": null,
                        "topic_submissions": {},
                        "user": {
                            "id": "afqfm5YNbok",
                            "updated_at": "2022-11-25T07:01:05Z",
                            "username": "phcsantos",
                            "name": "Pedro Henrique Santos",
                            "first_name": "Pedro Henrique",
                            "last_name": "Santos",
                            "twitter_username": null,
                            "portfolio_url": null,
                            "bio": null,
                            "location": null,
                            "links": {
                                "self": "https://api.unsplash.com/users/phcsantos",
                                "html": "https://unsplash.com/ja/@phcsantos",
                                "photos": "https://api.unsplash.com/users/phcsantos/photos",
                                "likes": "https://api.unsplash.com/users/phcsantos/likes",
                                "portfolio": "https://api.unsplash.com/users/phcsantos/portfolio",
                                "following": "https://api.unsplash.com/users/phcsantos/following",
                                "followers": "https://api.unsplash.com/users/phcsantos/followers"
                            },
                            "profile_image": {
                                "small": "https://images.unsplash.com/profile-fb-1456966864-b9d8545409cc.jpg?ixlib=rb-4.0.3&crop=faces&fit=crop&w=32&h=32",
                                "medium": "https://images.unsplash.com/profile-fb-1456966864-b9d8545409cc.jpg?ixlib=rb-4.0.3&crop=faces&fit=crop&w=64&h=64",
                                "large": "https://images.unsplash.com/profile-fb-1456966864-b9d8545409cc.jpg?ixlib=rb-4.0.3&crop=faces&fit=crop&w=128&h=128"
                            },
                            "instagram_username": "phcsantos",
                            "total_collections": 0,
                            "total_likes": 7,
                            "total_photos": 40,
                            "accepted_tos": true,
                            "for_hire": false,
                            "social": {
                                "instagram_username": "phcsantos",
                                "portfolio_url": null,
                                "twitter_username": null,
                                "paypal_email": null
                            }
                        },
                        "exif": {
                            "make": "DJI",
                            "model": "FC6310",
                            "name": "DJI, FC6310",
                            "exposure_time": "1/320",
                            "aperture": "5.6",
                            "focal_length": "8.8",
                            "iso": 100
                        },
                        "location": {
                            "name": "Beberibe, CE, Brasil",
                            "city": "Beberibe",
                            "country": "Brasil",
                            "position": {
                                "latitude": -4.182879,
                                "longitude": -38.130036
                            }
                        },
                        "views": 392145,
                        "downloads": 3471
                    }]
                }
            }
            ).then((json) => {
                console.log("Received from unsplash json", json) ; 
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

    if ((!currentBg || elapsedMinutes > Number(BACKGROUND_DISPLAY_MINUTES)) && bgArray.length > 0) {
        lastRenewTime = new Date();
        currentBg = bgArray.shift();
        console.log(bgArray.length, "images cached. Now service image for creative mode:",currentBg.id,  currentBg.description, currentBg.urls.full) ;
    }

    if (bgArray.length == 0 || !currentBg) {
        fetchNew();
    }

    return currentBg;
}

fetchNew();

setInterval(fetchNew, 10 * 60 * 1000) ,



module.exports = { getCurrentBackground };
