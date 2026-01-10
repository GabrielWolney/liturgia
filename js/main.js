/**
 * Main Controller - Liturgia Ágape
 * Desenvolvido por: Gabriel Wolney Drumond
 * Descrição: Orquestra a lógica da aplicação, integrando Firebase e APIs externas.
 */

import { db, auth, messaging, analytics } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  deleteDoc,
  doc,
  setDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { onMessage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { configurarNotificacoes, buscarDadosApi } from "./services.js";
import { configurarData, obterMisterioDoDia, setupClick } from "./utils.js";

// Estado global para dados da liturgia
let dadosLiturgia = null;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

/**
 * Inicialização centralizada da aplicação
 */
async function initApp() {
  // 1. Configurações de Interface
  configurarNavegação();
  configurarData();
  configurarTercoUI();
  configurarIconeDinamicoHoras();
  configurarTema(); // <--- NOVA CHAMADA DO DARK MODE AQUI

  // 2. Carregamento de Dados
  await tratarDadosApi();
  carregarAvisos();

  // 3. Funcionalidades de Engajamento
  ouvirContadorLeituras();
  configurarNotificacoes();

  // 4. Analytics e Monitoramento
  logEvent(analytics, "page_view", { page_title: "Home Liturgia Ágape" });

  // 5. Configuração de Listeners Globais e Admin
  configurarListenersAdmin();
  configurarListenersModais();

  // Loop de atualização de ícones (Horas)
  setInterval(configurarIconeDinamicoHoras, 300000); // 5 minutos
}

// =======================================================
// LÓGICA DE UI E NAVEGAÇÃO
// =======================================================

/**
 * Configura o Tema (Dark/Light Mode)
 */
function configurarTema() {
  const btnTema = document.getElementById("btn-tema");
  const html = document.documentElement;

  // 1. Função interna para aplicar visualmente
  function aplicarTema(tema) {
    if (tema === "dark") {
      html.setAttribute("data-theme", "dark");
      if (btnTema)
        btnTema.innerHTML =
          '<span class="material-symbols-rounded">light_mode</span>';
    } else {
      html.setAttribute("data-theme", "light");
      if (btnTema)
        btnTema.innerHTML =
          '<span class="material-symbols-rounded">dark_mode</span>';
    }
  }

  // 2. Carregar Preferência Salva
  const temaSalvo = localStorage.getItem("tema");
  if (temaSalvo) {
    aplicarTema(temaSalvo);
  }

  // 3. Evento de Clique
  if (btnTema) {
    btnTema.onclick = () => {
      const temaAtual = html.getAttribute("data-theme");
      if (temaAtual === "dark") {
        aplicarTema("light");
        localStorage.setItem("tema", "light");
      } else {
        aplicarTema("dark");
        localStorage.setItem("tema", "dark");
      }
    };
  }
}

/**
 * Atualiza o ícone da Liturgia das Horas baseado no horário do dia.
 */
function configurarIconeDinamicoHoras() {
  const iconElement = document.getElementById("icon-horas");
  if (!iconElement) return;

  const hora = new Date().getHours();
  let novoIcone = "bedtime"; // Padrão: Noite/Completas

  if (hora >= 5 && hora < 9) {
    novoIcone = "wb_twilight"; // Madrugada/Laudes
  } else if (hora >= 9 && hora < 18) {
    novoIcone = "light_mode"; // Hora Média
  } else if (hora >= 18 && hora < 22) {
    novoIcone = "clear_night"; // Vésperas
  }

  if (iconElement.innerText !== novoIcone) {
    iconElement.innerText = novoIcone;
  }
}

/**
 * Configura a navegação inferior e scroll suave.
 */
const configurarNavegação = () => {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.onclick = (e) => {
      e.preventDefault();

      // Lógica específica para o botão "Sobre"
      if (item.id === "nav-sobre-site") {
        abrirModal("modalSobreSite");
        return;
      }

      // Atualiza estado visual
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      // Scroll suave
      const targetId = item.getAttribute("data-target");
      if (targetId) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Feedback visual no card
          targetElement.classList.remove("highlight-card");
          void targetElement.offsetWidth; // Força reflow
          targetElement.classList.add("highlight-card");

          setTimeout(
            () => targetElement.classList.remove("highlight-card"),
            1500
          );
        }
      }
    };
  });
};

/**
 * Renderiza o Mistério do dia.
 */
