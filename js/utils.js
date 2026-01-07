export const configurarData = () => {
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

export const obterMisterioDoDia = () => {
  const diaSemana = new Date().getDay();
  const misterios = {
    0: { titulo: "Mistérios Gloriosos", desc: "Ressurreição, Ascensão, Vinda do Espírito Santo, Assunção e Coroação de Maria." },
    1: { titulo: "Mistérios Gozosos", desc: "Anunciação, Visitação, Nascimento de Jesus, Apresentação e Encontro no Templo." },
    2: { titulo: "Mistérios Dolorosos", desc: "Agonia no Horto, Flagelação, Coroação de Espinhos, Caminho do Calvário e Crucificação." },
    3: { titulo: "Mistérios Gloriosos", desc: "Ressurreição, Ascensão, Vinda do Espírito Santo, Assunção e Coroação de Maria." },
    4: { titulo: "Mistérios Luminosos", desc: "Batismo, Bodas de Caná, Anúncio do Reino, Transfiguração e Instituição da Eucaristia." },
    5: { titulo: "Mistérios Dolorosos", desc: "Agonia no Horto, Flagelação, Coroação de Espinhos, Caminho do Calvário e Crucificação." },
    6: { titulo: "Mistérios Gozosos", desc: "Anunciação, Visitação, Nascimento de Jesus, Apresentação e Encontro no Templo." },
  };
  return misterios[diaSemana];
};

export const setupClick = (id, fn) => {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
};