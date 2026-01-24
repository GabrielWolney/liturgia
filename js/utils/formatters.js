// --- FUNÇÃO AUXILIAR DE LIMPEZA (NOVA) ---
const limparComentario = (texto) => {
    // Frases que indicam o COMEÇO REAL da leitura bíblica
    const iniciosLiturgicos = [
        "Leitura d",       // Pega "Leitura do", "Leitura da", "Leitura dos"
        "Início d",        // Pega "Início do", "Início da"
        "Proclamação d",   // Para Evangelhos
        "Naqueles dias",   // Caso venha sem título
        "Naquele tempo"    // Caso venha sem título
    ];

    let menorIndice = texto.length;
    let encontrou = false;

    // Procura qual dessas frases aparece primeiro no texto
    iniciosLiturgicos.forEach(termo => {
        const idx = texto.indexOf(termo);
        // Se achou o termo e ele não está logo no início (tem lixo antes)
        // Ignoramos se estiver nos primeiros 5 caracteres, pois aí já é o texto certo
        if (idx !== -1 && idx < menorIndice) {
            menorIndice = idx;
            encontrou = true;
        }
    });

    // Se achou um ponto de corte válido (e não é o começo do texto), corta o que vem antes
    if (encontrou && menorIndice > 5) {
        return texto.substring(menorIndice);
    }

    return texto;
};

// --- EXPORTS ---

export const formatarSalmo = (dado) => {
    if (!dado) return "";

    let textoBase = typeof dado === "string" ? dado : (dado.texto || "");
    let refraoBase = typeof dado === "object" && dado.refrao ? dado.refrao : "";

    textoBase = textoBase.replace(/\+/g, "").trim();

    if (!refraoBase) {
        let linhas = textoBase.split('\n');
        if (linhas.length > 0) {
            refraoBase = linhas[0];
            textoBase = linhas.slice(1).join("\n"); 
        }
    }

    refraoBase = refraoBase.replace(/^(R\.|R:|—|Refrão:)\s*/i, "");

    let corpoFormatado = textoBase.replace(/\n/g, "<br>");
    corpoFormatado = corpoFormatado.replace(
        /(\d+)\.?/g, 
        '<sup style="color:var(--primary); font-weight:800; font-size:0.6em; vertical-align:super; margin-right:2px;">$1</sup>'
    );

    return `
        <div class="leitura-bloco">
            <p style="margin-bottom: 15px; background: rgba(0,0,0,0.03); padding: 10px; border-left: 3px solid var(--primary); border-radius: 4px;">
                <span style="color: var(--primary); font-weight: 800;">R.</span> 
                <strong>${refraoBase}</strong>
            </p>
            <div style="text-align: justify; line-height: 1.8; font-family: 'Montserrat', sans-serif;">
                ${corpoFormatado}
            </div>
        </div>
    `;
};

export const formatarLeitura = (textoLeitura) => {
    if (!textoLeitura) return "";
    
    // 1. LIMPEZA: Remove comentários teológicos antes da leitura
    textoLeitura = limparComentario(textoLeitura);

    // 2. Verifica duplicidade de título na primeira linha
    let linhas = textoLeitura.split('\n');
    if (linhas.length > 1) {
        // Se a 1ª linha for curta (< 60 chars) e a 2ª linha começar com "Naqueles dias" ou "Naquele tempo"
        // removemos a 1ª linha porque o cabeçalho do App já tem o título.
        if (linhas[0].trim().length < 60) {
            textoLeitura = linhas.slice(1).join('\n');
        }
    }

    // 3. Aplica formatação dos números (versículos)
    let html = textoLeitura.replace(
        /(^|[.!?\n>]\s*)(\d+)\s+(?=[A-ZÀ-Ú"'])/gm, 
        '$1<sup style="font-size: 0.6em; font-weight: 800; color: var(--primary); vertical-align: super; margin-right: 2px;">$2</sup> '
    );
    
    html = html.replace(/<strong>(\d+)<\/strong>/g, '<sup style="font-size: 0.6em; font-weight: 800; color: var(--primary); vertical-align: super;">$1</sup>');
    
    return html;
};

export const removerAcentos = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const getRef = (d) => {
    if (!d) return "Referência";
    
    let conteudo = "";

    if (typeof d === "string") {
        conteudo = d;
    } else if (typeof d === "object") {
        conteudo = d.referencia || d.titulo || d.texto || "";
    }

    if (!conteudo) return "Referência";

    conteudo = conteudo.replace(/[\n\r]/g, " ").trim();

    // Se curto, é a referência certa (Ex: "2Sm 1,1-4")
    if (conteudo.length < 60) {
        return conteudo;
    }

    // Se longo, tenta pegar a primeira frase (Ex: "Início do livro de...")
    let primeiraParte = conteudo.split(/[\n\.]/)[0];
    
    // Se a primeira parte também for um textão (> 60), desiste e põe título genérico
    if (primeiraParte.length > 60) return "Liturgia da Palavra";

    return primeiraParte;
};

export const getText = (d) => {
    if (!d) return "Texto não disponível";
    return (typeof d === "object" && d.texto) ? d.texto : (typeof d === "string" ? d : "Texto não disponível");
};