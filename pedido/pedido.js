/*
 * pedido.js — Lógica del checkout.
 * Modo delivery/recojo, resumen del carrito, guardado del pedido en
 * localStorage y envío del detalle por WhatsApp.
 */
(() => {
  const { formatPrice, escapeHtml, uid, toast } = window.ICAFRESA_UTILS;
  const storage = window.ICAFRESA_STORAGE;

  let modo = "delivery";

  /* ---------- Modo delivery / recojo ---------- */

  const renderMode = () => {
    document.querySelectorAll("#deliveryMode button").forEach((button) => {
      button.classList.toggle("picked", button.dataset.mode === modo);
    });
    document.getElementById("direccionField").classList.toggle("hidden", modo !== "delivery");
    document.getElementById("localField").classList.toggle("hidden", modo !== "recojo");
  };

  document.querySelectorAll("#deliveryMode button").forEach((button) => {
    button.addEventListener("click", () => {
      modo = button.dataset.mode;
      renderMode();
    });
  });

  /* ---------- Locales de recojo ---------- */

  const fillLocales = () => {
    const select = document.getElementById("fLocal");
    const locales = storage.getHorarios().locales.filter((l) => l.activo);
    select.innerHTML = locales
      .map((l) => `<option value="${l.id}">${escapeHtml(l.nombre)} — ${escapeHtml(l.direccion)}</option>`)
      .join("");
  };

  /* ---------- Resumen del pedido ---------- */

  const cartItems = () => storage.getCarrito();

  const renderSummary = () => {
    const items = cartItems();
    const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    const container = document.getElementById("orderSummary");

    container.innerHTML = items.length
      ? items
          .map(
            (i) => `
              <div class="line">
                <span>${i.cantidad} x ${escapeHtml(i.nombre)}</span>
                <b>${formatPrice(i.precio * i.cantidad)}</b>
              </div>`
          )
          .join("") +
        `<div class="line total"><span>Total</span><strong>${formatPrice(total)}</strong></div>`
      : '<p class="cart-empty">Tu carrito está vacío. <a href="../productos/productos.html">Ver el menú →</a></p>';

    document.getElementById("cartBadge").textContent = items.reduce((t, i) => t + i.cantidad, 0);
  };

  /* ---------- Validación y construcción del pedido ---------- */

  const buildOrder = () => {
    const items = cartItems();
    if (!items.length) {
      toast("Tu carrito está vacío", "error");
      return null;
    }
    const nombre = document.getElementById("fNombre").value.trim();
    const telefono = document.getElementById("fTelefono").value.trim();
    if (!nombre || !telefono) {
      toast("Completa nombre y teléfono", "error");
      return null;
    }
    const direccion = document.getElementById("fDireccion").value.trim();
    if (modo === "delivery" && !direccion) {
      toast("Escribe tu dirección para el delivery", "error");
      return null;
    }

    const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    const locales = storage.getHorarios().locales;
    const localElegido = storage.read("localElegido", null);
    const local = locales.find((l) => l.id === localElegido) || locales[0];

    return {
      id: uid("ord-"),
      fecha: new Date().toISOString(),
      modo,
      nombre,
      telefono,
      direccion: modo === "delivery" ? direccion : "",
      localId: modo === "recojo" ? document.getElementById("fLocal").value : local?.id,
      nota: document.getElementById("fNota").value.trim(),
      items: items.map((i) => ({
        nombre: i.nombre,
        precio: i.precio,
        cantidad: i.cantidad,
        opciones: i.opciones,
      })),
      total: Number(total.toFixed(2)),
      estado: "nuevo",
    };
  };

  /* ---------- Enviar por WhatsApp ---------- */

  const sendWhatsapp = () => {
    const pedido = buildOrder();
    if (!pedido) return;

    const config = storage.getConfig();
    const lineas = pedido.items
      .map((i) => `• ${i.cantidad} x ${i.nombre} — ${formatPrice(i.precio * i.cantidad)}`)
      .join("\n");

    const texto = [
      `¡Hola ${config.nombre}! Quiero hacer un pedido 🍓`,
      `Modo: ${pedido.modo === "delivery" ? "Delivery" : "Recojo en local"}`,
      `Nombre: ${pedido.nombre}`,
      `Teléfono: ${pedido.telefono}`,
      pedido.modo === "delivery" ? `Dirección: ${pedido.direccion}` : `Local: ${pedido.localId}`,
      pedido.nota ? `Nota: ${pedido.nota}` : "",
      "",
      lineas,
      `TOTAL: ${formatPrice(pedido.total)}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  /* ---------- Guardar pedido (demo local) ---------- */

  const saveOrder = () => {
    const pedido = buildOrder();
    if (!pedido) return;
    storage.savePedido(pedido);

    /* Fidelidad: si hay una tarjeta con sesión activa, suma 1 fresa 🍓 */
    const sesion = storage.read("sesionTarjeta", null);
    const tarjeta = sesion ? storage.getTarjetaById(sesion.id) : null;
    if (tarjeta) {
      const actualizada = storage.addSello(tarjeta.id);
      const sellos = Number(actualizada?.sellos || 0);
      toast(
        sellos >= 10
          ? "¡Pedido guardado! Llegaste a 10 fresas 🎁 canjea tu premio"
          : `Pedido guardado ✅ +1 fresa 🍓 (llevas ${sellos})`
      );
    } else {
      toast("Pedido guardado ✅ Será atendido por el local");
    }

    storage.clearCarrito();
    renderSummary();
  };

  document.getElementById("sendWhatsapp").addEventListener("click", sendWhatsapp);
  document.getElementById("saveOrder").addEventListener("click", saveOrder);

  /* ---------- Init ---------- */

  renderMode();
  fillLocales();
  renderSummary();
})();
