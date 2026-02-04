import { abrirModal } from "../utils/dom-utils.js";
import { buscarDadosLiturgia } from "../services/api-service.js";
import { atualizarContadorLeitura, ouvirContador } from "../services/firestore-service.js";
import { formatarSalmo, formatarLeitura, getText, getRef } from "../utils/formatters.js";
import { analytics } from "../config/firebase-config.js";
import { logEvent } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

let dadosLiturgiaCache = null;

// --- CARREGAMENTO INICIAL ---
export const carregarLiturgia = async () => {
    renderizarSkeletons();
    try {
        dadosLiturgiaCache = await buscarDadosLiturgia(); 
        
        if (!dadosLiturgiaCache || !dadosLiturgiaCache.primeiraLeitura) {
            throw new Error("Dados incompletos");
        }
        atualizarInterfaceLiturgia(dadosLiturgiaCache);
    } catch (error) {
        console.warn("Usando backup Liturgia:", error);
        usarBackup();
    }
};

// --- INTERFACE (UI) ---
const renderizarSkeletons = () => {
    const elSanto = document.getElementById("nome-santo");
    const resumo = document.getElementById("resumo-leituras");
    if (elSanto) elSanto.innerHTML = '<div class="skeleton skeleton-title"></div>';
    if (resumo) resumo.innerHTML = `<div class="skeleton skeleton-text" style="width: 60%; margin: 0 auto 10px auto;"></div><div class="skeleton skeleton-text" style="width: 80%; margin: 0 auto 10px auto;"></div>`;
};

const atualizarInterfaceLiturgia = (dados) => {
    const elSanto = document.getElementById("nome-santo");
    const elBadge = document.getElementById("badge-cor");
    const elCirculo = document.getElementById("indicador-cor");
    const elEmoji = document.getElementById("emoji-tempo");
    const resumo = document.getElementById("resumo-leituras");
    const liturgiaDesktop = document.getElementById("liturgia-desktop-texto");

    let corAPI = (dados.cor || "Branco").toLowerCase();
    const tituloLiturgia = (dados.liturgia || "").toLowerCase();

    // Lógica de cores litúrgicas
    if (tituloLiturgia.includes("tempo comum")) corAPI = "verde";
    else if (tituloLiturgia.includes("quaresma") || tituloLiturgia.includes("advento")) corAPI = "roxo";
    else if (tituloLiturgia.includes("mártir") || tituloLiturgia.includes("paixão")) corAPI = "vermelho";

    const configCores = {
        branco: { classe: "branco", img: "./liturgia-icons/branco.png" },
        verde: { classe: "verde", img: "./liturgia-icons/verde.png" },
        roxo: { classe: "roxo", img: "./liturgia-icons/roxo.png" },
        vermelho: { classe: "vermelho", img: "./liturgia-icons/vermelho.png" },
        rosa: { classe: "rosa", img: "./liturgia-icons/rosa.png" },
    };

    const config = configCores[Object.keys(configCores).find((key) => corAPI.includes(key))] || configCores.branco;

    if (elSanto) elSanto.innerText = dados.liturgia || "Tempo Comum";
    if (elBadge) {
        elBadge.innerText = corAPI.charAt(0).toUpperCase() + corAPI.slice(1);
        elBadge.className = `badge-cor ${config.classe}`;
    }
    if (elCirculo) elCirculo.className = `circulo-liturgico ${config.classe}`;
    if (elEmoji) elEmoji.innerHTML = `<img src="${config.img}" alt="${corAPI}" class="icone-liturgico-img">`;

    // Resumo Mobile
    if (resumo) {
        const l1 = getRef(dados.primeiraLeitura);
        const sal = getRef(dados.salmo);
        const ev = getRef(dados.evangelho);
        
        let html = `<div style="text-align: center; line-height: 1.8;">
            <p><strong>1ª Leitura:</strong> ${l1}</p>
            <p><strong>Salmo:</strong> ${sal}</p>`;
            
        // CORREÇÃO: Validação mais segura da Segunda Leitura
        const s2Texto = getText(dados.segundaLeitura);
        const temSegundaLeitura = s2Texto && 
                                  s2Texto.length > 5 && 
                                  !s2Texto.toLowerCase().includes("não há segunda leitura");

        if (temSegundaLeitura) {
            html += `<p><strong>2ª Leitura:</strong> ${getRef(dados.segundaLeitura)}</p>`;
        }
        
        html += `<p><strong>Evangelho:</strong> ${ev}</p></div>`;
        resumo.innerHTML = html;
    }

    // Texto Completo Desktop (Sem Modal)
    if(liturgiaDesktop) {
        liturgiaDesktop.innerHTML = gerarHTMLCompleto(dados);
    }
};

