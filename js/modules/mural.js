import { adicionarPedidoMural, deletarPedidoMural, ouvirMural } from "../services/firestore-service.js";
import { abrirModal } from "../utils/dom-utils.js";

let unsubscribe = null;

export const inicializarMural = () => {
    abrirModal("modalMuralPedidos");
    carregarMural();
};

export const enviarPedido = async () => {
    const nomeInput = document.getElementById("nome-orante");
    const textoInput = document.getElementById("texto-pedido-publico");
    
    // Tratamento seguro
    const nome = nomeInput ? nomeInput.value.trim() || "Anônimo" : "Anônimo";
    const texto = textoInput ? textoInput.value.trim() : "";

    if (!texto) return alert("Escreva seu pedido!");

    const btn = document.querySelector("#modalMuralPedidos .btn-primary");
    
    try {
        btn.disabled = true;

        // 1. Salva no Firestore e recupera o ID gerado
        const id = await adicionarPedidoMural(nome, texto);

        // 2. Salva ID no LocalStorage (para permitir exclusão futura)
        let meusIds = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
        meusIds.push(id);
        localStorage.setItem("meus_pedidos_mural", JSON.stringify(meusIds));

        textoInput.value = "";
    } catch (e) {
        console.error(e);
        alert("Erro ao enviar pedido.");
    } finally {
        btn.disabled = false;
    }
};

export const excluirPedido = async (id) => {
    if (!confirm("Deseja realmente apagar este pedido?")) return;
    
    try {
        await deletarPedidoMural(id);
        
        // Remove do local storage
        let lista = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
        lista = lista.filter((item) => item !== id);
        localStorage.setItem("meus_pedidos_mural", JSON.stringify(lista));
        
    } catch (e) {
        console.error(e);
        alert("Erro ao excluir.");
    }
};

const carregarMural = () => {
    const feed = document.getElementById("feed-pedidos");
    if (!feed) return;
    
    if (unsubscribe) unsubscribe();

    unsubscribe = ouvirMural((snapshot) => {
        feed.innerHTML = "";
        
        // Lê o localStorage a cada atualização para garantir sincronia
        const meusIds = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");

        if (snapshot.empty) {
            feed.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--muted); opacity: 0.8;">
                    <span class="material-symbols-rounded" style="font-size: 50px; margin-bottom: 15px; color: #db2777;">volunteer_activism</span>
                    <h3 style="font-size: 1.1rem; color: var(--text); margin-bottom: 5px;">Mural de Oração</h3>
                    <p style="font-size: 0.9rem; line-height: 1.5;">O mural está vazio agora...</p>
                    <div style="margin-top: 20px; font-weight: bold; color: #db2777; background: rgba(219, 39, 119, 0.1); padding: 10px; border-radius: 10px;">Seja o primeiro a pedir oração hoje! 🙏</div>
                </div>
            `;
            return;
        }

        snapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            const id = docSnap.id;
            const souDono = meusIds.includes(id);

            // Formata a hora
            const dataPedido = dados.data.toDate();
            const horaFormatada = dataPedido.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
            });

            const card = document.createElement("div");
            card.className = "card-pedido";
            card.innerHTML = `
                <div class="pedido-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="pedido-nome" style="font-weight:bold; color:var(--primary);">${dados.nome}</span>
                        <span style="font-size:0.7rem; color:var(--muted);">• ${horaFormatada}</span>
                    </div>
                    ${
                      souDono
                        ? `<button onclick="window.excluirMeuPedido('${id}')" class="btn-excluir-pedido" style="color:#ef4444; background:none; border:none; cursor:pointer;">
                            <span class="material-symbols-rounded" style="font-size:18px;">delete</span>
                           </button>`
                        : ""
                    }
                </div>
                <p class="pedido-texto" style="margin-top:8px; line-height:1.5; color:var(--text);">${dados.texto}</p>
            `;
            feed.appendChild(card);
        });

        // Rodapé
        const rodape = document.createElement("div");
        rodape.innerHTML = `<p style="text-align:center; font-size:0.75rem; color:var(--muted); margin-top:20px; opacity:0.6; font-style:italic;">* Os pedidos somem automaticamente após 24h.</p>`;
        feed.appendChild(rodape);
    });
};