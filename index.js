const TelegramApi = require("node-telegram-bot-api")
// const token = "5050568228:AAFKFO82p1FRz9xskj80bLKgW10GAHONKBc" // Test 
const token = "5024120479:AAG3USXCWWjJkgnZdc4E4xR1WfvJGym-6YU" // Production 
const bot = new TelegramApi(token, { polling: true })

bot.setMyCommands([
    { command: "/market", description: "Stock-Market" },
    { command: "/buy", description: "Buy VNC" },
    { command: "/sell", description: "Sell VNC" },
    { command: "/mine", description: "Mine" },
    { command: "/gamble", description: "Try your luck" },
    { command: "/about", description: "Player info" },
    { command: "/forbes", description: "Forbes" },
    { command: "/invest", description: "Invest into crypto farm" },
    { command: "/gallery", description: "Buy a painting" },
    { command: "/give", description: "Give someone money" },
    { command: "/fund", description: "Fund info" },
    { command: "/readme", description: "Gameplay & Updates news" }
])

const commands = {
    market: "/market",
    buy: "/buy",
    sell: "/sell",
    mine: "/mine",
    gamble: "/gamble",
    about: "/about",
    forbes: "/forbes",
    invest: "/invest",
    gallery: "/gallery",
    give: "/give",
    fund: "/fund",
    readme: "/readme@venscoinbot",

    restart: "/restart@venscoinbot",
    stats: "/stats",
    updateMined: "/updatemined",
    volt: "/volt",
    ban: "/ban@venscoinbot"
}
const allCommands = ["/market", "/market@venscoinbot", "/buy", "/buy@venscoinbot", "/sell", "/sell@venscoinbot", "/mine", "/mine@venscoinbot", "/gamble", "/gamble@venscoinbot", "/about", "/about@venscoinbot", "/forbes", "/forbes@venscoinbot", "/invest", "/invest@venscoinbot", "/gallery", "/gallery@venscoinbot", "/give", "/give@venscoinbot", "/fund", "/fund@venscoinbot", "/readme@venscoinbot"]
const devCommands = ["/stats", "/restart@venscoinbot", "/updatemined", "/volt", "/ban@venscoinbot"]





