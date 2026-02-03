
const socket = io();
const MAX_TOP = 9;
const MIN_TOP = 5;
const MAX_OTHERS = 20;

let topOpps = [];
let otherOpps = [];

socket.on("update", (data) => {
    const topDiv = document.getElementById("top-opportunities");
    const otherDiv = document.getElementById("other-opportunities");

    if(data.opportunities && data.opportunities.length > 0){

        // Ordena oportunidades pelo crossRate decrescente
        const sorted = data.opportunities.sort((a,b) => {
            const rateA = parseFloat(a.text.split("=").pop());
            const rateB = parseFloat(b.text.split("=").pop());
            return rateB - rateA;
        });

        // Adiciona novas oportunidades ao top se maior que o menor do topo ou ainda não atingiu MIN_TOP
        sorted.forEach(o => {
            const rateO = parseFloat(o.text.split("=").pop());
            
            if(topOpps.length < MIN_TOP) {
                if(!topOpps.some(e => e.text === o.text)){
                    topOpps.push(o);
                }
            } else {
                let minRate = Math.min(...topOpps.map(e => parseFloat(e.text.split("=").pop())));
                if(rateO > minRate && !topOpps.some(e => e.text === o.text)){
                    // substitui o menor
                    const index = topOpps.findIndex(e => parseFloat(e.text.split("=").pop()) === minRate);
                    const removed = topOpps.splice(index,1)[0];
                    otherOpps.push(removed);
                    if(otherOpps.length > MAX_OTHERS) otherOpps.shift();
                    topOpps.push(o);
                } else if(!otherOpps.some(e => e.text === o.text)){
                    otherOpps.push(o);
                    if(otherOpps.length > MAX_OTHERS) otherOpps.shift();
                }
            }
        });

        // Ordena top por crossRate decrescente
        topOpps.sort((a,b) => parseFloat(b.text.split("=").pop()) - parseFloat(a.text.split("=").pop()));

        // Atualiza container top
        topDiv.innerHTML = "";
        topOpps.forEach(o => {
            const p = document.createElement("div");
            p.className = "opp";
            p.innerHTML = `<span class="text">${o.text}</span> <span class="retorno">${o.retorno}</span>`;
            topDiv.appendChild(p);
        });

        // Atualiza container outras oportunidades
        otherDiv.innerHTML = "";
        otherOpps.forEach(o => {
            const p = document.createElement("div");
            p.className = "opp";
            p.innerHTML = `<span class="text">${o.text}</span> <span class="retorno">${o.retorno}</span>`;
            otherDiv.appendChild(p);
        });
    }
});