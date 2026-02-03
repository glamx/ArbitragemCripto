const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const stream = require("./stream");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const QUOTE = process.env.QUOTE;
const AMOUNT = parseInt(process.env.AMOUNT);
const PROFITABILITY = parseFloat(process.env.PROFITABILITY);
const { exchangeInfo } = require("./api");

let allSymbols = [];
let buySymbols = [];
let buyBuySellPairs = [];

// Função para descobrir todos os pares BBS
function getBuyBuySell(buySymbols, allSymbols, book) {
    const buyBuySell = [];
    for (let i = 0; i < buySymbols.length; i++) {
        const buy1 = buySymbols[i];
        const right = allSymbols.filter(s => s.quote === buy1.base);

        for (let j = 0; j < right.length; j++) {
            const buy2 = right[j];

            // Ignora se buy2 não tem preço no book
            if (!book || !book[buy2.symbol]) continue;

            const sell1 = allSymbols.find(s => s.base === buy2.base && s.quote === buy1.quote);
            if (!sell1 || !book[sell1.symbol]) continue;

            buyBuySell.push({ buy1, buy2, sell1 });
        }
    }
    return buyBuySell;
}



// Função que processa e retorna oportunidades com preços
function processBuyBuySell(buyBuySell) {
    const opportunities = [];
    const book = stream.getBook();

    for (let i = 0; i < buyBuySell.length; i++) {
        const candidate = buyBuySell[i];

        let priceBuy1 = book[candidate.buy1.symbol];
        let priceBuy2 = book[candidate.buy2.symbol];
        let priceSell1 = book[candidate.sell1.symbol];

        if (!priceBuy1 || !priceBuy2 || !priceSell1) continue;

        priceBuy1 = parseFloat(priceBuy1.price);
        priceBuy2 = parseFloat(priceBuy2.price);
        priceSell1 = parseFloat(priceSell1.price);

        const crossRate = (1 / priceBuy1) * (1 / priceBuy2) * priceSell1;

        if (crossRate > PROFITABILITY) {
            opportunities.push({
                text: `BBS EM ${candidate.buy1.symbol} > ${candidate.buy2.symbol} > ${candidate.sell1.symbol} = ${crossRate}`,
                retorno: `Investindo ${QUOTE}${AMOUNT}, retorna ${QUOTE}${(AMOUNT / priceBuy1 / priceBuy2 * priceSell1)}`
            });
        }
    }

    return opportunities;
}








// Inicializa symbols (como você fazia no index.js)
async function initSymbols() {
    allSymbols = await exchangeInfo();
    buySymbols = allSymbols.filter(s => s.quote === QUOTE);
    
    // Passa o book atual do stream
    buyBuySellPairs = getBuyBuySell(buySymbols, allSymbols, stream.getBook());
    
    console.log("BuyBuySellPairs inicializados:", buyBuySellPairs.length, "pares");
}


initSymbols(); // chama ao iniciar o servidor







// --- Aqui só uma função onPriceUpdate ---
let initialized = false; // para inicializar buyBuySellPairs só uma vez

stream.onPriceUpdate = () => {
    const prices = stream.getBook();

    // Inicializa os pares BBS apenas quando o book tiver alguns preços
    if (!initialized && Object.keys(prices).length > 5) { // 5 é apenas um número mínimo
        initSymbols(); // função que chama exchangeInfo e cria buyBuySellPairs
        initialized = true;
    }

    // Calcula oportunidades
    const opportunities = processBuyBuySell(buyBuySellPairs);

    // Envia para o navegador
    io.emit("update", { prices, opportunities });

    
};









app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
