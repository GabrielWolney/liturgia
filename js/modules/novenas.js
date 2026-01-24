import { abrirModal } from "../utils/dom-utils.js";

let cacheNovenas = null;
let filtroAtual = 'agora'; 

async function carregarNovenas() {
    if (cacheNovenas) return cacheNovenas;
    try {
        const response = await fetch('./js/novenas.json');
        if (!response.ok) throw new Error("Erro ao carregar novenas");
        cacheNovenas = await response.json();
        return cacheNovenas;
    } catch (erro) {
        console.error("Erro:", erro);
        return null;
    }
}

export const abrirListaNovenas = async () => {
    const db = await carregarNovenas();
    if (!db) return;

    const modal = document.getElementById("modalGeral");
    const titulo = document.getElementById("modal-titulo");
    const corpo = document.getElementById("modal-corpo");

    titulo.innerText = "Novenas e Devoções";

    // Criação das abas
    corpo.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; background: var(--bg); padding: 5px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border);">
            <button id="tab-agora" class="tab-novena" onclick="window.alternarAbaNovenas('agora')">Agora</button>
            <button id="tab-breve" class="tab-novena" onclick="window.alternarAbaNovenas('breve')">Em Breve</button>
            <button id="tab-fim" class="tab-novena" onclick="window.alternarAbaNovenas('fim')">Fim</button>
        </div>
        <div id="lista-novenas-conteudo" style="max-height: 60vh; overflow-y: auto; padding-bottom: 20px;"></div>
    `;
    
    // Estilização básica inline para os botões das abas
    const tabs = corpo.querySelectorAll('.tab-novena');
    tabs.forEach(t => {
        t.style.padding = '8px';
        t.style.borderRadius = '8px';
        t.style.border = 'none';
        t.style.fontWeight = 'bold';
        t.style.fontSize = '0.8rem';
        t.style.cursor = 'pointer';
        t.style.background = 'transparent';
        t.style.color = 'var(--muted)';
    });

    abrirModal("modalGeral");
    alternarAbaNovenas('agora');
};

export const alternarAbaNovenas = async (tipo) => {
    filtroAtual = tipo;
    const db = await carregarNovenas();
    const container = document.getElementById("lista-novenas-conteudo");
    
    // Atualiza estilo das abas
    const mapIds = { 'agora': 'tab-agora', 'breve': 'tab-breve', 'fim': 'tab-fim' };
    
    Object.values(mapIds).forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.style.background = "transparent";
            el.style.color = "var(--muted)";
            el.style.boxShadow = "none";
        }
    });

    const ativo = document.getElementById(mapIds[tipo]);
    if(ativo) {
        ativo.style.background = "var(--primary)";
        ativo.style.color = "#fff";
        ativo.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    }

    // Filtra novenas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    const lista = db.calendario.filter(n => {
        const [mIni, dIni] = n.inicio.split('-').map(Number);
        const [mFim, dFim] = n.fim.split('-').map(Number);
        
        let anoInicio = anoAtual;
        // Lógica simples de virada de ano
        if (mIni > mFim && mesAtual <= mFim) anoInicio = anoAtual - 1;

        const dataInicio = new Date(anoInicio, mIni - 1, dIni);
        const dataFim = new Date(anoInicio, mFim - 1, dFim);
        // Ajuste se data fim for menor que inicio (virada de ano)
        if (dataFim < dataInicio) dataFim.setFullYear(dataFim.getFullYear() + 1);

        if (tipo === 'agora') return hoje >= dataInicio && hoje <= dataFim;
        if (tipo === 'breve') return hoje < dataInicio;
        if (tipo === 'fim') return hoje > dataFim;
    });

    // Renderiza
    if (lista.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--muted); opacity: 0.7;"><p>Nada encontrado.</p></div>`;
        return;
    }

    container.innerHTML = lista.map(n => {
        const disponivel = db.detalhes[n.id] ? true : false;
        // Chama a função global window.abrirDetalhesNovena que o main.js vai expor
        const click = disponivel ? `onclick="window.abrirDetalhesNovena('${n.id}')"` : `onclick="alert('Em breve!')"`;
        const icone = disponivel ? "chevron_right" : "lock";
        
        return `
        <div ${click} style="background: var(--card-bg); padding: 15px; border-radius: 12px; margin-bottom: 10px; cursor: pointer; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="display:block; margin-bottom:4px; color:var(--text);">${n.nome}</strong>
                <span style="font-size:0.8rem; color:var(--muted);">${n.inicio.split('-').reverse().join('/')} a ${n.fim.split('-').reverse().join('/')}</span>
            </div>
            <span class="material-symbols-rounded" style="color:var(--primary)">${icone}</span>
        </div>`;
    }).join("");
};

