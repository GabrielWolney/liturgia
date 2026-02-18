/**
 * Main Controller - Versão Final (Dashboard Desktop Integrado)
 */
import { initInstall } from "./modules/install.js";
import { analytics } from "./config/firebase-config.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { configurarNotificacoes } from "./services/notification-service.js";
import { configurarData, obterMisterioDoDia } from "./utils/date-utils.js";
import {
  fecharModais,
  abrirModal,
  setupClick as setupDomClick,
} from "./utils/dom-utils.js";
import { dbOracoes } from "./data/prayers-data.js";

import * as LiturgiaModule from "./modules/liturgia.js";
import * as MuralModule from "./modules/mural.js";
import * as BibleModule from "./modules/bible.js";
import * as NovenasModule from "./modules/novenas.js";
import * as PrayersModule from "./modules/prayers.js";
import * as AdminModule from "./modules/admin.js";
import * as CalendarModule from "./modules/calendar.js"; 
import { initAvisos } from "./modules/avisos.js";
import * as PropositoModule from "./modules/proposito.js";




window.abrirCalendario = CalendarModule.abrirCalendario; 
window.abrirMuralPedidos = MuralModule.inicializarMural;
window.enviarPedidoMural = MuralModule.enviarPedido;
window.enviarPedidoMuralDesktop = () => MuralModule.enviarPedido('desk-'); 
window.alternarAbaMural = MuralModule.alternarAbaMural;
window.excluirMeuPedido = MuralModule.excluirPedido;
window.marcarOracao = MuralModule.marcarOracao;

window.abrirModal = abrirModal;
window.abrirLiturgia = () => LiturgiaModule.abrirModalLiturgiaCompleta();
window.abrirModalExplicacao = () => abrirModal("modalExplicacaoHoras");
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
  if (confirm("Limpar tudo?"))
    document
      .querySelectorAll(".check-roxo")
      .forEach((c) => (c.checked = false));
};








