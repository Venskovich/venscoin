// Importing 
var { getName } = require("./otherFunctions")

// Export
module.exports = { getStats, ban }


// Developer command / Function to get stats
function getStats(stats) {
    return `stats: ${stats}`
}

// Developer command / Function to ban player transactions
function ban(repliedMsg, banlist, developer) {

    // If there is none message replied, then return message
    if (!repliedMsg) {
        return `<a href="tg://user?id=${developer.id}">${developer.name}</a>, please reply that user message, who you wish to ban`
    }

    // Declaring user to ban profile
    let userToBan = repliedMsg.from
    let reply = `Player <a href="tg://user?id=${userToBan.id}">${getName(userToBan)}</a>`

    // If this user is already banned, then unban him. Otherwise - ban
    if (banlist.includes(userToBan.id)) {

        banlist.splice(banlist.indexOf(userToBan.id), 1)
        reply += ` is free to give money`

    } else {

        banlist.push(userToBan.id)
        reply += ` is forbidden to give money`

    }

    return reply

}