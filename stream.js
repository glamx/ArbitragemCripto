const WebSocket = require("ws");
require('dotenv').config();

const ws = new WebSocket(`${process.env.STREAM_URL}/!miniTicker@arr`);
const book = {};

ws.onmessage = (event) => {
    const arr = JSON.parse(event.data);
    arr.forEach(obj => book[obj.s] = { price: parseFloat(obj.c) });

    if (module.exports.onPriceUpdate) module.exports.onPriceUpdate();
}

function getBook() {
    return book;
}

module.exports = { getBook, onPriceUpdate: null };
