const TelegramApi = require("node-telegram-bot-api")
const token = "5050568228:AAFKFO82p1FRz9xskj80bLKgW10GAHONKBc"
const bot = new TelegramApi(token, {polling: true})

bot.setMyCommands([
    {command: "/buy", description: "Купить VNC на {N} долларов"},
    {command: "/sell", description: "Продать VNC на {N} долларов"},
    {command: "/mine", description: "Майнить крипту"},
    {command: "/gamble", description: "Попытать удачу на {N} долларов"},
    {command: "/about", description: "Информация о Ваших вложениях"},
    {command: "/top", description: "Топ-10 игроков по капиталу"},
    {command: "/readme", description: "Про игровой процесс"}
])

const commands = {
    buy: "/buy",
    sell: "/sell",
    mine: "/mine",
    gamble: "/gamble",
    about: "/about",
    top: "/top",
    readme: "/readme",

    market: "/market",
    restart: "/restart@venscoinbot",
    stats: "/stats",
    updateMined: "/updateMined@venscoinbot"
}
const allCommands = [ "/buy", "/buy@venscoinbot", "/sell", "/sell@venscoinbot", "/mine", "/mine@venscoinbot", "/gamble", "/gamble@venscoinbot", "/about", "/about@venscoinbot", "/top", "/top@venscoinbot", "/readme", "/readme@venscoinbot"]
const devCommands = ["/stats", "/restart@venscoinbot", "/updateMined@venscoinbot", "/market", "/market@venscoinbot"]

bot.on("message", msg => {
    let text = msg.text
    let user = msg.from
    let chatId = msg.chat.id
    let msgId = msg.message_id
    let player = null

    // Developer commands
    if(devCommands.includes(text) && user.id == 599100557) {
        if(commands.stats.includes(text)) {
            sendMessage(chatId, `total: ${stats}`)
    
        } else if(commands.restart.includes(text)) {
            restartGame()
            sendMessage(chatId, "Произошел троллинг: игра перезапущена")
    
        } else if(commands.updateMined.includes(text)) {
            updateMined()
            sendMessage(chatId, "Произошел троллинг: можно майнить")

        } else if(commands.market.includes(text)) {
            sendMessage(chatId, getMarketInfo())
            marketMsg = {
                msgId: msgId + 1,
                chatId: chatId
            }
            bot.pinChatMessage(marketMsg.chatId, marketMsg.msgId)
            return;
        }

        deleteMessages(chatId, msgId)
        return;
    }

    // Creating a player, otherwise initializing it
    if(allCommands.includes(text) || text.includes(commands.buy) || text.includes(commands.sell) || text.includes(commands.gamble)) {
        // Appropriate chatId for @venscoin chat
        if(chatId == -1001632682847) {
            createPlayer(user)
            player = getPlayer(user.id)

        } else {
            sendMessage(chatId, "Играй тут: @venscoin")
            return;
        } 

        // For developing
        // createPlayer(user)
        // player = getPlayer(user.id)

    } else {
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
        sendMessage(chatId, getUserInfo(player))

    } else if (text.includes(commands.top)) {
        sendMessage(chatId, getTop())

    } else if (text.includes(commands.readme)) {
        sendMessage(chatId, getReadme())
    }

    // Deleting messages
    if(commands.market.includes(text) || commands.top.includes(text) || commands.readme.includes(text)) {
        deleteMessages(chatId, msgId, 60)

    } else {
        deleteMessages(chatId, msgId)
    }
    
    // Saving data
    stats++
    saveData()
})

const fs = require("fs");
var players = require("./players")
var market = require("./market")
var stats = require("./stats")
var date = new Date()
var marketMsg = null

// Updating some game parametrs
setInterval(function() {

    // Updating mined status when it is a new day
    let newDate = new Date()
    let newDateDate = newDate.getDate()
    let dateDate = date.getDate()
    if(newDateDate != dateDate) {
        date = new Date()
        updateMined()
    }

    // Saving data
    saveData()
}, 1*60*60*1000)

// Updating market regularly
setInterval(function() {

    updateMarket()
}, 15*1000)


function sendMessage(chatId, text) {
    bot.sendMessage(chatId, text, {parse_mode: "HTML"})
}
function deleteMessages(chatId, msgId, delay = 30) {
    setTimeout(function() {
        bot.deleteMessage(chatId, msgId)
    }, 1000)
    setTimeout(function() {
        bot.deleteMessage(chatId, ++msgId)
    }, delay*1000)
}
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
}
function restartGame() {

    // Price
    let newPrice = {
        value: 10000,
        date: getDateNow(),
        change: "x"
    }

    market.price.pop()
    market.price.unshift(newPrice)
    market.lastPrice = market.price[0].value

    // Players
    players = []

    // Saving
    saveData()
}

