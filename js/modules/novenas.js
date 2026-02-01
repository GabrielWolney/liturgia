import { abrirModal } from "../utils/dom-utils.js";

let cacheNovenas = null;
let filtroAtual = 'agora';

// Carrega o JSON
async function carregarNovenas() {
    if (cacheNovenas) return cacheNovenas;
    try {
        const response = await fetch('./js/novenas.json');
        if (!response.ok) throw new Error("Erro ao carregar novenas");
        cacheNovenas = await response.json();
        return cacheNovenas;
    } catch (e) { 
        console.error(e);
        return null; 
    }
}

function highlightMenu(element) {
    if (!element) return;
    const items = document.querySelectorAll('.btn-nav-oracao, .btn-item-lista');
    if (items) items.forEach(b => b.classList.remove('active'));
    element.classList.add('active');
}

// --- ABRIR LISTA DE NOVENAS ---
export const abrirListaNovenas = async (element) => { 
    const db = await carregarNovenas();
    if (!db) return;

    const leitorDesktop = document.getElementById("leitor-oracao-desktop");
    const isDesktop = leitorDesktop && leitorDesktop.offsetParent !== null;

    if (isDesktop) {
        if(element) highlightMenu(element); 
        leitorDesktop.innerHTML = `
            <div class="conteudo-leitor-centralizado">
                <div style="text-align: center; margin-bottom: 30px;">
                    <span class="material-symbols-rounded" style="font-size: 40px; color: var(--primary); margin-bottom: 10px;">calendar_month</span>
                    <h2 style="font-size: 2rem; margin: 0; color: var(--text);">Novenas e Devoções</h2>
                    <p style="color: var(--muted); margin-top: 5px;">Calendário Litúrgico</p>
                </div>
                <div class="tabs-novena-container">
                    <button id="tab-agora" class="tab-novena-desk active" onclick="window.alternarAbaNovenas('agora')">Agora</button>
                    <button id="tab-breve" class="tab-novena-desk" onclick="window.alternarAbaNovenas('breve')">Em Breve</button>
                    <button id="tab-fim" class="tab-novena-desk" onclick="window.alternarAbaNovenas('fim')">Encerradas</button>
                </div>
                <div id="lista-novenas-conteudo" class="novena-grid">
                    <p style="text-align:center; width:100%;">Carregando...</p>
                </div>
            </div>`;
        window.alternarAbaNovenas('agora');
    } else {
        // MOBILE
        const modalHeader = document.querySelector("#modalGeral .modal-header");
        // Reseta o header para o padrão (Sem seta)
        if (modalHeader) {
            modalHeader.innerHTML = `
                <h3 id="modal-titulo" style="margin:0;">Novenas</h3>
                <button class="close-modal" onclick="document.getElementById('modalGeral').style.display='none'">
                    <span class="material-symbols-rounded">close</span>
                </button>
            `;
            modalHeader.style.justifyContent = "space-between";
        }

        const corpo = document.getElementById("modal-corpo");
        if (corpo) {
            corpo.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; background: var(--bg); padding: 5px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border);">
                    <button id="tab-agora" class="tab-novena" onclick="window.alternarAbaNovenas('agora')">Agora</button>
                    <button id="tab-breve" class="tab-novena" onclick="window.alternarAbaNovenas('breve')">Em Breve</button>
                    <button id="tab-fim" class="tab-novena" onclick="window.alternarAbaNovenas('fim')">Fim</button>
                </div>
                <div id="lista-novenas-conteudo" style="max-height: 60vh; overflow-y: auto; padding-bottom: 20px;"></div>
            `;
            corpo.querySelectorAll('.tab-novena').forEach(t => {
                t.style.padding = '8px'; t.style.borderRadius = '8px'; t.style.border = 'none'; 
                t.style.fontWeight = 'bold'; t.style.fontSize = '0.8rem'; t.style.cursor = 'pointer'; 
                t.style.background = 'transparent'; t.style.color = 'var(--muted)';
            });
        }
        abrirModal("modalGeral");
        window.alternarAbaNovenas('agora');
    }
};

// --- FILTRAR ABAS ---
export const alternarAbaNovenas = async (tipo) => {
    filtroAtual = tipo;
    const db = await carregarNovenas();
    const container = document.getElementById("lista-novenas-conteudo");
    if(!container) return;
    
    const mapIds = { 'agora': 'tab-agora', 'breve': 'tab-breve', 'fim': 'tab-fim' };
    Object.values(mapIds).forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            if (el.classList.contains('tab-novena-desk')) el.classList.remove('active');
            else { el.style.background = "transparent"; el.style.color = "var(--muted)"; }
        }
    });

    const ativo = document.getElementById(mapIds[tipo]);
    if(ativo) {
        if (ativo.classList.contains('tab-novena-desk')) ativo.classList.add('active');
        else { ativo.style.background = "var(--primary)"; ativo.style.color = "#fff"; }
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    const lista = db.calendario.filter(n => {
        const [mIni, dIni] = n.inicio.split('-').map(Number);
        const [mFim, dFim] = n.fim.split('-').map(Number);
        let anoInicio = anoAtual;
        if (mIni > mFim && mesAtual <= mFim) anoInicio = anoAtual - 1;
        const dataInicio = new Date(anoInicio, mIni - 1, dIni);
        const dataFim = new Date(anoInicio, mFim - 1, dFim);
        if (dataFim < dataInicio) dataFim.setFullYear(dataFim.getFullYear() + 1);

        if (tipo === 'agora') return hoje >= dataInicio && hoje <= dataFim;
        if (tipo === 'breve') return hoje < dataInicio;
        if (tipo === 'fim') return hoje > dataFim;
    });

    if (lista.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--muted); opacity: 0.7; grid-column: 1/-1;"><p>Nenhuma novena encontrada.</p></div>`;
        return;
    }

    const isDesktopContainer = container.classList.contains('novena-grid');
    container.innerHTML = lista.map(n => {
        const disponivel = db.detalhes[n.id] ? true : false;
        const click = disponivel ? `onclick="window.abrirDetalhesNovena('${n.id}')"` : `onclick="alert('Conteúdo em breve!')"`;
        const icone = disponivel ? "chevron_right" : "lock";
        
        if (isDesktopContainer) {
            return `<div class="card-novena-desk" ${click}>
                <div><strong style="display:block; font-size: 1rem; margin-bottom:5px; color:var(--text);">${n.nome}</strong><span style="font-size:0.8rem; color:var(--muted);">${n.inicio.split('-').reverse().join('/')} a ${n.fim.split('-').reverse().join('/')}</span></div>
                <div style="margin-top: 15px; display: flex; justify-content: flex-end;"><span class="material-symbols-rounded" style="color:var(--primary); background: var(--primary-light); border-radius: 50%; padding: 5px; font-size: 20px;">${icone}</span></div>
            </div>`;
        } else {
            return `<div ${click} style="background: var(--card-bg); padding: 15px; border-radius: 12px; margin-bottom: 10px; cursor: pointer; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div><strong style="display:block; margin-bottom:4px; color:var(--text);">${n.nome}</strong><span style="font-size:0.8rem; color:var(--muted);">${n.inicio.split('-').reverse().join('/')} a ${n.fim.split('-').reverse().join('/')}</span></div>
                <span class="material-symbols-rounded" style="color:var(--primary)">${icone}</span>
            </div>`;
        }
    }).join("");
};