window.carregarLeitor = (tipo) => {
    
    
    document.querySelectorAll('.desk-menu-oracao button').forEach(b => b.classList.remove('active'));
    const btnClicado = document.querySelector(`.desk-menu-oracao button[onclick*="'${tipo}'"]`);
    if (btnClicado) btnClicado.classList.add('active');

    const container = document.getElementById('leitor-conteudo-desktop');
    if (!container) return;

    
    container.classList.remove('alinhado-topo');

    
    if (tipo === 'novenas') {
        container.classList.add('alinhado-topo');
        if(window.abrirListaNovenas) window.abrirListaNovenas();
        return;
    }

    
    if (tipo === 'terco') {
        const hoje = typeof obterMisterioDoDia === 'function' ? obterMisterioDoDia() : { titulo: "Santo Terço", desc: "..." };
        
        let descFormatada = hoje.desc.replace(/\n/g, ' ').replace(/(\d\.\s)/g, '<br><b>$1</b>');
        if(descFormatada.startsWith('<br>')) descFormatada = descFormatada.substring(4);

        container.innerHTML = `
            <div class="card-leitor-simulacao">
                <h2>
                    <svg class="icone-oracao-custom" viewBox="0 0 682.67 682.67" xmlns="http:
                    <g transform="matrix(1.33,0,0,-1.33,0,682.67)">
                        <g>
                            <path d="m 0,0 v 120 h -40 v 40 H 0 v 60 H 40 V 160 H 80 V 120 H 40 V 0 Z" transform="translate(58,282)" />
                            <path d="m 0,0 -90.48,60.31 -56.19,-75.87 90,-60 86.65,115.54 c 2.19,2.92 3.54,6.38 3.9,10.01 l 16.17,161.63 c 0.21,2.05 0.2,4.07 0,6.03 -1.31,12.85 -10.87,23.48 -23.5,26.15 -2,0.42 -4.08,0.64 -6.21,0.64 -15.33,0 -28.17,-11.62 -29.7,-26.88 l -9.31,-93.12" transform="translate(247.67,85.56)" />
                            <path d="M 0,0 -24.93,16.62" transform="translate(155.68,93.55)" />
                            <path d="m 0,0 22.27,105.65 c 4.3,23.68 9.62,48.22 15.91,72.91" transform="translate(157.19,145.87)" />
                            <path d="m 0,0 c 10.66,31.02 22.89,61.05 36.67,88.61 3.77,7.53 11.47,12.29 19.9,12.29 12.48,0 22.24,-10.17 22.24,-22.2 0,-1.21 -0.1,-2.45 -0.31,-3.7 L 56.01,-71.93" transform="translate(218.18,401.1)" />
                            <path d="m 0,0 90.47,60.31 56.19,-75.87 -90,-60 -86.65,115.54 c -2.19,2.92 -3.54,6.38 -3.9,10.01 l -16.16,161.63 c -0.21,2.05 -0.2,4.07 0,6.03 1.31,12.85 10.86,23.48 23.49,26.15 2,0.42 4.08,0.64 6.21,0.64 15.34,0 28.18,-11.62 29.7,-26.88 L 18.66,124.44" transform="translate(347.77,85.56)" />
                            <path d="m 0,0 24.55,16.37 h 0.01" transform="translate(440.13,93.8)" />
                            <path d="m 0,0 -22.26,105.65 c -14.29,78.59 -39.68,166.74 -75.4,238.19 -3.77,7.53 -11.47,12.29 -19.89,12.29 -12.48,0 -22.25,-10.17 -22.25,-22.2 0,-1.22 0.1,-2.45 0.31,-3.7 L -117,183.3" transform="translate(438.24,145.87)" />
                            <path  d="m 0,0 c 5.52,0 10,-4.48 10,-10 0,-5.52 -4.48,-10 -10,-10 -5.52,0 -10,4.48 -10,10 0,5.52 4.48,10 10,10" transform="translate(206,373)" />
                        </g>
                    </g>
                </svg> 
                    Santo Terço
                </h2>
                <h3>${hoje.titulo}</h3>
                <div class="conteudo-texto" style="text-align: center;">${descFormatada}</div>
                <div class="rodape-texto">${hoje.meditacao || ""}</div>
            </div>`;
        return;
    }

    
    if (['laudes', 'vesperas', 'completas'].includes(tipo)) {
        const info = {
            'laudes': { titulo: "Laudes", sub: "Oração da Manhã", desc: "Consagramos o início do dia a Deus, celebrando a Ressurreição." },
            'vesperas': { titulo: "Vésperas", sub: "Oração da Tarde", desc: "Agradecemos pelo dia que passou e entregamos a noite." },
            'completas': { titulo: "Completas", sub: "Oração da Noite", desc: "Exame de consciência e preparação para o repouso em Deus." }
        };
        const dados = info[tipo];
        
        container.innerHTML = `
            <div class="card-leitor-simulacao">
                <h2>
                    <span class="material-symbols-rounded" style="color:#fbbf24; font-size: 40px;">auto_stories</span>
                </h2>
                <h2 style="margin-top:0; font-size:1.8rem; text-align:center;">${dados.titulo}</h2>
                <h3 style="color:var(--muted); font-size:1.1rem; margin-top:-10px; font-weight:normal; text-align:center;">${dados.sub}</h3>
                
                <p class="conteudo-texto" style="font-style:italic; margin: 20px 0 30px 0; text-align: center; width: 100%;">
                    "${dados.desc}"
                </p>

                <div class="box-destaque-youtube" style="margin-top:20px; border:none; background:transparent; display:flex; flex-direction:column; align-items:center;">
                     <p style="font-size: 0.8rem; font-weight: 800; margin-bottom: 10px; color: #CC0000; text-transform: uppercase;">
                        ▶️ ACOMPANHAR EM ÁUDIO
                    </p>
                    <a href="https:
                        Abrir Canal no YouTube
                    </a>
                </div>
            </div>`;
        return;
    }

    
    if(tipo === 'explicacao-horas') {
        container.innerHTML = `
            <div class="card-leitor-simulacao">
                <h2 style="color:var(--primary);">Liturgia das Horas</h2>
                <div class="conteudo-texto" style="margin-top:20px; text-align: center;">
                    A Liturgia das Horas é a oração pública e oficial da Igreja Católica que tem como objetivo santificar o tempo ao longo do dia.
                </div>
            </div>`;
        return;
    }

    
    const oracao = dbOracoes[tipo];
    if (oracao) {
        container.innerHTML = `
            <div class="card-leitor-simulacao">
                <h2 style="color:#3b82f6;">${oracao.titulo}</h2>
                <div class="conteudo-texto">${oracao.texto}</div>
                <div class="rodape-texto" style="color:#3b82f6; border:none;">Amém.</div>
            </div>`;
    } else {
        
        PrayersModule.abrirOracao(tipo);
    }
};
const initPropositoQuaresma = () => {
    const card = document.getElementById('card-proposito');
    if (!card) return;

    // --- 1. DATA ---
    const verificarSeEhQuaresma = () => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const inicio = new Date(ano, 1, 18); // 18 Fev
        const fim = new Date(ano, 3, 5);     // 05 Abr
        hoje.setHours(0,0,0,0);
        
        // ⚠️ TRUE para testar agora (pode mudar para false depois)
        const isModoTeste = true; 
        
        if ((hoje >= inicio && hoje <= fim) || isModoTeste) return true;
        return false;
    };

    if (!verificarSeEhQuaresma()) {
        card.style.display = 'none';
        return;
    }

    // --- 2. CRIAR OVERLAY (MODAL) ---
    let overlay = document.getElementById('modal-quaresma-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-quaresma-overlay';
        document.body.appendChild(overlay);
        
        // Fechar ao clicar no fundo escuro
        overlay.onclick = (e) => {
            if (e.target === overlay) fecharmodal();
        };
    }

    const fecharmodal = () => {
        overlay.style.display = 'none';
    };

    const abrirModal = () => {
        overlay.style.display = 'flex';
        overlay.appendChild(card);
        card.style.display = 'block';

        // --- INJEÇÃO DO BOTÃO "X" (CLOSE) ---
        // Verifica se o cabeçalho do card já tem o botão de fechar
        const header = card.querySelector('.proposito-header');
        if (header && !header.querySelector('.btn-close-quaresma')) {
            const btnClose = document.createElement('button');
            btnClose.className = 'btn-close-quaresma';
            btnClose.innerHTML = '<span class="material-symbols-rounded" style="font-size: 20px;">close</span>';
            btnClose.onclick = fecharmodal; // Ação de fechar
            
            // Adiciona no final do cabeçalho (lado direito)
            header.appendChild(btnClose);
        }
    };

    // --- 3. BOTÃO PRINCIPAL (ROXO) ---
    const criarBotaoPrincipal = (id) => {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = 'btn-quaresma-estilo'; // Classe com o estilo roxo
        btn.innerHTML = '<span class="material-symbols-rounded">church</span> Meu Propósito';
        btn.onclick = abrirModal;
        return btn;
    };

    // --- POSICIONAMENTO DESKTOP ---
    if (window.innerWidth >= 1024) {
        // Se já existe no HTML (grid), usa ele. Se não, cria.
        let btnDesk = document.getElementById('btn-quaresma-desktop');
        if (!btnDesk) {
            // Tenta colocar dentro da área de botões da liturgia ou cria nova
            // (Assumindo que você ajustou o Grid conforme conversamos antes)
        }
        // Se o botão já estiver no HTML via Grid, só ativamos:
        if (btnDesk) {
            btnDesk.onclick = abrirModal;
            btnDesk.classList.add('btn-quaresma-estilo');
        }
    } 
    // --- POSICIONAMENTO MOBILE (Ajuste de Espaçamento) ---
    else {
        let btnMobile = document.getElementById('btn-quaresma-mobile');
        if (!btnMobile) {
            btnMobile = criarBotaoPrincipal('btn-quaresma-mobile');
            
            // Insere LOGO APÓS o card da Liturgia
            const liturgiaCard = document.getElementById('liturgia');
            if (liturgiaCard && liturgiaCard.parentNode) {
                // insertBefore(novo, proximoIrmao) = Inserir Depois
                liturgiaCard.parentNode.insertBefore(btnMobile, liturgiaCard.nextSibling);
            }
        }
    }

    // Esconde card original da lista (para não duplicar)
    if (card.parentNode !== overlay) {
        card.style.display = 'none';
    }

    // --- LÓGICA DE SALVAR/EDITAR (Mantida) ---
    const atualizarInterface = () => {
        const salvo = localStorage.getItem('agape_proposito_2026');
        const viewForm = document.getElementById('proposito-form');
        const viewDisplay = document.getElementById('proposito-view');
        const textoFinal = document.getElementById('texto-compromisso-final');
        const btnEditar = document.getElementById('btn-editar-proposito');
        const input = document.getElementById('input-proposito');

        if (salvo) {
            if(textoFinal) textoFinal.innerText = `"${salvo}"`;
            if(viewForm) viewForm.style.display = 'none';
            if(viewDisplay) viewDisplay.style.display = 'block'; 
            if(btnEditar) btnEditar.style.display = 'block';
        } else {
            if(viewDisplay) viewDisplay.style.display = 'none';
            if(viewForm) viewForm.style.display = 'block';
            if(btnEditar) btnEditar.style.display = 'none';
            if(input) input.value = ''; 
        }
    };

    const btnSalvar = document.getElementById('btn-salvar-proposito');
    if(btnSalvar) {
        btnSalvar.onclick = () => {
            const input = document.getElementById('input-proposito');
            const txt = input.value.trim();
            if(txt.length < 3) return alert("Digite seu propósito!");
            localStorage.setItem('agape_proposito_2026', txt);
            atualizarInterface();
        };
    }
    
    const btnEditar = document.getElementById('btn-editar-proposito');
    if(btnEditar) {
        btnEditar.onclick = () => {
            if(confirm("Editar propósito?")) {
                localStorage.removeItem('agape_proposito_2026');
                atualizarInterface();
            }
        };
    }
    atualizarInterface();
};

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initPropositoQuaresma();
});

