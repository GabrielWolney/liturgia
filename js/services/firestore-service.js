import { db } from "../config/firebase-config.js";
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc, setDoc, increment } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- MURAL ---
export const adicionarPedidoMural = async (nome, texto) => {
    const novaRef = doc(collection(db, "mural_oracoes"));
    await setDoc(novaRef, {
        nome: nome,
        texto: texto,
        data: new Date(),
        rezaram: 0,
    });
    return novaRef.id; 
};

export const deletarPedidoMural = async (id) => {
    await deleteDoc(doc(db, "mural_oracoes", id));
};

export const ouvirMural = (callback) => {
    const ontem = new Date();
    ontem.setHours(ontem.getHours() - 24);
    const q = query(collection(db, "mural_oracoes"), where("data", ">", ontem), orderBy("data", "desc"));
    return onSnapshot(q, callback);
};

// --- AVISOS ---
export const adicionarAviso = async (texto, dataExpiracao) => {
    await addDoc(collection(db, "avisos"), {
        texto, 
        dataExpiracao, 
        dataCriacao: new Date()
    });
};

export const deletarAviso = async (id) => {
    await deleteDoc(doc(db, "avisos", id));
};

export const ouvirAvisos = (callback) => {
    const hojeLocal = new Date().toLocaleDateString("en-CA");
    const q = query(collection(db, "avisos"), where("dataExpiracao", ">=", hojeLocal), orderBy("dataExpiracao", "asc"));
    return onSnapshot(q, callback);
};

// --- ESTATÍSTICAS (CONTADOR DE LEITURAS) ---
export const atualizarContadorLeitura = async (incrementar) => {
    const hoje = new Date().toLocaleDateString("en-CA");
    const docRef = doc(db, "estatisticas", `leituras_${hoje}`);
    const valor = incrementar ? 1 : -1;
    await setDoc(docRef, { contador: increment(valor), ultimaAtualizacao: new Date() }, { merge: true });
};

export const ouvirContador = (callback) => {
    const hoje = new Date().toLocaleDateString("en-CA");
    return onSnapshot(doc(db, "estatisticas", `leituras_${hoje}`), callback);
};