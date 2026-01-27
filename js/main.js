/**
 * Main Controller - Versão Restaurada (Modo Clássico - onclick)
 */
import { initInstall } from "./modules/install.js";
import { analytics } from "./config/firebase-config.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { configurarNotificacoes } from "./services/notification-service.js"; 
import { configurarData, obterMisterioDoDia } from "./utils/date-utils.js";
import { abrirModal } from "./utils/dom-utils.js";

// Módulos
import * as LiturgiaModule from "./modules/liturgia.js";
import * as MuralModule from "./modules/mural.js";
import * as BibleModule from "./modules/bible.js";
import * as NovenasModule from "./modules/novenas.js";
import * as PrayersModule from "./modules/prayers.js";

// Importações dos novos módulos
import { initAvisos } from './modules/avisos.js';
import { initCalendar } from './modules/calendar.js';
import { inicializarAdmin } from './modules/admin.js';

// =======================================================
// EXPOSIÇÃO GLOBAL (Obrigatório para o onclick do HTML funcionar)
// =======================================================

// Calendário
window.abrirCalendario = function() {
    abrirModal("modalCalendario");
    // Pequeno delay para garantir que o CSS carregou e o modal abriu
    setTimeout(() => {
        initCalendar();
    }, 50);
};

// Mural de Pedidos
window.abrirMuralPedidos = function() {
    abrirModal("modalMuralPedidos");
    MuralModule.inicializarMural();
};
window.postarPedido = MuralModule.enviarPedido;
window.excluirMeuPedido = MuralModule.excluirPedido;

// Liturgia e Orações
window.abrirLiturgia = LiturgiaModule.abrirModalLiturgiaCompleta;
window.compartilharEvangelho = LiturgiaModule.compartilharEvangelho;
window.abrirHora = LiturgiaModule.abrirHora;
window.abrirOracao = PrayersModule.abrirOracao;

// Novenas
window.abrirListaNovenas = NovenasModule.abrirListaNovenas;
window.lerDiaNovena = NovenasModule.lerDiaNovena;
window.alternarStatusDia = NovenasModule.alternarStatusDia;

// Bíblia
window.alternarTestamento = BibleModule.alternarTestamento;
window.fecharLeitura = BibleModule.fecharLeitura;

// Utils e Admin
window.abrirNotas = () => abrirModal("modalNotas");
window.limparExame = () => {
    document.querySelectorAll(".check-roxo").forEach((c) => (c.checked = false));
    document.querySelectorAll("details.exame-grupo").forEach((d) => d.removeAttribute("open"));
};
// Função simples para fechar modais
window.fecharModal = (id) => document.getElementById(id).style.display = 'none';


// =======================================================
// INICIALIZAÇÃO
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    try {
        console.log("Iniciando App...");

        // Configurações Visuais
        configurarNavegação();
        configurarData();
        configurarTercoUI();
        configurarIconeDinamicoHoras();
        configurarTema();
        configurarNotas(); 
        
        // Iniciar Módulos
        initInstall();
        
        try { initAvisos(); } catch(e) { console.log("Erro Avisos", e); }
        try { inicializarAdmin(); } catch(e) { console.log("Erro Admin", e); }

        // Carregar Dados
        BibleModule.alternarTestamento("novo");
        await LiturgiaModule.carregarLiturgia();
        LiturgiaModule.inicializarContador();

        // Analytics
        try { configurarNotificacoes(); } catch (e) {}
        
        // Listeners Genéricos (Fechar modal, etc)
        configurarListenersModais();
        setInterval(configurarIconeDinamicoHoras, 300000);

        // Remover Splash Screen
        setTimeout(() => {
            const splash = document.getElementById("splash-screen");
            if (splash) splash.remove();
        }, 800);

    } catch (erro) {
        console.error("Erro fatal:", erro);
        document.getElementById("splash-screen")?.remove();
    }
}

// =======================================================
// FUNÇÕES AUXILIARES (UI)
// =======================================================

function configurarNavegação() {
    const navItems = document.querySelectorAll(".nav-item, .sidebar-menu button");
    const abas = document.querySelectorAll(".conteudo-aba");
    navItems.forEach((item) => {
        item.onclick = (e) => {
            if (item.tagName === 'A') e.preventDefault();
            let targetId = item.getAttribute("data-target");
            if (targetId) {
                navItems.forEach((i) => i.classList.remove("active"));
                document.querySelectorAll(`[data-target="${targetId}"]`).forEach(el => el.classList.add('active'));
                abas.forEach((aba) => (aba.style.display = "none"));
                const targetAba = document.getElementById(targetId);
                if (targetAba) {
                    targetAba.style.display = "block"; 
                    window.scrollTo(0, 0);
                }
            }
        };
    });
}

function configurarTema() {
    const btnTema = document.getElementById("btn-tema");
    const html = document.documentElement;
    const aplicar = (t) => {
        html.setAttribute("data-theme", t);
        if(btnTema) btnTema.innerHTML = t === "dark" ? '<span class="material-symbols-rounded">light_mode</span>' : '<span class="material-symbols-rounded">dark_mode</span>';
    };
    aplicar(localStorage.getItem("tema") || "light");
    if (btnTema) btnTema.onclick = () => {
        const novo = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
        aplicar(novo);
        localStorage.setItem("tema", novo);
    };
}

function configurarIconeDinamicoHoras() {
    const icon = document.getElementById("icon-horas");
    if (icon) {
        const h = new Date().getHours();
        icon.innerText = (h >= 5 && h < 9) ? "wb_twilight" : (h >= 9 && h < 18) ? "light_mode" : (h >= 18 && h < 22) ? "clear_night" : "bedtime";
    }
}

const configurarTercoUI = () => {
    const tit = document.getElementById("titulo-misterio");
    const desc = document.getElementById("descricao-misterio");
    if (tit && desc) {
        const hoje = obterMisterioDoDia();
        tit.innerText = hoje.titulo;
        desc.innerHTML = `<div style="text-align:center; margin-bottom:10px;">${hoje.desc}</div><div style="font-size:0.8rem; text-align:center; font-style:italic;">${hoje.meditacao}</div>`;
    }
};

function configurarNotas() {
    const area = document.getElementById("area-notas");
    if (area) {
        area.value = localStorage.getItem("minhas_notas_agape") || "";
        area.addEventListener("input", () => localStorage.setItem("minhas_notas_agape", area.value));
    }
}

function configurarListenersModais() {
    document.querySelectorAll(".close-modal").forEach(b => b.onclick = () => document.querySelectorAll(".modal").forEach(m => m.style.display = "none"));
    window.onclick = (e) => { if (e.target.classList.contains("modal")) document.querySelectorAll(".modal").forEach(m => m.style.display = "none"); };
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}