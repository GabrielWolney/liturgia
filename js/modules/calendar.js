import { ouvirAvisos } from "../services/firestore-service.js";
import { abrirModal } from "../utils/dom-utils.js";

let avisosCache = [];

export const inicializarAvisos = () => {
    const container = document.getElementById("lista-avisos");
    
    ouvirAvisos((snapshot) => {
        avisosCache = [];
        if (container) container.innerHTML = "";

        if (snapshot.empty && container) {
            container.innerHTML = `
                <div style="text-align:center; padding: 20px; opacity: 0.6;">
                    <span class="material-symbols-rounded" style="font-size:32px; color:var(--muted);">event_busy</span>
                    <p style="font-size:0.85rem; color:var(--muted); margin-top:5px;">Sem avisos por enquanto.</p>
                </div>`;
            return;
        }

        snapshot.forEach((doc) => {
            const dados = doc.data();
            avisosCache.push(dados);

            if (container) {
                // Formatação visual estilo "Calendário"
                const [ano, mes, dia] = dados.dataExpiracao.split("-");
                const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
                const nomeMes = meses[parseInt(mes) - 1];

                const li = document.createElement("li");
                li.className = "aviso-item";
                li.innerHTML = `
                    <div class="aviso-data-box">
                        <span class="aviso-dia">${dia}</span>
                        <span class="aviso-mes">${nomeMes}</span>
                    </div>
                    <div class="aviso-conteudo">
                        <p>${dados.texto}</p>
                    </div>
                `;
                container.appendChild(li);
            }
        });
    });
};

export const abrirCalendario = () => {
    renderizarCalendario();
    abrirModal("modalCalendario");
};

function renderizarCalendario() {
    const grid = document.getElementById("calendario-grid");
    const titulo = document.getElementById("mes-ano-calendario");
    const listaEventos = document.getElementById("lista-eventos-dia");

    if (!grid || !listaEventos) return;

    grid.innerHTML = "";
    listaEventos.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--muted); margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 8px;">
            <span class="material-symbols-rounded" style="font-size: 20px;">touch_app</span>
            <span style="font-size: 0.85rem;">Toque nos dias marcados para ver os avisos.</span>
        </div>`;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    titulo.innerText = hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    ["D", "S", "T", "Q", "Q", "S", "S"].forEach((d) => {
        const el = document.createElement("div");
        el.className = "calendar-header";
        el.innerText = d;
        grid.appendChild(el);
    });

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++) grid.appendChild(document.createElement("div"));

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const el = document.createElement("div");
        el.className = "calendar-day";
        el.innerText = dia;

        const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
        const temAviso = avisosCache.find((a) => a.dataExpiracao === dataStr);

        if (temAviso) {
            el.classList.add("has-event");
            el.onclick = () => {
                listaEventos.innerHTML = `
                    <div class="aviso-carinhoso" style="animation: fadeIn 0.3s ease;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                            <span class="material-symbols-rounded" style="color:var(--primary);">event_available</span>
                            <strong style="color:var(--primary);">Aviso para dia ${dia}:</strong>
                        </div>
                        <p style="font-size: 1rem; color: var(--text); line-height: 1.5;">${temAviso.texto}</p>
                    </div>`;
            };
        } else {
            el.onclick = () => {
                listaEventos.innerHTML = `<p style="font-size: 0.9rem; color: var(--muted); text-align: center; margin-top:15px; font-style: italic;">Nada agendado para o dia ${dia}.<br>Que tal um momento de oração? 🙏</p>`;
            };
        }

        if (dia === hoje.getDate()) el.style.border = "2px solid var(--primary)";
        grid.appendChild(el);
    }
}