bot.on("message", msg => {
    let text = msg.text
    text = text.toLowerCase()
    let user = msg.from
    let chatId = msg.chat.id
    let msgId = msg.message_id
    let player = null

    // Developer commands
    if (devCommands.includes(text) && user.id == 599100557) {

        if (text.includes(commands.stats)) {
            sendMessage(chatId, `stats: ${stats}`)

        } else if (text.includes(commands.restart)) {
            deleteMessages(chatId, msgId, false)
            sendMessage(chatId, "Dev in da house: game has been restarted")
            restartGame(chatId)
            return;

        } else if (text.includes(commands.updateMined)) {
            updateMined()
            sendMessage(chatId, "Dev in da house: mining is available again")

        } else if (text.includes(commands.volt)) {
            volt()
            sendMessage(chatId, "Dev id da house: volatility has been changed")

        } else if (text.includes(commands.ban)) {

            // Checking if there is replied message
            if (msg.reply_to_message) {

                let userToBan = msg.reply_to_message.from

                // If this user is already banned, then unban him. Otherwise - ban
                if (banlist.includes(userToBan.id)) {
                    banlist.splice(banlist.indexOf(userToBan.id), 1)
                    sendMessage(chatId, `Player <a href="tg://user?id=${msg.reply_to_message.from.id}">${getName(msg.reply_to_message.from)}</a> is free to give money`)
                } else {
                    banlist.push(msg.reply_to_message.from.id)
                    sendMessage(chatId, `Player <a href="tg://user?id=${msg.reply_to_message.from.id}">${getName(msg.reply_to_message.from)}</a> is forbidden to give money`)
                }

                saveData()

            } else {
                sendMessage(chatId, `<a href="tg://user?id=${user.id}">${getName(user)}</a>, please reply that user message, who you wish to ban`)
            }

        }

        deleteMessages(chatId, msgId, true)
        return;
    }

    // Creating a player, otherwise initializing it
    if (allCommands.includes(text) || text.includes(commands.buy) || text.includes(commands.sell) || text.includes(commands.gamble) || text.includes(commands.give) || text.includes(commands.invest) || text.includes(commands.gallery)) {

        // Appropriate chatId for @nause121 chat
        if (chatId == -1001131664573) {

            // Checking if user or user of replied message is a bot
            if (user.is_bot || (msg.reply_to_message && msg.reply_to_message.from.is_bot)) {
                deleteMessages(chatId, msgId, false)
                return;
            } 

            // If everything is okay, then initialize the player
            createPlayer(user)
            player = getPlayer(user.id)

        } else {
            sendMessage(chatId, "Play there: @nause121")
            return;
        }

        // For developing
        // createPlayer(user)
        // player = getPlayer(user.id)

    } else {
        return;
    }

    // Command for market
    if (text.includes(commands.market)) {

        // First deleting request message 
        bot.deleteMessage(chatId, msgId)

        // Deleting the previous market.message
        if (market.message.msgId && market.message.chatId) {
            bot.deleteMessage(market.message.chatId, market.message.msgId)
        }

        // Sending the new market.message
        sendMessage(chatId, getMarketInfo())

        // Updating market.message object, which will be used to update the sent message in updateMarket() function later
        market.message.msgId = msgId + 1
        market.message.chatId = chatId

        // Pinning the message
        bot.pinChatMessage(market.message.chatId, market.message.msgId)

        // Saving data
        stats++
        saveData()

        return;
    }

    // Main bot commands
    if (text.includes(commands.buy)) {
        sendMessage(chatId, buy(text, player))

    } else if (text.includes(commands.sell)) {
        sendMessage(chatId, sell(text, player))

    } else if (text.includes(commands.mine)) {
        sendMessage(chatId, mine(player))

    } else if (text.includes(commands.gamble)) {
        sendMessage(chatId, gamble(text, player))

    } else if (text.includes(commands.about)) {
        sendMessage(chatId, getUserInfo(msg, player))

    } else if (text.includes(commands.forbes)) {
        sendMessage(chatId, getForbes())

    } else if (text.includes(commands.invest)) {
        sendMessage(chatId, invest(text, player))

    } else if (text.includes(commands.gallery)) {
        sendMessage(chatId, getGallery(text, player, chatId))
        
        // Win event: if all paintings are sold
        if(isGallerySold()) {
            deleteMessages(chatId, msgId, false)
            setTimeout(restartGame(chatId), 3 * 1000)
            return;
        }

    } else if (text.includes(commands.give)) {

        // It is forbidden to make transaction from twink
        if (banlist.includes(user.id)) {
            sendMessage(chatId, `<a href="tg://user?id=${user.id}">${getName(user)}</a>, you are not allowed to give someone money`)
            deleteMessages(chatId, msgId, true)
            return;
        } 

        // If everything is okay, then execute the command
        sendMessage(chatId, give(msg, player))

    } else if (text.includes(commands.fund)) {
        sendMessage(chatId, getFund())

    } else if (text.includes(commands.readme)) {
        sendMessage(chatId, getReadme())
    }

    // Make player active status true if he called appropriate functions
    if (text.includes(commands.buy) || text.includes(commands.sell) || text.includes(commands.gamble) || text.includes(commands.mine)) {
        player.active = true
    }

    // Deleting messages
    if (text.includes(commands.market) || text.includes(commands.forbes) || text.includes(commands.readme)) {
        deleteMessages(chatId, msgId, true, 60)

    } else if (text.includes(commands.give) || text.includes(commands.gallery)) {
        deleteMessages(chatId, msgId, false)

    } else {
        deleteMessages(chatId, msgId, true)
    }

    // Saving data
    stats++
    saveData()
})





// Getting data from data base at the beginning of code execution
const fs = require("fs");
var players = require("./players")
var market = require("./market")
var stats = require("./stats")
var banlist = require("./banlist")
var gallery = require("./gallery")

// Variable of market share, which tells the user is rich
var richShare = 10




// Updating mined status at 18:00
setTimeout(function () {

    updateMined()
    saveData()

    setInterval(function () {

        updateMined()
        saveData()

    }, 24 * 60 * 60 * 1000)

}, getDelay(18))

// Giving finance help regularyly at 9:00
setTimeout(function () {

    financeHelp()
    updateActive()
    saveData()

    setInterval(function () {

        financeHelp()
        updateActive()
        saveData()

    }, 1 * 60 * 60 * 1000)

}, getFundDelay()) //  

