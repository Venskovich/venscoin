// Setting up telegram bot
const TelegramApi = require("node-telegram-bot-api")
const token = require("./token")
const bot = new TelegramApi(token, { polling: true })

// Import - variables
var specialChatId = require("./specialChatId.json")
var stats = require("./stats.json")
var players = require("./players.json")
var market = require("./market.json")
var econ = require("./econ.json")
var banlist = require("./banlist.json")
var developer = require("./developer.json")
var artCounter = require("./artCounter.json")

// Import - functions
var { getStats, ban } = require("./devFunctions")
var { getName, isRequest, getDelay, getUpdateMarketBahaviorDelay, savePlayers, saveStats, saveBanlist, saveMarket, sendMessage, sendMessageEverywhere, deleteMessages, deleteAllMarketMessages, saveArtCounter, getGalleryLength } = require("./otherFunctions")
var { createPlayer, getUserInfo, getPlayer, updateMined, updateActive, isUserPlayer } = require("./playerFunctions")
var { updateMarket, updateMarketBehavior, getMarketInfo, getFund, getMarketMsg, financeHelp, arrestFarm } = require("./marketFunctions")
var { buy, sell, mine, invest, give, getForbes, getReadme, start, art } = require("./commandFunctions")


// Setting up commands
bot.setMyCommands([
    { command: "/market", description: "Stock-Market" },
    { command: "/buy", description: "Buy VNC" },
    { command: "/sell", description: "Sell VNC" },
    { command: "/mine", description: "Mine" },
    { command: "/about", description: "Player info" },
    { command: "/forbes", description: "Forbes" },
    { command: "/invest", description: "Invest into crypto farm" },
    { command: "/give", description: "Give someone money" },
    { command: "/art", description: "Buy a painting" },
    { command: "/fund", description: "Fund info" },
    { command: "/readme", description: "Gameplay & Updates news" }
])

// Creating these variables to make it easier to operate with commands
const commands = {
    market: "/market",
    buy: "/buy",
    sell: "/sell",
    mine: "/mine",
    about: "/about",
    forbes: "/forbes",
    invest: "/invest",
    give: "/give",
    art: "/art",
    fund: "/fund",
    readme: "/readme",

    stats: "/stats@venscoinbot",
    update: "/update@venscoinbot",
    ban: "/ban@venscoinbot",

    start: "/start"
}
const allCommands = ["/market", "/market@venscoinbot", "/buy", "/buy@venscoinbot", "/sell", "/sell@venscoinbot", "/mine", "/mine@venscoinbot", "/about", "/about@venscoinbot", "/forbes", "/forbes@venscoinbot", "/invest", "/invest@venscoinbot", "/give", "/give@venscoinbot", "/art", "/art@venscoinbot", "/fund", "/fund@venscoinbot", "/readme", "/readme@venscoinbot", "/start", "/start@venscoinbot"]
const devCommands = ["/stats@venscoinbot", "/update@venscoinbot", "/ban@venscoinbot"]


 

