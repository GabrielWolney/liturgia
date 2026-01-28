import { getPropositoMensal, updatePropositoMensal } from "../services/firestore-service.js";
import { abrirModal } from "../utils/dom-utils.js";

// Renderiza o card na Home se estiver ativo
export const carregarCardProposito = async () => {
    const container = document.getElementById("container-proposito");
    if (!container) return;

    // Limpa antes de carregar
    container.innerHTML = "";

    const dados = await getPropositoMensal();

    // Se não tiver dados ou estiver marcado como inativo, não mostra nada (some)
    if (!dados || dados.ativo === "false" || dados.ativo === false) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";
    
    // Desenha o Card (Estilo Rosa da Intercessão)
    container.innerHTML = `
        <section class="card" style="border-left: 4px solid #db2777;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <h2 style="margin: 0; color: #db2777; font-size: 1.1rem;">Intercessão</h2>
            </div>
            
            <h3 style="font-size: 1rem; margin-bottom: 5px;">${dados.tema || "Propósito"}</h3>
            <p style="color: var(--text); line-height: 1.5; font-size: 0.95rem;">
                ${dados.texto}
            </p>
        </section>
    `;
};

// --- FUNÇÕES DE ADMINISTRAÇÃO ---

window.abrirAdminIntercessao = () => {
    abrirModal("modalIntercessaoAdmin");
    // Verifica se já está logado na sessão atual
    if (sessionStorage.getItem("intercessao_logada") === "true") {
        mostrarFormularioIntercessao();
    }
};

window.loginIntercessao = () => {
    const senha = document.getElementById("senha-intercessao").value;
    // Senha fixa simples (pode mudar se quiser)
    if (senha === "agape2026" || senha === "intercessao") {
        sessionStorage.setItem("intercessao_logada", "true");
        mostrarFormularioIntercessao();
    } else {
        alert("Senha incorreta.");
    }
};

async function mostrarFormularioIntercessao() {
    document.getElementById("login-intercessao").style.display = "none";
    document.getElementById("form-intercessao").style.display = "block";

    // Carrega dados atuais para editar
    const dados = await getPropositoMensal();
    if (dados) {
        document.getElementById("prop-ativo").value = dados.ativo ? "true" : "false";
        document.getElementById("prop-tema").value = dados.tema || "";
        document.getElementById("prop-texto").value = dados.texto || "";
    }
}

window.salvarProposito = async () => {
    const ativo = document.getElementById("prop-ativo").value === "true"; // Converte string para boolean
    const tema = document.getElementById("prop-tema").value;
    const texto = document.getElementById("prop-texto").value;

    if (!texto) {
        alert("Escreva o texto do propósito.");
        return;
    }

    const btn = document.querySelector("#form-intercessao button");
    const textoOriginal = btn.innerText;
    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        await updatePropositoMensal({
            ativo: ativo,
            tema: tema,
            texto: texto
        });
        
        alert("Propósito atualizado com sucesso!");
        carregarCardProposito(); // Atualiza a home na hora
        document.getElementById("modalIntercessaoAdmin").style.display = "none";
        
    } catch (error) {
        alert("Erro ao salvar: " + error.message);
    } finally {
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
};