async function initApp() {
  try {
    console.log("Iniciando App Ágape...");
    configurarNavegação();
    configurarData();
    configurarTercoUI(); 
    configurarIconeDinamicoHoras();
    configurarTema();
    
    
    configurarNotasSync(); 
    
    initInstall();
    
    if (typeof BibleModule.alternarTestamento === "function")
      BibleModule.alternarTestamento("novo");
    
    await LiturgiaModule.carregarLiturgia();
    LiturgiaModule.inicializarContador();
    
    try {
      await PropositoModule.carregarCardProposito();
    } catch (e) {}
    try {
      await initAvisos();
    } catch (e) {}
    try {
      AdminModule.inicializarAdmin();
    } catch (e) {}
    try {
      configurarNotificacoes();
    } catch (e) {}
    
    logEvent(analytics, "page_view", { page_title: "Home Liturgia Ágape" });
    configurarListenersModais();
    setInterval(configurarIconeDinamicoHoras, 300000);

    
    if (window.innerWidth >= 1024) {
      
      window.carregarLeitor("terco");
      
      
      MuralModule.inicializarMuralDesktop();
      
      
      CalendarModule.iniciarCalendarioDesktop();
    }
  } catch (erro) {
    console.error(erro);
    document.getElementById("splash-screen")?.remove();
  }
}






