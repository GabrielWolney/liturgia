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
  // Domingo e Quarta-feira
  0: { 
    titulo: "Mistérios Gloriosos", 
    desc: "1. Ressurreição de Jesus (Jo 20,1-18)\n2. Ascensão de Jesus ao Céu (Lc 24,50-53)\n3. Vinda do Espírito Santo (At 2,1-13)\n4. Assunção de Maria ao Céu (Ap 12, 13-14)\n5. Coroação de Maria Rainha (Ap 12,1-2)",
    meditacao: "Neste dia, pedimos a graça da esperança e de um coração voltado para o Céu."
  },
  3: { 
    titulo: "Mistérios Gloriosos", 
    desc: "1. Ressurreição de Jesus (Mt 28,1-10)\n2. Ascensão de Jesus ao Céu (Lc 24,50-53)\n3. Vinda do Espírito Santo (At 2,1-4)\n4. Assunção de Maria ao Céu (Sl 44)\n5. Coroação de Maria Rainha (Ap 12,1)",
    meditacao: "Neste dia, pedimos a graça da esperança e de um coração voltado para o Céu."
  },
  
  // Segunda-feira e Sábado
  1: { 
    titulo: "Mistérios Gozosos", 
    desc: "1. Anunciação do Arcanjo Gabriel  (Lc 1,26-38)\n2. Visitação de Maria a Isabel (Lc 1,39-45)\n3. Nascimento de Jesus (Lc 2,1-21)\n4. Apresentação no Templo (Lc 2,22-35)\n5. Encontro de Jesus no Templo (Lc 2,41-52)",
    meditacao: "Neste dia, meditamos sobre a alegria do 'Sim' e a humildade de servir com amor."
  },
  6: { 
    titulo: "Mistérios Gozosos", 
    desc: "1. Anunciação do Arcanjo Gabriel  (Lc 1,26-38)\n2. Visitação de Maria a Isabel (Lc 1,39-45)\n3. Nascimento de Jesus (Lc 2,1-21)\n4. Apresentação no Templo (Lc 2,22-35)\n5. Encontro de Jesus no Templo (Lc 2,41-52)",
    meditacao: "Neste dia, meditamos sobre a alegria do 'Sim' e a humildade de servir com amor."
  },
  
  // Terça e Sexta-feira
  2: { 
    titulo: "Mistérios Dolorosos", 
    desc: "1. Agonia de Jesus no Horto (Mt 26,36-46)\n2. Flagelação de Jesus (Mt 27,11-26)\n3. Coroação de Espinhos (Mt 27,27-31)\n4. Jesus carrega a Cruz (Jo 19,17)\n5. Crucificação e Morte (Jo 19,17-30)",
    meditacao: "Neste dia, pedimos coragem para carregar nossas cruzes e um coração arrependido."
  },
  5: { 
    titulo: "Mistérios Dolorosos", 
    desc: "1. Agonia de Jesus no Horto (Mt 26,36-46)\n2. Flagelação de Jesus (Mt 27,11-26)\n3. Coroação de Espinhos (Mt 27,27-31)\n4. Jesus carrega a Cruz (Jo 19,17)\n5. Crucificação e Morte (Jo 19,17-30)",
    meditacao: "Neste dia, pedimos coragem para carregar nossas cruzes e um coração arrependido."
  },
  
  // Quinta-feira
  4: { 
    titulo: "Mistérios Luminosos", 
    desc: "1. Batismo de Jesus no Jordão (Mt 3,13-17)\n2. Auto-revelação nas Bodas de Caná (Jo 2,1-12)\n3. Anúncio do Reino de Deus (Mc 1,14-15)\n4. Transfiguração de Jesus (Lc 9,28-36)\n5. Instituição da Eucaristia (Mt 26,26-28)",
    meditacao: "Neste dia, refletimos sobre a luz de Cristo que nos guia à conversão e à Eucaristia."
  }
};
  return misterios[diaSemana];
};

export const setupClick = (id, fn) => {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
};