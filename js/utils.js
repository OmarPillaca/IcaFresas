/*
 * utils.js — Funciones reutilizables para todas las páginas.
 * No toca localStorage directamente (eso es tarea de storage.js).
 */
window.ICAFRESA_UTILS = (() => {
  const formatPrice = (value) => {
    const config = window.ICAFRESA_STORAGE.getConfig();
    return `${config.moneda} ${Number(value || 0).toFixed(2)}`;
  };

  const parsePrice = (text) => {
    const match = String(text).match(/[\d.,]+/);
    if (!match) return 0;
    const normalized = match[0].replace(/,/g, "");
    return Number.parseFloat(normalized) || 0;
  };

  /* Escapa HTML para evitar inyección al renderizar datos guardados por el usuario. */
  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);

  /* Genera ids únicos simples para productos/toppings/cremas/pedidos. */
  const uid = (prefix) =>
    `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  /* Convierte un File seleccionado en dataURL (para guardar la imagen en localStorage). */
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  /* Notificación flotante breve. */
  let toastTimer = null;
  const toast = (message, type = "ok") => {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  };

  /* Grilla de sellos de la tarjeta de fidelidad (🍓 = con sello, ◌ = vacío). */
  const stampBar = (done, total = 10) => {
    let out = "";
    for (let i = 0; i < total; i += 1) out += i < done ? "🍓" : "◌";
    return out;
  };

  const getParam = (name) => new URLSearchParams(location.search).get(name);

  return {
    formatPrice,
    parsePrice,
    escapeHtml,
    uid,
    fileToDataUrl,
    toast,
    stampBar,
    getParam,
  };
})();
