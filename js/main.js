/**
 * Main Controller - Versão Corrigida (Modais Funcionando)
 */
import { initInstall } from "./modules/install.js";
import { analytics } from "./config/firebase-config.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { configurarNotificacoes } from "./services/notification-service.js"; 
import { configurarData, obterMisterioDoDia } from "./utils/date-utils.js";
import { fecharModais, abrirModal, setupClick as setupDomClick } from "./utils/dom-utils.js";

// Módulos
import * as LiturgiaModule from "./modules/liturgia.js";
import * as MuralModule from "./modules/mural.js";
import * as BibleModule from "./modules/bible.js";
import * as NovenasModule from "./modules/novenas.js";
import * as PrayersModule from "./modules/prayers.js";
import * as AdminModule from "./modules/admin.js";
import { initAvisos } from './modules/avisos.js';
import { abrirCalendario } from './modules/calendar.js';
import * as PropositoModule from './modules/proposito.js';

// =======================================================
// EXPOSIÇÃO GLOBAL (Essencial para onclick="..." no HTML)
// =======================================================
window.abrirMuralPedidos = MuralModule.inicializarMural;
window.postarPedido = MuralModule.enviarPedido;
window.excluirMeuPedido = MuralModule.excluirPedido;

window.abrirCalendario = abrirCalendario;

// --- AQUI ESTAVAM OS PROBLEMAS ---
// Garantindo que as funções da liturgia estejam disponíveis globalmente
window.abrirLiturgia = () => {
    console.log("Abrindo liturgia..."); // Debug
    LiturgiaModule.abrirModalLiturgiaCompleta();
};

// Se o botão de explicação usa onclick="abrirModalExplicacao()", precisamos expor:
window.abrirModalExplicacao = () => {
    abrirModal("modalExplicacaoHoras");
};

window.compartilharEvangelho = LiturgiaModule.compartilharEvangelho;
window.abrirHora = LiturgiaModule.abrirHora;

window.abrirListaNovenas = NovenasModule.abrirListaNovenas;
window.alternarAbaNovenas = NovenasModule.alternarAbaNovenas;
window.abrirDetalhesNovena = NovenasModule.abrirDetalhesNovena;
window.lerDiaNovena = NovenasModule.lerDiaNovena;
window.alternarStatusDia = NovenasModule.alternarStatusDia;

window.alternarTestamento = BibleModule.alternarTestamento;
window.fecharLeitura = BibleModule.fecharLeitura;

window.abrirOracao = PrayersModule.abrirOracao;

window.abrirNotas = () => abrirModal("modalNotas");
window.limparExame = () => {
    document.querySelectorAll(".check-roxo").forEach((c) => (c.checked = false));
    document.querySelectorAll("details.exame-grupo").forEach((d) => d.removeAttribute("open"));
};

// --- REGISTRO DO PWA ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("Service Worker registrado!", reg))
      .catch((err) => console.error("Falha no Service Worker:", err));
  });
}

// =======================================================
// INICIALIZAÇÃO
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    try {
        console.log("Iniciando App Ágape...");

        configurarNavegação();
        configurarData();
        configurarTercoUI();
        configurarIconeDinamicoHoras();
        configurarTema();
        configurarNotas(); 
        initInstall();

        BibleModule.alternarTestamento("novo");
        
        await LiturgiaModule.carregarLiturgia();
        LiturgiaModule.inicializarContador();
        try {
            await PropositoModule.carregarCardProposito();
        } catch (e) {
            console.warn("Erro ao carregar propósito:", e);
        }

        try { await initAvisos(); } catch (e) { console.warn("Erro avisos:", e); }
        try { AdminModule.inicializarAdmin(); } catch(e) {}
        try { configurarNotificacoes(); } catch (e) { }
        
        logEvent(analytics, "page_view", { page_title: "Home Liturgia Ágape" });
        
        // Configura os cliques DEPOIS de carregar tudo
        configurarListenersModais();
        
        setInterval(configurarIconeDinamicoHoras, 300000);

    } catch (erro) {
        console.error("Erro fatal na inicialização:", erro);
        const splash = document.getElementById("splash-screen");
        if (splash) splash.remove();
    }
}

// =======================================================
// UI UTILS
// =======================================================