function configurarNotasSync() {
    const areaMob = document.getElementById("area-notas"); 
    const areaDesk = document.getElementById("desk-area-notas"); 
    const key = "minhas_notas_agape";
    
    
    const salvar = (val) => {
        localStorage.setItem(key, val);
        
        if(areaMob && areaMob.value !== val) areaMob.value = val;
        if(areaDesk && areaDesk.value !== val) areaDesk.value = val;
    };

    const textoSalvo = localStorage.getItem(key) || "";
    
    if (areaMob) {
        areaMob.value = textoSalvo;
        areaMob.addEventListener("input", () => salvar(areaMob.value));
    }
    if (areaDesk) {
        areaDesk.value = textoSalvo;
        areaDesk.addEventListener("input", () => salvar(areaDesk.value));
    }
}

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
      window.navegarDesktop(targetId);
    };
  });
}

function configurarTema() {
  const btnTema = document.getElementById("btn-tema");
  const btnTemaDesk = document.getElementById("btn-tema-desk");
  const html = document.documentElement;
  
  function aplicarTema(tema) {
    if (tema === "dark") {
      html.setAttribute("data-theme", "dark");
      document.body.classList.add("dark-mode");
      if (btnTema)
        btnTema.innerHTML =
          '<span class="material-symbols-rounded">light_mode</span>';
      if (btnTemaDesk)
        btnTemaDesk.innerHTML =
          '<span class="material-symbols-rounded">light_mode</span>';
    } else {
      html.setAttribute("data-theme", "light");
      document.body.classList.remove("dark-mode");
      if (btnTema)
        btnTema.innerHTML =
          '<span class="material-symbols-rounded">dark_mode</span>';
      if (btnTemaDesk)
        btnTemaDesk.innerHTML =
          '<span class="material-symbols-rounded">dark_mode</span>';
    }
  }
  
  const temaSalvo = localStorage.getItem("tema");
  if (temaSalvo) aplicarTema(temaSalvo);
  
  const toggle = () => {
    const temaAtual = html.getAttribute("data-theme");
    const novoTema = temaAtual === "dark" ? "light" : "dark";
    aplicarTema(novoTema);
    localStorage.setItem("tema", novoTema);
  };
  
  if (btnTema) btnTema.onclick = toggle;
  if (btnTemaDesk) btnTemaDesk.onclick = toggle;
}

