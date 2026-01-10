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
  getDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { onMessage } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { configurarNotificacoes, buscarDadosApi } from "./services.js";
import { configurarData, obterMisterioDoDia, setupClick } from "./utils.js";

let dadosLiturgia = null;

document.addEventListener("DOMContentLoaded", () => {
  // FUNÇÃO 1: Ouvir o contador em tempo real
  // --- LÓGICA DO CONTADOR DE LEITURAS ---

  const ouvirContadorLeituras = () => {
    const btnLi = document.getElementById("btn-li-a-leitura");
    const elContador = document.getElementById("texto-contador-leituras");
    if (!btnLi || !elContador) return;

    const hoje = new Date().toLocaleDateString("en-CA");
    const docRef = doc(db, "estatisticas", `leituras_${hoje}`);

    // Estado inicial do botão baseado no localStorage
    const jaLeu = localStorage.getItem(`leitura_concluida_${hoje}`);
    if (jaLeu) {
      btnLi.innerText = "✅ Leitura Concluída";
      btnLi.style.color = "#22c55e";
      btnLi.style.borderColor = "#22c55e";
    }

    // 2. Ouvir o contador no Firestore (Com correção de grafia)
    onSnapshot(docRef, (docSnap) => {
      let total = 0;
      if (docSnap.exists()) {
        total = docSnap.data().contador || 0;
      }

      if (total === 0) {
        elContador.innerText = "Seja o primeiro a ler hoje!";
      } else if (total === 1) {
        elContador.innerText = "1 pessoa leu hoje!!";
      } else {
        elContador.innerText = `${total} pessoas leram hoje`;
      }
    });

    // 3. Registrar o Clique (Lógica de Marcar/Desmarcar)
    btnLi.onclick = async () => {
      const jaLeuAgora = localStorage.getItem(`leitura_concluida_${hoje}`);

      try {
        if (!jaLeuAgora) {
          // MARCAR COMO LIDO
          await setDoc(
            docRef,
            {
              contador: increment(1),
              ultimaAtualizacao: new Date(),
            },
            { merge: true }
          );

          localStorage.setItem(`leitura_concluida_${hoje}`, "true");
          btnLi.innerText = "✅ Leitura Concluída";
          btnLi.style.color = "#22c55e";
          btnLi.style.borderColor = "#22c55e";
          logEvent(analytics, "marcou_leitura_concluida");
        } else {
          // DESMARCAR (MANUALMENTE)
          await setDoc(
            docRef,
            {
              contador: increment(-1),
              ultimaAtualizacao: new Date(),
            },
            { merge: true }
          );

          localStorage.removeItem(`leitura_concluida_${hoje}`);
          btnLi.innerText = "📖 Eu li as leituras";
          btnLi.style.color = "#007AFF"; // Cor original do seu botão
          btnLi.style.borderColor = "#007AFF";
          logEvent(analytics, "desmarcou_leitura_concluida");
        }
      } catch (error) {
        console.error("Erro ao atualizar contador:", error);
      }
    };
  };

  // LEMBRE-SE: Chame a função ouvirContadorLeituras() no final do seu DOMContentLoaded!

  logEvent(analytics, "page_view", { page_title: "Home Liturgia Ágape" });

  onMessage(messaging, (payload) => {
    alert(`Novo Aviso do Ágape: ${payload.notification.body}`);
  });

  const tratarDadosApi = async () => {
    const resumo = document.getElementById("resumo-leituras");
    try {
      dadosLiturgia = await buscarDadosApi();

      const elSanto = document.getElementById("nome-santo");
      const elEmoji = document.getElementById("emoji-tempo");
      const elCirculo = document.getElementById("indicador-cor");
      const elBadge = document.getElementById("badge-cor");

      if (dadosLiturgia) {
        if (elSanto)
          elSanto.innerText = dadosLiturgia.liturgia || "Tempo Litúrgico";

        const corAPI = (dadosLiturgia.cor || "Branco").toLowerCase();
        let classeCor = "verde";
        let simboloIcone = "🌱";

        if (corAPI.includes("branco") || corAPI.includes("dourado")) {
          classeCor = "branco";
          simboloIcone = "🙌🏼";
        } else if (corAPI.includes("verde")) {
          classeCor = "verde";
          simboloIcone = "🌱";
        } else if (corAPI.includes("roxo") || corAPI.includes("violeta")) {
          classeCor = "roxo";
          simboloIcone = "🙏🏼";
        } else if (corAPI.includes("vermelho")) {
          classeCor = "vermelho";
          simboloIcone = "✝️";
        } else if (corAPI.includes("rosa")) {
          classeCor = "rosa";
          simboloIcone = "⏳";
        }

        if (elBadge) {
          elBadge.innerText = dadosLiturgia.cor;
          elBadge.className = `badge-cor ${classeCor}`;
        }
        if (elCirculo) elCirculo.className = `circulo-liturgico ${classeCor}`;
        if (elEmoji) elEmoji.innerText = simboloIcone;

        // Dentro do tratarDadosApi no seu main.js
        if (resumo) {
          const ref1 = dadosLiturgia.primeiraLeitura?.referencia || "---";
          const refSalmo = dadosLiturgia.salmo?.referencia || "---";
          const refEvangelho = dadosLiturgia.evangelho?.referencia || "---";

          // Criando o conteúdo centralizado
          let html = `<div style="text-align: center; line-height: 1.8;">`;
          html += `<p><strong>1ª Leitura:</strong> ${ref1}</p>`;
          html += `<p><strong>Salmo:</strong> ${refSalmo}</p>`;

          // Lógica da 2ª Leitura
          if (
            dadosLiturgia.segundaLeitura &&
            !dadosLiturgia.segundaLeitura.includes("Não há")
          ) {
            const ref2 =
              dadosLiturgia.segundaLeitura?.referencia ||
              "Referência indisponível";
            html += `<p><strong>2ª Leitura:</strong> ${ref2}</p>`;
          }

          html += `<p><strong>Evangelho:</strong> ${refEvangelho}</p>`;
          html += `</div>`;

          resumo.innerHTML = html;
        }
      }
    } catch (error) {
      console.error("Falha na API:", error);
    }
  };

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

  setupClick("btn-abrir-liturgia", () => {
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
        // Garante que pegamos a propriedade 'texto' do objeto
        let textoBase = typeof dado === "string" ? dado : dado.texto || "";
        let htmlFinal = dado.refrao
          ? `<strong>Refrão:</strong> ${dado.refrao}<br><br>`
          : "";
        htmlFinal += textoBase.replace(
          /(\d+)/g,
          '<sup class="versiculo">$1</sup>'
        );
        return htmlFinal;
      };

      // Montagem do conteúdo com as referências acessadas corretamente
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
        const ref2 = dadosLiturgia.segundaLeitura?.referencia || "";
        html += `<div class="leitura-bloco"><h4>2ª Leitura</h4><p style="color: #64748b; font-weight: bold;">${ref2}</p><p>${formatarTexto(
          dadosLiturgia.segundaLeitura
        )}</p></div><hr>`;
      }

      html += `<div class="leitura-bloco"><h4>Evangelho</h4><p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${
        dadosLiturgia.evangelho?.referencia || ""
      }</p><p>${formatarTexto(dadosLiturgia.evangelho)}</p></div>`;

      corpo.innerHTML = html;
      modal.style.display = "flex";
    }
  });

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
      modal.style.display = "flex";
    }
  };

  setupClick("btn-fazer-login", async () => {
    const e = document.getElementById("login-email").value;
    const s = document.getElementById("login-senha").value;
    try {
      await signInWithEmailAndPassword(auth, e, s);
      document.getElementById("modalLogin").style.display = "none";
      document.getElementById("modalAdminAvisos").style.display = "flex";
      gerenciarAvisosPainel();
    } catch (err) {
      alert("Acesso negado.");
    }
  });

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

  setupClick("nav-inicio", (e) => {
    e.preventDefault();
    document.querySelector("main").scrollTo({ top: 0, behavior: "smooth" });
  });
  setupClick("nav-sobre-site", (e) => {
    e.preventDefault();
    document.getElementById("modalSobreSite").style.display = "flex";
  });
  setupClick("btn-explicar-horas", () => {
    document.getElementById("modalExplicacaoHoras").style.display = "flex";
  });
  setupClick("btn-login-secreto", () => {
    document.getElementById("modalLogin").style.display = "flex";
  });

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

  const configurarNavegação = () => {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.onclick = (e) => {
        e.preventDefault();
        navItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        if (item.id === "nav-sobre-site") {
          document.getElementById("modalSobreSite").style.display = "flex";
          return;
        }
        const targetId = item.getAttribute("data-target");
        if (targetId) {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            targetElement.classList.remove("highlight-card");
            void targetElement.offsetWidth;
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

  const configurarTercoUI = () => {
    const tituloEl = document.getElementById("titulo-misterio");
    const descEl = document.getElementById("descricao-misterio");

    if (!tituloEl || !descEl) return;

    const hoje = obterMisterioDoDia();

    tituloEl.innerText = hoje.titulo;

    // Centralizando e organizando o conteúdo
    descEl.innerHTML = `
      <div style="margin-bottom: 12px; line-height: 1.5; text-align: center;">
        ${hoje.desc.replace(/\n/g, "<br>")}
      </div>
      <div style="font-style: italic; color: #64748b; font-size: 0.85rem; border-top: 1px dashed #e2e8f0; margin-top: 12px; padding-top: 10px; text-align: center;">
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

  configurarTercoUI();
  configurarNavegação();
  configurarData();
  carregarAvisos();
  tratarDadosApi();
  configurarNotificacoes();
  ouvirContadorLeituras();
});
