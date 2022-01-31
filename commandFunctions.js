// Import
var { priceLayout, abs } = require("./otherFunctions")
var { createPlayer, getPlayer, getCapital, getVenscoinCapital, isUserPlayer } = require("./playerFunctions")
var { updateMarket } = require("./marketFunctions")

// Export
module.exports = { buy, sell, mine, invest, give, getForbes, getReadme, start, art }




// Function to buy venscoins
function buy(bot, market, econ, text, player) {

    let param = null

    // Working with text and checking if the request is correct
    if (/\/buy(@venscoinbot)? +\d{0,3}%/.test(text)) {
        param = (parseInt(/\d+/.exec(text)[0]) / 100) * player.finance
    } else if (/\/buy(@venscoinbot)? +\d+k|к/.test(text) && !text.includes("%")) {
        param = parseInt(/\d+/.exec(text)[0]) * 1000
    } else if (/\/buy(@venscoinbot)? +\d+/.test(text)) {
        param = parseInt(/\d+/.exec(text)[0])
    } else if (/\/buy(@venscoinbot)? +all/.test(text) || text === "/buy" || text === "/buy@venscoinbot") {
        param = player.finance
    } else {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, incorrect request. Correct request example:\n<code>/buy 100</code> || <code>/buy 10k</code> || <code>/buy 10%</code> || <code>/buy all</code> || <code>/buy</code>`
    }

    // Some exclusions 
    if (player.venscoin.bought >= econ.buyLimit) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you have already bought ${priceLayout(econ.buyLimit)} worth VNC`
    } else if (param > player.finance && player.finance >= 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have ${priceLayout(param)}\n>Finance: ${priceLayout(player.finance)}`
    } else if (player.finance < 1 && getVenscoinCapital(market, player.venscoin.amount) > 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot buy more VNC, because all your money is in VNC already`
    } else if (player.finance < 1 && getVenscoinCapital(market, player.venscoin.amount) < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have any money to buy VNC`
    }


    // Checking if param is in limits
    if (param > econ.buyLimit - player.venscoin.bought) {
        param = econ.buyLimit - player.venscoin.bought
    }

    // Making purchase. This code executes if no exceptions above are handled
    player.venscoin.boughtPrice = market.lastPrice
    player.venscoin.amount += param / market.lastPrice
    player.finance -= param

    // Additional calculations for taxes
    player.venscoin.bought += param

    // Updating market price
    updateMarket(bot, market, econ, "buy", param, player.name)

    return `<a href="tg://user?id=${player.id}">${player.name}</a> buys VNC\n>Purchase: ${priceLayout(param)}\n>Bought by: ${priceLayout(player.venscoin.boughtPrice)}\n>Bought: ${priceLayout(player.venscoin.bought)}`
}

// Function to sell venscoins
function sell(bot, market, econ, text, player) {

    let param = null

    // Calculating player capital of venscoin
    let venscoinCapital = getVenscoinCapital(market, player.venscoin.amount)

    // Working with text and checking if the request is correct
    if (/\/sell(@venscoinbot)? +\d{0,3}%/.test(text)) {
        param = (parseInt(/\d+/.exec(text)[0]) / 100) * venscoinCapital
    } else if (/\/sell(@venscoinbot)? +\d+k|к/.test(text) && !text.includes("%")) {
        param = parseInt(/\d+/.exec(text)[0]) * 1000
    } else if (/\/sell(@venscoinbot)? +\d+/.test(text)) {
        param = parseInt(/\d+/.exec(text)[0])
    } else if (/\/sell(@venscoinbot)? +all/.test(text) || text === "/sell" || text === "/sell@venscoinbot") {
        param = venscoinCapital
    } else {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, incorrect request. Correct request example:\n<code>/sell 1000</code> || <code>/sell 10k</code> || <code>/sell 10%</code> || <code>/sell all</code> || <code>/sell</code>`
    }

    // Some exclusions
    if (param > venscoinCapital && venscoinCapital >= 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot sell ${priceLayout(param)} worth VNC, because you have only ${priceLayout(venscoinCapital)} worth VNC`
    } else if (venscoinCapital < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have any VNC left to sell`
    }

    // param in venscoin
    let paramVenscoin = param / market.lastPrice

    // Calculating income or loose
    let change = param - (player.venscoin.bought / player.venscoin.amount) * paramVenscoin

    // Declaring additional message about sale: income or loose
    let changeMsg = ""
    let taxes = 0

    // Calculating taxes and initializing changeMsg
    if (change > 0) {

        // Calulating taxes. The default value is 5% 
        taxes = econ.tax * change

        // Taxes fill the fund
        market.fund += taxes

        // Reducing income after taxes
        param -= taxes

        changeMsg = `>Income: ${priceLayout(change)}\n>Taxes: ${priceLayout(taxes)}\n>Profit: ${priceLayout(change - taxes)}`

    } else if (change < 0) {

        // Player looses fill the market.fund
        market.fund += abs(change)

        changeMsg = `>You lost ${priceLayout(abs(change))}`

    } else {
        changeMsg = `>Zero income`
    }

    // Making sale
    player.venscoin.bought -= (player.venscoin.bought / player.venscoin.amount) * paramVenscoin
    player.venscoin.amount -= paramVenscoin
    player.finance += param

    // If player sells everything, then boughtPrice is 0
    if (player.venscoin.amount * market.lastPrice < 1) {
        player.venscoin.boughtPrice = 0
        player.venscoin.amount = 0
        player.venscoin.bought = 0
    }

    // Influence of the market after sale
    updateMarket(bot, market, econ, "sell", param, player.name)

    return `<a href="tg://user?id=${player.id}">${player.name}</a> sells ${priceLayout(param + taxes)} worth VNC\n${changeMsg}`
}