// Main
bot.on("message", msg => {

    // Creating these variables to make it easier to operate with message
    let text = msg.text.toLowerCase()
    let user = msg.from
    let chatId = msg.chat.id
    let msgId = msg.message_id
    let repliedMsg = msg.reply_to_message ? msg.reply_to_message : null


    // Declaring player variable. It is initialized if the user calls any bot command
    // Declared to make it easier to operate with player data
    let player = null


    // Developer commands
    if (devCommands.includes(text) && user.id === developer.id) {

        if (text.includes(commands.stats)) {

            sendMessage(bot, chatId, getStats(stats))

        } else if (text.includes(commands.update)) {

            updateMined(players)
            sendMessage(bot, chatId, `Dev in da house: mining is available again`)
            savePlayers(players)

            // Deleting message
            deleteMessages(bot, chatId, msgId, false)
            return

        } else if (text.includes(commands.ban)) {

            sendMessage(bot, chatId, ban(repliedMsg, banlist, developer))
            saveBanlist(banlist)

            // Deleting message
            deleteMessages(bot, chatId, msgId, false)
            return

        }
        

        // Deleting messages
        deleteMessages(bot, chatId, msgId, true, 10)
        return

    }


    // If a message is not a command request, then ignore it and do not execute the following code
    // The same is if message was sent by bot
    // Otherwise create the new player or initialize it
    if (!isRequest(allCommands, text) || user.is_bot || (repliedMsg && repliedMsg.from.is_bot)) {

        return

    } else {

        if (!isUserPlayer(players, user.id)) {
            players.push(createPlayer(user))
        } 

        player = getPlayer(players, user.id)

    }


    // Command for market
    if (text.includes(commands.market)) {

        // First deleting request message 
        deleteMessages(bot, chatId, msgId, false)

        let marketMsg = getMarketMsg(market, chatId)

        // If there is no sent market mesage, then create the one and push it to market data base
        if (!marketMsg) {

            marketMsg = {
                chatId: chatId,
                msgId: msgId + 1
            }

            market.message.push(marketMsg)

        } else {

            // Deleting the previous marketMsg if it still exists
            if (marketMsg.msgId && marketMsg.chatId) {
                deleteMessages(bot, marketMsg.chatId, marketMsg.msgId, false)
            }

            // Updating marketMsg object, which will be used to update the sent message in updateMarket() function later
            marketMsg.msgId = msgId + 1

        }

        // Sending the new marketMsg
        sendMessage(bot, chatId, getMarketInfo(market))

        // Pinning the message
        bot.pinChatMessage(marketMsg.chatId, marketMsg.msgId)

        // Saving data
        stats++
        saveMarket(market)

        return

    }

    // Main bot commands
    if (text.includes(commands.buy)) {

        sendMessage(bot, chatId, buy(bot, market, econ, text, player))

    } else if (text.includes(commands.sell)) {

        sendMessage(bot, chatId, sell(bot, market, econ, text, player))

    } else if (text.includes(commands.mine)) {

        sendMessage(bot, chatId, mine(market, player, econ))

    } else if (text.includes(commands.about)) {

        // If you wish to see info about other user, then reply his message and call /about command
        if (repliedMsg) {

            if (!isUserPlayer(players, repliedMsg.from.id)) {
                players.push(createPlayer(repliedMsg.from))
            } 
            
            player = getPlayer(players, repliedMsg.from.id)
            
        }
        
        
        sendMessage(bot, chatId, getUserInfo(players, market, econ, player))

    } else if (text.includes(commands.forbes)) {

        sendMessage(bot, chatId, getForbes(market, players, econ))

    } else if (text.includes(commands.invest)) {

        sendMessage(bot, chatId, invest(market, econ, text, player))

    } else if (text.includes(commands.give)) {

        // It is forbidden to make transaction from twink
        if (banlist.includes(user.id)) {
            sendMessage(bot, chatId, `<a href="tg://user?id=${user.id}">${getName(user)}</a>, you are not allowed to give someone money`)
            deleteMessages(bot, chatId, msgId, true)
            return
        }

        // If everything is okay, then execute the command
        sendMessage(bot, chatId, give(market, players, msg, player))

    } else if (text.includes(commands.art)) {

        // Initializing the return of the function : message (as text) and photoPath if exists
        let reply = art(econ, player, artCounter)

        sendMessage(bot, chatId, reply.message)

        // If there is any path to photo, this means player has bought a photo
        if (reply.photoPath) {

            bot.sendPhoto(chatId, reply.photoPath)
            artCounter = reply.artCounter
            saveArtCounter(artCounter)

        }

    } else if (text.includes(commands.fund)) {

        sendMessage(bot, chatId, getFund(market, players))

    } else if (text.includes(commands.readme)) {

        sendMessage(bot, chatId, getReadme())

    } else if (text.includes(commands.start)) {

        sendMessage(bot, chatId, start())

    }

    // Make player active status true if he called appropriate functions
    if (text.includes(commands.buy) || text.includes(commands.sell) || text.includes(commands.mine)) {
        player.active = true
    }

    // If a player plays the game outside the chat the bot was created for, then warn him to play venscoinbot there
    if (chatId != specialChatId) {

        sendMessage(bot, chatId, `Play there: @nause121`)

        // Saving data
        stats++
        savePlayers(players)
        saveStats(stats)

        return

    }

    // Deleting messages
    if (text.includes(commands.forbes) || text.includes(commands.readme)) {

        deleteMessages(bot, chatId, msgId, true, 60)

    } else if (text.includes(commands.give) || text.includes(commands.art)) {

        deleteMessages(bot, chatId, msgId, false)

    } else {

        deleteMessages(bot, chatId, msgId, true)

    }


    // Saving data
    stats++
    savePlayers(players)
    saveStats(stats)

})




// Updating mined status at 6am and 5pm
setTimeout(function () {

    updateMined(players)
    sendMessageEverywhere(financeHelp(bot, market, players, econ))
    updateActive(players)
    sendMessageEverywhere(arrestFarm(bot, players, econ))

    // Saving changes
    savePlayers(players)

    setInterval(function () {

        updateMined(players)
        sendMessageEverywhere(financeHelp(bot, market, players, econ))
        updateActive(players)
        sendMessageEverywhere(arrestFarm(bot, players, econ))

        // Saving changes
        savePlayers(players)

    }, 24 * 60 * 60 * 1000)

}, getDelay(6))

setTimeout(function () {

    updateMined(players)
    sendMessageEverywhere(financeHelp(bot, market, players, econ))
    updateActive(players)
    sendMessageEverywhere(arrestFarm(bot, players, econ))

    // Saving changes
    savePlayers(players)

    setInterval(function () {

        updateMined(players)
        sendMessageEverywhere(financeHelp(bot, market, players, econ))
        updateActive(players)
        sendMessageEverywhere(arrestFarm(bot, players, econ))

        // Saving changes
        savePlayers(players)

    }, 24 * 60 * 60 * 1000)

}, getDelay(17))

// Updating market behavior regularly: whether the price will rise or go down
setTimeout(function () {

    updateMarketBehavior(market, econ)
    saveMarket(market)

    setInterval(function () {

        updateMarketBehavior(market, econ)
        saveMarket(market)

    }, 30 * 60 * 1000)

}, getUpdateMarketBahaviorDelay())

// Updating market regularly
setInterval(function () {

    updateMarket(bot, market, econ)
    saveMarket(market)

}, 15 * 1000)

// Clearing up market messages objects regularly
// This is done to not to edit it in nonactive chats
setTimeout(function() {

    deleteAllMarketMessages(bot, market)
    saveMarket(market)

    setInterval(function() {

        deleteAllMarketMessages(bot, market)
        saveMarket(market)

    }, 24 * 60 * 60 * 1000)

}, getDelay(0))