const usarBackup = () => {
    const backup = {
        liturgia: "Liturgia Diária", cor: "Verde", primeiraLeitura: "Leitura indisponível.", salmo: "Salmo indisponível.", evangelho: "Evangelho indisponível.", segundaLeitura: "Não há segunda leitura",
    };
    dadosLiturgiaCache = backup;
    atualizarInterfaceLiturgia(backup);
    const elSanto = document.getElementById("nome-santo");
    if (elSanto) elSanto.innerText = "Modo Offline";
};

// --- MODAL COMPLETO (MOBILE) ---
export const abrirModalLiturgiaCompleta = () => {
    if (!dadosLiturgiaCache) return usarBackup();
    logEvent(analytics, "visualizou_liturgia_completa", { liturgia_titulo: dadosLiturgiaCache.liturgia });
    
    const corpo = document.getElementById("modal-corpo");
    const titulo = document.getElementById("modal-titulo");
    
    if(titulo) titulo.innerText = "Liturgia da Palavra";
    if(corpo) corpo.innerHTML = gerarHTMLCompleto(dadosLiturgiaCache);

    abrirModal("modalGeral");
};

function gerarHTMLCompleto(data) {
    const estiloTexto = 'text-align: justify; line-height: 1.8; font-family: "Montserrat", sans-serif;';
    let html = "";

    // 1ª Leitura
    html += `<div class="leitura-bloco">
        <h4>1ª Leitura</h4>
        <p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${getRef(data.primeiraLeitura)}</p>
        <div style="${estiloTexto}">${formatarLeitura(getText(data.primeiraLeitura))}</div>
    </div><hr>`;
    
    // Salmo
    html += `<div class="leitura-bloco">
        <h4>Salmo Responsorial</h4>
        <p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${getRef(data.salmo)}</p>
        ${formatarSalmo(data.salmo)}
    </div><hr>`;
    
    // 2ª Leitura (CORREÇÃO DE LÓGICA)
    const s2Texto = getText(data.segundaLeitura);
    // Verifica se existe texto, se tem tamanho mínimo e se não é a frase padrão de ausência
    const temSegundaLeitura = s2Texto && 
                              s2Texto.length > 5 && 
                              !s2Texto.toLowerCase().includes("não há segunda leitura");

    if (temSegundaLeitura) {
        html += `<div class="leitura-bloco">
            <h4>2ª Leitura</h4>
            <p style="color: #64748b; font-weight: bold;">${getRef(data.segundaLeitura)}</p>
            <div style="${estiloTexto}">${formatarLeitura(s2Texto)}</div>
        </div><hr>`;
    }
      
    // Evangelho
    html += `<div class="leitura-bloco destaque-evangelho">
        <h4>Evangelho</h4>
        <p style="color: #64748b; font-weight: bold; margin-bottom: 10px;">${getRef(data.evangelho)}</p>
        <div style="${estiloTexto}">${formatarLeitura(getText(data.evangelho))}</div>
    </div>`;
    
    html += `<div style="padding: 15px; border-top: 1px solid var(--border);"><button id="btn-compartilhar" class="btn-primary" onclick="window.compartilharEvangelho()"><span class="material-symbols-rounded" style="vertical-align: middle; margin-right: 5px;">share</span> Compartilhar Evangelho</button></div>`;
    
    return html;
}

