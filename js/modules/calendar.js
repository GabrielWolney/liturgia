import { eventos2026 } from "../data/eventos-2026.js";
import { abrirModal } from "../utils/dom-utils.js";

let dataAtual = new Date(); 


let containerGrid = null;
let containerHeader = null;
let containerDetalhes = null;

export const abrirCalendario = () => {
    abrirModal("modalCalendario");
    setTimeout(() => {
        setupElementos("calendario-grid", "mes-ano-calendario", "lista-eventos-dia");
        renderizar();
    }, 50);
};


export const iniciarCalendarioDesktop = () => {


    setupElementos("desk-calendar-grid", "desk-calendar-header", "desk-calendar-details");
    renderizar();
};

const setupElementos = (gridId, headerId, detalhesId) => {
    containerGrid = document.getElementById(gridId);
    containerHeader = document.getElementById(headerId);
    containerDetalhes = document.getElementById(detalhesId);
};


window.mudarMes = (delta) => {
    dataAtual.setMonth(dataAtual.getMonth() + delta);
    renderizar();
};

const renderizar = () => {
    if (!containerGrid) return;

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    if(containerHeader) {
        containerHeader.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <button onclick="window.mudarMes(-1)" style="background:none; border:none; cursor:pointer; color:var(--text); padding:5px;"><span class="material-symbols-rounded">chevron_left</span></button>
                <span style="font-weight:800; font-size:1rem; text-transform:uppercase; color:var(--primary);">${nomesMeses[mes]} ${ano}</span>
                <button onclick="window.mudarMes(1)" style="background:none; border:none; cursor:pointer; color:var(--text); padding:5px;"><span class="material-symbols-rounded">chevron_right</span></button>
            </div>
        `;
    }


    containerGrid.innerHTML = "";
    

    const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
    diasSemana.forEach(d => {
        const el = document.createElement("div");
        el.innerText = d;
        el.style.fontWeight = "bold";
        el.style.color = "var(--primary)";
        el.style.textAlign = "center";
        el.style.fontSize = "0.75rem";
        el.style.marginBottom = "5px";
        containerGrid.appendChild(el);
    });

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const hoje = new Date();


    for(let i=0; i<primeiroDia; i++) containerGrid.appendChild(document.createElement("div"));


    for(let dia=1; dia<=diasNoMes; dia++) {
        const chave = `${dia}-${mes + 1}`;
        const evento = eventos2026[chave];
        const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
        
        const el = document.createElement("div");
        el.innerText = dia;
        

        el.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:50%; cursor:pointer; margin:0 auto; position:relative;";
        
        let bg = "transparent";
        let color = "var(--text)";

        if(isHoje) { bg = "var(--primary)"; color = "#fff"; el.style.fontWeight = "bold"; }
        
        if(evento) {

            const dot = document.createElement("span");
            dot.style.cssText = `display:block; width:4px; height:4px; background:${isHoje?'#fff':'#db2777'}; border-radius:50%; position:absolute; bottom:3px;`;
            el.appendChild(dot);
            if(!isHoje) el.style.fontWeight = "bold";
        }

        el.style.background = bg;
        el.style.color = color;


        el.onclick = () => {

            Array.from(containerGrid.children).forEach(child => {
                if(!child.querySelector("span") && child.innerText !== String(hoje.getDate())) { 
                    child.style.background = "transparent";
                    child.style.color = "var(--text)";
                }
            });


            if(!isHoje) { el.style.background = "rgba(219,39,119,0.1)"; el.style.color = "#db2777"; }


            if(containerDetalhes) {
                if(evento) {
                    containerDetalhes.innerHTML = `
                        <div style="animation:fadeIn 0.3s; width:100%;">
                            <div style="font-size:0.95rem; font-weight:700; color:#db2777;">${evento.titulo}</div>
                            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase; margin-top:2px;">${dia}/${mes+1} • ${evento.tipo}</div>
                        </div>`;
                } else {
                    containerDetalhes.innerHTML = `<span style="color:var(--muted); font-style:italic;">Nada agendado para dia ${dia}.</span>`;
                }
            }
        };

        containerGrid.appendChild(el);
    }
};