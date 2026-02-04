export const initInstall = () => {
    const containerBtn = document.getElementById("container-instalar");
    const btnInstall = document.getElementById("btn-instalar-app");
    const legenda = document.querySelector(".legenda-instalar");
    
    let installPrompt = null;


    if (containerBtn) {
        containerBtn.style.display = "block"; 
    }
    
    if (btnInstall) {
        btnInstall.style.display = "flex"; 
    }


    if (legenda) {
        legenda.innerHTML = `
            <div style="margin-top: 10px; font-size: 0.75rem; opacity: 0.8;">
                <strong>Android / PC:</strong> Clique no botão acima.<br>
                <strong>iPhone (iOS):</strong> Toque em Compartilhar <span class="material-symbols-rounded" style="font-size: 1rem; vertical-align: middle;">ios_share</span> 
                e "Adicionar à Tela de Início" <span class="material-symbols-rounded" style="font-size: 1rem; vertical-align: middle;">add_box</span>
            </div>
        `;
    }


    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault(); 
        installPrompt = e; 
        console.log("✅ Instalação nativa disponível (Evento capturado).");
    });


    if (btnInstall) {
        btnInstall.addEventListener("click", async () => {
            if (installPrompt) {

                const result = await installPrompt.prompt();
                console.log(`Resultado da instalação: ${result.outcome}`);
                installPrompt = null;
            } else {

                alert("⚠️ Se a instalação não abrir automaticamente:\n\nNo Android/PC: Procure 'Instalar Aplicativo' no menu do navegador (três pontinhos).\n\nNo iPhone: Use a opção 'Compartilhar' > 'Adicionar à Tela de Início'.");
            }
        });
    }


    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone) || (window.matchMedia('(display-mode: standalone)').matches);
    
    if (isInStandaloneMode) {

        if (containerBtn) containerBtn.style.display = "none";
    }
};