// Function to mine venscoins
function mine(market, player, econ) {

    // Checking if player already mined today
    if (player.mined) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you have already mined today. The crypto farm is cooling down`
    }

    // Calculating how much VNC user will mine
    let venscoinMined = player.farm

    // Mined VNC in dollars
    let venscoinMinedCapital = getVenscoinCapital(market, venscoinMined)

    // Changing player parameters due to mined VNC, so he cannot mine more this day
    player.venscoin.amount += venscoinMined
    player.mined = true

    return `<a href="tg://user?id=${player.id}">${player.name}</a>, \nYou've mined <b>${venscoinMined.toFixed(6)} VNC - ${priceLayout(venscoinMinedCapital)}</b>\n>Your VNC: ${player.venscoin.amount.toFixed(6)} - ${priceLayout(getVenscoinCapital(market, player.venscoin.amount))}\n>Capital: ${priceLayout(getCapital(market, player, econ))}`

}

// Function to invest money in cryptofarm
function invest(market, econ, text, player) {

    let param = null

    // Working with text and checking if the request is correct
    if (/\/invest(@venscoinbot)? +\d+k|к/.test(text)) {
        param = parseInt(/\d+/.exec(text)[0]) * 1000
    } else if (/\/invest(@venscoinbot)? +\d+/.test(text)) {
        param = parseInt(/\d+/.exec(text)[0])
    } else if (text === "/invest all" || text === "/invest@venscoinbot all") {
        param = player.finance
    } else {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, incorrect request. Correct request example:\n<code>/invest 1000</code> || <code>/invest 2k</code> || <code>/invest all</code>`
    }

    // Some exclusions 
    if (player.farm === econ.farm.max) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, your cryptofarm cannot be bigger. It has reached maximum of its productivity`
    } else if (player.finance < param && player.finance >= 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot invest ${priceLayout(param)}, because your finances are ${priceLayout(player.finance)} only`
    } else if (player.finance < 1 && getVenscoinCapital(market, player.venscoin.amount) > 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you cannot invest, because all your money is in VNC`
    } else if (player.finance < 1 && getVenscoinCapital(market, player.venscoin.amount) < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have any money to invest`
    }

    // Calculation of investment
    let rise = param / econ.farm.price
    player.farm += rise
    player.finance -= param

    // Limit for investments into cryptofarm
    if (player.farm > econ.farm.max) {
        player.finance += (econ.farm.max - player.farm) * econ.farm.price
        player.farm = 5
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, your cryptofarm has reached maximum of its productivity\n>Productivity: ${econ.farm.max.toFixed(6)}`
    }

    return `<a href="tg://user?id=${player.id}">${player.name}</a>, you've invested ${priceLayout(param)} into crypto farm\n>Growth: +${rise.toFixed(6)}\n>Productivity: ${player.farm.toFixed(6)}`

}

