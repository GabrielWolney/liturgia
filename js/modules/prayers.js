import { dbOracoes } from "../data/prayers-data.js";
import { abrirModal } from "../utils/dom-utils.js";

export const abrirOracao = (chave) => {
    const oracao = dbOracoes[chave];
    
    if (!oracao) {
        console.error("Oração não encontrada: " + chave);
        return;
    }

    const leitorDesktop = document.getElementById("leitor-conteudo-desktop");
    const isDesktop = leitorDesktop && leitorDesktop.offsetParent !== null;

    if (isDesktop) {
        // --- COMPORTAMENTO DESKTOP  ---
        
        document.querySelectorAll('.desk-menu-oracao button').forEach(b => b.classList.remove('active'));
        const btnSidebar = document.querySelector(`button[onclick*="'${chave}'"]`);
        if (btnSidebar) btnSidebar.classList.add('active');

        leitorDesktop.innerHTML = `
            <div class="conteudo-leitor-centralizado">
                <h2 style="text-align:center; color:var(--primary); margin-bottom:30px; font-size:2rem;">
                    ${oracao.titulo}
                </h2>
                <div class="texto-oracao-leitor" style="
                    font-size:1.3rem; 
                    line-height:2; 
                    text-align:center; /* <--- FORÇANDO CENTRO AQUI */
                    max-width:700px; 
                    margin:0 auto; 
                    white-space: pre-wrap;
                    color: var(--text);
                ">
                    ${oracao.texto}
                </div>
            </div>
        `;
        
        leitorDesktop.scrollTop = 0;

    } else {
        // --- COMPORTAMENTO MOBILE (Abre Modal) ---
        const modalTitulo = document.getElementById("modal-titulo");
        const modalCorpo = document.getElementById("modal-corpo");

        if (modalTitulo) modalTitulo.innerText = oracao.titulo;

        if (modalCorpo) {
            modalCorpo.innerHTML = `
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
    }
};