// Function to calculate delay of the setTimeout
// To execute at the exect time
function getDelay(hours) {
    let date1 = new Date()
    let date2 = new Date()
    date2.setHours(hours, 0, 0, 0)

    if (date1.getHours() > date2.getHours()) {
        date2.setDate(date2.getDate() + 1)
    }

    return date2.getTime() - date1.getTime()
}

// Function to calculate delay of the setTimeout of FUND 
function getFundDelay() {
    let date1 = new Date()
    let date2 = new Date()
    date2.setHours(date2.getHours() + 1, 0, 0, 0)

    return date2.getTime() - date1.getTime()
}

// Updating market regularly
setInterval(function () {

    updateMarket()
    saveData()

}, 15 * 1000)

// Updating market.loseRange regularly - this determines market behavior
setTimeout(function () {

    updateMarketBehavior()
    saveData()

    setInterval(function () {

        updateMarketBehavior()
        saveData()

    }, 30 * 60 * 1000)

}, getUpdateMarketLoseRangeDelay())
// Function to calculate delay of the above setTimeout
function getUpdateMarketLoseRangeDelay() {
    let date1 = new Date()
    let date2 = new Date()

    if (date2.getMinutes() > 30) {
        date2.setHours(date2.getHours() + 1, 0, 0, 0)
    } else {
        date2.setHours(date2.getHours(), 30, 0, 0)
    }

    return date2.getTime() - date1.getTime()
}




// This function is simplified form of bot.sendMessage()
function sendMessage(chatId, text) {
    bot.sendMessage(chatId, text, { parse_mode: "HTML" })
}
// This function deletes two messages : the one, which contains command request and the second, which contains its result
// The delay of deleting result message is 30 by default, so if you wish to make some messages disappear a bit later, you can specify this in the end of bot.on("message")
function deleteMessages(chatId, msgId, deleteReply, delay = 30) {
    setTimeout(function () {
        bot.deleteMessage(chatId, msgId)
    }, 1000)
    if (deleteReply) {
        setTimeout(function () {
            bot.deleteMessage(chatId, ++msgId)
        }, delay * 1000)
    }
}
// Function to save data to data bases
function saveData() {
    fs.writeFile("players.json", JSON.stringify(players), err => {
        if (err) throw err;
    });
    fs.writeFile("market.json", JSON.stringify(market), err => {
        if (err) throw err;
    });
    fs.writeFile("stats.json", JSON.stringify(stats), err => {
        if (err) throw err;
    });
    fs.writeFile("banlist.json", JSON.stringify(banlist), err => {
        if (err) throw err;
    });
    fs.writeFile("gallery.json", JSON.stringify(gallery), err => {
        if (err) throw err;
    });
}
// Function of /restart command, which is available for developer only
function restartGame(chatId) {

    // Updating player capitals due to last market price
    for (player of players) {
        player.capital = getCapital(player)
    }

    // Sorting players by capital
    players.sort(function (a, b) {
        if (a.gallery.length < b.gallery.length) {
            return 1;
        }
        if (a.gallery.length > b.gallery.length) {
            return -1;
        }
        return 0;
    });

    // Writing output 
    let reply = "<code>"
    for (player of players) {
        if(player.gallery.length == 0) {
            reply += `${priceLayout(player.capital)} - ${player.name}\n`
        } else {
            reply += `${priceLayout(player.capital)} - ${player.name} - ${player.gallery.length}🖼\n`
        }
    }
    reply += "</code>"

    sendMessage(chatId, reply)
    sendMessage(chatId, `Game has been ended. The winner is <a href="tg://user?id=${players[0].id}">${players[0].name}</a>`)
    sendMessage(chatId, `New round is started`)

    // Updating all game parameters to initial status
    updateGame()
}
// Update game paramaters - used with restarGame only
function updateGame() {

    // Creating new price
    let newPrice = {
        value: 40000,
        date: getDateNow(),
        change: "x"
    }

    // Pushing new price
    market.price.pop()
    market.price.unshift(newPrice)
    market.lastPrice = market.price[0].value

    // Deleting all players data
    players = []

    // Making all paintings available to buy
    for(painting of gallery) {
        painting.sold = false
    }

    // Saving data
    saveData()
}
// Function to make volatility be fucked up
function volt() {

    // Declaring high volatility parameters
    let highMin = 5000
    let highRange = 5000

    // If market volatility behavior is not changed yet, then change it
    if (market.range != highRange || market.min != highMin) {
        market.range = highMin
        market.min = highRange
        return;
    }

    // Return initial market behavior
    market.range = 400
    market.min = 400
}





