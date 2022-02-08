// Import
var { priceLayout, getDateNow, int, random, sendMessageEverywhere } = require("./otherFunctions")
var { getPlayer } = require("./playerFunctions")

// Export
module.exports = { updateMarket, updateMarketBehavior, getMarketInfo, getFund, getMarketMsg, financeHelp, arrestFarm }




// Function to update market prices
function updateMarket(bot, market, econ, status = "regular", param, playerName = null) {

    // Creating new price
    let newPrice = {
        value: 0,
        date: getDateNow(),
        change: "",
        playerName: playerName
    }

    // Calculating new Price change variable
    let change = random(econ.minStep, econ.rangeStep)

    // Calculating how purchase or sale will affect the price
    if (status === "buy" || status === "sell") {

        // Calculating coefficient of price change
        let coef = param / econ.depPriceChange

        // If sum of operation is less than 1 percent, then the operation won't influence the market price
        if (coef < 0.01) {
            return
        }

        // Calculating influence change
        if (status === "buy") {
            change = coef * econ.priceChangeRange
        } else if (status === "sell") {
            change = coef * econ.priceChangeRange
        }
    }

    // Variable to get price higher or lower - boolean
    let behavior = null

    if (status === "regular") {
        behavior = random(1, 100) >= market.loseRange
    } else if (status === "buy") {
        behavior = false
    } else if (status === "sell") {
        behavior = true
    }

    // Calculation new Price value and change sign
    if (behavior) {
        newPrice.value = market.lastPrice + change
        newPrice.change = "+"

    } else {
        newPrice.value = market.lastPrice - change
        newPrice.change = "-"
    }

    // If price has fallen too low or it has raised too high, an appropriate event is executed
    // market limits are set randomly and regularly via setInterval
    if (newPrice.value < market.minLimit || newPrice.value > market.maxLimit) {

        if (newPrice.value < market.minLimit) {

            sendMessageEverywhere(bot, market, "VNC price has risen")
            newPrice.value += econ.eventChange
            newPrice.change = "+"

            // Setting temporary market behavior
            market.loseRange = econ.minLoseRange

        } else if (newPrice.value > market.maxLimit) {

            sendMessageEverywhere(bot, market, "VNC price has fallen down")
            newPrice.value -= econ.eventChange
            newPrice.change = "-"

            // Setting temporary market behavior
            market.loseRange = econ.maxLoseRange
        }

        // After event, update the limits
        market.minLimit = random(econ.minLimit.value, econ.minLimit.range)
        market.maxLimit = random(econ.maxLimit.value, econ.maxLimit.range)
    }

    // Pushing newPrice and deleting the oldest one
    market.price.pop()
    market.price.unshift(newPrice)
    market.lastPrice = market.price[0].value

    // Updating the messages of market info in all chats if that message exists there
    for (let i = 0; i < market.message.length; i++) {

        if (market.message[i].msgId && market.message[i].chatId) {
            bot.editMessageText(getMarketInfo(market), { chat_id: market.message[i].chatId, message_id: market.message[i].msgId, parse_mode: "HTML" })
        }

    }

}

// Function to update market behavior
function updateMarketBehavior(market, econ) {

    let behavior = random(0, 2)

    switch (behavior) {
        case 0:
            market.loseRange = econ.minLoseRange
            break
        case 1:
            market.loseRange = econ.maxLoseRange
            break
    }

}

// Fucntion which returns market info in string format
function getMarketInfo(market) {

    let reply = `<code>`
    for (price of market.price) {

        // Those prices, which were affected by someone purchase or sale, are followed with the name of the player, who has done it
        // Otherwise - datetime of regular market update
        if (price.playerName) {
            reply += `${price.change} ${priceLayout(price.value)} - ${price.playerName}\n`
        } else {
            reply += `${price.change} ${priceLayout(price.value)} - ${price.date}\n`
        }

    }
    reply += `</code>`

    return reply
}

// Function to get array of players, who will receive finance help
function getPoorPlayers(players) {

    let poors = []

    // Pushing poor players
    for (let i = 5; i < players.length; i++) {

        if (players[i]) {

            let player = players[i]
            if (player.active) {
                poors.push(player.id)
            }

        }

    }

    return poors
}

// Function which returns how much there is money in fund
function getFund(market, players) {

    let reply = `Fund money: ${priceLayout(market.fund)}\n`

    // Calculating how many players will get finance Help
    let poors = getPoorPlayers(players)

    // Write how many players will get financial help
    // Condition is that there is more than 1 dollar for a person && there is at leat 1 person to get this financial help
    if (poors.length >= 1 && market.fund > poors.length) {
        reply += `>${poors.length} players to get help`
    }

    return reply
}

// Function to get market message
function getMarketMsg(market, chatId) {

    for (let i = 0; i < market.message.length; i++) {
        if (market.message[i].chatId === chatId) {
            return market.message[i]
        }
    }

    return false
}

// Function to give poor players money 
function financeHelp(market, players, econ) {

    // Determining those who need finance help
    let poors = getPoorPlayers(players)

    // If there is none to give money, then end function execution and save fund money untill there will be someone to get this help
    if (poors.length === 0) {
        return `None to receive financial help`
    }

    // Calculating sum to give money
    let sumToGive = int(market.fund / poors.length)

    // If there is less than 1 dollar on a person, stop executing the function
    if (sumToGive < 1) {
        return `None to receive financial help`
    }

    // Limit sumToGive
    if (sumToGive > econ.maxFinHelp) {
        sumToGive = econ.maxFinHelp
    }

    // Giving money
    for (poor of poors) {
        let player = getPlayer(players, poor)
        player.finance += sumToGive
        market.fund -= sumToGive
    }

    // Sending announcement
    let poorsList = ""
    for (poor of poors) {
        let player = getPlayer(players, poor)
        poorsList += `- ${priceLayout(sumToGive)} - <a href="tg://user?id=${player.id}">${player.name}</a>\n`
    }

    // Sending an annoucement to all chats
    return `Bot has given the following players financial help\n${poorsList}`

}

// Function to arrest someone's cryptofarm
function arrestFarm(players, econ) {

    // Choosing victims
    let playersWithBigFarm = []

    for (player of players) {
        if(player.farm >= econ.farm.big) {
            playersWithBigFarm.push(player)
        }
    }

    // If there is none with bigFarm, then stop choosing victim
    if (playersWithBigFarm.length === 0) {

        return `Police hasn't found any illegal cryptofarm`

    }

    // Choosing victim
    let victim = playersWithBigFarm[random(0, playersWithBigFarm.length)]

    // Arresting cryptofarm
    victim.farm -= econ.farm.arrestValue

    // Sending an annoucement to all chats
    return `Police has arrested ${econ.farm.arrestValue.toFixed(6)} of <a href="tg://user?id=${victim.id}">${victim.name}</a> cryptofarm`

}