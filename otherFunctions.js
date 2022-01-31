// Import
const fs = require("fs")

// Export
module.exports = { priceLayout, getDateNow, getName, isRequest, abs, int, random, getUpdateMarketBahaviorDelay, getDelay, getGalleryLength, savePlayers, saveStats, saveBanlist, saveMarket, saveArtCounter, sendMessage, sendMessageEverywhere, deleteMessages, deleteAllMarketMessages }



// Function to layout price output, so 1000 will output as $1,000
function priceLayout(price) {

    // Some operations with price to make it array by string symbols
    price = Math.floor(price)
    price = price.toString()
    price = price.split("")

    // The layouted price first will be written as symbols array and secondly as string to output
    let newPriceArray = []
    let newPriceString = ""

    // Creating layouted price with comas as symbols array
    for (let i = 0; i < price.length; i++) {
        if (i % 3 == 0 && i != 0) {
            newPriceArray.unshift(",")
        }
        newPriceArray.unshift(price[price.length - 1 - i])
    }

    // Converting symbol array of layouted price to simple string
    for (symbol of newPriceArray) {
        newPriceString += symbol
    }

    // Returning price with dollar sign
    return `$${newPriceString}`

}

// Function to layout time unit, so if it is 8 minutes, the 08 minutes is returned in string format
function timeLayout(timeUnit) {

    if (timeUnit < 10) {
        return `0${timeUnit}`
    }

    return timeUnit

}

// Function to get layouted date in appropriate format
// It is used in updateMarket() function to write when a price change happened
function getDateNow() {

    // Creating date object
    let date = new Date()

    // Getting and writing day of the week
    // getDay() function returns Sunday as 1st day of the week, so day variable is initilized this way
    let dateDate = date.getDay()
    let week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    let day = week[dateDate]

    // Getting time units
    let hours = timeLayout(date.getHours())
    let minutes = timeLayout(date.getMinutes())
    let seconds = timeLayout(date.getSeconds())

    // Returning date in specific string format
    return `${day}, ${hours}:${minutes}:${seconds}`

}

// Function to get user name. It is used it createPlayer() function
function getName(user) {

    // Checking if first_name and last_name are set by user
    // If user has no name, then his player name is initialized as "Player"
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`
    } else if (user.first_name) {
        return `${user.first_name}`
    } else if (user.last_name) {
        return `${user.last_name}`
    } else {
        return `Player`;
    }

}

// Function which checks whether text contains bot commands
function isRequest(allCommands, text) {
    
    for (command of allCommands) {
        if (text.includes(command)) {
            return true
        }
    }

    return false

}

// Some simplified Math methods
function abs(param) {
    return Math.abs(param)
}
function int(param) {
    return Math.floor(param)
}
function random(min, range) {
    return int(Math.random() * range + min)
}

// Function to calculate items amount of gallery folder
function getGalleryLength() {

    return fs.readdirSync('./gallery').length

}

// Function to calculate delay of the updateMarket setTimeout
function getUpdateMarketBahaviorDelay() {

    let date1 = new Date()
    let date2 = new Date()

    if (date2.getMinutes() > 30) {
        date2.setHours(date2.getHours() + 1, 0, 0, 0)
    } else {
        date2.setHours(date2.getHours(), 30, 0, 0)
    }

    return date2.getTime() - date1.getTime()

}

// Function to calculate delay to execute at the exect time
function getDelay(hours) {

    let date1 = new Date()
    let date2 = new Date()
    date2.setHours(hours, 0, 0, 0)

    if (date1.getHours() > date2.getHours()) {
        date2.setDate(date2.getDate() + 1)
    }

    return date2.getTime() - date1.getTime()

}

// Functions to save data to data bases
function savePlayers(players) {
    fs.writeFile("players.json", JSON.stringify(players), err => {
        if (err) throw err;
    });
}
function saveMarket(market) {
    fs.writeFile("market.json", JSON.stringify(market), err => {
        if (err) throw err;
    });
}
function saveStats(stats) {
    fs.writeFile("stats.json", JSON.stringify(stats), err => {
        if (err) throw err;
    });
}
function saveBanlist(banlist) {
    fs.writeFile("banlist.json", JSON.stringify(banlist), err => {
        if (err) throw err;
    });
}
function saveArtCounter(artCounter) {
    fs.writeFile("artCounter.json", JSON.stringify(artCounter), err => {
        if (err) throw err;
    });
}

// This function is simplified form of bot.sendMessage()
function sendMessage(bot, chatId, text) {
    bot.sendMessage(chatId, text, { parse_mode: "HTML" })
}

// Function to send one message to all chats
function sendMessageEverywhere(bot, market, text) {

    for (let i = 0; i < market.message.length; i++) {

        if (market.message[i].msgId && market.message[i].chatId) {
            sendMessage(bot, market.message[i].chatId, text)
        }

    }

}

// This function deletes two messages : the one, which contains command request and the second, which contains its result
// The delay of deleting result message is 30 by default, so if you wish to make some messages disappear a bit later, you can specify this in the end of bot.on("message")
function deleteMessages(bot, chatId, msgId, deleteReply, delay = 30) {

    setTimeout(function () {
        bot.deleteMessage(chatId, msgId)
    }, 1000)

    if (deleteReply) {

        setTimeout(function () {
            bot.deleteMessage(chatId, ++msgId)
        }, delay * 1000)

    }

}

// Function to delete all market messages from all chats
function deleteAllMarketMessages(bot, market) {

    for (let i = 0; i < market.message.length; i++) {
        
        if (market.message[i].chatId && market.message[i].msgId) {
            deleteMessages(bot, market.message[i].chatId, market.message[i].msgId, false)
        }

    }

    market.message = []

}