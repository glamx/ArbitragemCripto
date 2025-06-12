const axios = require("axios"); //consumir/carregar API'S


async function exchangeInfo(){ //toda funçao que chama api externa sao ASYNC
    const response = await axios.get(`${process.env.API_URL}/v3/exchangeInfo`); //await aguarda a linha responder;
    return response.data.symbols.filter(s => s.status === 'TRADING').map(s => {
return{
            symbol: s.symbol,
            base: s.baseAsset,
            quote: s.quoteAsset
        }
    });

}

module.exports = { exchangeInfo };