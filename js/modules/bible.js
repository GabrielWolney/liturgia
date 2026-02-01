import { bibliaCatolica } from "../data/bible-data.js"; 
import { removerAcentos } from "../utils/formatters.js";

let cacheBiblia = null;

// Carrega o JSON gigante da Bíblia apenas quando necessário
async function carregarBibliaLocal() {
  if (cacheBiblia) return cacheBiblia;
  try {
    const response = await fetch("./js/bibliaAveMaria.json");
    if (!response.ok) throw new Error("Arquivo não encontrado");
    cacheBiblia = await response.json();
    return cacheBiblia;
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar a Bíblia. Verifique sua conexão.");
    return null;
  }
}

export const alternarTestamento = (tipo) => {
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
    btn.style.fontSize = livro.nome.length > 11 ? "0.7rem" : "0.85rem";
    btn.innerText = livro.nome;
    btn.onclick = () => abrirModalCapitulo(livro);
    grid.appendChild(btn);
  });
}

const abrirModalCapitulo = (livroObj) => {
  const modal = document.getElementById("modalCapitulos");
  const titulo = document.getElementById("titulo-livro-selecionado");
  const input = document.getElementById("input-capitulo");
  const btnLer = document.getElementById("btn-ler-capitulo");

  if (titulo) titulo.innerText = livroObj.nome;
  if (input) input.value = "";
  if (modal) modal.style.display = "flex";

  // Clona o botão para limpar listeners antigos
  const novoBtn = btnLer.cloneNode(true);
  btnLer.parentNode.replaceChild(novoBtn, btnLer);

  novoBtn.onclick = async () => {
    const cap = input.value.trim();
    if (!cap || cap < 1) return alert("Capítulo inválido");
    await executarLeituraLocal(livroObj, cap);
  };
};

async function executarLeituraLocal(livroObj, capitulo) {
  const container = document.getElementById("leitura-biblia-container");
  const textoDiv = document.getElementById("leitura-texto");
  const tituloDiv = document.getElementById("leitura-titulo");

  document.getElementById("modalCapitulos").style.display = "none";
  container.style.display = "block";
  document.body.style.overflow = "hidden";
  textoDiv.innerHTML = "<div style='text-align:center; padding:20px;'>Carregando...</div>";

  try {
    const dados = await carregarBibliaLocal();
    if (!dados) throw new Error("Base vazia");

    let todosLivros = [].concat(dados.antigoTestamento || [], dados.novoTestamento || []);
    
    // --- MAPA DE CORREÇÃO MANUAL (AQUI ESTÁ A SOLUÇÃO) ---
    // Liga o 'slug' do botão ao 'nome' exato no JSON
    const mapaCorrecao = {
        "i-pedro": "I São Pedro",
        "ii-pedro": "II São Pedro",
        "i-joao": "I São João",
        "ii-joao": "II São João",
        "iii-joao": "III São João",
        "sao-judas": "São Judas",
        "sao-tiago": "São Tiago"
    };

    const nomeCorrigido = mapaCorrecao[livroObj.slug];
    const slugLimpo = livroObj.slug.replace(/-/g, " ").toLowerCase();
    const nomeLimpo = removerAcentos(livroObj.nome).toLowerCase();

    const livroEncontrado = todosLivros.find((l) => {
      // 1. Tenta bater pelo mapa manual (Prioridade para João e Pedro)
      if (nomeCorrigido && l.nome === nomeCorrigido) return true;

      // 2. Fallback: lógica padrão
      const nomeJson = removerAcentos(l.nome).toLowerCase();
      return nomeJson === slugLimpo || nomeJson === nomeLimpo || nomeJson.includes(slugLimpo);
    });

    if (!livroEncontrado) throw new Error("Livro não encontrado: " + livroObj.nome);

    // Tenta pegar o capítulo
    let capituloObj = livroEncontrado.capitulos[parseInt(capitulo) - 1];
    if (!capituloObj || capituloObj.capitulo != capitulo) {
        capituloObj = livroEncontrado.capitulos.find(c => c.capitulo == capitulo);
    }

    if (!capituloObj) throw new Error("Capítulo não encontrado");

    tituloDiv.innerText = `${livroEncontrado.nome} ${capitulo}`;
    
    textoDiv.innerHTML = capituloObj.versiculos.map(v => 
        `<p style="margin-bottom:10px; font-size: 1.1rem; text-align: justify;">
            <b style="color:var(--primary); font-size:0.8rem; margin-right:8px; vertical-align: super;">${v.versiculo}</b>
            ${v.texto}
        </p>`
    ).join("");
    
    container.scrollTo(0, 0);

  } catch (e) {
    console.error(e);
    alert(e.message);
    document.getElementById("leitura-biblia-container").style.display = "none";
    document.body.style.overflow = "auto";
  }
}

export const fecharLeitura = () => {
    document.getElementById("leitura-biblia-container").style.display = "none";
    document.body.style.overflow = "auto";
};