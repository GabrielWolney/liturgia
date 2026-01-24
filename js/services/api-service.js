export const buscarDadosLiturgia = async () => {
    const controller = new AbortController();
    // Timeout de 3 segundos para não travar se a API estiver lenta
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch("https://liturgia.up.railway.app/", { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error("API Principal Falhou");
        return await response.json();
    } catch (error) {
        throw error;
    }
};