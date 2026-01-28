import { eventos2026 } from "../data/eventos-2026.js";
import { abrirModal } from "../utils/dom-utils.js";

let dataCalendario = new Date(); 

// --- AQUI ESTÁ A EXPORTAÇÃO QUE O MAIN.JS PROCURA ---
export const abrirCalendario = () => {
    abrirModal("modalCalendario");
    // Pequeno delay para garantir que o modal abriu antes de renderizar
    setTimeout(() => {
        renderizarCalendario(dataCalendario);
    }, 50);
};

// Funções de navegação (Globais para funcionar no onclick do HTML gerado)
window.mudarMesCalendario = (delta) => {
    dataCalendario.setMonth(dataCalendario.getMonth() + delta);
    renderizarCalendario(dataCalendario);
};

function renderizarCalendario(data) {
    const grid = document.getElementById("calendario-grid");
    const titulo = document.getElementById("mes-ano-calendario");
    const areaDetalhes = document.getElementById("lista-eventos-dia"); 

    // Garante estrutura compacta se não existir
    if(areaDetalhes) {
        areaDetalhes.style.marginTop = "15px";
        areaDetalhes.style.paddingTop = "10px";
        areaDetalhes.style.borderTop = "1px solid var(--border)";
        areaDetalhes.style.minHeight = "60px";
        areaDetalhes.style.display = "flex";
        areaDetalhes.style.alignItems = "center";
        areaDetalhes.style.justifyContent = "center";
        areaDetalhes.style.textAlign = "center";
    }

    if (!grid || !titulo) return;

    const ano = data.getFullYear();
    const mes = data.getMonth();
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    // Header
    titulo.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding: 0 10px;">
            <button onclick="window.mudarMesCalendario(-1)" style="background:none; border:none; color:var(--text); cursor:pointer; padding: 5px;"><span class="material-symbols-rounded">chevron_left</span></button>
            <span style="font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${nomesMeses[mes]} ${ano}</span>
            <button onclick="window.mudarMesCalendario(1)" style="background:none; border:none; color:var(--text); cursor:pointer; padding: 5px;"><span class="material-symbols-rounded">chevron_right</span></button>
        </div>
    `;

    // Instrução Inicial
    if(areaDetalhes) {
        areaDetalhes.innerHTML = `
            <div style="color: var(--muted); font-size: 0.85rem; display: flex; align-items: center; gap: 6px; animation: fadeIn 0.5s;">
                <span class="material-symbols-rounded" style="font-size: 18px;">touch_app</span>
                Toque em um dia marcado para ver detalhes
            </div>
        `;
    }

    grid.innerHTML = "";
    
    // Dias da semana
    const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
    diasSemana.forEach(d => {
        const el = document.createElement("div");
        el.innerText = d;
        el.style.fontWeight = "bold";
        el.style.color = "var(--primary)";
        el.style.fontSize = "0.8rem";
        el.style.textAlign = "center";
        el.style.marginBottom = "5px";
        grid.appendChild(el);
    });

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay(); 

    // Espaços
    for (let i = 0; i < diaSemanaInicio; i++) {
        grid.appendChild(document.createElement("div"));
    }

    // Dias
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const el = document.createElement("div");
        el.innerText = dia;
        
        el.style.display = "flex";
        el.style.flexDirection = "column";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.height = "32px";
        el.style.width = "32px";
        el.style.margin = "0 auto";
        el.style.borderRadius = "50%";
        el.style.cursor = "pointer";
        el.style.fontSize = "0.9rem";
        el.style.position = "relative";

        const chave = `${dia}-${mes + 1}`;
        const evento = eventos2026[chave];
        const hoje = new Date();

        if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
            el.style.background = "var(--primary)";
            el.style.color = "#fff";
            el.style.fontWeight = "bold";
        }

        if (evento) {
            const dot = document.createElement("span");
            dot.style.cssText = "display:block; width:5px; height:5px; background:#db2777; border-radius:50%; position: absolute; bottom: 2px;";
            if (dia === hoje.getDate() && mes === hoje.getMonth()) dot.style.background = "#fff";
            
            el.appendChild(dot);
            el.style.fontWeight = "600";
            
            el.onclick = () => {
                document.querySelectorAll(".dia-selecionado").forEach(d => {
                    d.style.border = "none";
                    d.style.background = "transparent";
                });
                
                if (!(dia === hoje.getDate() && mes === hoje.getMonth())) {
                    el.style.background = "rgba(219, 39, 119, 0.1)"; 
                    el.style.color = "#db2777";
                }
                el.classList.add("dia-selecionado");
                
                if(areaDetalhes) {
                    areaDetalhes.innerHTML = `
                        <div style="width: 100%; animation: slideUp 0.3s;">
                            <div style="font-size: 0.95rem; font-weight: 700; color: #db2777;">${evento.titulo}</div>
                            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; margin-top: 2px;">
                                ${dia}/${mes+1} • ${evento.tipo}
                            </div>
                        </div>
                    `;
                }
            };
        } else {
             el.onclick = () => {
                document.querySelectorAll(".dia-selecionado").forEach(d => {
                    d.style.background = "transparent";
                    d.style.color = "var(--text)";
                });
                if(areaDetalhes) {
                    areaDetalhes.innerHTML = `
                        <div style="color: var(--muted); font-size: 0.8rem; font-style: italic;">
                            Nada agendado para dia ${dia}.
                        </div>
                    `;
                }
             }
        }
        grid.appendChild(el);
    }
}