// Function to give poor players money 
function financeHelp() {

    // Determining those who need finance help
    let poors = getPoorPlayers()

    // If there is none to give money, then end function execution and save fund money untill there will be someone to get this help
    if (poors.length == 0) {
        return
    }

    // Calculating sum to give money
    let sumToGive = Math.floor(market.fund / poors.length)

    // If there is less than 1 dollar on a person, stop executing the function
    if (sumToGive < 1) {
        return
    }

    // Giving money
    for (poor of poors) {
        let player = getPlayer(poor.id)
        player.finance += sumToGive * poor.coef
        market.fund -= sumToGive * poor.coef
    }

    // Sending announcement
    let listOfPoor = "<code>"
    for (poor of poors) {
        let player = getPlayer(poor.id)
        listOfPoor += `- ${priceLayout(Math.floor(sumToGive * poor.coef))} - <a href="tg://user?id=${player.id}">${player.name}</a>\n`
    }
    sendMessage(market.message.chatId, `Bot has given the following players financial help\n${listOfPoor}</code>`)
}
// Function which returns how much there is money in fund
function getFund() {

    let reply = `Fund money: ${priceLayout(market.fund)}`

    // Calculating how many players will get finance Help
    let poors = getPoorPlayers()

    // Write how many players will get financial help
    // Condition is that there is more than 1 dollar for a person && there is at leat 1 person to get this financial help
    if (poors.length >= 1 && market.fund > poors.length) {
        reply += `\n>${poors.length} players to get help`
    }

    return reply
}
// Function to make players active status false
function updateActive() {
    for (player of players) {
        player.active = false
    }
}
// Function to get array of players, who will receive finance help
function getPoorPlayers() {

    let poors = []

    // Pushing poor players
    // Multiplier is used in this way: help = sumToGive * multiplier, so a bit more rich players will get 25% of help

    for (let i = 0; i < players.length; i++) {
        let player = players[i]
        if(player.active && !isRich(player) && player.farm.value < 2) {
            poors.push({id: player.id, coef: 1})
        } else if(player.active && !isRich(player)) {
            poors.push({id: player.id, coef: 0.25})
        }
    }

    return poors
}





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
// Getting module of a number, so if it is -2, it returns 2
function module(param) {
    if (param < 0) {
        return 0 - param
    }
    return param
}





