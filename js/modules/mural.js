import { adicionarPedidoMural, deletarPedidoMural, ouvirMural, ouvirMuralCompleto, registrarOracao } from "../services/firestore-service.js";
import { abrirModal } from "../utils/dom-utils.js";

let unsubscribe = null;
let filtroAtual = '24h'; 


export const inicializarMural = () => {
    const modalBody = document.querySelector("#modalMuralPedidos .modal-body");

    if(modalBody) {
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

            <div id="feed-pedidos"></div>
        `;

        abrirModal("modalMuralPedidos");
        alternarAbaMural('24h');
    }
};

export const inicializarMuralDesktop = () => {
    const colunaLateral = document.querySelector('.desk-mural-lateral');
    if (colunaLateral) {

        colunaLateral.innerHTML = `
            <div class="mural-header-desktop">
                <h3>MURAL DE INTERCESSÃO</h3>
            </div>
            
            <div class="mural-input-area">
                <input type="text" id="desk-nome-orante" class="input-mural-desk" placeholder="Seu nome (Opcional)">
                <textarea id="desk-texto-pedido-publico" class="input-mural-desk" placeholder="Escreva seu pedido de oração..." style="height: 80px; resize: none;"></textarea>
                
                <button onclick="window.enviarPedidoMural()" class="btn-mural-rosa">
                    <span class="material-symbols-rounded">send</span> Publicar
                </button>
                
                <div class="mural-abas-desk">
                    <button id="desk-aba-24h" onclick="window.alternarAbaMural('24h')" class="btn-aba-mural active">Últimas 24h</button>
                    <button id="desk-aba-todas" onclick="window.alternarAbaMural('todas')" class="btn-aba-mural">Todas</button>
                </div>
            </div>

            <div id="mural-desktop-placeholder"></div>
        `;

        carregarMural('mural-desktop-placeholder');
    }
};


export const alternarAbaMural = (tipo) => {
    filtroAtual = tipo;

    const btn24 = document.getElementById("aba-24h");
    const btnTodas = document.getElementById("aba-todas");
    if(btn24 && btnTodas) {
        const ativo = "background: #db2777; color: white; border: none;";
        const inativo = "background: transparent; color: var(--muted); border: 1px solid var(--border);";
        if (tipo === '24h') { btn24.style.cssText = ativo; btnTodas.style.cssText = inativo; } 
        else { btnTodas.style.cssText = ativo; btn24.style.cssText = inativo; }
    }

    const desk24 = document.getElementById("desk-aba-24h");
    const deskTodas = document.getElementById("desk-aba-todas");
    if(desk24 && deskTodas) {
        desk24.classList.remove('active');
        deskTodas.classList.remove('active');
        if(tipo === '24h') desk24.classList.add('active');
        else deskTodas.classList.add('active');
    }

    let target = "feed-pedidos"; 
    if (document.getElementById("mural-desktop-placeholder") && window.innerWidth >= 1024) {
        target = "mural-desktop-placeholder";
    }
    carregarMural(target);
};

const carregarMural = (targetId) => {

    let feed = document.getElementById(targetId);
    if (!feed) feed = document.getElementById("mural-desktop-placeholder"); 
    if (!feed) feed = document.getElementById("feed-pedidos"); 

    if (!feed) return;
    
    feed.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted);">Buscando pedidos...</div>`;

    if (unsubscribe) unsubscribe();

    const funcaoOuvir = filtroAtual === '24h' ? ouvirMural : ouvirMuralCompleto;

    unsubscribe = funcaoOuvir((snapshot) => {
        feed.innerHTML = "";
        const meusIds = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
        const oracoesFeitas = JSON.parse(localStorage.getItem("oracoes_feitas") || "[]");

        if (snapshot.empty) {
            feed.innerHTML = `
                <div class="mural-vazio" style="text-align:center; padding:20px; color:var(--muted)">
                    <span class="material-symbols-rounded" style="font-size:40px">volunteer_activism</span>
                    <p>Nenhum pedido encontrado.</p>
                </div>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            const id = docSnap.id;
            const souDono = meusIds.includes(id);
            const jaRezei = oracoesFeitas.includes(id);

            let dataStr = "";
            if(dados.data && dados.data.toDate) {
                const d = dados.data.toDate();
                dataStr = " • " + d.toLocaleDateString("pt-BR", {day:'2-digit', month:'2-digit'}) + " às " + d.toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'});
            }
            
            const count = Math.max(dados.rezaram || 0, dados.contagemOracoes || 0); 

            const card = document.createElement("div");
            card.className = "card-pedido";
            card.innerHTML = `
                <div class="pedido-header">
                    <div>
                        <strong style="color:var(--primary); font-size:0.9rem;">${dados.nome || "Anônimo"}</strong>
                        <span style="font-size:0.75rem; color:var(--muted); margin-left:5px;">${dataStr}</span>
                    </div>
                    ${souDono ? `<button onclick="window.excluirMeuPedido('${id}')" class="btn-lixeira" style="background:none; border:none; color:red; cursor:pointer"><span class="material-symbols-rounded" style="font-size:18px">delete</span></button>` : ""}
                </div>
                
                <p class="pedido-texto">${dados.texto}</p>
                
                <div class="pedido-footer">
                    <span class="contador-oracoes">
                        <span class="material-symbols-rounded" style="font-size:16px; vertical-align:middle">volunteer_activism</span> 
                        <b id="count-text-${id}">${count}</b> intercessores
                    </span>
                    
                    <button onclick="window.marcarOracao('${id}', ${count})" id="btn-rezar-${id}" class="btn-rezar ${jaRezei ? 'ativo' : ''}" style="${jaRezei ? 'background:#db2777; color:white; border:none' : 'background:transparent; color:#db2777; border:1px solid #db2777'}">
                        <span class="material-symbols-rounded" style="font-size:16px; vertical-align:middle">${jaRezei ? 'check' : 'favorite'}</span>
                        ${jaRezei ? 'Você rezou' : 'Rezar'}
                    </button>
                </div>
            `;
            feed.appendChild(card);
        });
        
        feed.insertAdjacentHTML('beforeend', '<div style="height:30px;"></div>');
    });
};

export const enviarPedido = async () => {
    // 1. Tenta pegar inputs do MOBILE
    let nomeInput = document.getElementById("nome-orante");
    let textoInput = document.getElementById("texto-pedido-publico");

    // 2. Se não achar ou estiver vazio, tenta pegar do DESKTOP
    // (Verifica se textoInput é nulo OU se o valor está vazio e estamos no Desktop)
    if (!textoInput || (textoInput.value.trim() === "" && document.getElementById("desk-texto-pedido-publico"))) {
        const deskNome = document.getElementById("desk-nome-orante");
        const deskTexto = document.getElementById("desk-texto-pedido-publico");
        if(deskTexto) {
            nomeInput = deskNome;
            textoInput = deskTexto;
        }
    }
    
    // Botão de loading (pega o que estiver visível)
    const btn = document.querySelector("#modalMuralPedidos .btn-publicar") || document.querySelector(".btn-mural-rosa");

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

        if(textoInput) textoInput.value = ""; 
        
        if(btn) btn.innerHTML = `<span class="material-symbols-rounded">send</span> Publicar`;

        // Recarrega a aba 24h
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

export const marcarOracao = async (id, contagemAtual) => {
    // Busca o botão pelo ID único do card (funciona igual no Desktop e Mobile)
    const btn = document.getElementById(`btn-rezar-${id}`);
    const contadorTexto = document.getElementById(`count-text-${id}`);
    
    let oracoesFeitas = JSON.parse(localStorage.getItem("oracoes_feitas") || "[]");
    const jaRezou = oracoesFeitas.includes(id);

    if (jaRezou) {
        oracoesFeitas = oracoesFeitas.filter(item => item !== id);
        localStorage.setItem("oracoes_feitas", JSON.stringify(oracoesFeitas));

        if (btn) {
            btn.classList.remove('ativo');
            btn.style.cssText = "background:transparent; color:#db2777; border:1px solid #db2777";
            btn.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px; vertical-align:middle">favorite</span> Rezar`;
        }
        if (contadorTexto) contadorTexto.innerText = Math.max(0, contagemAtual - 1);

        await registrarOracao(id, -1);

    } else {
        oracoesFeitas.push(id);
        localStorage.setItem("oracoes_feitas", JSON.stringify(oracoesFeitas));

        if (btn) {
            btn.classList.add('ativo');
            btn.style.cssText = "background:#db2777; color:white; border:none";
            btn.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px; vertical-align:middle">check</span> Você rezou`;
        }
        if (contadorTexto) contadorTexto.innerText = contagemAtual + 1;

        await registrarOracao(id, 1);
    }
};

window.inicializarMural = inicializarMural;
window.enviarPedidoMural = enviarPedido;
window.excluirMeuPedido = excluirPedido;
window.alternarAbaMural = alternarAbaMural;
window.marcarOracao = marcarOracao;