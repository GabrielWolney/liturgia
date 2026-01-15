/**
 * Main Controller - Versão 5.0 (Final - Gold Master)
 * Gerenciador principal da aplicação Ágape
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
// INICIALIZAÇÃO DA APLICAÇÃO
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

    // Carrega liturgia com tratamento de falhas
    await gerenciarLiturgia();

    carregarAvisos();
    ouvirContadorLeituras();

    try {
      configurarNotificacoes();
    } catch (e) {
      console.warn("Notificações desativadas ou não suportadas.");
    }

    logEvent(analytics, "page_view", { page_title: "Home Liturgia Ágape" });
    configurarListenersAdmin();
    configurarListenersModais();

    // Atualiza ícone de horas a cada 5 minutos
    setInterval(configurarIconeDinamicoHoras, 300000);
  } catch (erroFatal) {
    console.error("Erro fatal na inicialização:", erroFatal);
    const splash = document.getElementById("splash-screen");
    if (splash) splash.remove();
  }
}

// =======================================================
// MURAL DE ORAÇÃO
// =======================================================
window.abrirMuralPedidos = () => {
  abrirModal("modalMuralPedidos");
  carregarMuralFirestore();
};

window.postarPedido = async () => {
  const nomeInput = document.getElementById("nome-orante");
  const textoInput = document.getElementById("texto-pedido-publico");

  // Tratamento seguro de inputs
  const nome = nomeInput ? nomeInput.value.trim() || "Anônimo" : "Anônimo";
  const texto = textoInput ? textoInput.value.trim() : "";

  if (!texto) return alert("Escreva seu pedido!");

  const btn = document.querySelector("#modalMuralPedidos .btn-primary");
  try {
    btn.disabled = true;

    const docRef = await addDoc(collection(db, "mural_oracoes"), {
      nome: nome,
      texto: texto,
      data: new Date(),
      rezaram: 0,
    });

    let meusIds = JSON.parse(
      localStorage.getItem("meus_pedidos_mural") || "[]"
    );
    meusIds.push(docRef.id);
    localStorage.setItem("meus_pedidos_mural", JSON.stringify(meusIds));

    textoInput.value = "";
  } catch (e) {
    console.error(e);
  } finally {
    btn.disabled = false;
  }
};

function carregarMuralFirestore() {
  const feed = document.getElementById("feed-pedidos");
  if (!feed) return;
  if (unsubscribeMural) unsubscribeMural();

  // Filtra pedidos das últimas 24h
  const ontem = new Date();
  ontem.setHours(ontem.getHours() - 24);

  const q = query(
    collection(db, "mural_oracoes"),
    where("data", ">", ontem),
    orderBy("data", "desc")
  );

  unsubscribeMural = onSnapshot(q, (snapshot) => {
    feed.innerHTML = "";
    const meusIds = JSON.parse(
      localStorage.getItem("meus_pedidos_mural") || "[]"
    );

    // Renderiza estado vazio se não houver pedidos recentes
    if (snapshot.empty) {
      feed.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--muted); opacity: 0.8;">
                    <span class="material-symbols-rounded" style="font-size: 50px; margin-bottom: 15px; color: #db2777;">volunteer_activism</span>
                    <h3 style="font-size: 1.1rem; color: var(--text); margin-bottom: 5px;">Mural de Oração</h3>
                    <p style="font-size: 0.9rem; line-height: 1.5;">
                        Os pedidos ficam visíveis por apenas <strong>24 horas</strong>.<br>
                        O mural está vazio agora...
                    </p>
                    <div style="margin-top: 20px; font-weight: bold; color: #db2777; background: rgba(219, 39, 119, 0.1); padding: 10px; border-radius: 10px;">
                        Seja o primeiro a pedir oração hoje! 🙏
                    </div>
                </div>
            `;
      return;
    }

    // Renderiza os cards de pedidos existentes
    snapshot.forEach((docSnap) => {
      const dados = docSnap.data();
      const id = docSnap.id;
      const souDono = meusIds.includes(id);

      // Formata a hora (Ex: 14:30)
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
                        <span class="pedido-nome" style="font-weight:bold; color:var(--primary);">${
                          dados.nome
                        }</span>
                        <span style="font-size:0.7rem; color:var(--muted);">• ${horaFormatada}</span>
                    </div>
                    ${
                      souDono
                        ? `
                        <button onclick="excluirMeuPedido('${id}')" class="btn-excluir-pedido" style="color:#ef4444; background:none; border:none; cursor:pointer;">
                            <span class="material-symbols-rounded" style="font-size:18px;">delete</span>
                        </button>`
                        : ""
                    }
                </div>
                <p class="pedido-texto" style="margin-top:8px; line-height:1.5; color:var(--text);">${
                  dados.texto
                }</p>
            `;
      feed.appendChild(card);
    });

    // Rodapé informativo
    const rodape = document.createElement("div");
    rodape.innerHTML = `<p style="text-align:center; font-size:0.75rem; color:var(--muted); margin-top:20px; opacity:0.6; font-style:italic;">* Os pedidos somem automaticamente após 24h.</p>`;
    feed.appendChild(rodape);
  });
}

function removerIdMeusPedidos(id) {
  let lista = JSON.parse(localStorage.getItem("meus_pedidos_mural") || "[]");
  lista = lista.filter((item) => item !== id);
  localStorage.setItem("meus_pedidos_mural", JSON.stringify(lista));
}

// =======================================================
// FERRAMENTAS E CALENDÁRIO
// =======================================================
window.abrirCalendario = () => {
  renderizarCalendario();
  abrirModal("modalCalendario");
};

function renderizarCalendario() {
  const grid = document.getElementById("calendario-grid");
  const titulo = document.getElementById("mes-ano-calendario");
  const listaEventos = document.getElementById("lista-eventos-dia");

  if (!grid || !listaEventos) return;

  grid.innerHTML = "";

  // Define a mensagem instrucional padrão ao abrir o calendário
  listaEventos.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--muted); margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 8px;">
            <span class="material-symbols-rounded" style="font-size: 20px;">touch_app</span>
            <span style="font-size: 0.85rem;">Toque nos dias marcados para ver os avisos.</span>
        </div>
    `;

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  titulo.innerText = hoje.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Cabeçalho dos dias da semana
  ["D", "S", "T", "Q", "Q", "S", "S"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "calendar-header";
    el.innerText = d;
    grid.appendChild(el);
  });

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  // Preenchimento dos dias vazios
  for (let i = 0; i < primeiroDia; i++)
    grid.appendChild(document.createElement("div"));

  // Renderização dos dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const el = document.createElement("div");
    el.className = "calendar-day";
    el.innerText = dia;

    // Formata data para comparação (YYYY-MM-DD)
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(
      dia
    ).padStart(2, "0")}`;
    const temAviso = avisosGlobais.find((a) => a.dataExpiracao === dataStr);

    if (temAviso) {
      el.classList.add("has-event"); // Indicador visual de evento
      el.onclick = () => {
        // Exibe o aviso ao clicar no dia
        listaEventos.innerHTML = `
                    <div class="aviso-carinhoso" style="animation: fadeIn 0.3s ease;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                            <span class="material-symbols-rounded" style="color:var(--primary);">event_available</span>
                            <strong style="color:var(--primary);">Aviso para dia ${dia}:</strong>
                        </div>
                        <p style="font-size: 1rem; color: var(--text); line-height: 1.5;">${temAviso.texto}</p>
                    </div>`;
      };
    } else {
      el.onclick = () => {
        listaEventos.innerHTML = `
                    <p style="font-size: 0.9rem; color: var(--muted); text-align: center; margin-top:15px; font-style: italic;">
                        Nada agendado para o dia ${dia}.<br>Que tal um momento de oração? 🙏
                    </p>`;
      };
    }

    if (dia === hoje.getDate()) el.style.border = "2px solid var(--primary)";
    grid.appendChild(el);
  }
}

window.abrirNotas = () => abrirModal("modalNotas");
function configurarNotas() {
  const area = document.getElementById("area-notas");
  if (!area) return;
  const sugestoes = [
    "O que Deus falou ao seu coração hoje?",
    "Pontos da pregação...",
    "Orações...",
  ];
  if (!area.value)
    area.placeholder = sugestoes[Math.floor(Math.random() * sugestoes.length)];
  const salvo = localStorage.getItem("minhas_notas_agape");
  if (salvo) area.value = salvo;
  area.addEventListener("input", () => {
    localStorage.setItem("minhas_notas_agape", area.value);
  });
}

// =======================================================
// LITURGIA E INTEGRAÇÃO API
// =======================================================
async function gerenciarLiturgia() {
  renderizarSkeletons();
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    const response = await fetch("https://liturgia.up.railway.app/", {
      signal: controller.signal,
    });
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

  // --- INÍCIO DA CORREÇÃO (PATCH) ---
  
  // 1. Pega a cor da API e o Título
  let corAPI = (dados.cor || "Branco").toLowerCase();
  const tituloLiturgia = (dados.liturgia || "").toLowerCase();

  // 2. Regra de Correção: Se tem "Tempo Comum", TEM que ser verde!
  if (tituloLiturgia.includes("tempo comum")) {
    corAPI = "verde";
  } 
  // Regras extras de segurança (opcional, mas recomendado)
  else if (tituloLiturgia.includes("quaresma") || tituloLiturgia.includes("advento")) {
    corAPI = "roxo";
  }
  else if (tituloLiturgia.includes("mártir") || tituloLiturgia.includes("paixão")) {
    corAPI = "vermelho";
  }

  // --- FIM DA CORREÇÃO ---

  const configCores = {
    branco: { classe: "branco", img: "./liturgia-icons/branco.png" },
    verde: { classe: "verde", img: "./liturgia-icons/verde.png" },
    roxo: { classe: "roxo", img: "./liturgia-icons/roxo.png" },
    vermelho: { classe: "vermelho", img: "./liturgia-icons/vermelho.png" },
    rosa: { classe: "rosa", img: "./liturgia-icons/rosa.png" },
  };

  // Seleciona a configuração usando a corAPI já corrigida
  const config =
    configCores[Object.keys(configCores).find((key) => corAPI.includes(key))] ||
    configCores.branco;

  if (elSanto) elSanto.innerText = dados.liturgia || "Tempo Comum";
  
  if (elBadge) {
    // Atualizei aqui para escrever "Verde" no texto também, senão ficaria escrito "Branco" com fundo verde
    const nomeCorFormatada = corAPI.charAt(0).toUpperCase() + corAPI.slice(1);
    elBadge.innerText = nomeCorFormatada; 
    elBadge.className = `badge-cor ${config.classe}`;
  }
  
  if (elCirculo) {
    elCirculo.className = `circulo-liturgico ${config.classe}`;
    elCirculo.style.border = "none";
  }
  
  if (elEmoji) {
    elEmoji.style.display = "block";
    elEmoji.innerHTML = `<img src="${config.img}" alt="${corAPI}" class="icone-liturgico-img">`;
  }

  const getText = (d) => {
    if (!d) return "---";
    return typeof d === "string" ? d : d.referencia || "---";
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
// UI E INTERFACE DO USUÁRIO
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

// =======================================================
// LÓGICA DA BÍBLIA (LOCAL)
// =======================================================
let cacheBiblia = null;

// 1. Carrega o arquivo JSON localmente
async function carregarBibliaLocal() {
  if (cacheBiblia) return cacheBiblia;

  try {
    const response = await fetch("./js/bibliaAveMaria.json");
    if (!response.ok) throw new Error("Arquivo não encontrado (404)");

    cacheBiblia = await response.json();
    console.log("Bíblia carregada com sucesso!");
    return cacheBiblia;
  } catch (e) {
    console.error(e);
    alert(
      "Erro: Certifique-se de que 'bibliaAveMaria.json' está na pasta 'js'."
    );
    return null;
  }
}

// 2. Prepara e exibe o Modal de Seleção de Capítulo
function abrirModalCapitulo(livroObj) {
  const modal = document.getElementById("modalCapitulos");
  const titulo = document.getElementById("titulo-livro-selecionado");
  const input = document.getElementById("input-capitulo");
  const btnLer = document.getElementById("btn-ler-capitulo");

  if (titulo) titulo.innerText = livroObj.nome;
  if (input) input.value = "";
  if (modal) modal.style.display = "flex";

  // Clone para limpar listeners de eventos antigos
  const novoBtn = btnLer.cloneNode(true);
  btnLer.parentNode.replaceChild(novoBtn, btnLer);

  novoBtn.onclick = async () => {
    const cap = input.value.trim();
    if (!cap || cap < 1) return alert("Capítulo inválido");
    // Passa o objeto completo (nome e slug)
    await executarLeituraLocal(livroObj, cap);
  };
}

// 3. Busca e Renderiza o conteúdo do capítulo selecionado
async function executarLeituraLocal(livroObj, capitulo) {
  const container = document.getElementById("leitura-biblia-container");
  const textoDiv = document.getElementById("leitura-texto");
  const tituloDiv = document.getElementById("leitura-titulo");

  try {
    // UI de Carregamento
    document.getElementById("modalCapitulos").style.display = "none";
    container.style.display = "block";
    document.body.style.overflow = "hidden";
    textoDiv.innerHTML =
      "<div style='text-align:center; padding:20px;'><span class='material-symbols-rounded' style='animation:spin 1s infinite'>autorenew</span><br>Abrindo as Escrituras...</div>";

    // Carrega Dados
    const dados = await carregarBibliaLocal();
    if (!dados) throw new Error("Base de dados vazia.");

    // === PASSO A: UNIFICAÇÃO ===
    // O JSON separa em "antigoTestamento" e "novoTestamento".
    // Unifica os arrays para facilitar a busca do livro.
    let todosLivros = [];
    if (dados.antigoTestamento)
      todosLivros = todosLivros.concat(dados.antigoTestamento);
    if (dados.novoTestamento)
      todosLivros = todosLivros.concat(dados.novoTestamento);

    // === PASSO B: LOCALIZAÇÃO DO LIVRO ===
    // Normaliza strings para comparação (minúsculo e sem acento)
    // Ex: "São Mateus" (JSON) vs "sao-mateus" (Slug)
    const slugLimpo = livroObj.slug.replace(/-/g, " ").toLowerCase(); // "sao mateus"
    const nomeLimpo = removerAcentos(livroObj.nome).toLowerCase(); // "mateus"

    const livroEncontrado = todosLivros.find((l) => {
      const nomeJson = removerAcentos(l.nome).toLowerCase(); // "sao mateus"
      return (
        nomeJson === slugLimpo ||
        nomeJson === nomeLimpo ||
        nomeJson.includes(slugLimpo)
      );
    });

    if (!livroEncontrado) {
      throw new Error(`Livro '${livroObj.nome}' não encontrado no arquivo.`);
    }

    // === PASSO C: LOCALIZAÇÃO DO CAPÍTULO ===
    // A estrutura 'capitulos' é uma lista de objetos.
    // Tenta acesso direto pelo índice ou busca pelo número exato.
    let capituloObj = livroEncontrado.capitulos[parseInt(capitulo) - 1];

    // Segurança extra: se o índice falhar, procura pelo número exato
    if (!capituloObj || capituloObj.capitulo != capitulo) {
      capituloObj = livroEncontrado.capitulos.find(
        (c) => c.capitulo == capitulo
      );
    }

    if (!capituloObj) {
      throw new Error(
        `O livro de ${livroEncontrado.nome} não possui o capítulo ${capitulo}.`
      );
    }

    // === PASSO D: RENDERIZAÇÃO DE VERSÍCULOS ===
    // Itera sobre a lista de versículos para construir o HTML
    tituloDiv.innerText = `${livroEncontrado.nome} ${capitulo}`;

    textoDiv.innerHTML = capituloObj.versiculos
      .map(
        (v) =>
          `<p style="margin-bottom:10px; font-size: 1.1rem; text-align: justify;">
                <b style="color:var(--primary); font-size:0.8rem; margin-right:8px; vertical-align: super;">${v.versiculo}</b>
                ${v.texto}
            </p>`
      )
      .join("");

    container.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    textoDiv.innerHTML = `
            <div style="text-align:center; color: #ef4444; padding: 20px;">
                <span class="material-symbols-rounded" style="font-size: 48px;">error</span>
                <p style="margin-top:10px; font-weight:bold;">Não foi possível abrir.</p>
                <p>${e.message}</p>
                <button onclick="fecharLeitura(); document.getElementById('modalCapitulos').style.display='flex'" class="btn-primary" style="margin-top:15px; background:#333;">Tentar outro</button>
            </div>`;
  }
}

// Auxiliar para normalizar texto
function removerAcentos(str) {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
// 4. Botão Voltar
window.fecharLeitura = () => {
  document.getElementById("leitura-biblia-container").style.display = "none";
  document.body.style.overflow = "auto";
};

// =======================================================
// UTILITÁRIOS GERAIS
// =======================================================
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

// =======================================================
// ADMINISTRAÇÃO E PAINEL
// =======================================================
function configurarListenersAdmin() {
  setupClick("btn-fazer-login", async () => {
    const e = document.getElementById("login-email").value;
    const s = document.getElementById("login-senha").value;
    const btn = document.getElementById("btn-fazer-login");
    const originalText = btn.innerText;

    try {
      btn.innerText = "Verificando...";
      btn.disabled = true;
      await signInWithEmailAndPassword(auth, e, s);
      document.getElementById("modalLogin").style.display = "none";
      abrirModal("modalAdminAvisos");
      gerenciarAvisosPainel();
    } catch (err) {
      alert("Acesso negado: Verifique seu e-mail e senha de Coordenador.");
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  });

  setupClick("btn-salvar-aviso", async () => {
    const inp = document.getElementById("novo-aviso-texto");
    const dataExp = document.getElementById("aviso-data-expiracao");
    if (!inp.value || !dataExp.value)
      return alert("Preencha o texto e a data!");

    try {
      await addDoc(collection(db, "avisos"), {
        texto: inp.value,
        dataExpiracao: dataExp.value,
        dataCriacao: new Date(),
      });
      inp.value = "";
      alert("Aviso publicado com sucesso! ✨");
    } catch (e) {
      alert("Erro ao salvar aviso.");
    }
  });
}

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
      "<h4 style='margin: 15px 0 10px; font-size:0.9rem;'>Avisos Ativos (Toque no 🗑️ para apagar):</h4>";
    if (snapshot.empty) {
      listaAdmin.innerHTML +=
        "<p style='font-size:0.8rem; color:gray;'>Nenhum aviso no sistema.</p>";
      return;
    }
    snapshot.forEach((documento) => {
      const dados = documento.data();
      const item = document.createElement("div");
      item.className = "item-admin-aviso";
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

    listaAdmin.querySelectorAll(".btn-delete-aviso").forEach((btn) => {
      btn.onclick = async (e) => {
        const idAviso = e.currentTarget.getAttribute("data-id");
        if (confirm("Remover aviso?")) {
          try {
            await deleteDoc(doc(db, "avisos", idAviso));
          } catch (err) {
            alert("Erro ao excluir.");
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
  if (!dadosLiturgia) usarDadosBackup();
  logEvent(analytics, "visualizou_liturgia_completa", {
    liturgia_titulo: dadosLiturgia.liturgia,
  });
  const modal = document.getElementById("modalGeral");
  const corpo = document.getElementById("modal-corpo");
  const titulo = document.getElementById("modal-titulo");
  if (modal && corpo) {
    titulo.innerText = "Liturgia da Palavra";
    const getText = (d) => (d ? d.texto || d : "Texto não disponível");
    const getRef = (d) => (d ? d.referencia || "Referência" : "Ref");
    let html = `<div class="leitura-bloco"><h4>1ª Leitura</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${getRef(
      dadosLiturgia.primeiraLeitura
    )}</p><p>${getText(dadosLiturgia.primeiraLeitura)}</p></div><hr>`;
    html += `<div class="leitura-bloco"><h4>Salmo Responsorial</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${getRef(
      dadosLiturgia.salmo
    )}</p><p>${getText(dadosLiturgia.salmo)}</p></div><hr>`;
    if (
      dadosLiturgia.segundaLeitura &&
      !JSON.stringify(dadosLiturgia.segundaLeitura).includes("Não há")
    )
      html += `<div class="leitura-bloco"><h4>2ª Leitura</h4><p style="color: #64748b; font-weight: bold;">${getRef(
        dadosLiturgia.segundaLeitura
      )}</p><p>${getText(dadosLiturgia.segundaLeitura)}</p></div><hr>`;
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
    } catch (err) {}
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
// Função Global para Abrir o Modal (Visual Limpo)
window.abrirOracao = (chave) => {
    const oracao = dbOracoes[chave];
    
    if (!oracao) {
        console.error("Oração não encontrada: " + chave);
        return;
    }

    const modal = document.getElementById("modalGeral");
    const titulo = document.getElementById("modal-titulo");
    const corpo = document.getElementById("modal-corpo");

    if (modal && corpo) {
        if (titulo) titulo.innerText = oracao.titulo;

        corpo.innerHTML = `
            <p style="
                font-size: 1.1rem; 
                line-height: 1.8; 
                color: var(--text); 
                white-space: pre-wrap; 
                text-align: justify; 
                margin-top: 0;
            ">${oracao.texto}</p>
            
            <div style="margin-top: 20px;">
                <button class="btn-primary" onclick="document.getElementById('modalGeral').style.display='none'">Amém</button>
            </div>
        `;
        
        // Tenta abrir o modal
        if (typeof abrirModal === 'function') {
            abrirModal("modalGeral");
        } else {
            modal.style.display = 'flex';
        }
    }
};

// 1. Banco de Dados das Orações (ATUALIZADO E EXPANDIDO)
const dbOracoes = {
    // --- BÁSICAS ---
    "pai-nosso": {
        titulo: "Pai Nosso",
        texto: `Pai Nosso que estais nos Céus, santificado seja o vosso Nome, venha a nós o vosso Reino, seja feita a vossa vontade assim na terra como no Céu.<br><br>O pão nosso de cada dia nos dai hoje, perdoai-nos as nossas ofensas assim como nós perdoamos a quem nos tem ofendido, e não nos deixeis cair em tentação, mas livrai-nos do Mal.<br><br>Amém.`
    },
    "ave-maria": {
        titulo: "Ave Maria",
        texto: `Ave Maria, cheia de graça, o Senhor é convosco, bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus.<br><br>Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora da nossa morte.<br><br>Amém.`
    },
    "gloria-pai": {
        titulo: "Glória ao Pai",
        texto: `Glória ao Pai, ao Filho e ao Espírito Santo.<br><br>Como era no princípio, agora e sempre.<br><br>Amém.`
    },
    "credo": {
        titulo: "Credo (Símbolo dos Apóstolos)",
        texto: `Creio em Deus Pai Todo-Poderoso, Criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor; que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado.<br><br>Desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus, está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos.<br><br>Creio no Espírito Santo, na Santa Igreja Católica, na comunhão dos Santos, na remissão dos pecados, na ressurreição da carne, na vida eterna.<br><br>Amém.`
    },
    "salve-rainha": {
        titulo: "Salve Rainha",
        texto: `Salve, Rainha, Mãe de misericórdia, vida, doçura e esperança nossa, salve! A vós bradamos os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas.<br><br>Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei, e depois deste desterro mostrai-nos Jesus, bendito fruto do vosso ventre, ó clemente, ó piedosa, ó doce sempre Virgem Maria.<br><br>V. Rogai por nós, Santa Mãe de Deus.<br>R. Para que sejamos dignos das promessas de Cristo.`
    },
    
    // --- PROTEÇÃO E ANJOS ---
    "santo-anjo": {
        titulo: "Santo Anjo",
        texto: `Santo Anjo do Senhor, meu zeloso guardador, se a ti me confiou a piedade divina, sempre me rege, me guarda, me governa e me ilumina.<br><br>Amém.`
    },
    "sao-miguel": {
        titulo: "São Miguel Arcanjo",
        texto: `São Miguel Arcanjo, defendei-nos no combate, sede o nosso refúgio contra as maldades e ciladas do demônio. Ordene-lhe Deus, instantemente o pedimos, e vós, príncipe da milícia celeste, pela virtude divina, precipitai no inferno a satanás e aos outros espíritos malignos, que andam pelo mundo para perder as almas.<br><br>Amém.`
    },
    "sao-bento": {
        titulo: "Oração de São Bento",
        texto: `A Cruz Sagrada seja a minha luz, não seja o dragão o meu guia. Retira-te, satanás! Nunca me aconselhes coisas vãs. É mau o que tu me ofereces, bebe tu mesmo os teus venenos!<br><br>Amém.`
    },
    "vinde-espirito": {
        titulo: "Vinde Espírito Santo",
        texto: `Vinde Espírito Santo, enchei os corações dos vossos fiéis e acendei neles o fogo do Vosso Amor. Enviai o Vosso Espírito e tudo será criado, e renovareis a face da terra.<br><br><b>Oremos:</b> Ó Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, fazei que apreciemos retamente todas as coisas segundo o mesmo Espírito e gozemos sempre da Sua consolação. Por Cristo Senhor Nosso.<br><br>Amém.`
    },
    "alma-cristo": {
        titulo: "Alma de Cristo",
        texto: `Alma de Cristo, santificai-me.<br>Corpo de Cristo, salvai-me.<br>Sangue de Cristo, inebriai-me.<br>Água do lado de Cristo, lavai-me.<br>Paixão de Cristo, confortai-me.<br>Ó bom Jesus, ouvi-me.<br>Dentro de vossas chagas, escondei-me.<br>Não permitais que eu me separe de vós.<br>Do inimigo maligno, defendei-me.<br>Na hora da minha morte, chamai-me.<br>E mandai-me ir para vós,<br>para que com vossos Santos vos louve,<br>por todos os séculos dos séculos.<br><br>Amém.`
    }
};
// =========================================
// AUTO-ATUALIZAÇÃO INTELIGENTE
// =========================================

// 1. Guarda o dia em que a página foi carregada
let diaCarregamento = new Date().getDate();

// 2. O Evento 'visibilitychange' dispara quando você troca de aba ou desbloqueia o celular
document.addEventListener("visibilitychange", () => {
    
    // Só nos importamos se a aba ficou VISÍVEL de novo
    if (document.visibilityState === "visible") {
        
        const diaAtual = new Date().getDate();

        // 3. Se o dia de hoje for diferente do dia carregado...
        if (diaAtual !== diaCarregamento) {
            console.log("O dia virou! Atualizando a página...");
            
            // ...Recarrega a página para puxar a nova liturgia
            window.location.reload(); 
        }
    }
});

// (Opcional) Checagem a cada hora para quem deixa o PC ligado direto
setInterval(() => {
    const diaAtual = new Date().getDate();
    if (diaAtual !== diaCarregamento) {
        window.location.reload();
    }
}, 3600000); // 3.600.000 ms = 1 hora

setTimeout(() => {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 500);
  }
}, 1000);

