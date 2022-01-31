// Import
var { priceLayout, getName } = require("./otherFunctions")

// Export
module.exports = { createPlayer, getUserInfo, getPlayer, getCapital, getVenscoinCapital, updateMined, updateActive, getForbesPosition, isUserPlayer }


// Function to create player
function createPlayer(user) {

    // Creating new player object
    let newPlayer = {
        id: user.id,
        name: getName(user),
        venscoin: {
            amount: 0,
            boughtPrice: 0,
            bought: 0
        },
        finance: 7000,
        capital: 7000,
        mined: false,
        active: false,
        farm: 1, 
        art: 0
    }

    return newPlayer

}

// Function which finds player by userId and returns it
function getPlayer(players, userId) {

    for (player of players) {
        if (player.id === userId) {
            return player
        }
    }

}

// Function to check whether user with this id is already a player
function isUserPlayer(players, userId) {

    for (player of players) {
        if (player.id === userId) {
            return true
        }
    }

    return false

}

// Function which returns player info in string format for output
function getUserInfo(players, market, econ, player) {

    return `<a href="tg://user?id=${player.id}">${player.name}</a>\nVNC: ${player.venscoin.amount.toFixed(6)} - ${priceLayout(getVenscoinCapital(market, player.venscoin.amount))}\nBought by: ${priceLayout(player.venscoin.boughtPrice)}\n>Bought: ${priceLayout(player.venscoin.bought)}\nCryptofarm: ${player.farm.toFixed(6)}\nFinance: ${priceLayout(player.finance)}\nCapital: ${priceLayout(getCapital(market, player, econ))}\nForbes: ${getForbesPosition(market, econ, players, player.id)} of ${players.length}\nGallery: ${player.art}🖼`

}

// Function to calculate player capital
function getCapital(market, player, econ) {
    return player.finance + getVenscoinCapital(market, player.venscoin.amount) + player.art * econ.artPrice + player.farm * econ.farm.price
}

// Function to calculate venscoin capital
function getVenscoinCapital(market, amount) {
    return amount * market.lastPrice
}

// Function to get player position in Forbes
function getForbesPosition(market, econ, players, playerId) {

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

    // Determing position
    for (let i = 0; i < players.length; i++) {
        if (players[i].id === playerId) {
            return i + 1
        }
    }
}

// Function to update mined status for all players
function updateMined(players) {

    for (player of players) {
        player.mined = false
    }

}

// Function to make players active status false
function updateActive(players) {

    for (player of players) {
        player.active = false
    }

}