// Function to give some player your finance
function give(market, players, msg, giver) {

    // text, repliedMsg, giver
    let text = msg.text
    let repliedMsg = msg.reply_to_message

    // Exclusions if there is no replied message or someone is a bot
    if (!repliedMsg) {

        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, please reply that user message, who you wish to give some money`

    } 

    // If replied message is sent by user, which is not a player yet, then create a new player before giving him money
    if (!isUserPlayer(players, repliedMsg.from.id)) {
        players.push(createPlayer(repliedMsg.from))
    } 
    let recipient = getPlayer(players, repliedMsg.from.id)


    let param = null

    // Working with text and checking if the request is correct
    if (/\/give(@venscoinbot)? +\d{0,3}%/.test(text)) {
        param = (parseInt(/\d+/.exec(text)[0]) / 100) * giver.finance
    } else if (/\/give(@venscoinbot)? +\d+k|к/.test(text) && !text.includes("%")) {
        param = parseInt(/\d+/.exec(text)[0]) * 1000
    } else if (/\/give(@venscoinbot)? +\d+/.test(text)) {
        param = parseInt(/\d+/.exec(text)[0])
    } else if (text === "/give all" || text === "/give@venscoinbot all") {
        param = giver.finance
    } else {
        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, incorrect request. Correct request example:\n<code>/give 1000</code> || <code>/give 10k</code> || <code>/give 10%</code> || <code>/give all</code>`
    }

    // Some exclusions 
    if (param > giver.finance && giver.finance >= 1) {

        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, wow, you are so generous! The problem is you don't have ${priceLayout(param)}. Your finances are ${priceLayout(giver.finance)} only`

    } else if (param > giver.finance && getVenscoinCapital(market, giver.venscoin.amount) >= 1) {

        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, you don't have any cash, there is ${priceLayout(getVenscoinCapital(market, giver.venscoin.amount))} of VNC on your account\nCopy: <code>/sell ${param}</code>`

    } else if (giver.finance < 1 && getVenscoinCapital(market, giver.venscoin.amount) < 1) {

        return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, well, this is good deed, buy you don't have any money`

    }

    // If everything is okay, then calculate transaction, but first calculate comission
    let comission = Math.floor(param * 0.05)
    market.fund += comission

    giver.finance -= param
    recipient.finance += param - comission

    return `<a href="tg://user?id=${giver.id}">${giver.name}</a>, you've supported <a href="tg://user?id=${recipient.id}">${recipient.name}</a> with ${priceLayout(param - comission)}\n>Commission: ${priceLayout(comission)}`

}

// Function which returns string object of top-10 players by capital
function getForbes(market, players, econ) {

    // Updating player capitals due to last market price
    for (player of players) {
        player.capital = getCapital(market, player, econ)
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
            reply += `${priceLayout(players[i].capital)} - ${players[i].name}\n`
        }
    }
    reply += "</code>"

    return reply

}

// Function to get readme text
function getReadme() {
    return `<a href="https://telegra.ph/venscoin-01-13">Gameplay & Update news</a>`
}

// Function to get readme text
function start() {
    return `Hi there! You better go @nause121 to play there, buy you can try the game here\n\nCall: /market and /about`
}

// Function to buy a painting
function art(econ, player, artCounter) {

    // If player doesn't have enough money
    if (player.finance < econ.artPrice) {
        return {message: `<a href="tg://user?id=${player.id}">${player.name}</a>, you don't have enough cash. The default painting price is ${priceLayout(econ.artPrice)}\n>Finance: ${priceLayout(player.finance)}`}
    }

    // Operating purchase
    player.finance -= econ.artPrice
    player.gallery++

    // Increasing artCounter to send the next painting after this purchase
    artCounter++

    return { message: `<a href="tg://user?id=${player.id}">${player.name}</a> buys a painting`, photoPath: `gallery/img${artCounter}.jpg`, artCounter: artCounter }

}