function priceLayout(price) {

    price = Math.floor(price)
    price = price.toString()
    price = price.split("")
    let newPriceArray = []
    let newPriceString = ""

    for(let i = 0; i < price.length; i++) {
        if (i % 3 == 0 && i != 0) {
            newPriceArray.unshift(",")
        }
        newPriceArray.unshift(price[price.length - 1 - i])
    }

    for (symbol of newPriceArray) {
        newPriceString += symbol
    }

    return `$${newPriceString}`
}
function timeLayout(timeUnit) {
    if(timeUnit < 10) {
        return `0${timeUnit}`
    }
    return timeUnit
}
function getDateNow() {
    let date = new Date()
    let dateDate = date.getDay()

    let week = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
    let day = week[dateDate]
    let hours = timeLayout(date.getHours())
    let minutes = timeLayout(date.getMinutes())
    let seconds = timeLayout(date.getSeconds())

    return `${day}, ${hours}:${minutes}:${seconds}`
}
function getName(user) {
    if(user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`
    } else if(user.first_name) {
        return `${user.first_name}`
    } else if(user.last_name) {
        return `${user.last_name}`
    } else {
        return `Игрок`;
    }
}
function module(param) {
    if(param < 0) {
        return 0 - param
    } 
    return param
}

function updateMarket(status = "regular", param = 100) {

    // If it is purchase or sell on less than 100 dollars, then the price won't change
    if(param < 100) {
        return;
    }

    // Creating new price
    let newPrice = {
        value: 0,
        date: getDateNow(),
        change: ""
    }

    // Declaring new Price change variable
    let change = Math.floor(Math.random()*250 + 51)

    // Variable to get price higher or lower - boolean
    let behavior = null

    if (status == "regular") {
        behavior = Math.floor(Math.random() * 2) == 0 ? true : false

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

    // If price has fallen too low, an appropriate event is executed
    if (newPrice.value < 5000) {
        sendMessage(marketMsg.chatId, "На рынке невиданый бум цен: произошел рост котировок")
        newPrice.value = 40000
        newPrice.change = "+"
    } else if (newPrice.value > 75000) {
        sendMessage(marketMsg.chatId, "На рынке невиданое падение цен: котировки Venscoin обрушились")
        newPrice.value = 40000
        newPrice.change = "-"
    }

    // Pushing newPrice and deleting the oldest one
    market.price.pop()
    market.price.unshift(newPrice)
    market.lastPrice = market.price[0].value

    // Updating message of market info, which should be pinned
    if (marketMsg) {
        bot.editMessageText(getMarketInfo(), {chat_id: marketMsg.chatId, message_id: marketMsg.msgId, parse_mode: "HTML"})
    }
}
function getMarketInfo() {
    let reply = `<code>`
    for(price of market.price) {
        reply += `${price.change} ${priceLayout(price.value)} - ${price.date}\n`
    }
    reply += `</code>`
    return reply
}

function createPlayer(user) {

    if(isUserPlayer(user.id)) {
        return;
    }

    let newPlayer = {
        id: user.id,
        name: getName(user),
        venscoin: {
            amount: 0, 
            boughtPrice: 0
        },
        finance: 7000,
        capital: 7000,
        mined: false
    }

    players.push(newPlayer)
}
function getPlayer(userId) {
    for(player of players) {
        if(player.id == userId) {
            return player;
        }
    }
}
function isUserPlayer(userId) {
    for(player of players) {
        if(player.id == userId) {
            return true;
        }
    }
    return false;
}
function getUserInfo(player) {
    return `<a href="tg://user?id=${player.id}">${player.name}</a>\nVNC: ${player.venscoin.amount.toFixed(4)} - ${priceLayout(getVenscoinCapital(player.venscoin.amount))}\nВхождение: ${priceLayout(player.venscoin.boughtPrice)}\nФинансы: ${priceLayout(player.finance)}\nКапитал: ${priceLayout(getCapital(player))}`;
}
function getCapital(player) {
    return player.finance + getVenscoinCapital(player.venscoin.amount);
}
function getVenscoinCapital(amount) {
    return amount * market.lastPrice
}

function buy(text, player) {

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if((items.length != 2 || !parseInt(param) || parseInt(param) < 0) && param != "all") {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, неверная команда. Пример правильной команды:\n${commands.buy} 1000`
    }

    // Parsing string and initializing param
    if(param == "all") {
        param = player.finance
    } else {
        param = Math.floor(parseInt(param))
    }

    // Some exclusions 
    if(player.finance < param && player.finance >= 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, Вы не можете купить VNC на ${priceLayout(param)}, поскольку Ваши финансы всего ${priceLayout(player.finance)}`
    } else if (player.finance < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, Вы не можете купить больше VNC, поскольку все Ваши средства уже вложены в VNC`
    }

    // Making purchase. This code executes if no exceptions above are handled
    player.venscoin.boughtPrice = market.lastPrice
    player.venscoin.amount += param / player.venscoin.boughtPrice
    player.finance -= param

    // Updating market price 
    updateMarket("buy", param)

    return `<a href="tg://user?id=${player.id}">${player.name}</a> приобретает VNC \n>Сумма покупки: ${priceLayout(param)} \n>Вхождение: ${priceLayout(player.venscoin.boughtPrice)}`
}