// Function to update market prices
function updateMarket(status = "regular", param, playerName = null) {

    // Creating new price
    let newPrice = {
        value: 0,
        date: getDateNow(),
        change: "",
        playerName: playerName
    }

    // Calculating new Price change variable
    let change = Math.floor(Math.random() * market.range + market.min)

    if (status == "buy" || status == "sell") {

        // Calculating marketShare of this param according to whole marketCapital
        let marketShare = param / getMarketCapital()

        // If sum of operation is less than 1 percent, then the operation won't influence the market price
        if (marketShare < 0.01) {
            return;
        }

        // Calculating influence change
        if (status == "buy") {
            change = marketShare * 20000
        } else if (status == "sell") {
            change = marketShare * 20000
        }
    }

    // Variable to get price higher or lower - boolean
    let behavior = null

    if (status == "regular") {
        behavior = Math.floor(Math.random() * 100 + 1) >= market.loseRange ? true : false
    } else if (status == "buy") {
        behavior = false
    } else if (status == "sell") {
        behavior = true
    }

    // Calculation new Price value and change sign
    if (behavior == true) {
        newPrice.value = market.lastPrice + change
        newPrice.change = "+"

    } else if (behavior == false) {
        newPrice.value = market.lastPrice - change
        newPrice.change = "-"
    }

    // If price has fallen too low or it has raised too high, an appropriate event is executed
    // market limits are set randomly and regularly via setInterval
    if (newPrice.value < market.minLimit || newPrice.value > market.maxLimit) {

        if (newPrice.value < market.minLimit) {
            sendMessage(market.message.chatId, "Economic Miracle: VNC price has risen")
            newPrice.value += Math.floor(Math.random() * 20000 + 30000)
            newPrice.change = "+"

            // Setting temporaty market behavior
            market.loseRange = 40

        } else if (newPrice.value > market.maxLimit) {
            sendMessage(market.message.chatId, "Black Tuesday: VNC price has fallen down")
            newPrice.value -= Math.floor(Math.random() * 20000 + 30000)
            newPrice.change = "-"

            // Setting temporaty market behavior
            market.loseRange = 60
        }

        // If there was high volatility enabled, then disable it after event happened
        market.min = 400
        market.range = 400

        // After event, update the limits
        market.minLimit = Math.floor(Math.random() * 30000 + 5000)
        market.maxLimit = Math.floor(Math.random() * 55000 + 45000)
    }

    // Pushing newPrice and deleting the oldest one
    market.price.pop()
    market.price.unshift(newPrice)
    market.lastPrice = market.price[0].value

    // Updating the last message of market info if it exists
    if (market.message.msgId && market.message.chatId) {
        bot.editMessageText(getMarketInfo(), { chat_id: market.message.chatId, message_id: market.message.msgId, parse_mode: "HTML" })
    }
}
// Function to update market behavior
function updateMarketBehavior() {

    let behavior = Math.floor(Math.random() * 2)

    switch (behavior) {
        case 0:
            market.loseRange = 45
            break
        case 1:
            market.loseRange = 55
            break
    }

    let volatility = Math.floor(Math.random() * 3)

    switch (volatility) {
        case 0:
            market.range = 400
            market.min = 400
            break
        case 1:
            market.range = 600
            market.min = 600
            break
        case 2:
            market.range = 800
            market.min = 800
            break
    }
}
// Fucntion which returns market info in string format
function getMarketInfo() {

    let reply = `<code>`
    for (price of market.price) {

        // We write down prices, which have change due to purchase or sale operations with the mention of a player, who has done this operation
        if (price.playerName) {
            reply += `${price.change} ${priceLayout(price.value)} - ${price.playerName}\n`
        } else {
            reply += `${price.change} ${priceLayout(price.value)} - ${price.date}\n`
        }
        
    }
    reply += `</code>`

    return reply
}
// Function to calculate how much there is money on the market
function getMarketCapital() {
    let marketCapital = 0
    for (player of players) {
        marketCapital += getCapital(player)
    }
    return marketCapital
}
// Function to calculate whether user has more than richShare variable
function isRich(player) {
    return Math.floor(getCapital(player) >= getBigWeath()) ? true : false
}
// Function to calculate how much in dollars the bigWealth is
function getBigWeath() {
    return Math.floor(getMarketCapital() / richShare)
}





// Function to create player
function createPlayer(user) {

    // Checking if this player already exists. If true, then the new player is not created
    if (isUserPlayer(user.id)) {
        return;
    }

    // Creating new player object
    let newPlayer = {
        id: user.id,
        name: getName(user),
        venscoin: {
            amount: 0,
            boughtPrice: 0
        },
        finance: 7000,
        capital: 7000,
        mined: false,
        active: false,
        farm: {
            value: 0.3,
            invested: 0
        },
        gallery: []
    }

    // Pushing new player to array of players
    players.push(newPlayer)
}
// Function which finds player by userId and returns it
function getPlayer(userId) {
    for (player of players) {
        if (player.id == userId) {
            return player;
        }
    }
}
// Function to check whether user with this id is already a player
function isUserPlayer(userId) {
    for (player of players) {
        if (player.id == userId) {
            return true;
        }
    }
    return false;
}
// Function which returns player info in string format for output
function getUserInfo(msg, player) {

    // If you wish to see info about other user, then reply his message and call /about command
    if (msg.reply_to_message) {
        createPlayer(msg.reply_to_message.from)
        player = getPlayer(msg.reply_to_message.from.id)
    }

    // Calculating tax status
    let taxStatus = null
    if (isRich(player)) {
        taxStatus = "40%"
    } else {
        taxStatus = "5%"
    }

    return `<a href="tg://user?id=${player.id}">${player.name}</a>\nVNC: ${player.venscoin.amount.toFixed(6)} - ${priceLayout(getVenscoinCapital(player.venscoin.amount))}\nBought by: ${priceLayout(player.venscoin.boughtPrice)}\nCryptofarm: ${player.farm.value.toFixed(6)}\nFinance: ${priceLayout(player.finance)}\nCapital: ${priceLayout(getCapital(player))}\nForbes: ${getForbesPosition(player.id)} of ${players.length}\nTax rate: ${taxStatus}\n🖼 ${player.gallery.length} paintings`;
}
// Function to calculate player capital
function getCapital(player) {
    return player.finance + getVenscoinCapital(player.venscoin.amount);
}
// Function to calculate venscoin capital
function getVenscoinCapital(amount) {
    return amount * market.lastPrice
}





