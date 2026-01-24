import { dbOracoes } from "../data/prayers-data.js";
import { abrirModal } from "../utils/dom-utils.js";

export const abrirOracao = (chave) => {
    const oracao = dbOracoes[chave];
    
    if (!oracao) {
        console.error("Oração não encontrada: " + chave);
        return;
    }

    const modal = document.getElementById("modalGeral");
    const titulo = document.getElementById("modal-titulo");
    const corpo = document.getElementById("modal-corpo");

    if (modal && corpo) {
        if (titulo) titulo.innerText = oracao.titulo;

        corpo.innerHTML = `
            <p style="
                font-size: 1.1rem; 
                line-height: 1.8; 
                color: var(--text); 
                white-space: pre-wrap; 
                text-align: justify; 
                margin-top: 0;
            ">${oracao.texto}</p>
            
            <div style="margin-top: 20px;">
                <button class="btn-primary" onclick="document.getElementById('modalGeral').style.display='none'">Amém</button>
            </div>
        `;
        
        abrirModal("modalGeral");
    }
};