const configurarTercoUI = () => {
  const tituloEl = document.getElementById("titulo-misterio");
  const descEl = document.getElementById("descricao-misterio");

  if (!tituloEl || !descEl) return;

  const hoje = obterMisterioDoDia();
  tituloEl.innerText = hoje.titulo;

  descEl.innerHTML = `
      <div style="margin-bottom: 12px; line-height: 1.5; text-align: center;">
        ${hoje.desc.replace(/\n/g, "<br>")}
      </div>
      
      <hr /> <div class="citacao-misterio-footer" style="font-style: italic; font-size: 0.85rem; padding-top: 5px; text-align: center;">
        ${hoje.meditacao}
      </div>
    `;

  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
      splash.style.opacity = "0";
      setTimeout(() => splash.remove(), 500);
    }
  }, 1500);
};

// =======================================================
// LÓGICA DE DADOS (API & FIRESTORE)
// =======================================================

/**
 * Busca e renderiza os dados da Liturgia Diária.
 */
async function tratarDadosApi() {
  // 1. Mostra o carregamento (Skeletons) em TUDO (Liturgia + Terço)
  renderizarSkeletons();

  const resumo = document.getElementById("resumo-leituras");

  try {
    // 2. Busca dados da API
    dadosLiturgia = await buscarDadosApi();

    if (!dadosLiturgia) return;

    // 3. --- LITURGIA ---
    // Configura Santo, Cor e Ícones
    const elSanto = document.getElementById("nome-santo");
    const elEmoji = document.getElementById("emoji-tempo");
    const elCirculo = document.getElementById("indicador-cor");
    const elBadge = document.getElementById("badge-cor");

    // Tratamento dos ícones/imagens
    const corAPI = (dadosLiturgia.cor || "Branco").toLowerCase();

    const configCores = {
      branco: { classe: "branco", img: "./liturgia-icons/branco.png" },
      dourado: { classe: "branco", img: "./liturgia-icons/branco.png" },
      verde: { classe: "verde", img: "./liturgia-icons/verde.png" },
      roxo: { classe: "roxo", img: "./liturgia-icons/roxo.png" },
      violeta: { classe: "roxo", img: "./liturgia-icons/roxo.png" },
      vermelho: { classe: "vermelho", img: "./liturgia-icons/vermelho.png" },
      rosa: { classe: "rosa", img: "./liturgia-icons/rosa.png" },
    };

    const config =
      configCores[
        Object.keys(configCores).find((key) => corAPI.includes(key))
      ] || configCores.branco;

    elSanto.innerText = dadosLiturgia.liturgia || "Tempo Litúrgico";
    elBadge.innerText = dadosLiturgia.cor;
    elBadge.className = `badge-cor ${config.classe}`;

    // Atualiza o círculo e imagem
    elCirculo.className = `circulo-liturgico ${config.classe}`;
    elCirculo.classList.remove("skeleton", "skeleton-circle");

    elEmoji.style.display = "block";
    elEmoji.innerHTML = `<img src="${config.img}" alt="${dadosLiturgia.cor}" class="icone-liturgico-img">`;
    elEmoji.classList.remove("material-symbols-rounded");

    // Atualiza Resumo
    if (resumo) {
      const ref1 = dadosLiturgia.primeiraLeitura?.referencia || "---";
      const refSalmo = dadosLiturgia.salmo?.referencia || "---";
      const refEvangelho = dadosLiturgia.evangelho?.referencia || "---";

      let html = `<div style="text-align: center; line-height: 1.8;">
                <p><strong>1ª Leitura:</strong> ${ref1}</p>
                <p><strong>Salmo:</strong> ${refSalmo}</p>`;
      if (
        dadosLiturgia.segundaLeitura &&
        !dadosLiturgia.segundaLeitura.includes("Não há")
      ) {
        html += `<p><strong>2ª Leitura:</strong> ${
          dadosLiturgia.segundaLeitura.referencia || "---"
        }</p>`;
      }
      html += `<p><strong>Evangelho:</strong> ${refEvangelho}</p></div>`;
      resumo.innerHTML = html;
    }

    // 4. --- RECARREGA O TERÇO (CORREÇÃO) ---
    configurarTercoUI();
  } catch (error) {
    console.error("Erro:", error);
    document.getElementById("nome-santo").innerText = "Erro ao carregar";
  }
}

