export const initInstall = () => {
    const containerBtn = document.getElementById("container-instalar");
    const btnInstall = document.getElementById("btn-instalar-app");
    const legenda = document.querySelector(".legenda-instalar");
    
    let installPrompt = null;

    // ======================================================
    // 1. VISIBILIDADE FORÇADA (Aparece para todos)
    // ======================================================
    if (containerBtn) {
        containerBtn.style.display = "block"; // Mostra o container inteiro
    }
    
    if (btnInstall) {
        btnInstall.style.display = "flex"; // Garante que o botão apareça
    }

    // Atualiza o texto para mostrar instruções para TODOS os casos
    if (legenda) {
        legenda.innerHTML = `
            <div style="margin-top: 10px; font-size: 0.75rem; opacity: 0.8;">
                <strong>Android / PC:</strong> Clique no botão acima.<br>
                <strong>iPhone (iOS):</strong> Toque em Compartilhar <span class="material-symbols-rounded" style="font-size: 1rem; vertical-align: middle;">ios_share</span> 
                e "Adicionar à Tela de Início" <span class="material-symbols-rounded" style="font-size: 1rem; vertical-align: middle;">add_box</span>
            </div>
        `;
    }

    // ======================================================
    // 2. CAPTURA DO EVENTO (Chrome/Android)
    // ======================================================
    // O navegador avisa: "Ei, posso instalar nativamente!"
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault(); // Impede o banner automático padrão
        installPrompt = e;  // Guarda a "chave" para instalar no clique
        console.log("✅ Instalação nativa disponível (Evento capturado).");
    });

    // ======================================================
    // 3. CLIQUE DO BOTÃO
    // ======================================================
    if (btnInstall) {
        btnInstall.addEventListener("click", async () => {
            if (installPrompt) {
                // CENÁRIO 1: Navegador autorizou instalação nativa
                const result = await installPrompt.prompt();
                console.log(`Resultado da instalação: ${result.outcome}`);
                installPrompt = null; // Limpa o evento usado
            } else {
                // CENÁRIO 2: iPhone ou Navegador ainda não carregou o evento
                // Mostra um alerta simples orientando o usuário
                alert("⚠️ Se a instalação não abrir automaticamente:\n\nNo Android/PC: Procure 'Instalar Aplicativo' no menu do navegador (três pontinhos).\n\nNo iPhone: Use a opção 'Compartilhar' > 'Adicionar à Tela de Início'.");
            }
        });
    }

    // ======================================================
    // 4. SE JÁ ESTIVER INSTALADO (Opcional)
    // ======================================================
    // Verifica se o site já está aberto como aplicativo
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone) || (window.matchMedia('(display-mode: standalone)').matches);
    
    if (isInStandaloneMode) {
        // Se já está instalado, aí sim podemos esconder para limpar a tela
        if (containerBtn) containerBtn.style.display = "none";
    }
};