import { auth, db } from "../config/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { abrirModal } from "../utils/dom-utils.js";

export const inicializarAdmin = () => {
    // Configura o botão de login
    const btnLogin = document.getElementById("btn-fazer-login");
    if (btnLogin) {
        btnLogin.onclick = async () => {
            const e = document.getElementById("login-email").value;
            const s = document.getElementById("login-senha").value;
            const originalText = btnLogin.innerText;

            try {
                btnLogin.innerText = "Verificando...";
                btnLogin.disabled = true;
                await signInWithEmailAndPassword(auth, e, s);
                document.getElementById("modalLogin").style.display = "none";
                abrirModal("modalAdminAvisos");
                gerenciarAvisosPainel();
            } catch (err) {
                alert("Acesso negado: Verifique seu e-mail e senha.");
            } finally {
                btnLogin.innerText = originalText;
                btnLogin.disabled = false;
            }
        };
    }

    // Configura o botão de salvar aviso
    const btnSalvar = document.getElementById("btn-salvar-aviso");
    if (btnSalvar) {
        btnSalvar.onclick = async () => {
            const inp = document.getElementById("novo-aviso-texto");
            const dataExp = document.getElementById("aviso-data-expiracao");
            if (!inp.value || !dataExp.value) return alert("Preencha o texto e a data!");

            try {
                await addDoc(collection(db, "avisos"), {
                    texto: inp.value,
                    dataExpiracao: dataExp.value,
                    dataCriacao: new Date(),
                });
                inp.value = "";
                alert("Aviso publicado!");
            } catch (e) {
                alert("Erro ao salvar aviso.");
            }
        };
    }
};

const gerenciarAvisosPainel = () => {
    const listaAdmin = document.getElementById("meus-avisos-lista");
    if (!listaAdmin) return;
    
    const hojeLocal = new Date().toLocaleDateString("en-CA");
    const q = query(collection(db, "avisos"), where("dataExpiracao", ">=", hojeLocal), orderBy("dataExpiracao", "asc"));

    onSnapshot(q, (snapshot) => {
        listaAdmin.innerHTML = "<h4 style='margin: 15px 0 10px; font-size:0.9rem;'>Avisos Ativos:</h4>";
        if (snapshot.empty) {
            listaAdmin.innerHTML += "<p style='font-size:0.8rem; color:gray;'>Nenhum aviso.</p>";
            return;
        }
        
        snapshot.forEach((documento) => {
            const dados = documento.data();
            const item = document.createElement("div");
            item.className = "item-admin-aviso";
            item.innerHTML = `
                <div style="flex: 1; padding-right: 10px;">
                    <p style="font-size: 0.85rem; font-weight: 600; margin: 0; color:var(--text);">${dados.texto}</p>
                    <small style="color: var(--muted);">Expira em: ${dados.dataExpiracao}</small>
                </div>
                <button class="btn-delete-aviso" data-id="${documento.id}"><span class="material-symbols-rounded">delete</span></button>`;
            listaAdmin.appendChild(item);
        });

        // Adiciona eventos de delete
        listaAdmin.querySelectorAll(".btn-delete-aviso").forEach((btn) => {
            btn.onclick = async (e) => {
                const idAviso = e.currentTarget.getAttribute("data-id");
                if (confirm("Remover este aviso?")) {
                    try {
                        await deleteDoc(doc(db, "avisos", idAviso));
                    } catch (err) {
                        alert("Erro ao excluir.");
                    }
                }
            };
        });
    });
};