// Função auxiliar para desenhar os retângulos cinzas
function renderizarSkeletons() {
  // Skeleton do Santo/Tempo
  const elSanto = document.getElementById("nome-santo");
  const elBadge = document.getElementById("badge-cor");
  const elCirculo = document.getElementById("indicador-cor");
  const elEmoji = document.getElementById("emoji-tempo");

  if (elSanto)
    elSanto.innerHTML = '<div class="skeleton skeleton-title"></div>';
  if (elBadge)
    elBadge.innerHTML = '<div class="skeleton skeleton-badge"></div>';
  if (elBadge) elBadge.className = ""; // Limpa cor anterior

  // Transforma o círculo num skeleton
  if (elCirculo) {
    elCirculo.className = "skeleton skeleton-circle";
    elCirculo.style.border = "none";
  }
  if (elEmoji) elEmoji.style.display = "none";

  // Skeleton do Resumo da Liturgia
  const resumo = document.getElementById("resumo-leituras");
  if (resumo) {
    resumo.innerHTML = `
            <div class="skeleton skeleton-text" style="width: 60%; margin: 0 auto 10px auto;"></div>
            <div class="skeleton skeleton-text" style="width: 80%; margin: 0 auto 10px auto;"></div>
            <div class="skeleton skeleton-text" style="width: 50%; margin: 0 auto;"></div>
        `;
  }

  // Skeleton do Terço
  const tituloTerco = document.getElementById("titulo-misterio");
  const descTerco = document.getElementById("descricao-misterio");
  if (tituloTerco)
    tituloTerco.innerHTML =
      '<div class="skeleton skeleton-title" style="width: 50%"></div>';
  if (descTerco)
    descTerco.innerHTML =
      '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>';
}

/**
 * Gerencia o contador de leituras em tempo real.
 */
const ouvirContadorLeituras = () => {
  const btnLi = document.getElementById("btn-li-a-leitura");
  const elContador = document.getElementById("texto-contador-leituras");
  if (!btnLi || !elContador) return;

  const hoje = new Date().toLocaleDateString("en-CA");
  const docRef = doc(db, "estatisticas", `leituras_${hoje}`);

  // Verifica estado local
  const jaLeu = localStorage.getItem(`leitura_concluida_${hoje}`);
  if (jaLeu) {
    atualizarEstadoBotaoLeitura(btnLi, true);
  }

  // Ouve mudanças no Firestore
  onSnapshot(docRef, (docSnap) => {
    const total = docSnap.exists() ? docSnap.data().contador || 0 : 0;

    if (total === 0) elContador.innerText = "Seja o primeiro a ler hoje!";
    else if (total === 1) elContador.innerText = "1 pessoa leu hoje!!";
    else elContador.innerText = `${total} pessoas leram hoje!!`;
  });

  // Clique do botão
  btnLi.onclick = async () => {
    const jaLeuAgora = localStorage.getItem(`leitura_concluida_${hoje}`);
    try {
      if (!jaLeuAgora) {
        await setDoc(
          docRef,
          { contador: increment(1), ultimaAtualizacao: new Date() },
          { merge: true }
        );
        localStorage.setItem(`leitura_concluida_${hoje}`, "true");
        atualizarEstadoBotaoLeitura(btnLi, true);
        logEvent(analytics, "marcou_leitura_concluida");
      } else {
        await setDoc(
          docRef,
          { contador: increment(-1), ultimaAtualizacao: new Date() },
          { merge: true }
        );
        localStorage.removeItem(`leitura_concluida_${hoje}`);
        atualizarEstadoBotaoLeitura(btnLi, false);
        logEvent(analytics, "desmarcou_leitura_concluida");
      }
    } catch (error) {
      console.error("Erro ao atualizar contador:", error);
    }
  };
};

function atualizarEstadoBotaoLeitura(btn, lido) {
  if (lido) {
    btn.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' 1;">check_circle</span> <span>Leitura Concluída</span>`;
    btn.classList.add("lido");
    btn.style.color = "";
    btn.style.borderColor = "";
  } else {
    btn.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' 0;">check_circle</span> <span>Eu li as leituras</span>`;
    btn.classList.remove("lido");
    btn.style.color = "";
    btn.style.borderColor = "";
  }
}

/**
 * Carrega lista de avisos ativos.
 */
const carregarAvisos = () => {
  const container = document.getElementById("lista-avisos");
  if (!container) return;

  const hojeLocal = new Date().toLocaleDateString("en-CA");
  const q = query(
    collection(db, "avisos"),
    where("dataExpiracao", ">=", hojeLocal),
    orderBy("dataExpiracao", "asc")
  );

  onSnapshot(q, (snapshot) => {
    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML =
        "<li style='text-align:center; color:gray;'>Nenhum aviso ativo.</li>";
      return;
    }
    snapshot.forEach((doc) => {
      const li = document.createElement("li");
      li.innerText = doc.data().texto;
      container.appendChild(li);
    });
  });
};

