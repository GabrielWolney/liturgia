document.addEventListener("DOMContentLoaded", () => {
  let dadosLiturgia = null;

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

  // 2. LISTA DE AVISOS (Prioridade pro Encontro de Jovens)
  const carregarAvisos = () => {
    const lista = [
      { texto: "🔥 Encontro de Jovens - Sábado 19h", prioridade: 1 },
      { texto: "🎸 Ensaio do Ministério - Quinta 20h", prioridade: 2 },
      { texto: "⛪ Missa com Jovens - Domingo 18h", prioridade: 3 },
    ];
    lista.sort((a, b) => a.prioridade - b.prioridade);
    const container = document.getElementById("lista-avisos");
    if (container) {
      container.innerHTML = lista.map((a) => `<li>${a.texto}</li>`).join("");
    }
  };

  // 3. BUSCA NA API E TRATAMENTO DE CORES/ÍCONES
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
        // Puxa o nome do tempo litúrgico (já que a API não manda santo)
        if (elSanto) elSanto.innerText = dadosLiturgia.liturgia || "Tempo Litúrgico";

        const corAPI = (dadosLiturgia.cor || "Branco").toLowerCase();
        let classeCor = "verde";
        let simboloIcone = "🌱";

        // Mapeia ícones conforme o guia de cores
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

        // Atualiza o card de resumo
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

  // 4. LOGICA DOS MODAIS E CLIQUE NOS BOTOES
  const setupClick = (id, fn) => { 
    const el = document.getElementById(id); 
    if (el) el.onclick = fn; 
  };

  // Abre a liturgia e formata os versículos (Regex pros números ficarem pequenos)
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
        // Regex bolada pra deixar versículo como <sup>
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

  // Liturgia das Horas (Vídeos + Explicação da IGLH)
  window.abrirHora = (tipo) => {
    const modal = document.getElementById("modalGeral");
    const corpo = document.getElementById("modal-corpo");
    const titulo = document.getElementById("modal-titulo");

    if (modal && corpo) {
        const infoHoras = {
            laudes: {
                titulo: "Laudes: Oração da Manhã",
                desc: "As Laudes são destinadas a santificar o tempo da manhã. Elas celebram a Ressurreição do Senhor, que é a 'Luz verdadeira' e o 'Sol de Justiça'."
            },
            vesperas: {
                titulo: "Vésperas: Oração da Tarde",
                desc: "As Vésperas são celebradas ao entardecer. Nelas, damos graças pelo que nos foi dado no dia e fazemos memória da Redenção."
            },
            completas: {
                titulo: "Completas: Oração antes do Repouso",
                desc: "As Completas são a última oração do dia. É o momento do exame de consciência e da entrega confiante de nossa vida nas mãos de Deus."
            }
        };

        const selecao = infoHoras[tipo];
        titulo.innerText = selecao.titulo;
        corpo.innerHTML = `
            <div style="text-align:center; padding: 10px;">
                <p style="margin-bottom: 25px; text-align: justify; line-height: 1.6; font-style: italic;">"${selecao.desc}"</p>
                <div style="background: #f8fafc; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0;">
                    <p style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: #CC0000;">▶️ REZAR AGORA</p>
                    <a href="https://www.youtube.com/LiturgiadasHorasOnline" target="_blank" class="btn-primary" style="text-decoration:none; display:inline-block; width:auto; padding: 12px 25px; background: #FF0000;">Abrir Canal no YouTube</a>
                </div>
            </div>`;
        modal.style.display = "flex";
    }
  };

  // Botões da Bottom Nav
  setupClick("nav-inicio", (e) => { e.preventDefault(); document.querySelector("main").scrollTo({ top: 0, behavior: "smooth" }); });
  setupClick("nav-sobre-site", (e) => { e.preventDefault(); document.getElementById("modalSobreSite").style.display = "flex"; });
  setupClick("btn-explicar-horas", () => { document.getElementById("modalExplicacaoHoras").style.display = "flex"; });

  // Fechar qualquer modal
  const fechar = () => { document.querySelectorAll(".modal").forEach((m) => (m.style.display = "none")); };
  
  // Pegando todos os seletores de fechar, inclusive o que tava quebrado
  document.querySelectorAll(".close-modal, .close-modal-sobre, #btn-entendido-horas, #btn-fechar-explicacao").forEach((b) => {
    b.onclick = fechar;
  });
  
  window.onclick = (e) => { if (e.target.classList.contains("modal")) fechar(); };

  // Smooth scroll pros links com data-target
  document.querySelectorAll(".nav-item[data-target]").forEach((item) => {
    item.onclick = (e) => {
      e.preventDefault();
      const target = document.querySelector(item.getAttribute("data-target"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    };
  });

  configurarData(); 
  carregarAvisos(); 
  buscarDadosApi();
});