// --- DETALHES DA NOVENA (LISTA DE DIAS) ---
export const abrirDetalhesNovena = async (id) => {
    const db = await carregarNovenas();
    const novena = db.detalhes[id];
    if (!novena) return;

    const leitorDesktop = document.getElementById("leitor-oracao-desktop");
    const isDesktop = leitorDesktop && leitorDesktop.offsetParent !== null;
    
    let htmlDias = `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:10px;">`;
    const progresso = JSON.parse(localStorage.getItem(`novena_${id}`)) || [];

    novena.dias.forEach((diaObj, index) => {
        const feito = progresso.includes(index);
        const estilo = feito 
            ? 'background:var(--primary); color:#fff; border:none;' 
            : 'background:var(--bg); border:1px solid var(--border); color:var(--text);';
        const conteudo = feito ? '<span class="material-symbols-rounded">check</span>' : `${index+1}º Dia`;
        htmlDias += `<button onclick="window.lerDiaNovena('${id}', ${index})" style="padding:15px; border-radius:10px; font-weight:bold; height:60px; cursor:pointer; ${estilo}">${conteudo}</button>`;
    });
    htmlDias += `</div>`;

    if(isDesktop) {
        leitorDesktop.innerHTML = `
            <div class="conteudo-leitor-centralizado">
                <button onclick="window.abrirListaNovenas()" style="background:none; border:none; cursor:pointer; color:var(--muted); margin-bottom:20px; display:flex; align-items:center; font-size:0.9rem;"><span class="material-symbols-rounded">arrow_back</span> Voltar</button>
                <h2 style="font-size: 2rem; color: var(--text); margin-bottom: 10px; text-align:center;">${novena.titulo}</h2>
                <div style="margin-bottom:30px; font-size:1rem; color:var(--muted); text-align:center; max-width:600px; margin: 0 auto 30px auto;">${novena.intro}</div>
                ${htmlDias}
            </div>`;
    } else {
        // --- MOBILE FIX: HEADER COM SETA PARA LISTA ---
        const modalHeader = document.querySelector("#modalGeral .modal-header");
        if(modalHeader) {
            modalHeader.innerHTML = `
                <button onclick="window.abrirListaNovenas()" style="background:none; border:none; color:var(--text); padding:5px; display:flex; align-items:center; cursor:pointer;">
                    <span class="material-symbols-rounded">arrow_back</span>
                </button>
                <h3 style="margin:0; font-size:1.1rem; flex:1; text-align:center;">${novena.titulo}</h3>
                <button class="close-modal" onclick="document.getElementById('modalGeral').style.display='none'">
                    <span class="material-symbols-rounded">close</span>
                </button>
            `;
            modalHeader.style.display = "flex";
            modalHeader.style.justifyContent = "space-between";
            modalHeader.style.alignItems = "center";
        }
        
        const corpo = document.getElementById("modal-corpo");
        if(corpo) corpo.innerHTML = `<div style="padding:0 5px; margin-bottom:20px; font-size:0.95rem; color:var(--text); line-height:1.5;">${novena.intro}</div>` + htmlDias;
    }
};