function configurarNavegação() {
    const navItems = document.querySelectorAll(".nav-item");
    const abas = document.querySelectorAll(".conteudo-aba");
    navItems.forEach((item) => {
        item.onclick = (e) => {
            e.preventDefault();
            const targetId = item.getAttribute("data-target");
            const targetAba = document.getElementById(targetId);
            navItems.forEach((i) => i.classList.remove("active"));
            item.classList.add("active");
            abas.forEach((aba) => (aba.style.display = "none"));
            if (targetAba) {
                targetAba.style.display = "block";
                window.scrollTo(0, 0);
            }
        };
    });
}

function configurarTema() {
    const btnTema = document.getElementById("btn-tema");
    const html = document.documentElement;
    function aplicarTema(tema) {
        if (tema === "dark") {
            html.setAttribute("data-theme", "dark");
            if (btnTema) btnTema.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
        } else {
            html.setAttribute("data-theme", "light");
            if (btnTema) btnTema.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>';
        }
    }
    const temaSalvo = localStorage.getItem("tema");
    if (temaSalvo) aplicarTema(temaSalvo);
    if (btnTema) {
        btnTema.onclick = () => {
            const temaAtual = html.getAttribute("data-theme");
            const novoTema = temaAtual === "dark" ? "light" : "dark";
            aplicarTema(novoTema);
            localStorage.setItem("tema", novoTema);
        };
    }
}

function configurarIconeDinamicoHoras() {
    const iconElement = document.getElementById("icon-horas");
    if (!iconElement) return;
    const hora = new Date().getHours();
    let novoIcone = "bedtime";
    if (hora >= 5 && hora < 9) novoIcone = "wb_twilight";
    else if (hora >= 9 && hora < 18) novoIcone = "light_mode";
    else if (hora >= 18 && hora < 22) novoIcone = "clear_night";
    if (iconElement.innerText !== novoIcone) iconElement.innerText = novoIcone;
}

const configurarTercoUI = () => {
    const tituloEl = document.getElementById("titulo-misterio");
    const descEl = document.getElementById("descricao-misterio");
    if (!tituloEl || !descEl) return;
    
    const hoje = obterMisterioDoDia();
    tituloEl.innerText = hoje.titulo;

    let descFormatada = hoje.desc;
    descFormatada = descFormatada.replace(/(\d\.\s)/g, '<br>$1');
    if(descFormatada.startsWith('<br>')) descFormatada = descFormatada.substring(4);

    descEl.innerHTML = `
        <div class="terco-lista">
            ${descFormatada}
        </div>
        <div class="terco-meditacao">
            ${hoje.meditacao}
        </div>
    `;
};

function configurarNotas() {
    const area = document.getElementById("area-notas");
    if (!area) return;
    const sugestoes = ["O que Deus falou ao seu coração hoje?", "Pontos da pregação...", "Orações..."];
    if (!area.value) area.placeholder = sugestoes[Math.floor(Math.random() * sugestoes.length)];
    const salvo = localStorage.getItem("minhas_notas_agape");
    if (salvo) area.value = salvo;
    area.addEventListener("input", () => {
        localStorage.setItem("minhas_notas_agape", area.value);
    });
}

// --- FUNÇÃO DE LISTENERS CORRIGIDA ---
function configurarListenersModais() {
    // Listener explícito para o botão da Liturgia Completa (caso o onclick falhe)
    const btnLiturgia = document.getElementById("btn-abrir-liturgia");
    if (btnLiturgia) {
        btnLiturgia.onclick = () => {
            LiturgiaModule.abrirModalLiturgiaCompleta();
        };
    }

    // Listener explícito para o botão de explicação das Horas
    const btnExplicacao = document.getElementById("btn-explicar-horas");
    if (btnExplicacao) {
        btnExplicacao.onclick = () => {
            abrirModal("modalExplicacaoHoras");
        };
    }
    
    // Login Admin
    setupDomClick("btn-login-secreto", () => abrirModal("modalLogin"));

    // Fechar modais
    const fechar = () => document.querySelectorAll(".modal").forEach((m) => (m.style.display = "none"));
    document.querySelectorAll(".close-modal, .close-modal-sobre, #btn-entendido-horas, #btn-fechar-explicacao").forEach((b) => (b.onclick = fechar));
    
    window.onclick = (e) => {
        if (e.target.classList.contains("modal")) fechar();
    };
}

setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
        splash.style.opacity = "0";
        setTimeout(() => splash.remove(), 500);
    }
}, 1000);