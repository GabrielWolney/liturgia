export const setupClick = (id, fn) => {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
};

export const abrirModal = (id) => {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "flex";
};

export const fecharModais = () => {
    document.querySelectorAll(".modal").forEach((m) => (m.style.display = "none"));
};