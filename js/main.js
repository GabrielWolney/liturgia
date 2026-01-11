/**
 * Main Controller - Versão 5.0 (Final - Gold Master)
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
  limit,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { onMessage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { configurarNotificacoes } from "./services.js";
import { configurarData, obterMisterioDoDia, setupClick } from "./utils.js";

let dadosLiturgia = null;
let avisosGlobais = [];
let unsubscribeMural = null;

// =======================================================
// CATÁLOGO BÍBLIA
// =======================================================
const bibliaCatolica = {
  novo: [
    { nome: "Mateus", slug: "sao-mateus" },
    { nome: "Marcos", slug: "sao-marcos" },
    { nome: "Lucas", slug: "sao-lucas" },
    { nome: "João", slug: "sao-joao" },
    { nome: "Atos", slug: "atos-dos-apostolos" },
    { nome: "Romanos", slug: "romanos" },
    { nome: "1 Coríntios", slug: "i-corintios" },
    { nome: "2 Coríntios", slug: "ii-corintios" },
    { nome: "Gálatas", slug: "galatas" },
    { nome: "Efésios", slug: "efesios" },
    { nome: "Filipenses", slug: "filipenses" },
    { nome: "Colossenses", slug: "colossenses" },
    { nome: "1 Tess", slug: "i-tessalonicenses" },
    { nome: "2 Tess", slug: "ii-tessalonicenses" },
    { nome: "1 Timóteo", slug: "i-timoteo" },
    { nome: "2 Timóteo", slug: "ii-timoteo" },
    { nome: "Tito", slug: "tito" },
    { nome: "Filemom", slug: "filemon" },
    { nome: "Hebreus", slug: "hebreus" },
    { nome: "Tiago", slug: "sao-tiago" },
    { nome: "1 Pedro", slug: "i-pedro" },
    { nome: "2 Pedro", slug: "ii-pedro" },
    { nome: "1 João", slug: "i-joao" },
    { nome: "2 João", slug: "ii-joao" },
    { nome: "3 João", slug: "iii-joao" },
    { nome: "Judas", slug: "sao-judas" },
    { nome: "Apocalipse", slug: "apocalipse" },
  ],
  antigo: [
    { nome: "Gênesis", slug: "genesis" },
    { nome: "Êxodo", slug: "exodo" },
    { nome: "Levítico", slug: "levitico" },
    { nome: "Números", slug: "numeros" },
    { nome: "Deuteronômio", slug: "deuteronomio" },
    { nome: "Josué", slug: "josue" },
    { nome: "Juízes", slug: "juizes" },
    { nome: "Rute", slug: "rute" },
    { nome: "1 Samuel", slug: "i-samuel" },
    { nome: "2 Samuel", slug: "ii-samuel" },
    { nome: "1 Reis", slug: "i-reis" },
    { nome: "2 Reis", slug: "ii-reis" },
    { nome: "1 Crônicas", slug: "i-cronicas" },
    { nome: "2 Crônicas", slug: "ii-cronicas" },
    { nome: "Esdras", slug: "esdras" },
    { nome: "Neemias", slug: "neemias" },
    { nome: "Tobias", slug: "tobias" },
    { nome: "Judite", slug: "judite" },
    { nome: "Ester", slug: "ester" },
    { nome: "1 Macabeus", slug: "i-macabeus" },
    { nome: "2 Macabeus", slug: "ii-macabeus" },
    { nome: "Jó", slug: "jo" },
    { nome: "Salmos", slug: "salmos" },
    { nome: "Provérbios", slug: "proverbios" },
    { nome: "Eclesiastes", slug: "eclesiastes" },
    { nome: "Cânticos", slug: "cantico-dos-canticos" },
    { nome: "Sabedoria", slug: "sabedoria" },
    { nome: "Eclesiástico", slug: "eclesiastico" },
    { nome: "Isaías", slug: "isaias" },
    { nome: "Jeremias", slug: "jeremias" },
    { nome: "Lamentações", slug: "lamentacoes" },
    { nome: "Baruc", slug: "baruc" },
    { nome: "Ezequiel", slug: "ezequiel" },
    { nome: "Daniel", slug: "daniel" },
    { nome: "Oseias", slug: "oseias" },
    { nome: "Joel", slug: "joel" },
    { nome: "Amós", slug: "amos" },
    { nome: "Abdias", slug: "abdias" },
    { nome: "Jonas", slug: "jonas" },
    { nome: "Miqueias", slug: "miqueias" },
    { nome: "Naum", slug: "naum" },
    { nome: "Habacuc", slug: "habacuc" },
    { nome: "Sofonias", slug: "sofonias" },
    { nome: "Ageu", slug: "ageu" },
    { nome: "Zacarias", slug: "zacarias" },
    { nome: "Malaquias", slug: "malaquias" },
  ],
};

// =======================================================
// INICIALIZAÇÃO
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  try {
    configurarNavegação();
    configurarData();
    configurarTercoUI();
    configurarIconeDinamicoHoras();
    configurarTema();

    alternarTestamento("novo");
    configurarNotas();

    // Liturgia com tratamento de erro
    await gerenciarLiturgia();

    carregarAvisos();
    ouvirContadorLeituras();

    // Notificações em bloco try/catch para não parar o app
    try {
      configurarNotificacoes();
    } catch (e) {
      console.warn("Notificações desativadas");
    }

    logEvent(analytics, "page_view", { page_title: "Home Liturgia Ágape" });
    configurarListenersAdmin();
    configurarListenersModais();

    setInterval(configurarIconeDinamicoHoras, 300000);
  } catch (erroFatal) {
    console.error("Erro fatal na inicialização:", erroFatal);
    // Remove splash mesmo com erro
    const splash = document.getElementById("splash-screen");
    if (splash) splash.remove();
  }
}

// =======================================================
// MURAL DE ORAÇÃO (24H + EXCLUSÃO)
// =======================================================
window.abrirMuralPedidos = () => {
  abrirModal("modalMuralPedidos");
  carregarMuralFirestore();
};

// 1. Postar e salvar o ID imediatamente
// 1. Postar pedido e salvar ID localmente para permitir exclusão
// 1. POSTAR: Garante que o ID seja salvo antes de qualquer outra coisa
window.postarPedido = async () => {
    const nomeInput = document.getElementById("nome-orante");
    const textoInput = document.getElementById("texto-pedido-publico");
    const nome = nomeInput.value.trim() || "Anônimo";
    const texto = textoInput.value.trim();

    if (!texto) return alert("Escreva seu pedido!");

    const btn = document.querySelector("#modalMuralPedidos .btn-primary");
    try {
        btn.disabled = true;
        
        const docRef = await addDoc(collection(db, "mural_oracoes"), {
            nome: nome,
            texto: texto,
            data: new Date(),
            rezaram: 0
        });

        // SALVAMENTO GARANTIDO
        let meusIds = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
        meusIds.push(docRef.id);
        localStorage.setItem("meus_pedidos_mural", JSON.stringify(meusIds));
        
        console.log("ID Salvo com sucesso:", docRef.id); // Debug para você no F12
        textoInput.value = "";

    } catch (e) {
        console.error(e);
    } finally {
        btn.disabled = false;
    }
};

// 2. RENDERIZAR: Garante que a lixeira apareça consultando o storage atualizado
function carregarMuralFirestore() {
    const feed = document.getElementById("feed-pedidos");
    if (!feed) return;
    if (unsubscribeMural) unsubscribeMural();

    const ontem = new Date();
    ontem.setHours(ontem.getHours() - 24);

    const q = query(collection(db, "mural_oracoes"), where("data", ">", ontem), orderBy("data", "desc"));

    unsubscribeMural = onSnapshot(q, (snapshot) => {
        feed.innerHTML = "";
        // Lê a lista atualizada de IDs toda vez que o banco muda
        const meusIds = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");

        snapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            const id = docSnap.id;
            const souDono = meusIds.includes(id);

            const card = document.createElement("div");
            card.className = "card-pedido";
            card.innerHTML = `
                <div class="pedido-header">
                    <span class="pedido-nome">${dados.nome}</span>
                    ${souDono ? `
                        <button onclick="excluirMeuPedido('${id}')" class="btn-excluir-pedido">
                            <span class="material-symbols-rounded">delete</span>
                        </button>` : ''}
                </div>
                <p class="pedido-texto">${dados.texto}</p>
            `;
            feed.appendChild(card);
        });
    });
}
window.excluirMeuPedido = async (id) => {
  if (!confirm("Deseja apagar seu pedido do mural?")) return;
  try {
    await deleteDoc(doc(db, "mural_oracoes", id));
    removerIdMeusPedidos(id);
  } catch (e) {
    alert("Erro ao excluir.");
  }
};

// LocalStorage Helpers
function salvarIdMeusPedidos(id) {
  const lista = lerIdsMeusPedidos();
  lista.push(id);
  localStorage.setItem("meus_pedidos_mural", JSON.stringify(lista));
}
function lerIdsMeusPedidos() {
  return JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
}
function removerIdMeusPedidos(id) {
  let lista = lerIdsMeusPedidos();
  lista = lista.filter((item) => item !== id);
  localStorage.setItem("meus_pedidos_mural", JSON.stringify(lista));
}

// =======================================================
// FERRAMENTAS MENU
// =======================================================
window.abrirCalendario = () => {
  renderizarCalendario();
  abrirModal("modalCalendario");
};
function renderizarCalendario() {
  const grid = document.getElementById("calendario-grid");
  const titulo = document.getElementById("mes-ano-calendario");
  const listaEventos = document.getElementById("lista-eventos-dia");
  if (!grid) return;

  grid.innerHTML = "";
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  titulo.innerText = hoje.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  ["D", "S", "T", "Q", "Q", "S", "S"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "calendar-header";
    el.innerText = d;
    grid.appendChild(el);
  });

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++)
    grid.appendChild(document.createElement("div"));

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const el = document.createElement("div");
    el.className = "calendar-day";
    el.innerText = dia;
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(
      dia
    ).padStart(2, "0")}`;

    const temAviso = avisosGlobais.find((a) => a.dataExpiracao === dataStr);

    if (temAviso) {
      el.classList.add("has-event");
      el.onclick = () => {
        listaEventos.innerHTML = `
                    <div class="aviso-carinhoso">
                        <span class="material-symbols-rounded">event_available</span>
                        <div>
                            <strong>Aviso de ${dia}/${mes + 1}:</strong>
                            <p>${temAviso.texto}</p>
                        </div>
                    </div>`;
      };
    } else {
      el.onclick = () => {
        listaEventos.innerHTML = `<p style="font-size: 0.8rem; color: var(--muted); text-align: center; font-style: italic;">Não há avisos para este dia. Que tal dedicar um tempo à oração pessoal? 🙏</p>`;
      };
    }

    if (dia === hoje.getDate()) el.style.border = "2px solid var(--primary)";
    grid.appendChild(el);
  }

  // INSTRUÇÃO NA PARTE DE BAIXO
  if (
    !listaEventos.innerHTML ||
    listaEventos.innerHTML.includes("Clique em um dia")
  ) {
    listaEventos.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center; color: var(--muted); opacity: 0.8;">
                <span class="material-symbols-rounded" style="font-size: 18px;">touch_app</span>
                <p style="font-size: 0.75rem; font-weight: 500;">Toque nos dias marcados para ver os avisos do grupo.</p>
            </div>`;
  }
}

window.abrirNotas = () => abrirModal("modalNotas");
function configurarNotas() {
    const area = document.getElementById("area-notas");
    if(!area) return;

    // placeholder com sugestões do que anotar
    const sugestoes = [
        "O que Deus falou ao seu coração hoje? ✨",
        "Sugestão: Anote pontos da pregação ou do Evangelho...",
        "Espaço para suas orações, dúvidas ou resoluções espirituais...",
        "Anote aqui seus compromissos com o grupo Ágape..."
    ];
    
    // Escolhe uma sugestão aleatória toda vez que abre
    if(!area.value) {
        area.placeholder = sugestoes[Math.floor(Math.random() * sugestoes.length)];
    }

    const salvo = localStorage.getItem("minhas_notas_agape");
    if(salvo) area.value = salvo;

    area.addEventListener("input", () => {
        localStorage.setItem("minhas_notas_agape", area.value);
    });
}

// =======================================================
// LITURGIA E API
// =======================================================
async function gerenciarLiturgia() {
  renderizarSkeletons();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch("https://liturgia.up.railway.app/", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("API Principal Falhou");
    dadosLiturgia = await response.json();
    if (!dadosLiturgia || !dadosLiturgia.primeiraLeitura)
      throw new Error("Dados incompletos");
    preencherResumoInicio(dadosLiturgia);
  } catch (error) {
    console.warn("Usando backup Liturgia:", error);
    usarDadosBackup();
  }
}

function usarDadosBackup() {
  const backup = {
    liturgia: "Liturgia Diária",
    cor: "Verde",
    primeiraLeitura: "Leitura indisponível temporariamente.",
    salmo: "Salmo indisponível temporariamente.",
    evangelho: "Evangelho indisponível. Verifique sua conexão.",
    segundaLeitura: "Não há",
  };
  dadosLiturgia = backup;
  preencherResumoInicio(backup);
  const elSanto = document.getElementById("nome-santo");
  if (elSanto) elSanto.innerText = "Modo Offline";
}

function preencherResumoInicio(dados) {
  const elSanto = document.getElementById("nome-santo");
  const elBadge = document.getElementById("badge-cor");
  const elCirculo = document.getElementById("indicador-cor");
  const elEmoji = document.getElementById("emoji-tempo");
  const resumo = document.getElementById("resumo-leituras");

  const corAPI = (dados.cor || "Branco").toLowerCase();
  const configCores = {
    branco: { classe: "branco", img: "./liturgia-icons/branco.png" },
    verde: { classe: "verde", img: "./liturgia-icons/verde.png" },
    roxo: { classe: "roxo", img: "./liturgia-icons/roxo.png" },
    vermelho: { classe: "vermelho", img: "./liturgia-icons/vermelho.png" },
    rosa: { classe: "rosa", img: "./liturgia-icons/rosa.png" },
  };
  const config =
    configCores[Object.keys(configCores).find((key) => corAPI.includes(key))] ||
    configCores.branco;

  if (elSanto) elSanto.innerText = dados.liturgia || "Tempo Comum";
  if (elBadge) {
    elBadge.innerText = dados.cor || "Cor";
    elBadge.className = `badge-cor ${config.classe}`;
  }
  if (elCirculo) {
    elCirculo.className = `circulo-liturgico ${config.classe}`;
    elCirculo.style.border = "none";
  }
  if (elEmoji) {
    elEmoji.style.display = "block";
    elEmoji.innerHTML = `<img src="${config.img}" alt="${dados.cor}" class="icone-liturgico-img">`;
  }

  const getText = (d) => {
    if (!d) return "---";
    if (typeof d === "string") return d;
    return d.referencia || "---";
  };
  if (resumo) {
    const l1 = getText(dados.primeiraLeitura);
    const sal = getText(dados.salmo);
    const ev = getText(dados.evangelho);
    let html = `<div style="text-align: center; line-height: 1.8;"><p><strong>1ª Leitura:</strong> ${l1}</p><p><strong>Salmo:</strong> ${sal}</p>`;
    if (
      dados.segundaLeitura &&
      !JSON.stringify(dados.segundaLeitura).includes("Não há")
    )
      html += `<p><strong>2ª Leitura:</strong> ${getText(
        dados.segundaLeitura
      )}</p>`;
    html += `<p><strong>Evangelho:</strong> ${ev}</p></div>`;
    resumo.innerHTML = html;
  }
}

// =======================================================
// AVISOS E CONTADORES
// =======================================================
const carregarAvisos = () => {
  const container = document.getElementById("lista-avisos");
  const hojeLocal = new Date().toLocaleDateString("en-CA");
  const q = query(
    collection(db, "avisos"),
    where("dataExpiracao", ">=", hojeLocal),
    orderBy("dataExpiracao", "asc")
  );
  onSnapshot(q, (snapshot) => {
    avisosGlobais = [];
    if (container) container.innerHTML = "";
    if (snapshot.empty && container) {
      container.innerHTML =
        "<li style='text-align:center; color:gray;'>Nenhum aviso ativo.</li>";
      return;
    }
    snapshot.forEach((doc) => {
      const dados = doc.data();
      avisosGlobais.push(dados);
      if (container) {
        const li = document.createElement("li");
        const dataFormatada = dados.dataExpiracao
          .split("-")
          .reverse()
          .join("/");
        li.innerHTML = `<strong>${dataFormatada}:</strong> ${dados.texto}`;
        container.appendChild(li);
      }
    });
  });
};

const ouvirContadorLeituras = () => {
  const btnLi = document.getElementById("btn-li-a-leitura");
  const elContador = document.getElementById("texto-contador-leituras");
  if (!btnLi || !elContador) return;
  const hoje = new Date().toLocaleDateString("en-CA");
  const docRef = doc(db, "estatisticas", `leituras_${hoje}`);
  const jaLeu = localStorage.getItem(`leitura_concluida_${hoje}`);
  if (jaLeu) atualizarEstadoBotaoLeitura(btnLi, true);
  onSnapshot(docRef, (docSnap) => {
    const total = docSnap.exists() ? docSnap.data().contador || 0 : 0;
    if (total === 0) elContador.innerText = "Seja o primeiro a ler hoje!";
    else if (total === 1) elContador.innerText = "1 pessoa leu hoje!!";
    else elContador.innerText = `${total} pessoas leram hoje!!`;
  });
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
      console.error("Erro contador:", error);
    }
  };
};

function atualizarEstadoBotaoLeitura(btn, lido) {
  if (lido) {
    btn.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' 1;">check_circle</span> <span>Leitura Concluída</span>`;
    btn.classList.add("lido");
  } else {
    btn.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' 0;">check_circle</span> <span>Eu li as leituras</span>`;
    btn.classList.remove("lido");
  }
}

// =======================================================
// UI E UTILITÁRIOS
// =======================================================
window.alternarTestamento = (tipo) => {
  const btnNovo = document.getElementById("btn-novo-test");
  const btnAntigo = document.getElementById("btn-antigo-test");
  if (tipo === "novo") {
    if (btnNovo) btnNovo.style.opacity = "1";
    if (btnAntigo) btnAntigo.style.opacity = "0.5";
    renderizarLivros(bibliaCatolica.novo);
  } else {
    if (btnNovo) btnNovo.style.opacity = "0.5";
    if (btnAntigo) btnAntigo.style.opacity = "1";
    renderizarLivros(bibliaCatolica.antigo);
  }
};
function renderizarLivros(lista) {
  const grid = document.getElementById("grid-livros");
  if (!grid) return;
  grid.innerHTML = "";
  lista.forEach((livro) => {
    const btn = document.createElement("div");
    btn.className = "btn-livro";
    if (livro.nome.length > 11) btn.style.fontSize = "0.7rem";
    else btn.style.fontSize = "0.85rem";
    btn.innerText = livro.nome;
    btn.onclick = () => abrirModalCapitulo(livro);
    grid.appendChild(btn);
  });
}
function abrirModalCapitulo(livroObj) {
  const modal = document.getElementById("modalCapitulos");
  const titulo = document.getElementById("titulo-livro-selecionado");
  const input = document.getElementById("input-capitulo");
  const btnLer = document.getElementById("btn-ler-capitulo");
  if (titulo) titulo.innerText = livroObj.nome;
  if (input) input.value = "";
  if (modal) modal.style.display = "flex";
  if (btnLer) {
    btnLer.onclick = () => {
      const cap = input.value;
      if (!cap || cap < 1) return alert("Digite um capítulo válido!");
      window.open(
        `https://www.bibliacatolica.com.br/biblia-ave-maria/${livroObj.slug}/${cap}/`,
        "_blank"
      );
      if (modal) modal.style.display = "none";
    };
  }
}

function renderizarSkeletons() {
  const elSanto = document.getElementById("nome-santo");
  if (elSanto)
    elSanto.innerHTML = '<div class="skeleton skeleton-title"></div>';
  const resumo = document.getElementById("resumo-leituras");
  if (resumo)
    resumo.innerHTML = `<div class="skeleton skeleton-text" style="width: 60%; margin: 0 auto 10px auto;"></div><div class="skeleton skeleton-text" style="width: 80%; margin: 0 auto 10px auto;"></div>`;
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
    };
  });
}
function configurarTema() {
  const btnTema = document.getElementById("btn-tema");
  const html = document.documentElement;
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
  descEl.innerHTML = `<div style="margin-bottom: 12px; line-height: 1.5; text-align: center;">${hoje.desc.replace(
    /\n/g,
    "<br>"
  )}</div><hr/><div style="font-style: italic; font-size: 0.85rem; padding-top: 5px; text-align: center;">${
    hoje.meditacao
  }</div>`;
};

// Modais
function configurarListenersAdmin() {
    setupClick("btn-fazer-login", async () => {
        const e = document.getElementById("login-email").value;
        const s = document.getElementById("login-senha").value;
        
        const btn = document.getElementById("btn-fazer-login");
        const originalText = btn.innerText;

        try {
            btn.innerText = "Verificando...";
            btn.disabled = true;

            // 1. Tenta autenticar no Firebase
            await signInWithEmailAndPassword(auth, e, s);
            
            // 2. Se chegou aqui, o login deu certo. Fecha o login e abre o admin.
            document.getElementById("modalLogin").style.display = "none";
            abrirModal("modalAdminAvisos");
            
            // 3. CARREGA A LISTA DE EXCLUSÃO (Essencial para aparecer o lixinho)
            gerenciarAvisosPainel();

        } catch (err) {
            console.error("Erro de login:", err);
            alert("Acesso negado: Verifique seu e-mail e senha de Coordenador.");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    setupClick("btn-salvar-aviso", async () => {
        const inp = document.getElementById("novo-aviso-texto");
        const dataExp = document.getElementById("aviso-data-expiracao");
        if (!inp.value || !dataExp.value) return alert("Preencha o texto e a data!");
        
        try {
            await addDoc(collection(db, "avisos"), {
                texto: inp.value,
                dataExpiracao: dataExp.value,
                dataCriacao: new Date()
            });
            inp.value = "";
            alert("Aviso publicado com sucesso! ✨");
        } catch (e) {
            alert("Erro ao salvar aviso.");
        }
    });
}

// --- FUNÇÃO PARA POPULAR A LISTA COM BOTÃO DE EXCLUIR ---
const gerenciarAvisosPainel = () => {
    const listaAdmin = document.getElementById("meus-avisos-lista");
    if (!listaAdmin) return;

    // Busca apenas avisos que ainda não expiraram
    const hojeLocal = new Date().toLocaleDateString("en-CA");
    const q = query(
        collection(db, "avisos"), 
        where("dataExpiracao", ">=", hojeLocal), 
        orderBy("dataExpiracao", "asc")
    );

    onSnapshot(q, (snapshot) => {
        listaAdmin.innerHTML = "<h4 style='margin: 15px 0 10px; font-size:0.9rem;'>Avisos Ativos (Toque no 🗑️ para apagar):</h4>";
        
        if (snapshot.empty) {
            listaAdmin.innerHTML += "<p style='font-size:0.8rem; color:gray;'>Nenhum aviso no sistema.</p>";
            return;
        }

        snapshot.forEach((documento) => {
            const dados = documento.data();
            const item = document.createElement("div");
            item.className = "item-admin-aviso"; // Estilo abaixo
            
            item.innerHTML = `
                <div style="flex: 1; padding-right: 10px;">
                    <p style="font-size: 0.85rem; font-weight: 600; margin: 0; color:var(--text);">${dados.texto}</p>
                    <small style="color: var(--muted);">Expira em: ${dados.dataExpiracao}</small>
                </div>
                <button class="btn-delete-aviso" data-id="${documento.id}">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            `;
            listaAdmin.appendChild(item);
        });

        // Adiciona evento de clique nos botões de excluir avisos
        listaAdmin.querySelectorAll(".btn-delete-aviso").forEach((btn) => {
            btn.onclick = async (e) => {
                const idAviso = e.currentTarget.getAttribute("data-id");
                if (confirm("Tem certeza que deseja remover este aviso do mural?")) {
                    try {
                        await deleteDoc(doc(db, "avisos", idAviso));
                        alert("Aviso removido!");
                    } catch (err) {
                        alert("Erro ao excluir aviso.");
                    }
                }
            };
        });
    });
};
function configurarListenersModais() {
  setupClick("btn-abrir-liturgia", abrirModalLiturgia);
  setupClick("btn-explicar-horas", () => abrirModal("modalExplicacaoHoras"));
  setupClick("btn-login-secreto", () => abrirModal("modalLogin"));
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
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
}
function abrirModalLiturgia() {
  if (!dadosLiturgia) {
    usarDadosBackup();
  }
  logEvent(analytics, "visualizou_liturgia_completa", {
    liturgia_titulo: dadosLiturgia.liturgia,
  });
  const modal = document.getElementById("modalGeral");
  const corpo = document.getElementById("modal-corpo");
  const titulo = document.getElementById("modal-titulo");
  if (modal && corpo) {
    titulo.innerText = "Liturgia da Palavra";
    const getText = (d) => {
      if (!d) return "Texto não disponível";
      return d.texto || d || "Texto não disponível";
    };
    const getRef = (d) => {
      if (!d) return "Ref";
      return d.referencia || "Referência";
    };
    let html = `<div class="leitura-bloco"><h4>1ª Leitura</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${getRef(
      dadosLiturgia.primeiraLeitura
    )}</p><p>${getText(dadosLiturgia.primeiraLeitura)}</p></div><hr>`;
    html += `<div class="leitura-bloco"><h4>Salmo Responsorial</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${getRef(
      dadosLiturgia.salmo
    )}</p><p>${getText(dadosLiturgia.salmo)}</p></div><hr>`;
    if (
      dadosLiturgia.segundaLeitura &&
      !JSON.stringify(dadosLiturgia.segundaLeitura).includes("Não há")
    ) {
      html += `<div class="leitura-bloco"><h4>2ª Leitura</h4><p style="color: #64748b; font-weight: bold;">${getRef(
        dadosLiturgia.segundaLeitura
      )}</p><p>${getText(dadosLiturgia.segundaLeitura)}</p></div><hr>`;
    }
    html += `<div class="leitura-bloco"><h4>Evangelho</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${getRef(
      dadosLiturgia.evangelho
    )}</p><p>${getText(dadosLiturgia.evangelho)}</p></div>`;
    html += `<div style="padding: 15px; border-top: 1px solid var(--border);"><button id="btn-compartilhar" class="btn-primary" onclick="compartilharEvangelho()"><span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px;">share</span> Compartilhar Evangelho</button></div>`;
    corpo.innerHTML = html;
    abrirModal("modalGeral");
  }
}
window.abrirHora = (tipo) => {
  logEvent(analytics, "rezou_liturgia_horas", { tipo_hora: tipo });
  const modal = document.getElementById("modalGeral");
  const corpo = document.getElementById("modal-corpo");
  const titulo = document.getElementById("modal-titulo");
  if (modal && corpo) {
    const infoHoras = {
      laudes: {
        titulo: "Laudes: Oração da Manhã",
        desc: "Consagramos o início do dia a Deus, celebrando a Ressurreição.",
      },
      vesperas: {
        titulo: "Vésperas: Oração da Tarde",
        desc: "Agradecemos pelo dia que passou e entregamos a noite.",
      },
      completas: {
        titulo: "Completas: Oração da Noite",
        desc: "Exame de consciência e preparação para o repouso em Deus.",
      },
    };
    const selecao = infoHoras[tipo];
    titulo.innerText = selecao.titulo;
    corpo.innerHTML = `<div style="text-align:center; padding: 10px;"><p style="margin-bottom: 25px; text-align: justify; line-height: 1.6; color: var(--text); font-style: italic;">"${selecao.desc}"</p><div class="box-destaque-youtube"><p style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: #CC0000;">▶️ REZAR AGORA</p><a href="https://www.youtube.com/LiturgiadasHorasOnline" target="_blank" class="btn-primary" style="text-decoration:none; display:inline-block; width:auto; padding: 12px 25px; background: #FF0000; border-radius: 8px; border: none; color: white;">Abrir Canal no YouTube</a></div></div>`;
    abrirModal("modalGeral");
  }
};
window.compartilharEvangelho = async function () {
  if (!dadosLiturgia) return;
  const texto = `📖 *Evangelho do Dia*\n\nConfira a liturgia completa no App Ágape!\n${window.location.href}`;
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Liturgia Diária",
        text: texto,
        url: window.location.href,
      });
    } catch (err) {
      console.log("Cancelado");
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
onMessage(messaging, (payload) => {
  alert(`Novo Aviso do Ágape: ${payload.notification.body}`);
});
window.limparExame = () => {
  document.querySelectorAll(".check-roxo").forEach((c) => (c.checked = false));
  document
    .querySelectorAll("details.exame-grupo")
    .forEach((d) => d.removeAttribute("open"));
};

// Rede de segurança (Splash)
setTimeout(() => {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 500);
  }
}, 1000);