function configurarIconeDinamicoHoras() {
    
}


const configurarTercoUI = () => {
  const tituloEl = document.getElementById("titulo-misterio");
  const descEl = document.getElementById("descricao-misterio");
  if (!tituloEl || !descEl) return;

  const hoje = obterMisterioDoDia();
  tituloEl.innerText = hoje.titulo;

  let descFormatada = hoje.desc;
  descFormatada = descFormatada.replace(/(\d\.\s)/g, "<br>$1");
  if (descFormatada.startsWith("<br>"))
    descFormatada = descFormatada.substring(4);

  descEl.innerHTML = `
        <div class="terco-lista">
            ${descFormatada}
        </div>
        <div class="terco-meditacao">
            ${hoje.meditacao}
        </div>
    `;
};



function configurarListenersModais() {
  const btnLiturgia = document.getElementById("btn-abrir-liturgia");
  if (btnLiturgia)
    btnLiturgia.onclick = () => LiturgiaModule.abrirModalLiturgiaCompleta();
  const btnExplicacao = document.getElementById("btn-explicar-horas");
  if (btnExplicacao)
    btnExplicacao.onclick = () => abrirModal("modalExplicacaoHoras");
  setupDomClick("btn-login-secreto", () => abrirModal("modalLogin"));
  
  const fechar = () =>
    document
      .querySelectorAll(".modal")
      .forEach((m) => (m.style.display = "none"));
      
  document
    .querySelectorAll(
      ".close-modal, .close-modal-sobre, #btn-entendido-horas, #btn-fechar-explicacao"
    )
    .forEach((b) => (b.onclick = fechar));
    
  window.onclick = (e) => {
    if (e.target.classList.contains("modal")) fechar();
  };
}

window.navegarDesktop = (idTab) => {
  document.querySelectorAll(".conteudo-aba").forEach((tab) => {
    tab.style.display = "none";
  });
  
  const abaAlvo = document.getElementById(idTab);
  if (abaAlvo) {
    if (
      window.innerWidth >= 1024 &&
      (idTab === "tab-inicio" || idTab === "tab-oracao")
    ) {
      abaAlvo.style.display = "grid";
    } else {
      abaAlvo.style.display = "block";
    }
    window.scrollTo(0, 0);
  }
  
  
  document.querySelectorAll(".sidebar-item").forEach((btn) => {
    btn.classList.remove("active");
  });
  const idBotao = "btn-sidebar-" + idTab.replace("tab-", "");
  const botaoAtivo = document.getElementById(idBotao);
  if (botaoAtivo) botaoAtivo.classList.add("active");
  
  
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
    if (item.getAttribute("data-target") === idTab)
      item.classList.add("active");
  });

  
  
  if (idTab === 'tab-menu') {
      CalendarModule.iniciarCalendarioDesktop();
  }
};

setTimeout(() => {
  document.getElementById("splash-screen")?.remove();
}, 1000);