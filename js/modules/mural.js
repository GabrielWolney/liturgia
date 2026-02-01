import { adicionarPedidoMural, deletarPedidoMural, ouvirMural, ouvirMuralCompleto, registrarOracao } from "../services/firestore-service.js";
import { abrirModal } from "../utils/dom-utils.js";

let unsubscribe = null;
let filtroAtual = '24h'; 

export const inicializarMural = () => {
    const modalBody = document.querySelector("#modalMuralPedidos .modal-body");
    
    // HTML Estrutural (com classes corrigidas para o CSS main.css)
    modalBody.innerHTML = `
        <div class="mural-header-fixo">
            <input type="text" id="nome-orante" placeholder="Seu nome (Opcional)">
            <textarea id="texto-pedido-publico" placeholder="Escreva seu pedido de oração..." style="height: 70px; resize: none;"></textarea>
            
            <button onclick="window.enviarPedidoMural()" class="btn-publicar">
                <span class="material-symbols-rounded">send</span> Publicar
            </button>

            <div class="mural-abas">
                <button id="aba-24h" onclick="window.alternarAbaMural('24h')">Últimas 24h</button>
                <button id="aba-todas" onclick="window.alternarAbaMural('todas')">Todas</button>
            </div>
        </div>

        <div id="feed-pedidos">
            </div>
    `;

    abrirModal("modalMuralPedidos");
    alternarAbaMural('24h');
};

export const alternarAbaMural = (tipo) => {
    filtroAtual = tipo;
    const btn24 = document.getElementById("aba-24h");
    const btnTodas = document.getElementById("aba-todas");

    if(!btn24 || !btnTodas) return;

    const ativo = "background: #db2777; color: white; border: none;";
    const inativo = "background: transparent; color: var(--muted); border: 1px solid var(--border);";

    if (tipo === '24h') {
        btn24.style.cssText = ativo;
        btnTodas.style.cssText = inativo;
    } else {
        btnTodas.style.cssText = ativo;
        btn24.style.cssText = inativo;
    }

    carregarMural();
};