export const compartilharEvangelho = async () => {
    if (!dadosLiturgiaCache) return;
    const texto = `📖 *Evangelho do Dia*\n\nConfira a liturgia completa no App Ágape!\n${window.location.href}`;
    if (navigator.share) {
        try { await navigator.share({ title: "Liturgia Diária", text: texto, url: window.location.href }); } catch (err) {}
    } else {
        try { await navigator.clipboard.writeText(texto); alert("Link copiado!"); } catch (err) { alert("Erro ao copiar."); }
    }
};

export const inicializarContador = () => {
    const btnLi = document.getElementById("btn-li-a-leitura");
    const elContador = document.getElementById("texto-contador-leituras");
    if (!btnLi || !elContador) return;

    const hoje = new Date().toLocaleDateString("en-CA");

    try {
        ouvirContador((docSnap) => {
            const total = docSnap.exists() ? docSnap.data().contador || 0 : 0;
            if (total === 0) elContador.innerText = "Seja o primeiro a ler hoje!";
            else if (total === 1) elContador.innerText = "1 pessoa leu hoje!!";
            else elContador.innerText = `${total} pessoas leram hoje!!`;
        });
    } catch(e) { console.log("Contador offline"); }

    const atualizarVisualBotao = (lido) => {
        if (lido) {
            btnLi.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' 1;">check_circle</span> <span>Leitura Concluída</span>`;
            btnLi.classList.add("lido");
            btnLi.style.color = "#22c55e"; 
            btnLi.style.borderColor = "#22c55e";
        } else {
            btnLi.innerHTML = `<span class="material-symbols-rounded" style="font-variation-settings: 'FILL' 0;">check_circle</span> <span>Eu li as leituras</span>`;
            btnLi.classList.remove("lido");
            btnLi.style.color = ""; 
            btnLi.style.borderColor = "";
        }
    };

    const jaLeu = localStorage.getItem(`leitura_concluida_${hoje}`);
    atualizarVisualBotao(!!jaLeu);

    btnLi.onclick = async () => {
        const estaLido = localStorage.getItem(`leitura_concluida_${hoje}`);
        atualizarVisualBotao(!estaLido);
        try {
            if (!estaLido) {
                localStorage.setItem(`leitura_concluida_${hoje}`, "true");
                await atualizarContadorLeitura(true);
                logEvent(analytics, "marcou_leitura_concluida");
            } else {
                localStorage.removeItem(`leitura_concluida_${hoje}`);
                await atualizarContadorLeitura(false);
                logEvent(analytics, "desmarcou_leitura_concluida");
            }
        } catch (error) {
            atualizarVisualBotao(!!estaLido);
        }
    };
};

export const abrirHora = (tipo) => {
    logEvent(analytics, "rezou_liturgia_horas", { tipo_hora: tipo });
    const infoHoras = {
        laudes: { titulo: "Laudes: Oração da Manhã", desc: "Consagramos o início do dia a Deus, celebrando a Ressurreição." },
        vesperas: { titulo: "Vésperas: Oração da Tarde", desc: "Agradecemos pelo dia que passou e entregamos a noite." },
        completas: { titulo: "Completas: Oração da Noite", desc: "Exame de consciência e preparação para o repouso em Deus." },
    };
    
    const modalTitulo = document.getElementById("modal-titulo");
    const modalCorpo = document.getElementById("modal-corpo");
    
    if (modalTitulo && modalCorpo && infoHoras[tipo]) {
        const selecao = infoHoras[tipo];
        modalTitulo.innerText = selecao.titulo;
        modalCorpo.innerHTML = `
            <div style="text-align:center; padding: 10px;">
                <p style="margin-bottom: 25px; text-align: justify; line-height: 1.6; color: var(--text); font-style: italic;">"${selecao.desc}"</p>
                <div class="box-destaque-youtube">
                    <p style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; color: #CC0000;">▶️ REZAR AGORA</p>
                    <a href="https://www.youtube.com/LiturgiadasHorasOnline" target="_blank" class="btn-primary" style="text-decoration:none; display:inline-block; width:auto; padding: 12px 25px; background: #FF0000; border-radius: 8px; border: none; color: white;">Abrir Canal no YouTube</a>
                </div>
            </div>`;
        abrirModal("modalGeral");
    } else {
        window.open('https://www.youtube.com/LiturgiadasHorasOnline', '_blank');
    }
};