import { 
    getFirestore, 
    collection, 
    addDoc, 
    deleteDoc, 
    onSnapshot, 
    doc, 
    updateDoc, 
    setDoc, 
    increment, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { app } from "../config/firebase-config.js";

const db = getFirestore(app);

// ==============================================================
// 1. MÓDULO: MURAL DE ORAÇÃO (Conectado aos dados ANTIGOS)
// ==============================================================

// Usamos "mural_oracoes" para recuperar o histórico antigo
const COLLECTION_MURAL = "mural_oracoes"; 

export const adicionarPedidoMural = async (nome, texto) => {
    const docRef = await addDoc(collection(db, COLLECTION_MURAL), {
        nome: nome,
        texto: texto,
        data: serverTimestamp(), // Compatível com data antiga
        rezaram: 0,             // Voltamos a usar 'rezaram' para manter padrão antigo
        contagemOracoes: 0      // Mantemos este por garantia
    });
    return docRef.id;
};

// Ler Últimas 24h
export const ouvirMural = (callback) => {
    const ontem = new Date();
    ontem.setHours(ontem.getHours() - 24);

    const q = query(
        collection(db, COLLECTION_MURAL),
        where("data", ">=", ontem),
        orderBy("data", "desc")
    );
    return onSnapshot(q, callback);
};

// Ler Todas (Histórico Completo)
export const ouvirMuralCompleto = (callback) => {
    // Busca até 100 pedidos para garantir que os antigos apareçam
    const q = query(collection(db, COLLECTION_MURAL), orderBy("data", "desc"), limit(100));
    return onSnapshot(q, callback);
};

export const deletarPedidoMural = async (id) => {
    await deleteDoc(doc(db, COLLECTION_MURAL, id));
};

// Rezar (Incrementar)
export const registrarOracao = async (id, valor) => {
    const docRef = doc(db, COLLECTION_MURAL, id);
    
    // Atualiza AMBOS os campos para garantir compatibilidade total
    await updateDoc(docRef, {
        rezaram: increment(valor),        // Campo antigo
        contagemOracoes: increment(valor) // Campo novo (backup)
    });
};

// ==============================================================
// 2. MÓDULO: AVISOS, LITURGIA E PROPÓSITO (Mantidos)
// ==============================================================

// Avisos
export const adicionarAviso = async (texto, dataExpiracao) => {
    await addDoc(collection(db, "avisos"), { texto, dataExpiracao, dataCriacao: new Date() });
};
export const deletarAviso = async (id) => { await deleteDoc(doc(db, "avisos", id)); };
export const ouvirAvisos = (callback) => {
    const hoje = new Date().toLocaleDateString("en-CA");
    const q = query(collection(db, "avisos"), where("dataExpiracao", ">=", hoje), orderBy("dataExpiracao", "asc"));
    return onSnapshot(q, callback);
};

// Liturgia (Contador)
export const atualizarContadorLeitura = async (incrementar) => {
    const hoje = new Date().toLocaleDateString("en-CA");
    const docRef = doc(db, "estatisticas", `leituras_${hoje}`);
    const valor = (typeof incrementar === 'number') ? incrementar : (incrementar ? 1 : -1);
    await setDoc(docRef, { contador: increment(valor), ultimaAtualizacao: new Date() }, { merge: true });
};
export const ouvirContador = (callback) => {
    const hoje = new Date().toLocaleDateString("en-CA");
    return onSnapshot(doc(db, "estatisticas", `leituras_${hoje}`), callback);
};

// Propósito
export const getPropositoMensal = async () => {
    try {
        const snap = await getDoc(doc(db, "config_geral", "proposito_mensal"));
        return snap.exists() ? snap.data() : null;
    } catch (e) { console.warn(e); return null; }
};
export const updatePropositoMensal = async (dados) => {
    await setDoc(doc(db, "config_geral", "proposito_mensal"), { ...dados, data_atualizacao: new Date().toISOString() }, { merge: true });
    return true;
};