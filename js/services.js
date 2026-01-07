import { messaging, db } from "./firebase-config.js";
import { getToken } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export const configurarNotificacoes = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BGj3cGIxl4_ysRQ5iXyazj8_gpMTe0_CW39i5O4gaqptTx-TlIQrxdAlO4SWBxGI8Pd9T4KuO-QSkqJp0MARLYg",
      });

      if (token) {
        console.log("Token gerado:", token);
        await setDoc(doc(db, "tokens_notificacao", token), {
          token: token,
          ultimoAcesso: new Date(),
        });
      }
    }
  } catch (err) {
    console.warn("Aviso: Notificações não configuradas. Verifique se está em HTTPS ou localhost.");
  }
};

export const buscarDadosApi = async () => {
  const url = "https://liturgia.up.railway.app/";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erro na rede");
  return await response.json();
};