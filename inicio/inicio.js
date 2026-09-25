/*
 * inicio.js — Lógica de la página de inicio.
 * Renderiza favoritos, promo destacada, locales y el estado del local
 * leyendo todo desde ICAFRESA_STORAGE.
 */
(() => {
  const { formatPrice, escapeHtml, stampBar, toast } = window.ICAFRESA_UTILS;
  const storage = window.ICAFRESA_STORAGE;

  /* ---------- Badge del carrito en el header ---------- */

  const updateCartBadge = () => {
    const badge = document.getElementById("cartBadge");
    const items = storage.getCarrito();
    badge.textContent = items.reduce((total, item) => total + item.cantidad, 0);
  };

  /* ---------- Estado del local (abierto / cerrado) ---------- */

  const renderStoreStatus = () => {
    const horarios = storage.getHorarios();
    const button = document.getElementById("storeStatus");
    button.classList.toggle("is-closed", !horarios.abierto);
    button.querySelector(".status-label").textContent = horarios.abierto ? "Abierto" : "Cerrado";
    document.getElementById("storeHours").textContent = horarios.texto;
  };

  /* ---------- Favoritos (hasta 4 productos destacados) ---------- */

  const renderFeatured = () => {
    const grid = document.getElementById("featuredGrid");
    const productos = storage
      .getProductos()
      .filter((p) => p.disponible && !p.agotado && p.etiqueta)
      .slice(0, 4);

    grid.innerHTML = productos.length
      ? productos
          .map(
            (p) => `
              <article class="product">
                <div class="picture">
                  <img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" />
                  ${p.etiqueta ? `<span>${escapeHtml(p.etiqueta)}</span>` : ""}
                </div>
                <div class="pbody">
                  <small>${escapeHtml(p.categoria)}</small>
                  <h3>${escapeHtml(p.nombre)}</h3>
                  <div>
                    <strong>${formatPrice(p.precio)}</strong>
                    <a href="../productos/productos.html?cat=${encodeURIComponent(p.categoria)}">Pedir +</a>
                  </div>
                </div>
              </article>`
          )
          .join("")
      : '<p class="empty-note">Aún no hay productos destacados. Asígnales una etiqueta desde el panel.</p>';
  };

  /* ---------- Promo destacada (primera promo activa) ---------- */

  const renderPromo = () => {
    const promo = storage.getProductos().find((p) => p.categoria === "Promos" && p.disponible && !p.agotado);
    const card = document.getElementById("promoCard");
    card.innerHTML = promo
      ? `
        <span>🍓</span>
        <p>${escapeHtml(promo.nombre.toUpperCase())}</p>
        <strong>${escapeHtml(promo.descripcion)}</strong>
        <b>${formatPrice(promo.precio)}</b>`
      : `
        <span>🍓</span>
        <p>COMBO ANTOJITO</p>
        <strong>Pronto nuevas promos</strong>
        <b>—</b>`;
  };

  /* ---------- Locales ---------- */

  const renderPlaces = () => {
    const grid = document.getElementById("placeGrid");
    const locales = storage.getHorarios().locales;
    const seleccionado = storage.read("localElegido", null) || locales[0]?.id;

    grid.innerHTML = locales
      .map(
        (l) => `
          <article class="${l.id === seleccionado ? "chosen" : ""}">
            <div class="place-icon">🍓</div>
            <h3>${escapeHtml(l.nombre)}</h3>
            <p>⌖ ${escapeHtml(l.direccion)}</p>
            <p>◷ ${escapeHtml(l.horario)}</p>
            <p>☎ ${escapeHtml(l.telefono)}</p>
            <div>
              <a href="https://wa.me/${l.whatsapp}" target="_blank" rel="noreferrer">WhatsApp</a>
              <a href="https://maps.google.com/?q=${encodeURIComponent(l.direccion)}" target="_blank" rel="noreferrer">Cómo llegar</a>
            </div>
            <button type="button" data-local="${l.id}" class="${l.id === seleccionado ? "selected" : ""}">
              ${l.id === seleccionado ? "✓ Local seleccionado" : "Elegir este local"}
            </button>
          </article>`
      )
      .join("");

    grid.querySelectorAll("button[data-local]").forEach((button) => {
      button.addEventListener("click", () => {
        storage.write("localElegido", button.dataset.local);
        renderPlaces();
        toast("Local seleccionado");
      });
    });
  };

  /* ---------- Tarjeta de fidelidad (login por teléfono + clave) ---------- */

  const SELLOS_META = 10; // fresas necesarias para el premio

  const sesionTarjeta = () => storage.read("sesionTarjeta", null);

  const renderLoyalty = () => {
    const sesion = sesionTarjeta();
    const tarjeta = sesion ? storage.getTarjetaById(sesion.id) : null;

    document.getElementById("loyaltyLogout").classList.toggle("hidden", !tarjeta);
    document.getElementById("loyaltyCta").textContent = tarjeta ? "Ver mi tarjeta →" : "Ingresar / Crear tarjeta →";
    document.querySelector(".loyalty-card").classList.toggle("is-active", !!tarjeta);

    if (tarjeta) {
      const sellos = Number(tarjeta.sellos || 0);
      document.getElementById("loyaltyCardTitle").innerHTML = `Hola, ${escapeHtml(tarjeta.nombre || "clienta")} 🍓`;
      document.getElementById("stampBar").textContent = stampBar(sellos, SELLOS_META).split("").join(" ");
      document.getElementById("stampCounter").textContent =
        sellos >= SELLOS_META
          ? `¡${sellos} de ${SELLOS_META} sellos! Canjea tu premio 🎁`
          : `${sellos} de ${SELLOS_META} sellos · te faltan ${SELLOS_META - sellos}`;
    } else {
      document.getElementById("loyaltyCardTitle").innerHTML = "Tu próxima fresa<br />está más cerca";
      document.getElementById("stampBar").textContent = stampBar(0, SELLOS_META).split("").join(" ");
      document.getElementById("stampCounter").textContent = "Ingresa para ver tus sellos";
    }
  };

  document.getElementById("loyaltyCta").addEventListener("click", (event) => {
    const sesion = sesionTarjeta();
    const tarjeta = sesion ? storage.getTarjetaById(sesion.id) : null;
    if (!tarjeta) return; // abre el modal de login normalmente
    event.preventDefault(); // ya tiene sesión: solo muestra su tarjeta
    renderLoyalty();
    toast(`Hola ${tarjeta.nombre || "clienta"}, llevas ${Number(tarjeta.sellos || 0)} fresas 🍓`);
  });

  const setAuthTab = (isLogin) => {
    document.getElementById("tabIngresar").classList.toggle("selected", isLogin);
    document.getElementById("tabCrear").classList.toggle("selected", !isLogin);
    document.getElementById("loginTarjetaForm").classList.toggle("hidden", !isLogin);
    document.getElementById("registroForm").classList.toggle("hidden", isLogin);
  };

  document.getElementById("tabIngresar").addEventListener("click", () => setAuthTab(true));
  document.getElementById("tabCrear").addEventListener("click", () => setAuthTab(false));

  /* Iniciar sesión con tarjeta existente */
  document.getElementById("loginTarjetaForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const telefono = document.getElementById("loginTelefono").value.trim();
    const clave = document.getElementById("loginClave").value;
    if (!telefono || !clave) {
      toast("Completa teléfono y clave", "error");
      return;
    }
    const tarjeta = storage.getTarjetas().find((t) => String(t.telefono).trim() === telefono);
    if (!tarjeta || String(tarjeta.clave || "") !== clave) {
      toast("Teléfono o clave incorrectos", "error");
      return;
    }
    storage.write("sesionTarjeta", { id: tarjeta.id, telefono: tarjeta.telefono });
    document.getElementById("loginTarjetaForm").reset();
    location.hash = "";
    renderLoyalty();
    toast(`¡Hola, ${tarjeta.nombre || "clienta"}! 🍓`);
  });

  /* Crear tarjeta nueva */
  document.getElementById("registroForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const nombre = document.getElementById("loyaltyName").value.trim();
    const telefono = document.getElementById("loyaltyPhone").value.trim();
    const clave = document.getElementById("loyaltyClave").value;
    if (!nombre || !telefono || !clave) {
      toast("Completa todos los campos", "error");
      return;
    }
    if (storage.getTarjetas().some((t) => String(t.telefono).trim() === telefono)) {
      toast("Ya existe una tarjeta con ese teléfono. Ingresa con tu clave.", "error");
      return;
    }
    const tarjeta = storage.upsertTarjeta({ nombre, telefono, clave });
    storage.write("sesionTarjeta", { id: tarjeta.id, telefono: tarjeta.telefono });
    document.getElementById("registroForm").reset();
    location.hash = "";
    renderLoyalty();
    toast("¡Tarjeta creada! 🍓");
  });

  /* Cerrar sesión de la tarjeta */
  document.getElementById("loyaltyLogout").addEventListener("click", () => {
    storage.write("sesionTarjeta", null);
    renderLoyalty();
    toast("Sesión cerrada");
  });

  /* ---------- Init ---------- */

  updateCartBadge();
  renderStoreStatus();
  renderFeatured();
  renderPromo();
  renderPlaces();
  renderLoyalty();
})();
