export const buscarDadosLiturgia = async () => {
    const controller = new AbortController();
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