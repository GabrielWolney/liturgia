/**
 * Main Controller - Versão 6.6 (Integração Firebase Admin + Calendar Fix)
 */
import { initInstall } from "./modules/install.js";
import { analytics } from "./config/firebase-config.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { configurarNotificacoes } from "./services/notification-service.js"; 
import { configurarData, obterMisterioDoDia } from "./utils/date-utils.js";
import { abrirModal, setupClick as setupDomClick } from "./utils/dom-utils.js";

// Módulos de Conteúdo
import * as LiturgiaModule from "./modules/liturgia.js";
import * as MuralModule from "./modules/mural.js";
import * as BibleModule from "./modules/bible.js";
import * as NovenasModule from "./modules/novenas.js";
import * as PrayersModule from "./modules/prayers.js";

// Módulos de Funcionalidade
import { initAvisos } from './modules/avisos.js'; // Mantém para exibir na Home (se usar localStorage ou adaptar)
import { initCalendar } from './modules/calendar.js';
import { inicializarAdmin } from './modules/admin.js'; // <--- NOME CORRETO DA SUA FUNÇÃO

// =======================================================
// EXPOSIÇÃO GLOBAL
// =======================================================

window.abrirCalendario = function() {
    abrirModal("modalCalendario");
    // Delay para garantir renderização correta das setas
    setTimeout(() => initCalendar(), 50); 
};

window.abrirMuralPedidos = function() {
    abrirModal("modalMuralPedidos");
    MuralModule.inicializarMural();
};
window.postarPedido = MuralModule.enviarPedido;
window.excluirMeuPedido = MuralModule.excluirPedido;

window.abrirLiturgia = LiturgiaModule.abrirModalLiturgiaCompleta;
window.compartilharEvangelho = LiturgiaModule.compartilharEvangelho;
window.abrirHora = LiturgiaModule.abrirHora;
window.abrirOracao = PrayersModule.abrirOracao;

window.abrirListaNovenas = NovenasModule.abrirListaNovenas;
window.alternarAbaNovenas = NovenasModule.alternarAbaNovenas;
window.abrirDetalhesNovena = NovenasModule.abrirDetalhesNovena;
window.lerDiaNovena = NovenasModule.lerDiaNovena;
window.alternarStatusDia = NovenasModule.alternarStatusDia;

window.alternarTestamento = BibleModule.alternarTestamento;
window.fecharLeitura = BibleModule.fecharLeitura;

window.abrirNotas = () => abrirModal("modalNotas");
window.limparExame = () => {
    document.querySelectorAll(".check-roxo").forEach((c) => (c.checked = false));
    document.querySelectorAll("details.exame-grupo").forEach((d) => d.removeAttribute("open"));
};
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

        // UI Base
        configurarNavegação();
        configurarData();
        configurarTercoUI();
        configurarIconeDinamicoHoras();
        configurarTema();
        configurarNotas(); 
        
        // Inicializa Módulos
        initInstall();
        
        // Tenta iniciar avisos da home (se existir lógica para isso)
        try { initAvisos(); } catch(e) { console.log("Avisos Home não configurado"); }
        
        // INICIA SEU ADMIN (FIREBASE)
        try { 
            inicializarAdmin(); 
            console.log("Admin Firebase iniciado");
        } catch(e) { 
            console.error("Erro ao iniciar Admin:", e); 
        }

        // Dados Iniciais
        BibleModule.alternarTestamento("novo");
        await LiturgiaModule.carregarLiturgia();
        LiturgiaModule.inicializarContador();

        // Analytics
        try { configurarNotificacoes(); } catch (e) {}
        logEvent(analytics, "page_view", { page_title: "Home" });
        
        // Listeners
        configurarListenersModais();
        setInterval(configurarIconeDinamicoHoras, 300000);

        // Remove Splash
        const splash = document.getElementById("splash-screen");
        if (splash) {
            setTimeout(() => {
                splash.style.opacity = "0";
                setTimeout(() => splash.remove(), 500);
            }, 800);
        }

    } catch (erro) {
        console.error("Erro fatal:", erro);
        document.getElementById("splash-screen")?.remove();
    }
}

// ... (MANTENHA AS FUNÇÕES AUXILIARES DE UI AQUI IGUAL AO ANTERIOR: configurarNavegação, etc.) ...
// Copie do arquivo anterior para economizar espaço se já tiver
// Se precisar eu mando completo de novo
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
    function aplicarTema(tema) {
        html.setAttribute("data-theme", tema);
        if (btnTema) {
            btnTema.innerHTML = tema === "dark" ? '<span class="material-symbols-rounded">light_mode</span>' : '<span class="material-symbols-rounded">dark_mode</span>';
        }
    }
    const temaSalvo = localStorage.getItem("tema") || "light";
    aplicarTema(temaSalvo);
    if (btnTema) {
        btnTema.onclick = () => {
            const novo = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
            aplicarTema(novo);
            localStorage.setItem("tema", novo);
        };
    }
}

function configurarIconeDinamicoHoras() {
    const icon = document.getElementById("icon-horas");
    if (!icon) return;
    const h = new Date().getHours();
    icon.innerText = (h >= 5 && h < 9) ? "wb_twilight" : (h >= 9 && h < 18) ? "light_mode" : (h >= 18 && h < 22) ? "clear_night" : "bedtime";
}

const configurarTercoUI = () => {
    const tit = document.getElementById("titulo-misterio");
    const desc = document.getElementById("descricao-misterio");
    if (!tit || !desc) return;
    const hoje = obterMisterioDoDia();
    tit.innerText = hoje.titulo;
    desc.innerHTML = `<div style="text-align:center; margin-bottom:10px;">${hoje.desc}</div><div style="font-size:0.8rem; text-align:center; font-style:italic;">${hoje.meditacao}</div>`;
};

function configurarNotas() {
    const area = document.getElementById("area-notas");
    if (!area) return;
    area.value = localStorage.getItem("minhas_notas_agape") || "";
    area.addEventListener("input", () => localStorage.setItem("minhas_notas_agape", area.value));
}

function configurarListenersModais() {
    setupDomClick("btn-abrir-liturgia", LiturgiaModule.abrirModalLiturgiaCompleta);
    setupDomClick("btn-explicar-horas", () => abrirModal("modalExplicacaoHoras"));
    setupDomClick("btn-login-secreto", () => abrirModal("modalLogin"));
    const fecharTodos = () => document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
    document.querySelectorAll(".close-modal").forEach(b => b.onclick = fecharTodos);
    window.onclick = (e) => { if (e.target.classList.contains("modal")) fecharTodos(); };
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}