const carregarMural = () => {
    const feed = document.getElementById("feed-pedidos");
    if (!feed) return;
    
    feed.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted);">Buscando pedidos...</div>`;

    if (unsubscribe) unsubscribe();

    // Seleciona a função correta
    const funcaoOuvir = filtroAtual === '24h' ? ouvirMural : ouvirMuralCompleto;

    unsubscribe = funcaoOuvir((snapshot) => {
        feed.innerHTML = "";
        const meusIds = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
        const oracoesFeitas = JSON.parse(localStorage.getItem("oracoes_feitas") || "[]");

        if (snapshot.empty) {
            feed.innerHTML = `
                <div class="mural-vazio">
                    <span class="material-symbols-rounded">volunteer_activism</span>
                    <h3>Mural de Oração</h3>
                    <p>Nenhum pedido encontrado nesta lista.</p>
                    ${filtroAtual === '24h' ? '<div class="msg-first">Seja o primeiro a pedir hoje! 🙏</div>' : ''}
                </div>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            const id = docSnap.id;
            const souDono = meusIds.includes(id);
            const jaRezei = oracoesFeitas.includes(id);
            
            // FORMATAÇÃO DE DATA (Segura para evitar erros)
            let dataFormatada = "--/--";
            let horaFormatada = "--:--";
            if(dados.data && dados.data.toDate) {
                const d = dados.data.toDate();
                dataFormatada = d.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
                horaFormatada = d.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
            }
            
            // LÓGICA HÍBRIDA: Pega 'rezaram' (antigo) OU 'contagemOracoes' (novo)
            // Se tiver os dois, prefere o maior número para não zerar contagem
            const cAntigo = dados.rezaram || 0;
            const cNovo = dados.contagemOracoes || 0;
            const count = Math.max(cAntigo, cNovo); 

            const card = document.createElement("div");
            card.className = "card-pedido";
            card.innerHTML = `
                <div class="pedido-header">
                    <div>
                        <strong style="color:var(--primary); font-size:0.9rem;">${dados.nome}</strong>
                        <span style="font-size:0.7rem; color:var(--muted); margin-left:5px;">• ${dataFormatada} às ${horaFormatada}</span>
                    </div>
                    ${souDono ? `<button onclick="window.excluirMeuPedido('${id}')" class="btn-lixeira"><span class="material-symbols-rounded">delete</span></button>` : ""}
                </div>
                
                <p class="pedido-texto">${dados.texto}</p>
                
                <div class="pedido-footer">
                    <span class="contador-oracoes">
                        <span class="material-symbols-rounded">volunteer_activism</span> 
                        <b id="count-text-${id}">${count}</b> intercessores
                    </span>
                    
                    <button onclick="window.marcarOracao('${id}', ${count})" id="btn-rezar-${id}" class="btn-rezar ${jaRezei ? 'ativo' : ''}">
                        <span class="material-symbols-rounded">${jaRezei ? 'check' : 'favorite'}</span>
                        ${jaRezei ? 'Você rezou' : 'Rezar'}
                    </button>
                </div>
            `;
            feed.appendChild(card);
        });
        
        feed.insertAdjacentHTML('beforeend', '<div style="height:30px;"></div>');
    });
};

export const marcarOracao = async (id, contagemAtual) => {
    const btn = document.getElementById(`btn-rezar-${id}`);
    const contadorTexto = document.getElementById(`count-text-${id}`);
    
    let oracoesFeitas = JSON.parse(localStorage.getItem("oracoes_feitas") || "[]");
    const jaRezou = oracoesFeitas.includes(id);

    if (jaRezou) {
        // DESMARCAR
        oracoesFeitas = oracoesFeitas.filter(item => item !== id);
        localStorage.setItem("oracoes_feitas", JSON.stringify(oracoesFeitas));

        if (btn) {
            btn.classList.remove('ativo');
            btn.innerHTML = `<span class="material-symbols-rounded">favorite</span> Rezar`;
        }
        if (contadorTexto) contadorTexto.innerText = Math.max(0, contagemAtual - 1);

        await registrarOracao(id, -1);

    } else {
        // MARCAR
        oracoesFeitas.push(id);
        localStorage.setItem("oracoes_feitas", JSON.stringify(oracoesFeitas));

        if (btn) {
            btn.classList.add('ativo');
            btn.innerHTML = `<span class="material-symbols-rounded">check</span> Você rezou`;
        }
        if (contadorTexto) contadorTexto.innerText = contagemAtual + 1;

        await registrarOracao(id, 1);
    }
};

export const enviarPedido = async () => {
    const nomeInput = document.getElementById("nome-orante");
    const textoInput = document.getElementById("texto-pedido-publico");
    const btn = document.querySelector("#modalMuralPedidos .btn-publicar"); // Seletor corrigido

    const nome = nomeInput ? nomeInput.value.trim() || "Anônimo" : "Anônimo";
    const texto = textoInput ? textoInput.value.trim() : "";

    if (!texto) return alert("Escreva seu pedido!");
    
    try {
        if(btn) {
            btn.disabled = true; 
            btn.innerHTML = `<span class="material-symbols-rounded">hourglass_empty</span> Enviando...`;
        }

        const id = await adicionarPedidoMural(nome, texto);

        let meusIds = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
        meusIds.push(id);
        localStorage.setItem("meus_pedidos_mural", JSON.stringify(meusIds));

        textoInput.value = ""; 
        
        if(btn) btn.innerHTML = `<span class="material-symbols-rounded">send</span> Publicar`;

        // Se estiver em "Todas", muda para "24h" para ver o novo pedido no topo
        if(filtroAtual !== '24h') alternarAbaMural('24h');

    } catch (e) { 
        console.error(e); 
        alert("Erro ao enviar."); 
    } finally { 
        if(btn) btn.disabled = false; 
    }
};

export const excluirPedido = async (id) => {
    if (!confirm("Apagar este pedido?")) return;
    try {
        await deletarPedidoMural(id);
        let lista = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
        lista = lista.filter((item) => item !== id);
        localStorage.setItem("meus_pedidos_mural", JSON.stringify(lista));
    } catch (e) { console.error(e); }
};

window.inicializarMural = inicializarMural;
window.enviarPedidoMural = enviarPedido;
window.excluirMeuPedido = excluirPedido;
window.alternarAbaMural = alternarAbaMural;
window.marcarOracao = marcarOracao;