// Function to buy venscoins
function buy(text, player) {

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if ((items.length != 2 || !parseInt(param) || parseInt(param) < 0) && items.length != 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, incorrect request. Correct request example:\n"${commands.buy} 1000" or "${commands.buy}"`
    }

    // Parsing string and initializing param
    if (items.length == 1) {
        param = player.finance
    } else {
        param = Math.floor(parseInt(param))
    }

    // Some exclusions 
    if (player.finance < param && player.finance >= 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot buy ${priceLayout(param)} worth VNC, because your finances are ${priceLayout(player.finance)}`
    } else if (player.finance < 1 && getVenscoinCapital(player.venscoin.amount) > 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot buy more VNC, because all your money is in VNC already`
    } else if (player.finance < 1 && getVenscoinCapital(player.venscoin.amount) < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have any money to buy VNC`
    }

    // Making purchase. This code executes if no exceptions above are handled
    player.venscoin.boughtPrice = market.lastPrice
    player.venscoin.amount += param / player.venscoin.boughtPrice
    player.finance -= param

    // Updating market price
    updateMarket("buy", param, player.name)

    return `<a href="tg://user?id=${player.id}">${player.name}</a> buys VNC\n>Purchase: ${priceLayout(param)}\n>Bought by: ${priceLayout(player.venscoin.boughtPrice)}`
}
// Function to sell venscoins
function sell(text, player) {

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if ((items.length != 2 || !parseInt(param) || parseInt(param) < 0) && items.length != 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, incorrect request. Correct request example:\n"${commands.sell} 1000" or "${commands.sell}"`
    }

    // Calculating player capital of venscoin
    let venscoinCapital = getVenscoinCapital(player.venscoin.amount)

    // Parsing string and initializing param
    if (items.length == 1) {
        param = venscoinCapital
    } else {
        param = Math.floor(parseInt(param))
    }

    // Some exclusions
    if (param > venscoinCapital && venscoinCapital >= 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot sell ${priceLayout(param)} worth VNC, because you have only ${priceLayout(venscoinCapital)} worth VNC`
    } else if (venscoinCapital < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have any VNC left to sell`
    }

    // param in venscoin
    paramVenscoin = param / market.lastPrice

    // Making sale
    player.venscoin.amount -= paramVenscoin
    player.finance += param

    // Calculating change according to boughtPrice
    // It will work better if there is an array of {boughtValue, boughtPrice}
    let change = module(paramVenscoin * player.venscoin.boughtPrice - paramVenscoin * market.lastPrice)
    let changeMsg = ""

    if (player.venscoin.boughtPrice < market.lastPrice) {

        // Calculating taxes on income
        let taxes = taxIncome(change, player)
        market.fund += taxes
        player.finance -= taxes
        change -= taxes

        // Writing reply
        changeMsg = `>Income: ${priceLayout(change + taxes)}\n>Taxes: ${priceLayout(taxes)}\n>Profit: ${priceLayout(change)}`

    } else if (player.venscoin.boughtPrice > market.lastPrice) {

        // If player loses money on market, then his lost money goes to fund
        market.fund += change

        // Writing reply
        changeMsg += `You have lost ${priceLayout(change)}`

    } else {
        // Writing reply
        changeMsg += "No income"
    }

    // If player sells everything, then boughtPrice is 0
    if (player.venscoin.amount * market.lastPrice < 1) {
        player.venscoin.boughtPrice = 0
    }

    // Influence of the market after sale
    updateMarket("sell", param, player.name)

    return `<a href="tg://user?id=${player.id}">${player.name}</a> sells ${priceLayout(param)} worth VNC\n${changeMsg}`
}
// Function to calculate taxes from income
function taxIncome(income, player) {
    if (isRich(player)) {
        return Math.floor(income * 0.4)

    } else {
        return Math.floor(income * 0.05)
    }
}





// Function to mine venscoins
function mine(player) {

    // Checking if player already mined today
    if (player.mined == true) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you have already mined today. The crypto farm is cooling down`
    }

    // Calculating how much VNC user will mine
    let venscoinMined = player.farm.value

    // Mined VNC in dollars
    let venscoinMinedCapital = getVenscoinCapital(venscoinMined)

    // Changing player parameters due to mined VNC, so he cannot mine more this day
    player.venscoin.amount += venscoinMined
    player.mined = true

    return `<a href="tg://user?id=${player.id}">${player.name}</a>, \nYou've mined <b>${venscoinMined.toFixed(6)} VNC - ${priceLayout(venscoinMinedCapital)}</b>\n>Your VNC: ${player.venscoin.amount.toFixed(6)} - ${priceLayout(getVenscoinCapital(player.venscoin.amount))}\n>Capital: ${priceLayout(getCapital(player))}`
}
// Function to update mined status for all players
function updateMined() {
    for (player of players) {
        player.mined = false
    }
}
// Function to invest money in cryptofarm
function invest(text, player) {

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if ((items.length != 2 || !parseInt(param) || parseInt(param) < 0) && param != "all") {
        return `Productivity: ${player.farm.value.toFixed(6)}\nInvested: ${priceLayout(player.farm.invested)}\n\n<a href="tg://user?id=${player.id}">${player.name}</a>, to invest use command: "${commands.invest} 1000" or "${commands.invest} all"`
    }

    // Parsing string and initializing param
    if (param == "all") {
        param = player.finance
    } else {
        param = Math.floor(parseInt(param))
    }

    // Some exclusions 
    if (player.finance < param && player.finance >= 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot invest ${priceLayout(param)}, because your finances are ${priceLayout(player.finance)} only`
    } else if (player.finance < 1 && getVenscoinCapital(player.venscoin.amount) > 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot invest, because all your money is in VNC`
    } else if (player.finance < 1 && getVenscoinCapital(player.venscoin.amount) < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have any money to invest`
    }

    // Calculation of investment
    let rise = param / 500000
    player.farm.value += rise
    player.farm.invested += param
    player.finance -= param

    return `<a href="tg://user?id=${player.id}">${player.name}</a>, you've invested ${priceLayout(param)} into crypto farm\n>Growth: +${rise.toFixed(6)}\n>Productivity: ${player.farm.value.toFixed(6)}`
}





function getGallery(text, player, chatId) {

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if (items.length != 2  && param != "buy") {

        // Two answers: if player has some paintings in his gallery; if not
        if(player.gallery.length == 0) {
            return `<a href="tg://user?id=${player.id}">${player.name}</a>, to buy a painting use command: "${commands.gallery} buy"`

        } else {

            // Writing those paintings in readable list
            let playerGallery = ""
            for(let i = 0; i < player.gallery.length; i++) {
                playerGallery += `- ${player.gallery[i]}\n`
            }

            return `<a href="tg://user?id=${player.id}">${player.name}</a> Art Gallery\n${playerGallery}\nTo buy a painting use command: "${commands.gallery} buy"`
        }
    }

    // Parsing string and initializing param
    if (param == "buy") {
        param = player.finance
    } 

    // Declaring painting price
    let paintingPrice = 1000000

    // Some exclusions 
    if (player.finance < paintingPrice) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have ${priceLayout(paintingPrice)} to buy a painting. Your finances are ${priceLayout(player.finance)} only`
    } 

    // Making painting purchase
    player.finance -= paintingPrice
    let painting = getPainting()
    player.gallery.push(painting.name)
    bot.sendPhoto(chatId, painting.path, {caption: painting.name})

    return `<a href="tg://user?id=${player.id}">${player.name}</a> buys the painting`
}
// Function to get painting from the gallery.json
function getPainting() {
    for(painting of gallery) {
        if(painting.sold == false) {
            painting.sold = true
            return painting
        }
    }
}
function isGallerySold() {

    // First count how many paintings are unsold
    let countUnsoldPaintings = 0
    for(painting of gallery) {
        if(painting.sold == false) {
            countUnsoldPaintings++
        }
    }

    // If counter is zero, this means that none has bought any painting yet
    // If counter is less than gallery.lenght, then not every painting is sold
    if(countUnsoldPaintings == 0) {
        return true
    } else {
        return false
    }
}



// Function to gamble (casino mini-game)
function gamble(text, player) {

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if ((items.length != 2 || !parseInt(param) || parseInt(param) < 0) && param != "all") {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, incorrect request. Correct request example:\n"${commands.gamble} 1000" or "${commands.gamble} all"`
    }

    // Parsing string and initializing param
    if (param == "all") {
        param = player.finance
    } else {
        param = Math.floor(parseInt(param))
    }

    // Some exclusions 
    if (param < 100) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, initial bet is ${priceLayout(100)}`
    }
    if (param > player.finance) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot bet ${priceLayout(param)}, because your finances are ${priceLayout(player.finance)} only`
    }

    // MAIN GAME EXECUTION

    // Calculating chances range of win according to player wealth
    let range = 2
    if (isRich(player)) {
        range = 2 + Math.floor(getCapital(player) / market.lastPrice)

    } else if (getCapital(player) / market.lastPrice >= 2) {
        range = 4
    }

    // Behavior for winning money

    if (Math.floor(Math.random() * range) == 0) {
        player.finance += param
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you've won ${priceLayout(param)}\n>Finance: ${priceLayout(player.finance)}`
    }

    // Behavior for losing money
    market.fund += param
    player.finance -= param

    if (player.finance < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you've lost everything. Sell a bit of VNC to bet more`
    } else {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you've lost ${priceLayout(param)}\n>Finance: ${priceLayout(player.finance)}`
    }
}





