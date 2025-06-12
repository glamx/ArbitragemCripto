const WebSocket = require("ws");
require('dotenv').config()

const ws = new WebSocket(`${process.env.STREAM_URL}/!miniTicker@arr`);

const book = {};


ws.onmessage = async (event) => {
    
    const arr = JSON.parse(event.data)
     arr.map(obj => book[obj.s] = { price: parseFloat(obj.c)})
    //console.log(arr)
}

function getBook(symbol) {
    return book[symbol]
}

module.exports = {
    getBook
}