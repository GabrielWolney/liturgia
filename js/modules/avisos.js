/* =================================================================
   MÓDULO: AVISOS (Visual de Data + Firebase)
   ================================================================= */
import { db } from "../config/firebase-config.js";
import { collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const listaAvisos = document.getElementById('lista-avisos');

export function initAvisos() {
    if (!listaAvisos) return;
    escutarAvisosEmTempoReal();
}

function escutarAvisosEmTempoReal() {
    // Pega a data de hoje para filtrar (não mostrar avisos vencidos)
    const hojeLocal = new Date().toLocaleDateString('en-CA'); 

    const q = query(
        collection(db, "avisos"),
        where("dataExpiracao", ">=", hojeLocal),
        orderBy("dataExpiracao", "asc")
    );

    onSnapshot(q, (snapshot) => {
        listaAvisos.innerHTML = "";

        // SE NÃO TIVER AVISOS
        if (snapshot.empty) {
            listaAvisos.innerHTML = `
                <div style="text-align:center; padding: 30px 20px; opacity: 0.6;">
                    <span class="material-symbols-rounded" style="font-size:32px; color:var(--muted);">event_busy</span>
                    <p style="font-size:0.9rem; color:var(--muted); margin-top:5px;">Sem avisos por enquanto.</p>
                </div>`;
            return;
        }

        // SE TIVER AVISOS
        snapshot.forEach((doc) => {
            const dados = doc.data();
            criarItemAviso(dados);
        });
    }, (error) => {
        console.error("Erro ao buscar avisos:", error);
    });
}

function criarItemAviso(dados) {
    // Separa a data (YYYY-MM-DD) para criar a caixinha visual
    const [ano, mes, dia] = dados.dataExpiracao.split("-");
    const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    
    // Converte o número do mês para nome (ex: 01 -> JAN)
    const nomeMes = meses[parseInt(mes) - 1]; 

    const li = document.createElement('li');
    li.className = 'aviso-item';
    
    // HTML com a estrutura da caixinha de data
    li.innerHTML = `
        <div class="aviso-data-box">
            <span class="aviso-dia">${dia}</span>
            <span class="aviso-mes">${nomeMes}</span>
        </div>
        <div class="aviso-conteudo">
            <p>${dados.texto}</p>
        </div>
    `;
    
    listaAvisos.appendChild(li);
}