function sell(text, player) {

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if((items.length != 2 || !parseInt(param) || parseInt(param) < 0) && param != "all") {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, неверная команда. Пример правильной команды:\n${commands.sell} 1000`
    }

    // Calculating player capital of venscoin
    let venscoinCapital = getVenscoinCapital(player.venscoin.amount)

    // Parsing string and initializing param
    if(param == "all") {
        param = venscoinCapital
    } else {
        param = Math.floor(parseInt(param))
    }

    // Some exclusions
    if(param > venscoinCapital && venscoinCapital >= 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, Вы не можете продать VNC на ${priceLayout(param)}, поскольку у Вас VNC всего на ${priceLayout(venscoinCapital)}`
    } else if(venscoinCapital < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, Вы не можете продать больше VNC, поскольку у Вас нет никаких вложений в VNC`
    }

    // param in venscoin
    paramVenscoin = param / market.lastPrice

    // Making sale
    player.venscoin.amount -= paramVenscoin
    player.finance += param

    // Calculating change according to boughtPrice
    // It will work better if there is an array of {boughtValue, boughtPrice}
    let change = module(paramVenscoin * player.venscoin.boughtPrice - paramVenscoin * market.lastPrice)
    let changeMsg = `Вы вышли в `

    if (player.venscoin.boughtPrice < market.lastPrice) {
        changeMsg += `плюс на ${priceLayout(change)}` 

    } else if (player.venscoin.boughtPrice > market.lastPrice) {
        changeMsg += `минус на ${priceLayout(change)}` 

    } else {
        changeMsg += "ноль"
    }

    // If player sells everything, then boughtPrice is 0
    if(player.venscoin.amount * market.lastPrice < 1) {
        player.venscoin.boughtPrice = 0
    }

    // Updating market price 
    updateMarket("sell", param)

    return `<a href="tg://user?id=${player.id}">${player.name}</a> продает VNC на сумму ${priceLayout(param)}\n>${changeMsg}` 
}

function mine(player) {

    // Checking if player already mined today
    if(player.mined == true) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, Вы сегодня уже майнили. Ваш компьютер отдыхает`
    }

    // Declaring variable on amount of mained VNC
    let venscoinMined = null

    // Different mine ranges : players with high capital will mine less VNC then those with small capital
    if(getCapital(player) < market.lastPrice) {
        venscoinMined = Math.floor(Math.random()*100 + 100) / 1000
    } else {
        venscoinMined = Math.floor(Math.random()*900 + 100) / 10000
    }

    // Mined VNC in dollars
    let venscoinMinedCapital = getVenscoinCapital(venscoinMined)

    // Changing user parameters due to mined VNC
    player.venscoin.amount += venscoinMined
    player.mined = true    

    return `<a href="tg://user?id=${player.id}">${player.name}</a>, \nВы намайнили <b>${venscoinMined.toFixed(4)} VNC - ${priceLayout(venscoinMinedCapital)}</b>\n>Ваш VNC: ${player.venscoin.amount.toFixed(4)} - ${priceLayout(getVenscoinCapital(player.venscoin.amount))}\n>Ваш капитал: ${priceLayout(getCapital(player))}`
}
function updateMined() {
    for(player of players) {
        player.mined = false
    }
}

function gamble(text, player) {

    // Working with text
    text = text.toLowerCase()
    let items = text.split(" ")
    let param = items[1]

    // Checking if the request is correct
    if((items.length != 2 || !parseInt(param) || parseInt(param) < 0) && param != "all") {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, неверная команда. Пример правильной команды:\n${commands.gamble} 1000`
    }

    // Parsing string and initializing param
    if(param == "all") {
        param = player.finance
    } else {
        param = Math.floor(parseInt(param))
    }

    // Some exclusions 
    if(param < 100) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, начальная ставка - ${priceLayout(100)}`
    } 

    // Gamble game result 

    let range = 2 + Math.floor(getCapital(player) / market.lastPrice)

    // Behavior for winning money
    
    if (Math.floor(Math.random() * range) == 0) {
        player.finance += param 
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, Вы добились успеха и подняли ${priceLayout(param)}\n>Ваши финансы: ${priceLayout(player.finance)}`
    }

    // Behavior for losing money

    player.finance -= param

    if (player.finance < 1) {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, Вас постигла неудача и Вы спустили все личные средства. Продайте немного VNC, чтобы сыграть заново`
    } else {
        return `<a href="tg://user?id=${player.id}">${player.name}</a>, Вас постигла неудача и Вы спустили ${priceLayout(param)}\n>Ваши финансы: ${priceLayout(player.finance)}`
    }
}

function getTop() {
    for(player of players) {
        player.capital = getCapital(player)
    }

    players.sort(function (a, b) {
        if (a.capital < b.capital) {
          return 1;
        }
        if (a.capital > b.capital) {
          return -1;
        }
        return 0;
    });

    let reply = "<code>"
    for(let i = 0; i < 10; i++) {
        if(players[i]) {
            reply += `${priceLayout(players[i].capital)} - ${players[i].name}\n`
        }
    }
    reply += "</code>"

    return reply
}
function getReadme() {
    return `<a href="https://telegra.ph/venscoin-01-13">VensCoin - Про игровой процесс</a>`
}