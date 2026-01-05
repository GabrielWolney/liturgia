import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8HrJeZ-QHGQHHGTn5-N7L_2CpSUd42gM",
  authDomain: "agape-avisos.firebaseapp.com",
  projectId: "agape-avisos",
  storageBucket: "agape-avisos.firebasestorage.app",
  messagingSenderId: "556421268172",
  appId: "1:556421268172:web:b9cb0955e3e95dd8e8f869",
  measurementId: "G-ZMW9FY1H4N"
};

// Inicialização segura
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let dadosLiturgia = null;

document.addEventListener("DOMContentLoaded", () => {

  // 1. DATA DO TOPO
  const configurarData = () => {
    const el = document.getElementById("data-atual");
    if (el) {
      const hoje = new Date();
      el.innerText = hoje.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
  };

  // 2. BUSCA NA API E TRATAMENTO DE CORES/ÍCONES
  const buscarDadosApi = async () => {
    const resumo = document.getElementById("resumo-leituras");
    try {
      const url = "https://liturgia.up.railway.app/";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro na rede");
      dadosLiturgia = await response.json();

      const elSanto = document.getElementById("nome-santo");
      const elEmoji = document.getElementById("emoji-tempo");
      const elCirculo = document.getElementById("indicador-cor");
      const elBadge = document.getElementById("badge-cor");

      if (dadosLiturgia) {
        if (elSanto) elSanto.innerText = dadosLiturgia.liturgia || "Tempo Litúrgico";

        const corAPI = (dadosLiturgia.cor || "Branco").toLowerCase();
        let classeCor = "verde";
        let simboloIcone = "🌱";

        if (corAPI.includes("branco") || corAPI.includes("dourado")) {
          classeCor = "branco"; simboloIcone = "🙌🏼";
        } else if (corAPI.includes("verde")) {
          classeCor = "verde"; simboloIcone = "🌱";
        } else if (corAPI.includes("roxo") || corAPI.includes("violeta")) {
          classeCor = "roxo"; simboloIcone = "🙏🏼";
        } else if (corAPI.includes("vermelho")) {
          classeCor = "vermelho"; simboloIcone = "✝️";
        } else if (corAPI.includes("rosa")) {
          classeCor = "rosa"; simboloIcone = "⏳";
        }

        if (elBadge) { 
          elBadge.innerText = dadosLiturgia.cor; 
          elBadge.className = `badge-cor ${classeCor}`; 
        }
        if (elCirculo) elCirculo.className = `circulo-liturgico ${classeCor}`;
        if (elEmoji) elEmoji.innerText = simboloIcone;

        if (resumo) {
          let htmlResumo = `<p>• 1ª Leitura</p><p>• Salmo</p>`;
          if (dadosLiturgia.segundaLeitura && !dadosLiturgia.segundaLeitura.includes("Não há")) {
            htmlResumo += `<p>• 2ª Leitura</p>`;
          }
          htmlResumo += `<p>• Evangelho</p>`;
          resumo.innerHTML = htmlResumo;
        }
      }
    } catch (error) {
      console.error("Falha na API:", error);
    }
  };

  // 3. SISTEMA DE AVISOS COM EXPIRAÇÃO AUTOMÁTICA (Mural Público)
  const carregarAvisos = () => {
    const container = document.getElementById("lista-avisos");
    if (!container) return;
    const hoje = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, "avisos"), 
      where("dataExpiracao", ">=", hoje),
      orderBy("dataExpiracao", "asc")
    );

    onSnapshot(q, (snapshot) => {
      container.innerHTML = "";
      if (snapshot.empty) {
        container.innerHTML = "<li style='text-align:center; color:gray; font-size:0.9rem;'>Nenhum aviso ativo no momento.</li>";
        return;
      }
      snapshot.forEach((doc) => {
        const li = document.createElement("li");
        li.innerText = doc.data().texto;
        container.appendChild(li);
      });
    });
  };

  // --- NOVO: GERENCIAMENTO DE AVISOS (Painel do Coordenador) ---
  const gerenciarAvisosPainel = () => {
    const listaAdmin = document.getElementById("meus-avisos-lista");
    if (!listaAdmin) return;

    // Admin vê todos os avisos futuros para poder excluir
    const q = query(collection(db, "avisos"), orderBy("dataExpiracao", "asc"));

    onSnapshot(q, (snapshot) => {
      listaAdmin.innerHTML = "<h4 style='margin: 15px 0 10px;'>Gerenciar Avisos Ativos:</h4>";
      
      snapshot.forEach((documento) => {
        const dados = documento.data();
        const item = document.createElement("div");
        item.style = "background: #f8fafc; padding: 12px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0;";
        
        item.innerHTML = `
          <div style="flex: 1; padding-right: 10px;">
            <p style="font-size: 0.9rem; font-weight: 600; margin: 0;">${dados.texto}</p>
            <small style="color: #64748b;">Expira em: ${dados.dataExpiracao}</small>
          </div>
          <button class="btn-excluir" data-id="${documento.id}" style="background: #ef4444; color: white; border: none; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 1.1rem;">🗑️</button>
        `;
        listaAdmin.appendChild(item);
      });

      // Clique para excluir
      listaAdmin.querySelectorAll(".btn-excluir").forEach(btn => {
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

  // 4. LOGICA DOS MODAIS E CLIQUE
  const setupClick = (id, fn) => { 
    const el = document.getElementById(id); 
    if (el) el.onclick = fn; 
  };

  setupClick("btn-abrir-liturgia", () => {
    if (!dadosLiturgia) return alert("Aguarde o carregamento...");
    const modal = document.getElementById("modalGeral");
    const corpo = document.getElementById("modal-corpo");
    const titulo = document.getElementById("modal-titulo");

    if (modal && corpo) {
      titulo.innerText = "Liturgia da Palavra";
      const formatarTexto = (dado) => {
        if (!dado) return "Conteúdo não disponível.";
        let textoBase = typeof dado === "string" ? dado : (dado.texto || "");
        let htmlFinal = dado.refrao ? `<strong>Refrão:</strong> ${dado.refrao}<br><br>` : "";
        htmlFinal += textoBase.replace(/(\d+)/g, '<sup class="versiculo">$1</sup>');
        return htmlFinal;
      };

      let html = `<div class="leitura-bloco"><h4>1ª Leitura</h4><p><small>${dadosLiturgia.primeiraLeitura.referencia || ""}</small></p><p>${formatarTexto(dadosLiturgia.primeiraLeitura)}</p></div><hr>`;
      html += `<div class="leitura-bloco"><h4>Salmo Responsorial</h4><p><small>${dadosLiturgia.salmo.referencia || ""}</small></p><p>${formatarTexto(dadosLiturgia.salmo)}</p></div><hr>`;
      if (dadosLiturgia.segundaLeitura && !dadosLiturgia.segundaLeitura.includes("Não há")) {
        html += `<div class="leitura-bloco"><h4>2ª Leitura</h4><p><small>${dadosLiturgia.segundaLeitura.referencia || ""}</small></p><p>${formatarTexto(dadosLiturgia.segundaLeitura)}</p></div><hr>`;
      }
      html += `<div class="leitura-bloco"><h4>Evangelho</h4><p><small>${dadosLiturgia.evangelho.referencia || ""}</small></p><p>${formatarTexto(dadosLiturgia.evangelho)}</p></div>`;
      corpo.innerHTML = html;
      modal.style.display = "flex";
    }
  });

  window.abrirHora = (tipo) => {
    const modal = document.getElementById("modalGeral");
    const corpo = document.getElementById("modal-corpo");
    const titulo = document.getElementById("modal-titulo");

    if (modal && corpo) {
        const infoHoras = {
            laudes: {
                titulo: "Laudes: Oração da Manhã",
                desc: "As Laudes são destinadas a santificar o tempo da manhã. Elas celebram a Ressurreição do Senhor, que é a 'Luz verdadeira' e o 'Sol de Justiça'. É o momento de consagrar a Deus os primeiros impulsos da nossa mente e do nosso coração."
            },
            vesperas: {
                titulo: "Vésperas: Oração da Tarde",
                desc: "As Vésperas são celebradas ao entardecer, quando o dia já declina. Nelas, damos graças pelo que nos foi dado no dia e pelo que realizamos retamente. Fazemos memória da Redenção por meio da oração que sobe como incenso na presença do Senhor."
            },
            completas: {
                titulo: "Completas: Oração antes do Repouso",
                desc: "As Completas são a última oração do dia, feita antes do sono da noite, mesmo depois da meia-noite. É o momento do exame de consciência e da entrega confiante de nossa vida nas mãos de Deus, sob a proteção da Virgem Maria."
            }
        };

        const selecao = infoHoras[tipo];
        titulo.innerText = selecao.titulo;
        corpo.innerHTML = `
            <div style="text-align:center; padding: 10px;">
                <p style="margin-bottom: 25px; text-align: justify; line-height: 1.6; color: var(--text); font-style: italic;">"${selecao.desc}"</p>
                <div style="background: #f8fafc; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;">
                    <p style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: #CC0000;">▶️ REZAR AGORA</p>
                    <a href="https://www.youtube.com/LiturgiadasHorasOnline" target="_blank" class="btn-primary" style="text-decoration:none; display:inline-block; width:auto; padding: 12px 25px; background: #FF0000; border-radius: 8px;">Abrir Canal no YouTube</a>
                </div>
            </div>`;
        modal.style.display = "flex";
    }
  };

  // Funções Administrativas
  setupClick("btn-fazer-login", async () => {
    const e = document.getElementById("login-email").value;
    const s = document.getElementById("login-senha").value;
    try {
      await signInWithEmailAndPassword(auth, e, s);
      document.getElementById("modalLogin").style.display = "none";
      document.getElementById("modalAdminAvisos").style.display = "flex";
      gerenciarAvisosPainel(); // Carrega a lista de exclusão após logar
    } catch (err) { alert("Acesso negado."); }
  });

  setupClick("btn-salvar-aviso", async () => {
    const inp = document.getElementById("novo-aviso-texto");
    const dataExp = document.getElementById("aviso-data-expiracao");

    if (!inp.value || !dataExp.value) {
      alert("Por favor, preencha o aviso e a data de expiração!");
      return;
    }

    try {
      await addDoc(collection(db, "avisos"), { 
        texto: inp.value, 
        dataExpiracao: dataExp.value, 
        dataCriacao: new Date() 
      });
      inp.value = "";
      dataExp.value = "";
      alert("Aviso postado!");
    } catch (e) { alert("Erro ao postar."); }
  });

  // Eventos de Navegação e Fechar
  setupClick("nav-inicio", (e) => { e.preventDefault(); document.querySelector("main").scrollTo({ top: 0, behavior: "smooth" }); });
  setupClick("nav-sobre-site", (e) => { e.preventDefault(); document.getElementById("modalSobreSite").style.display = "flex"; });
  setupClick("btn-explicar-horas", () => { document.getElementById("modalExplicacaoHoras").style.display = "flex"; });
  // Abre o modal de login quando o coordenador clica no botão "secreto"
setupClick("btn-login-secreto", () => {
    document.getElementById("modalLogin").style.display = "flex";
});

  const fechar = () => { document.querySelectorAll(".modal").forEach((m) => (m.style.display = "none")); };
  document.querySelectorAll(".close-modal, .close-modal-sobre, #btn-entendido-horas, #btn-fechar-explicacao").forEach((b) => b.onclick = fechar);
  window.onclick = (e) => { if (e.target.classList.contains("modal")) fechar(); };

  // --- NAVEGAÇÃO COM RESPOSTA VISUAL NOS CARDS ---
const configurarNavegação = () => {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.onclick = (e) => {
      e.preventDefault();

      // Feedback visual na Nav
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // Caso Especial: SOBRE
      if (item.id === "nav-sobre-site") {
        const modalSobre = document.getElementById("modalSobreSite");
        if (modalSobre) modalSobre.style.display = "flex";
        return;
      }

      // Caso Geral (Avisos, Liturgia, Terço, Horas)
      const targetId = item.getAttribute("data-target");
      if (targetId) {
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          // Scroll suave centralizado
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

          // Efeito visual de Piscar (Highlight)
          targetElement.classList.remove("highlight-card");
          void targetElement.offsetWidth; // Reset da animação
          targetElement.classList.add("highlight-card");

          setTimeout(() => {
            targetElement.classList.remove("highlight-card");
          }, 1500);
        }
      }
    };
  });
};

const configurarTerco = () => {
  const tituloEl = document.getElementById("titulo-misterio");
  const descEl = document.getElementById("descricao-misterio");
  
  if (!tituloEl || !descEl) return;

  const diaSemana = new Date().getDay(); // 0 = Domingo, 1 = Segunda...
  
  const misterios = {
    0: { titulo: "Mistérios Gloriosos", desc: "Ressurreição, Ascensão, Vinda do Espírito Santo, Assunção e Coroação de Maria." },
    1: { titulo: "Mistérios Gozosos", desc: "Anunciação, Visitação, Nascimento de Jesus, Apresentação e Encontro no Templo." },
    2: { titulo: "Mistérios Dolorosos", desc: "Agonia no Horto, Flagelação, Coroação de Espinhos, Caminho do Calvário e Crucificação." },
    3: { titulo: "Mistérios Gloriosos", desc: "Ressurreição, Ascensão, Vinda do Espírito Santo, Assunção e Coroação de Maria." },
    4: { titulo: "Mistérios Luminosos", desc: "Batismo, Bodas de Caná, Anúncio do Reino, Transfiguração e Instituição da Eucaristia." },
    5: { titulo: "Mistérios Dolorosos", desc: "Agonia no Horto, Flagelação, Coroação de Espinhos, Caminho do Calvário e Crucificação." },
    6: { titulo: "Mistérios Gozosos", desc: "Anunciação, Visitação, Nascimento de Jesus, Apresentação e Encontro no Templo." }
  };

  const hoje = misterios[diaSemana];
  tituloEl.innerText = hoje.titulo;
  descEl.innerText = hoje.desc;
};

configurarTerco();
configurarNavegação();
  configurarData(); 
  carregarAvisos(); 
  buscarDadosApi();
});