// =======================================================
// ADMINISTRAÇÃO E MODAIS
// =======================================================

function configurarListenersAdmin() {
  // Login
  setupClick("btn-fazer-login", async () => {
    const e = document.getElementById("login-email").value;
    const s = document.getElementById("login-senha").value;
    try {
      await signInWithEmailAndPassword(auth, e, s);
      document.getElementById("modalLogin").style.display = "none";
      abrirModal("modalAdminAvisos");
      gerenciarAvisosPainel();
    } catch (err) {
      alert("Acesso negado.");
    }
  });

  // Salvar Aviso
  setupClick("btn-salvar-aviso", async () => {
    const inp = document.getElementById("novo-aviso-texto");
    const dataExp = document.getElementById("aviso-data-expiracao");
    if (!inp.value || !dataExp.value) return alert("Preencha tudo!");
    try {
      await addDoc(collection(db, "avisos"), {
        texto: inp.value,
        dataExpiracao: dataExp.value,
        dataCriacao: new Date(),
      });
      inp.value = "";
      dataExp.value = "";
      alert("Aviso postado!");
    } catch (e) {
      alert("Erro ao postar.");
    }
  });
}

function configurarListenersModais() {
  // Botões de abertura
  setupClick("btn-abrir-liturgia", abrirModalLiturgia);
  setupClick("btn-explicar-horas", () => abrirModal("modalExplicacaoHoras"));
  setupClick("btn-login-secreto", () => abrirModal("modalLogin"));

  // Fechamento
  const fechar = () => {
    document
      .querySelectorAll(".modal")
      .forEach((m) => (m.style.display = "none"));
  };

  document
    .querySelectorAll(
      ".close-modal, .close-modal-sobre, #btn-entendido-horas, #btn-fechar-explicacao"
    )
    .forEach((b) => (b.onclick = fechar));

  window.onclick = (e) => {
    if (e.target.classList.contains("modal")) fechar();
  };
}

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}

function abrirModalLiturgia() {
  if (!dadosLiturgia) return alert("Aguarde o carregamento...");

  logEvent(analytics, "visualizou_liturgia_completa", {
    liturgia_titulo: dadosLiturgia.liturgia,
  });
  const modal = document.getElementById("modalGeral");
  const corpo = document.getElementById("modal-corpo");
  const titulo = document.getElementById("modal-titulo");

  if (modal && corpo) {
    titulo.innerText = "Liturgia da Palavra";
    const formatarTexto = (dado) => {
      if (!dado) return "Conteúdo não disponível.";
      let textoBase = typeof dado === "string" ? dado : dado.texto || "";
      let htmlFinal = dado.refrao
        ? `<strong>Refrão:</strong> ${dado.refrao}<br><br>`
        : "";
      return (
        htmlFinal +
        textoBase.replace(/(\d+)/g, '<sup class="versiculo">$1</sup>')
      );
    };

    let html = `<div class="leitura-bloco"><h4>1ª Leitura</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${
      dadosLiturgia.primeiraLeitura?.referencia || ""
    }</p><p>${formatarTexto(dadosLiturgia.primeiraLeitura)}</p></div><hr>`;
    html += `<div class="leitura-bloco"><h4>Salmo Responsorial</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${
      dadosLiturgia.salmo?.referencia || ""
    }</p><p>${formatarTexto(dadosLiturgia.salmo)}</p></div><hr>`;

    if (
      dadosLiturgia.segundaLeitura &&
      !dadosLiturgia.segundaLeitura.includes?.("Não há")
    ) {
      html += `<div class="leitura-bloco"><h4>2ª Leitura</h4><p style="color: #64748b; font-weight: bold;">${
        dadosLiturgia.segundaLeitura?.referencia || ""
      }</p><p>${formatarTexto(dadosLiturgia.segundaLeitura)}</p></div><hr>`;
    }

    html += `<div class="leitura-bloco"><h4>Evangelho</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${
      dadosLiturgia.evangelho?.referencia || ""
    }</p><p>${formatarTexto(dadosLiturgia.evangelho)}</p></div>`;

    // Botão de compartilhar no Modal
    html += `
        <div style="padding: 15px; border-top: 1px solid var(--border);">
            <button id="btn-compartilhar" class="btn-primary" onclick="compartilharEvangelho()">
                <span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px;">share</span>
                Compartilhar Evangelho
            </button>
        </div>
    `;

    corpo.innerHTML = html;
    abrirModal("modalGeral");
  }
}

