/* =================================================================
   MÓDULO: AVISOS PÚBLICOS (Leitura do Firebase)
   ================================================================= */
import { db } from "../config/firebase-config.js";
import { collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const listaAvisos = document.getElementById('lista-avisos');

export function initAvisos() {
    if (!listaAvisos) return;
    escutarAvisosEmTempoReal();
}

function escutarAvisosEmTempoReal() {
    // Pega data de hoje no formato YYYY-MM-DD (padrão do input date e do Firebase)
    const hoje = new Date().toLocaleDateString('en-CA'); 

    // Cria a busca: Coleção "avisos", onde a data de validade for maior ou igual a hoje
    const q = query(
        collection(db, "avisos"),
        where("dataExpiracao", ">=", hoje),
        orderBy("dataExpiracao", "asc")
    );

    // "onSnapshot" fica vigiando o banco. Se você adicionar um aviso no Admin,
    // ele aparece na Home instantaneamente sem precisar atualizar a página.
    onSnapshot(q, (snapshot) => {
        listaAvisos.innerHTML = "";

        // SE NÃO TIVER AVISOS
        if (snapshot.empty) {
            listaAvisos.innerHTML = `
                <li style="text-align: center; color: #9ca3af; padding: 20px 0; font-style: italic; list-style: none;">
                    Nenhum aviso paroquial no momento.
                </li>`;
            return;
        }

        // SE TIVER AVISOS
        snapshot.forEach((doc) => {
            const aviso = doc.data();
            criarItemAviso(aviso.texto);
        });
    }, (error) => {
        console.error("Erro ao buscar avisos:", error);
        listaAvisos.innerHTML = `<li style="color:red; font-size:0.8rem;">Erro ao carregar avisos.</li>`;
    });
}

function criarItemAviso(texto) {
    const li = document.createElement('li');
    // Estilo inline para garantir visual mesmo sem CSS atualizado
    li.style.cssText = "padding: 12px 0; border-bottom: 1px solid #eee; display: flex; gap: 12px; align-items: flex-start;";
    
    li.innerHTML = `
        <span class="material-symbols-rounded" style="color: #db2777; flex-shrink: 0; margin-top: 2px;">campaign</span>
        <span style="font-size: 0.95rem; line-height: 1.5; color: var(--text);">${texto}</span>
    `;
    
    listaAvisos.appendChild(li);
}