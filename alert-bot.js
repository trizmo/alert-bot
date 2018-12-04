console.log("=ALERT-BOT STARTING=")
console.log("==============================================")

var alertList = require("./alertList.js");
let ready = false;
let priceFetchCounter = 0;
const Twitter = require('twitter');
const config = require('./config');
const Twit = new Twitter(config);
var https = require("https");
let triggered = 0;


// ###################
// ##### LOGGING #####

function everythingLog() {
  console.log(alertList)

  for (let i = 0; i < alertList.length; i++) {
    if (alertList[i].triggered === true) {
      triggered++
    }
  }

  console.log("triggered items: " + triggered)
}

// #######################################################
// ##### INITIALIZING ALERTLIST WITH CURRENT PRICE #######

function initializePriceing() {
  console.log("STARTING SERVER")
  console.log("initializing price")
  for (let i = 0; i < alertList.length; i++) {
    if (alertList[i].type === "stock") {

      const options = {
        hostname: "api.iextrading.com",
        port: 443,
        path: "/1.0/stock/" + alertList[i].symbol + "/price",
        method: "GET"
      }

      let price = ""
      req = https.get(options, function (res) {
        res.on("data", function (data) {
          priceFetchCounter++
          price += data;
          alertList[i].current = price

        })
        res.on("end", function () {

        })
      })
    } else if (alertList[i].type === "crypto") {
      let coinSym = alertList[i].symbol


      // let coinlist = [];
      // let coinlistST = coinlist.join(",")
      // console.log("coinlist to be sent: " + coinlistST)

      // for (i = 0; i < alertList.length; i++) {
      //   console.log(alertList[i].symbol);
      //   coinlist.push(alertList[i].symbol);
      // }

      const options = {
        hostname: "min-api.cryptocompare.com",
        port: 443,
        path: "/data/pricemulti?fsyms=" + alertList[i].symbol + "&tsyms=USD",
        method: "GET"
      }

      let cryptoPrice;
      let stringed = "";
      let toparse = ""
      let finalArray = [];
      req = https.get(options, function (res) {
        res.on("data", function (data) {
          toparse += data;
          console.log(toparse)
          cryptoPrice = JSON.parse(toparse);
          // console.log("coin price data...:");
          // console.log(cryptoPrice[coinSym].USD);
          // console.log(typeof (cryptoPrice[coinSym].USD))
          stringed = JSON.stringify(cryptoPrice[coinSym].USD)
          // console.log(alertList[i])
          alertList[i].current = cryptoPrice[coinSym].USD

        })
      })
    }
  }
  everythingLog()

}

// #######################################################
// ##### GETTING CURRENT PRICE #####


function getPricing() {
  // updateFirebase()
  for (let i = 0; i < alertList.length; i++) {
    if (alertList[i].type === "stock") {
      const options = {
        hostname: "api.iextrading.com",
        port: 443,
        path: "/1.0/stock/" + alertList[i].symbol + "/price",
        method: "GET"
      }
      let price = ""
      req = https.get(options, function (res) {
        res.on("data", function (data) {
          priceFetchCounter++
          price += data;
          alertList[i].current = price
        })
        res.on("end", function () {
        })
      })
    } else if (alertList[i].type === "crypto") {
      let coinSym = alertList[i].symbol


      // let coinlist = [];
      // let coinlistST = coinlist.join(",")
      // console.log("coinlist to be sent: " + coinlistST)

      // for (i = 0; i < alertList.length; i++) {
      //   console.log(alertList[i].symbol);
      //   coinlist.push(alertList[i].symbol);
      // }

      const options = {
        hostname: "min-api.cryptocompare.com",
        port: 443,
        path: "/data/pricemulti?fsyms=" + alertList[i].symbol + "&tsyms=USD",
        method: "GET"
      }

      let cryptoPrice;
      let stringed = "";
      let toparse = ""
      let finalArray = [];
      req = https.get(options, function (res) {
        res.on("data", function (data) {
          toparse += data;
          console.log(toparse)
          if (toparse.substring(0, 1) === "<") {
            console.log("ERROR TRIGGER: " + toparse.substring(0, 1))
            errorTweet()
          } else {
            // console.log("DATA GOOD: " + toparse.substring(0,1))

            cryptoPrice = JSON.parse(toparse);
            // console.log("coin price data...:");
            // console.log(cryptoPrice[coinSym].USD);
            // console.log(typeof (cryptoPrice[coinSym].USD))
            stringed = JSON.stringify(cryptoPrice[coinSym].USD)
            // console.log(alertList[i])
            alertList[i].current = cryptoPrice[coinSym].USD
          }




        })
      })
    }
  }

  for (i = 0; i < alertList.length; i++) {
    if (alertList[i].current !== 0) {
      ready = true
    } else {
      ready = false
    }
  }
  if (ready === true) {
    checkTargetPrice()
  }
}

// #######################################################
// ##### CHECKING TARGET PRICE AGAINST CURRENT PRICE #####


function checkTargetPrice() {
  for (let i = 0; i < alertList.length; i++) {
    if (alertList[i].current === 0) {
      initializePriceing()
    }

    for (let j = 0; j < alertList[i].targetUP.length; j++) {
      if (alertList[i].targetUP[j] <= alertList[i].current && alertList[i].triggered === false) {
        console.log("ALERT: TARGETup PRICE REACHED FOR: " + alertList[i].symbol);
        triggered++
        alertList[i].targetUP.splice(j, 1, 0)
        console.log("REMOVING: " + alertList[i].targetUP[j])
        blastTweet(alertList[i]);
      }
    }

    for (let j = 0; j < alertList[i].targetDN.length; j++) {
      if (alertList[i].targetDN[j] >= alertList[i].current && alertList[i].triggered === false) {
        console.log("ALERT: TARGETdn PRICE REACHED FOR: " + alertList[i].symbol);
        triggered++
        alertList[i].targetDN.splice(j, 1, 0)
        console.log("REMOVING: " + alertList[i].targetDN[j])
        blastTweet(alertList[i]);
      }
    }

  }
  console.log(".")
  everythingLog()
}



// ###############################################
// ##### TWEETS UPON SUCCESS or ERROR ############

function errorTweet() {
  console.log("err tweet")
  // const tweet = {
  //   status: "ERROR RECEIVED: SERVER STILL RUNNING"
  // }

  // Twit.post('statuses/update', tweet, function (error, tweet, response) {
  //   if (error) {
  //     console.log(error)
  //   }
  //   console.log("ERROR TWEET SUCCESS")
  //   console.log(tweet);  // Tweet body.
  //   console.log(response);  // Raw response object.
  // });
}


function blastTweet(target) {
  console.log("success tweet")
  // const tweet = {
  //   status: "TARGET PRICE REACHED: " + target.symbol + " $" + target.current
  // }

  // Twit.post('statuses/update', tweet, function (error, tweet, response) {
  //   if (error) {
  //     console.log(error)
  //   }
  //   console.log("TWEET SUCCESS")
  //   // console.log(tweet);  // Tweet body.
  //   // console.log(response);  // Raw response object.
  // });
}





// ###############################################
// ##### START APP ###############################


initializePriceing()

setInterval(function () {
  console.log("GETTING PRICE: " + alertList.length);
  console.log("Fetch Counter: " + priceFetchCounter)
  getPricing();

}, 1000 * 5)