// FUNCIONALIDADE: COMPARTILHAMENTO NATIVO
window.compartilharEvangelho = async function () {
  if (!dadosLiturgia) return;

  const texto = `📖 *Evangelho do Dia*\n\n${dadosLiturgia.liturgia}\n\nConfira a liturgia completa no App Ágape!\n${window.location.href}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Liturgia Diária - Ágape",
        text: texto,
        url: window.location.href,
      });
    } catch (err) {
      console.log("Cancelado pelo usuário");
    }
  } else {
    try {
      await navigator.clipboard.writeText(texto);
      alert("Link copiado!");
    } catch (err) {
      alert("Erro ao copiar.");
    }
  }
};

const gerenciarAvisosPainel = () => {
  const listaAdmin = document.getElementById("meus-avisos-lista");
  if (!listaAdmin) return;

  const hojeLocal = new Date().toLocaleDateString("en-CA");
  const q = query(
    collection(db, "avisos"),
    where("dataExpiracao", ">=", hojeLocal),
    orderBy("dataExpiracao", "asc")
  );

  onSnapshot(q, (snapshot) => {
    listaAdmin.innerHTML =
      "<h4 style='margin: 15px 0 10px;'>Gerenciar Avisos Ativos:</h4>";
    snapshot.forEach((documento) => {
      const dados = documento.data();
      const item = document.createElement("div");
      item.style =
        "background: #f8fafc; padding: 12px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0;";
      item.innerHTML = `
                <div style="flex: 1; padding-right: 10px;">
                    <p style="font-size: 0.9rem; font-weight: 600; margin: 0;">${dados.texto}</p>
                    <small style="color: #64748b;">Expira em: ${dados.dataExpiracao}</small>
                </div>
                <button class="btn-excluir" data-id="${documento.id}" style="background: #ef4444; color: white; border: none; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 1.1rem;">🗑️</button>
            `;
      listaAdmin.appendChild(item);
    });

    listaAdmin.querySelectorAll(".btn-excluir").forEach((btn) => {
      btn.onclick = async (e) => {
        const idAviso = e.currentTarget.getAttribute("data-id");
        if (confirm("Deseja realmente apagar este aviso?")) {
          try {
            await deleteDoc(doc(db, "avisos", idAviso));
            alert("Aviso removido!");
          } catch (err) {
            alert("Erro ao remover: " + err.message);
          }
        }
      };
    });
  });
};

// Push Notifications
onMessage(messaging, (payload) => {
  alert(`Novo Aviso do Ágape: ${payload.notification.body}`);
});

// Exposição global necessária para onclick no HTML
window.abrirHora = (tipo) => {
  logEvent(analytics, "rezou_liturgia_horas", { tipo_hora: tipo });
  const modal = document.getElementById("modalGeral");
  const corpo = document.getElementById("modal-corpo");
  const titulo = document.getElementById("modal-titulo");

  if (modal && corpo) {
    const infoHoras = {
      laudes: {
        titulo: "Laudes: Oração da Manhã",
        desc: "As Laudes são destinadas a santificar o tempo da manhã. Elas celebram a Ressurreição do Senhor, que é a 'Luz verdadeira' e o 'Sol de Justiça'.",
      },
      vesperas: {
        titulo: "Vésperas: Oração da Tarde",
        desc: "As Vésperas são celebradas ao entardecer, quando o dia já declina. Fazemos memória da Redenção por meio da oração que sobe como incenso.",
      },
      completas: {
        titulo: "Completas: Oração antes do Repouso",
        desc: "As Completas são a última oração do dia. É o momento do exame de consciência e da entrega confiante de nossa vida nas mãos de Deus.",
      },
    };
    const selecao = infoHoras[tipo];
    titulo.innerText = selecao.titulo;
    corpo.innerHTML = `<div style="text-align:center; padding: 10px;"><p style="margin-bottom: 25px; text-align: justify; line-height: 1.6; color: var(--text); font-style: italic;">"${selecao.desc}"</p><div style="background: #f8fafc; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;"><p style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: #CC0000;">▶️ REZAR AGORA</p><a href="https://www.youtube.com/LiturgiadasHorasOnline" target="_blank" class="btn-primary" style="text-decoration:none; display:inline-block; width:auto; padding: 12px 25px; background: #FF0000; border-radius: 8px;">Abrir Canal no YouTube</a></div></div>`;
    abrirModal("modalGeral");
  }
};