// Function to give some player your finance
function give(msg, giver) {

    // text, repliedMsg, giver
    let text = msg.text
    let repliedMsg = msg.reply_to_message

    // Exclusions if there is no replied message or someone is a bot
    if (!repliedMsg) {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, please reply that user message, who you wish to give some money`

    } else if (msg.reply_to_message.from.is_bot || msg.from.is_bot) {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, transaction is declined`
    }

    // If replied message is sent by user, which is not a player yet, then create a new player before giving him money
    createPlayer(repliedMsg.from)
    let recipient = getPlayer(repliedMsg.from.id)

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if ((items.length != 2 || !parseInt(param) || parseInt(param) < 0) && param != "all") {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, incorrect request. Correct request example:\n"${commands.give} 1000" or "${commands.give} all"`
    }

    // Parsing string and initializing param
    if (param == "all") {
        param = giver.finance
    } else {
        param = Math.floor(parseInt(param))
    }

    // Some exclusions 
    if (param > giver.finance && giver.finance >= 1) {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, wow, you are so generous! The problem is you don't have ${priceLayout(param)}. Your finances are ${priceLayout(giver.finance)} only`

    } else if (param > giver.finance && getVenscoinCapital(giver.venscoin.amount) >= 1) {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, you don't have any cash, there is ${priceLayout(getVenscoinCapital(giver.venscoin.amount))} of VNC on your account\nCopy: <code>/sell ${param}</code>`

    } else if (giver.finance < 1 && getVenscoinCapital(giver.venscoin.amount) < 1) {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, well, this is good deed, buy you don't have any money`
    }

    // If everything is okay, then calculate transaction, but first calculate comission
    let comission = Math.floor(param * 0.05)
    param -= comission
    market.fund += comission

    giver.finance -= param
    recipient.finance += param

    return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, you've supported <a href="tg://user?id=${recipient.id}">${recipient.name}</a> with ${priceLayout(param)}\n>Commission: ${priceLayout(comission)}`
}