// --- LER DIA ESPECÍFICO (CORRIGIDO MANTENDO CONTEÚDO) ---
export const lerDiaNovena = async (id, index) => {
    const db = await carregarNovenas();
    const novena = db.detalhes[id];
    const diaObj = novena.dias[index];
    const progresso = JSON.parse(localStorage.getItem(`novena_${id}`)) || [];
    const feito = progresso.includes(index);
 
    const leitorDesktop = document.getElementById("leitor-oracao-desktop");
    const isDesktop = leitorDesktop && leitorDesktop.offsetParent !== null;

    const btnAcao = feito 
        ? `<button class="btn-primary" style="background:transparent; border:1px solid var(--border); color:var(--text);" onclick="window.alternarStatusDia('${id}', ${index})">Desmarcar Dia</button>`
        : `<button class="btn-primary" onclick="window.alternarStatusDia('${id}', ${index})">Concluir Dia</button>`;

    // --- CONTEÚDO EXATO DO SEU CÓDIGO ORIGINAL ---
    const htmlConteudo = `
        <div style="padding:0 5px;">
            <h4 style="color:var(--primary); margin-bottom:10px;">Oração Inicial</h4>
            <div style="font-style:italic; border-left:3px solid var(--border); padding-left:15px; margin-bottom:30px; line-height: 1.6; text-align:justify;">${novena.oracaoInicial}</div>
            
            <hr style="border:0; border-top:1px solid var(--border); margin:30px 0;">
            <div style="text-align:justify; line-height:1.8; font-size: 1.1rem;">${diaObj.texto}</div>
            <hr style="border:0; border-top:1px solid var(--border); margin:30px 0;">
            
            <h4 style="color:var(--primary); margin-bottom:10px;">Oração Final</h4>
            <div style="font-style:italic; border-left:3px solid var(--border); padding-left:15px; margin-bottom:30px; line-height: 1.6; text-align:justify;">${novena.oracaoFinal}</div>
            
            <div style="text-align:center; margin-top:30px;">${btnAcao}</div>
        </div>
    `;

    if (isDesktop) {
        // Desktop: Botão voltar no corpo (padrão)
        leitorDesktop.innerHTML = `
            <div class="conteudo-leitor-centralizado">
                <button onclick="window.abrirDetalhesNovena('${id}')" style="background:none; border:none; cursor:pointer; color:var(--muted); margin-bottom:20px; display:flex; align-items:center; font-size:0.9rem;"><span class="material-symbols-rounded">arrow_back</span> Voltar</button>
                <h3 style="color:var(--text); margin-bottom:20px; font-size: 1.5rem; text-align:center;">${diaObj.dia}º Dia</h3>
                ${htmlConteudo}
            </div>`;
        leitorDesktop.scrollTop = 0;
    } else {
        // --- MOBILE FIX: HEADER COM SETA PARA DETALHES ---
        const modalHeader = document.querySelector("#modalGeral .modal-header");
        if (modalHeader) {
            modalHeader.innerHTML = `
                <button onclick="window.abrirDetalhesNovena('${id}')" style="background:none; border:none; color:var(--text); padding:5px; display:flex; align-items:center; cursor:pointer;">
                    <span class="material-symbols-rounded">arrow_back</span>
                </button>
                <h3 style="margin:0; font-size:1.1rem; flex:1; text-align:center;">${diaObj.dia}º Dia</h3>
                <button class="close-modal" onclick="document.getElementById('modalGeral').style.display='none'">
                    <span class="material-symbols-rounded">close</span>
                </button>
            `;
            // Garante o alinhamento
            modalHeader.style.display = "flex";
            modalHeader.style.justifyContent = "space-between";
            modalHeader.style.alignItems = "center";
        }
        
        // Injeta o conteúdo no corpo
        document.getElementById("modal-corpo").innerHTML = htmlConteudo;
    }
};

export const alternarStatusDia = (id, index) => {
    let progresso = JSON.parse(localStorage.getItem(`novena_${id}`)) || [];
    if (progresso.includes(index)) {
        progresso = progresso.filter(i => i !== index);
    } else {
        progresso.push(index);
    }
    localStorage.setItem(`novena_${id}`, JSON.stringify(progresso));
    lerDiaNovena(id, index);
};

window.abrirListaNovenas = abrirListaNovenas;
window.alternarAbaNovenas = alternarAbaNovenas;
window.abrirDetalhesNovena = abrirDetalhesNovena;
window.lerDiaNovena = lerDiaNovena;
window.alternarStatusDia = alternarStatusDia;