
const limparComentario = (texto) => {

    const iniciosLiturgicos = [
        "Leitura d",     
        "Início d",      
        "Proclamação d",  
        "Naqueles dias",  
        "Naquele tempo"   
    ];

    let menorIndice = texto.length;
    let encontrou = false;

    iniciosLiturgicos.forEach(termo => {
        const idx = texto.indexOf(termo);

        if (idx !== -1 && idx < menorIndice) {
            menorIndice = idx;
            encontrou = true;
        }
    });


    if (encontrou && menorIndice > 5) {
        return texto.substring(menorIndice);
    }

    return texto;
};


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
    

    textoLeitura = limparComentario(textoLeitura);


    let linhas = textoLeitura.split('\n');
    if (linhas.length > 1) {

        if (linhas[0].trim().length < 60) {
            textoLeitura = linhas.slice(1).join('\n');
        }
    }


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


    if (conteudo.length < 60) {
        return conteudo;
    }


    let primeiraParte = conteudo.split(/[\n\.]/)[0];
    

    if (primeiraParte.length > 60) return "Liturgia da Palavra";

    return primeiraParte;
};

export const getText = (d) => {
    if (!d) return "Texto não disponível";
    return (typeof d === "object" && d.texto) ? d.texto : (typeof d === "string" ? d : "Texto não disponível");
};