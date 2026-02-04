
export const inicializarExame = () => {
    const checkboxes = document.querySelectorAll(".check-roxo");
    

    const salvo = JSON.parse(localStorage.getItem("meu_exame_consciencia") || "{}");

    checkboxes.forEach((chk, index) => {

        const id = `pecado_${index}`;
        chk.setAttribute("data-id", id);


        if (salvo[id]) {
            chk.checked = true;
        }


        chk.addEventListener("change", () => {
            const estadoAtual = JSON.parse(localStorage.getItem("meu_exame_consciencia") || "{}");
            
            if (chk.checked) {
                estadoAtual[id] = true;
            } else {
                delete estadoAtual[id];
            }
            
            localStorage.setItem("meu_exame_consciencia", JSON.stringify(estadoAtual));
        });
    });
};

export const limparExame = () => {
    if (confirm("Deseja desmarcar todos os itens?")) {

        document.querySelectorAll(".check-roxo").forEach((c) => (c.checked = false));

        document.querySelectorAll("details.exame-grupo").forEach((d) => d.removeAttribute("open"));

        localStorage.removeItem("meu_exame_consciencia");
    }
};