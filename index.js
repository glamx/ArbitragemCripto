
const { exchangeInfo } = require("./api");
 
const stream = require("./stream");

const QUOTE = process.env.QUOTE;
const AMOUNT = parseInt(process.env.AMOUNT);
const PROFITABILITY = parseFloat(process.env.PROFITABILITY);
//require('dotenv').config()
 




function getBuyBuySell(buySymbols, allSymbols){
    const buyBuySell = [];

    for (let i = 0; i < buySymbols.length; i++) {
        const buy1 = buySymbols[i];
        
        const right = allSymbols.filter(s => s.quote === buy1.base);

        for (let j = 0; j < right.length; j++) {
            const buy2 = right[j];
            
            const sell1 = allSymbols.find(s => s.base === buy2.base && s.quote === buy1.quote);
            if(!sell1) continue

            buyBuySell.push({ buy1, buy2, sell1 })
        }
    }

    return buyBuySell;
}


function getBuySellSell(sellSymbols){
const buySellSell = [];

    for (let i = 0; i < sellSymbols.length; i++) {
        const buy1 = sellSymbols[i];
        
        const right = buySellSell.filter(s => s.quote === buy1.base && s.quote !== buy1.quote);

        for (let j = 0; j < right.length; j++) {
            const sell1 = right[j];
            
            const sell2 = allSymbols.find(s => s.base === sell1.quote && s.quote === buy1.quote);
            if(!sell2) continue

            buySellSell.push({ buy1, sell1, sell2 })
        }
    }

    return buySellSell;
}




function getSymbolMap(symbols){
    const map = {};
    symbols.map(s => map[s.symbol] = s);
    return map;
}


function processBuyBuySell(buyBuySell) {
    for (let i = 0; i < buyBuySell.length; i++) {
        const candidate = buyBuySell[i];

        //verificar se ja temos os preços
        let priceBuy1 = stream.getBook(candidate.buy1.symbol);

        if(!priceBuy1)continue
        priceBuy1 = parseFloat(priceBuy1.price);

        let priceBuy2 = stream.getBook(candidate.buy2.symbol);
        if(!priceBuy2)continue
        priceBuy2 = parseFloat(priceBuy2.price);

        let priceSell1 = stream.getBook(candidate.sell1.symbol);
        if(!priceSell1)continue
        priceSell1 = parseFloat(priceSell1.price);

        const crossRate = (1/priceBuy1) * (1/priceBuy2) * priceSell1
        if(crossRate > PROFITABILITY){
            console.log(`BBS EM ${candidate.buy1.symbol} > ${candidate.buy2.symbol} > ${candidate.sell1.symbol} = ${crossRate}`);
            console.log(`Investindo ${QUOTE}${AMOUNT}, retorna ${QUOTE}${(AMOUNT / priceBuy1)/ priceBuy2 * priceSell1} `)
        }
    }
}
function processBuySellSell(buySellSell) {
for (let i = 0; i < buySellSell.length; i++) {
        const candidate = buySellSell[i];

        //verificar se ja temos os preços
        let priceBuy1 = stream.getBook(candidate.buy1.symbol);
        
        if(!priceBuy1)continue
        priceBuy1 = parseFloat(priceBuy1.price);

        let priceSell1 = stream.getBook(candidate.sell1.symbol);
        if(!priceBuy2)continue
        priceBuy2 = parseFloat(priceBuy2.price);

        let priceSell2 = stream.getBook(candidate.sell2.symbol);
        if(!priceSell2)continue
        priceSell2 = parseFloat(priceSell2.price);

        const crossRate = (1/priceBuy1) * (1/priceBuy2) * priceSell1
        if(crossRate > PROFITABILITY){
            console.log(`BSS EM ${candidate.buy1.symbol} > ${candidate.sell1.symbol} > ${candidate.sell2.symbol} = ${crossRate}`);
            console.log(`Investindo ${QUOTE}${AMOUNT}, retorna ${QUOTE}${(AMOUNT / priceBuy1) * priceSell1 * priceSell2} `)
        }
    }
}




async function start(){
    console.log('carregando exchange')
    const allSymbols = await exchangeInfo();
    
    

    //moedas q voc pode comprar
    const buySymbols = allSymbols.filter(s => s.quote === QUOTE);
    console.log("EXISTE" + buySymbols.length + "que voc pode Buy");



    //organiza em map para performace
    const symbolsMap = getSymbolMap(allSymbols);


    //descobre todos os pares q podem triangular buy-buy-sell
    const buyBuySell = getBuyBuySell(buySymbols, allSymbols, symbolsMap);
    console.log("there are" + buyBuySell.length + "pairs that we can do BBS");

    //descobre todos os pares q podem triangular buy-sell-sell
    const buySellSell = getBuySellSell(buySymbols, allSymbols, symbolsMap);
    console.log("there are" + buySellSell.length + "pairs that we can do BBS");
    
    

    setInterval(() => {

        processBuyBuySell(buyBuySell);
        processBuySellSell(buySellSell);

    }, process.env.CRAWLER_INTERVAL)
};

start();