// Function which returns string object of top-10 players by capital
function getForbes() {

    // Updating player capitals due to last market price
    for (player of players) {
        player.capital = getCapital(player)
    }

    // Sorting players by capital
    players.sort(function (a, b) {
        if (a.capital < b.capital) {
            return 1;
        }
        if (a.capital > b.capital) {
            return -1;
        }
        return 0;
    });

    // Writing output 
    let reply = "<code>"
    for (let i = 0; i < 10; i++) {
        if (players[i]) {
            if(players[i].gallery.length == 0) {
                reply += `${priceLayout(players[i].capital)} - ${players[i].name}\n`
            } else {
                reply += `${priceLayout(players[i].capital)} - ${players[i].name} - ${players[i].gallery.length}🖼\n`
            }
        }
    }
    reply += "</code>"

    return reply
}
// Function to get player position in Forbes
function getForbesPosition(playerId) {

    // Updating player capitals due to last market price
    for (player of players) {
        player.capital = getCapital(player)
    }

    // Sorting players by capital
    players.sort(function (a, b) {
        if (a.capital < b.capital) {
            return 1;
        }
        if (a.capital > b.capital) {
            return -1;
        }
        return 0;
    });

    // Determing position
    for (let i = 0; i < players.length; i++) {
        if (players[i].id == playerId) {
            return i + 1
        }
    }
}





// Function to get readme text
function getReadme() {
    return `<a href="https://telegra.ph/venscoin-01-13">Gameplay & Update news</a>`
}