export const abrirDetalhesNovena = async (id) => {
    const db = await carregarNovenas();
    const novena = db.detalhes[id];
    if (!novena) return;

    const titulo = document.getElementById("modal-titulo");
    const corpo = document.getElementById("modal-corpo");
    
    titulo.innerHTML = `<div style="display:flex; align-items:center;"><button onclick="window.abrirListaNovenas()" style="background:none; border:none; cursor:pointer; color:var(--text); margin-right:10px; display:flex; align-items:center;"><span class="material-symbols-rounded">arrow_back</span></button> <span>${novena.titulo}</span></div>`;

    let html = `<div style="padding:0 5px; margin-bottom:20px; font-size:0.95rem; color:var(--text);">${novena.intro}</div>`;
    html += `<div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">`;

    const progresso = JSON.parse(localStorage.getItem(`novena_${id}`)) || [];

    novena.dias.forEach((diaObj, index) => {
        const feito = progresso.includes(index);
        const estilo = feito ? 'background:var(--primary); color:#fff; border:none;' : 'background:var(--card-bg); border:1px solid var(--border); color:var(--text);';
        const conteudo = feito ? '<span class="material-symbols-rounded">check</span>' : `${index+1}º Dia`;
        
        html += `<button onclick="window.lerDiaNovena('${id}', ${index})" style="padding:15px; border-radius:10px; font-weight:bold; height:60px; cursor:pointer; ${estilo}">${conteudo}</button>`;
    });
    html += `</div>`;
    corpo.innerHTML = html;
};

export const lerDiaNovena = async (id, index) => {
    const db = await carregarNovenas();
    const novena = db.detalhes[id];
    const diaObj = novena.dias[index];
    const progresso = JSON.parse(localStorage.getItem(`novena_${id}`)) || [];
    const feito = progresso.includes(index);

    const titulo = document.getElementById("modal-titulo");
    const corpo = document.getElementById("modal-corpo");

    titulo.innerHTML = `<div style="display:flex; align-items:center;"><button onclick="window.abrirDetalhesNovena('${id}')" style="background:none; border:none; cursor:pointer; color:var(--text); margin-right:10px; display:flex; align-items:center;"><span class="material-symbols-rounded">arrow_back</span></button> <span>${diaObj.dia}º Dia</span></div>`;

    const btnAcao = feito 
        ? `<button class="btn-primary" style="background:transparent; border:1px solid var(--border); color:var(--text);" onclick="window.alternarStatusDia('${id}', ${index})">Desmarcar</button>`
        : `<button class="btn-primary" onclick="window.alternarStatusDia('${id}', ${index})">Concluir Dia</button>`;

    corpo.innerHTML = `
        <div style="padding:0 5px;">
            <h4 style="color:var(--primary); margin-bottom:10px;">Oração Inicial</h4>
            <div style="font-style:italic; border-left:3px solid var(--border); padding-left:10px; margin-bottom:20px;">${novena.oracaoInicial}</div>
            <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">
            <div style="text-align:justify; line-height:1.8;">${diaObj.texto}</div>
            <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">
            <h4 style="color:var(--primary); margin-bottom:10px;">Oração Final</h4>
            <div style="font-style:italic; border-left:3px solid var(--border); padding-left:10px; margin-bottom:20px;">${novena.oracaoFinal}</div>
            ${btnAcao}
        </div>
    `;
};

export const alternarStatusDia = (id, index) => {
    let progresso = JSON.parse(localStorage.getItem(`novena_${id}`)) || [];
    if (progresso.includes(index)) {
        progresso = progresso.filter(i => i !== index);
    } else {
        progresso.push(index);
    }
    localStorage.setItem(`novena_${id}`, JSON.stringify(progresso));
    abrirDetalhesNovena(id);
};