/*
 * admin.js — Panel de administrador.
 * CRUD de productos (con imagen por URL o archivo), toppings, cremas,
 * tarjetas de fidelidad (sellos por compra), pedidos y configuración general.
 */
(() => {
  const { formatPrice, escapeHtml, uid, fileToDataUrl, stampBar, toast } = window.ICAFRESA_UTILS;
  const storage = window.ICAFRESA_STORAGE;

  const $ = (selector) => document.querySelector(selector);

  let editProductoId = null;
  let editToppingId = null;
  let editCremaId = null;
  let editTarjetaId = null;
  let imagenActual = "";

  /* ---------- Sesión ---------- */

  const isLogged = () => window.ICAFRESA_STORAGE.read("sesionAdmin", 0) === 1;

  const renderSession = () => {
    $("#loginView").classList.toggle("hidden", isLogged());
    $("#panelView").classList.toggle("hidden", !isLogged());
    if (isLogged()) renderAll();
  };

  $("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const config = storage.getConfig();
    if ($("#loginUser").value.trim() === config.adminUsuario && $("#loginPass").value === config.adminClave) {
      storage.write("sesionAdmin", 1);
      renderSession();
      toast("Bienvenida(o), " + config.adminUsuario);
    } else {
      toast("Usuario o clave incorrectos", "error");
    }
  });

  $("#logoutBtn").addEventListener("click", () => {
    storage.write("sesionAdmin", 0);
    renderSession();
  });

  /* ---------- Pestañas ---------- */

  $("#adminTabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tab]");
    if (!button) return;
    const target = $(`#tab-${button.dataset.tab}`);
    if (!target) return;
    document.querySelectorAll("#adminTabs button").forEach((b) => b.classList.toggle("selected", b === button));
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("open"));
    target.classList.add("open");
  });

  /* ================= PRODUCTOS ================= */

  const renderProducts = () => {
    $("#productRows").innerHTML = storage
      .getProductos()
      .map(
        (p) => `
          <tr>
            <td><img class="thumb" src="${escapeHtml(p.imagen)}" alt="" /></td>
            <td><strong>${escapeHtml(p.nombre)}</strong><br /><small>${escapeHtml(p.descripcion || "")}</small></td>
            <td>${escapeHtml(p.categoria)}</td>
            <td>${formatPrice(p.precio)}</td>
            <td>
              ${p.disponible ? '<span class="badge">Disponible</span>' : '<span class="badge off">Oculto</span>'}
              ${p.agotado ? '<span class="badge soldout">Agotado</span>' : ""}
              ${p.etiqueta ? `<span class="badge">${escapeHtml(p.etiqueta)}</span>` : ""}
            </td>
            <td>
              <div class="row-actions">
                <button data-edit="${p.id}">Editar</button>
                <button data-toggle="${p.id}">${p.disponible ? "Ocultar" : "Activar"}</button>
                <button data-soldout="${p.id}">${p.agotado ? "Hay stock" : "Agotar"}</button>
                <button class="danger" data-del="${p.id}">Eliminar</button>
              </div>
            </td>
          </tr>`
      )
      .join("");
  };

  const fillCategoriaSelect = () => {
    $("#pCategoria").innerHTML = storage
      .getCategorias()
      .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join("");
  };

  const openProductModal = (id = null) => {
    editProductoId = id;
    fillCategoriaSelect();
    const form = $("#productForm");
    form.reset();
    imagenActual = "";

    if (id) {
      const p = storage.getProductoById(id);
      $("#productFormTitle").textContent = "EDITAR PRODUCTO";
      $("#productFormName").textContent = p.nombre;
      $("#pNombre").value = p.nombre;
      $("#pCategoria").value = p.categoria;
      $("#pDescripcion").value = p.descripcion || "";
      $("#pPrecio").value = p.precio;
      $("#pEtiqueta").value = p.etiqueta || "";
      $("#pImagenUrl").value = p.imagen.startsWith("data:") ? "" : p.imagen;
      $("#pPersonalizable").checked = !!p.personalizable;
      $("#pDisponible").checked = !!p.disponible;
      $("#pAgotado").checked = !!p.agotado;
      imagenActual = p.imagen;
    } else {
      $("#productFormTitle").textContent = "NUEVO PRODUCTO";
      $("#productFormName").textContent = "Producto";
      $("#pDisponible").checked = true;
    }
    $("#pPreview").src = imagenActual;
    $("#productOverlay").classList.add("open");
  };

  $("#newProduct").addEventListener("click", () => openProductModal());
  $("#closeProduct").addEventListener("click", () => $("#productOverlay").classList.remove("open"));

  $("#pImagenUrl").addEventListener("input", (event) => {
    imagenActual = event.target.value.trim();
    $("#pPreview").src = imagenActual;
  });

  $("#pImagenFile").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      imagenActual = await fileToDataUrl(file);
      $("#pPreview").src = imagenActual;
      $("#pImagenUrl").value = "";
      toast("Imagen cargada (se guarda en el navegador)");
    } catch {
      toast("No se pudo leer la imagen", "error");
    }
  });

  $("#productForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!imagenActual) {
      toast("Agrega una imagen (URL o archivo)", "error");
      return;
    }
    const productos = storage.getProductos();
    const datos = {
      nombre: $("#pNombre").value.trim(),
      categoria: $("#pCategoria").value,
      descripcion: $("#pDescripcion").value.trim(),
      precio: Number($("#pPrecio").value) || 0,
      imagen: imagenActual,
      etiqueta: $("#pEtiqueta").value.trim(),
      personalizable: $("#pPersonalizable").checked,
      disponible: $("#pDisponible").checked,
      agotado: $("#pAgotado").checked,
    };

    if (editProductoId) {
      const index = productos.findIndex((p) => p.id === editProductoId);
      productos[index] = { ...productos[index], ...datos };
    } else {
      productos.push({ id: uid("p"), ...datos });
    }
    storage.saveProductos(productos);
    $("#productOverlay").classList.remove("open");
    renderProducts();
    toast("Producto guardado ✅");
  });

  $("#productRows").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.dataset.edit || button.dataset.toggle || button.dataset.soldout || button.dataset.del;
    if (!id) return;

    if (button.dataset.edit) return openProductModal(id);

    const productos = storage.getProductos();
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    if (button.dataset.toggle) producto.disponible = !producto.disponible;
    if (button.dataset.soldout) producto.agotado = !producto.agotado;
    if (button.dataset.del) {
      if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return;
      storage.saveProductos(productos.filter((p) => p.id !== id));
      renderProducts();
      toast("Producto eliminado");
      return;
    }
    storage.saveProductos(productos);
    renderProducts();
  });

  /* ================= TOPPINGS ================= */

  const renderToppings = () => {
    $("#toppingRows").innerHTML = storage
      .getToppings()
      .map(
        (t) => `
          <tr>
            <td><strong>${escapeHtml(t.nombre)}</strong></td>
            <td>${formatPrice(t.precio)}</td>
            <td>${t.disponible ? '<span class="badge">Disponible</span>' : '<span class="badge off">No disponible</span>'}</td>
            <td>
              <div class="row-actions">
                <button data-edit="${t.id}">Editar</button>
                <button data-toggle="${t.id}">${t.disponible ? "Desactivar" : "Activar"}</button>
                <button class="danger" data-del="${t.id}">Eliminar</button>
              </div>
            </td>
          </tr>`
      )
      .join("");
  };

  const openToppingModal = (id = null) => {
    editToppingId = id;
    $("#toppingForm").reset();
    if (id) {
      const t = storage.getToppings().find((x) => x.id === id);
      $("#toppingFormName").textContent = t.nombre;
      $("#tNombre").value = t.nombre;
      $("#tPrecio").value = t.precio;
      $("#tDisponible").checked = !!t.disponible;
    } else {
      $("#toppingFormName").textContent = "Nuevo topping";
      $("#tDisponible").checked = true;
    }
    $("#toppingOverlay").classList.add("open");
  };

  $("#newTopping").addEventListener("click", () => openToppingModal());
  $("#closeTopping").addEventListener("click", () => $("#toppingOverlay").classList.remove("open"));

  $("#toppingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const toppings = storage.getToppings();
    const datos = {
      nombre: $("#tNombre").value.trim(),
      precio: Number($("#tPrecio").value) || 0,
      disponible: $("#tDisponible").checked,
    };
    if (editToppingId) {
      const index = toppings.findIndex((t) => t.id === editToppingId);
      toppings[index] = { ...toppings[index], ...datos };
    } else {
      toppings.push({ id: uid("t"), ...datos });
    }
    storage.saveToppings(toppings);
    $("#toppingOverlay").classList.remove("open");
    renderToppings();
    toast("Topping guardado ✅");
  });

  $("#toppingRows").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.dataset.edit || button.dataset.toggle || button.dataset.del;
    const toppings = storage.getToppings();
    const topping = toppings.find((t) => t.id === id);
    if (!topping) return;

    if (button.dataset.edit) return openToppingModal(id);
    if (button.dataset.del) {
      if (!confirm(`¿Eliminar "${topping.nombre}"?`)) return;
      storage.saveToppings(toppings.filter((t) => t.id !== id));
      renderToppings();
      toast("Topping eliminado");
      return;
    }
    topping.disponible = !topping.disponible;
    storage.saveToppings(toppings);
    renderToppings();
  });

  /* ================= CREMAS ================= */

  const renderCremas = () => {
    $("#cremaRows").innerHTML = storage
      .getCremas()
      .map(
        (c) => `
          <tr>
            <td><strong>${escapeHtml(c.nombre)}</strong></td>
            <td>${c.disponible ? '<span class="badge">Disponible</span>' : '<span class="badge off">No disponible</span>'}</td>
            <td>
              <div class="row-actions">
                <button data-edit="${c.id}">Editar</button>
                <button data-toggle="${c.id}">${c.disponible ? "Desactivar" : "Activar"}</button>
                <button class="danger" data-del="${c.id}">Eliminar</button>
              </div>
            </td>
          </tr>`
      )
      .join("");
  };

  const openCremaModal = (id = null) => {
    editCremaId = id;
    $("#cremaForm").reset();
    if (id) {
      const c = storage.getCremas().find((x) => x.id === id);
      $("#cremaFormName").textContent = c.nombre;
      $("#cNombre").value = c.nombre;
      $("#cDisponible").checked = !!c.disponible;
    } else {
      $("#cremaFormName").textContent = "Nueva crema";
      $("#cDisponible").checked = true;
    }
    $("#cremaOverlay").classList.add("open");
  };

  $("#newCrema").addEventListener("click", () => openCremaModal());
  $("#closeCrema").addEventListener("click", () => $("#cremaOverlay").classList.remove("open"));

  $("#cremaForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const cremas = storage.getCremas();
    const datos = {
      nombre: $("#cNombre").value.trim(),
      disponible: $("#cDisponible").checked,
    };
    if (editCremaId) {
      const index = cremas.findIndex((c) => c.id === editCremaId);
      cremas[index] = { ...cremas[index], ...datos };
    } else {
      cremas.push({ id: uid("c"), ...datos });
    }
    storage.saveCremas(cremas);
    $("#cremaOverlay").classList.remove("open");
    renderCremas();
    toast("Crema guardada ✅");
  });

  $("#cremaRows").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.dataset.edit || button.dataset.toggle || button.dataset.del;
    const cremas = storage.getCremas();
    const crema = cremas.find((c) => c.id === id);
    if (!crema) return;

    if (button.dataset.edit) return openCremaModal(id);
    if (button.dataset.del) {
      if (!confirm(`¿Eliminar "${crema.nombre}"?`)) return;
      storage.saveCremas(cremas.filter((c) => c.id !== id));
      renderCremas();
      toast("Crema eliminada");
      return;
    }
    crema.disponible = !crema.disponible;
    storage.saveCremas(cremas);
    renderCremas();
  });

  /* ================= FIDELIDAD (tarjetas con sellos) ================= */

  const SELLOS_META = 10; // fresas necesarias para el premio

  const renderFidelidad = () => {
    const tarjetas = storage
      .getTarjetas()
      .slice()
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    $("#tarjetaRows").innerHTML = tarjetas.length
      ? tarjetas
          .map((t) => {
            const sellos = Number(t.sellos || 0);
            const fecha = t.fecha ? new Date(t.fecha).toLocaleDateString() : "—";
            return `
              <tr>
                <td><strong>${escapeHtml(t.nombre || "—")}</strong></td>
                <td>${escapeHtml(t.telefono || "")}</td>
                <td>
                  <div class="stamp-cell">
                    <span class="stamp-icons">${stampBar(sellos, SELLOS_META)}</span>
                    <small>${sellos} / ${SELLOS_META}</small>
                  </div>
                </td>
                <td>${Number(t.compras || 0)}</td>
                <td>${Number(t.canjes || 0)}</td>
                <td>${fecha}</td>
                <td>
                  <div class="row-actions">
                    <button data-add="${t.id}">+ 1 fresa</button>
                    <button data-stamp="${t.id}">Quitar fresa</button>
                    <button data-edit="${t.id}">Editar</button>
                    ${sellos >= SELLOS_META ? `<button class="reward" data-canje="${t.id}">Canjear premio</button>` : ""}
                    <button class="danger" data-del="${t.id}">Eliminar</button>
                  </div>
                </td>
              </tr>`;
          })
          .join("")
      : '<tr><td colspan="7">Aún no hay tarjetas. Crea una con “+ Nueva tarjeta” o espera que una clienta se registre.</td></tr>';
  };

  const openTarjetaModal = (id = null) => {
    editTarjetaId = id;
    $("#tarjetaForm").reset();
    $("#tcClave").type = "password";
    $("#tcClaveVisible").checked = false;
    if (id) {
      const t = storage.getTarjetaById(id);
      $("#tarjetaFormName").textContent = t.nombre || "Tarjeta";
      $("#tcNombre").value = t.nombre || "";
      $("#tcTelefono").value = t.telefono || "";
      $("#tcClave").value = t.clave || "";
      $("#tcSellos").value = Number(t.sellos || 0);
      $("#tcCompras").value = Number(t.compras || 0);
    } else {
      $("#tarjetaFormName").textContent = "Nueva tarjeta";
      $("#tcSellos").value = 0;
      $("#tcCompras").value = 0;
    }
    $("#tarjetaOverlay").classList.add("open");
  };

  $("#newTarjeta").addEventListener("click", () => openTarjetaModal());
  $("#closeTarjeta").addEventListener("click", () => $("#tarjetaOverlay").classList.remove("open"));

  $("#tcClaveVisible").addEventListener("change", (event) => {
    $("#tcClave").type = event.target.checked ? "text" : "password";
  });

  $("#genClave").addEventListener("click", () => {
    $("#tcClave").value = Math.random().toString(36).slice(2, 8);
    $("#tcClave").type = "text";
    $("#tcClaveVisible").checked = true;
  });

  $("#tarjetaForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const telefono = $("#tcTelefono").value.trim();
    const tarjetas = storage.getTarjetas();

    if (tarjetas.some((t) => String(t.telefono).trim() === telefono && t.id !== editTarjetaId)) {
      toast("Ya existe una tarjeta con ese teléfono", "error");
      return;
    }

    const datos = {
      nombre: $("#tcNombre").value.trim(),
      telefono,
      clave: $("#tcClave").value.trim(),
      sellos: Math.max(0, Math.min(SELLOS_META, Number($("#tcSellos").value) || 0)),
      compras: Math.max(0, Number($("#tcCompras").value) || 0),
    };

    if (editTarjetaId) {
      const index = tarjetas.findIndex((t) => t.id === editTarjetaId);
      tarjetas[index] = { ...tarjetas[index], ...datos };
    } else {
      tarjetas.push({
        id: uid("tc"),
        ...datos,
        canjes: 0,
        fecha: new Date().toISOString(),
      });
    }
    storage.saveTarjetas(tarjetas);
    $("#tarjetaOverlay").classList.remove("open");
    renderFidelidad();
    toast("Tarjeta guardada 🍓");
  });

  $("#tarjetaRows").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.dataset.add || button.dataset.stamp || button.dataset.edit || button.dataset.canje || button.dataset.del;
    if (!id) return;

    if (button.dataset.edit) return openTarjetaModal(id);

    const tarjetas = storage.getTarjetas();
    const tarjeta = tarjetas.find((t) => t.id === id);
    if (!tarjeta) return;

    if (button.dataset.add) {
      tarjeta.sellos = Number(tarjeta.sellos || 0) + 1;
      tarjeta.compras = Number(tarjeta.compras || 0) + 1;
    }
    if (button.dataset.stamp) {
      tarjeta.sellos = Math.max(0, Number(tarjeta.sellos || 0) - 1);
    }
    if (button.dataset.canje) {
      tarjeta.sellos = Number(tarjeta.sellos || 0) - SELLOS_META;
      tarjeta.canjes = Number(tarjeta.canjes || 0) + 1;
      toast(`Premio canjeado por ${tarjeta.nombre || "la clienta"} 🎁`);
    }
    if (button.dataset.del) {
      if (!confirm(`¿Eliminar la tarjeta de "${tarjeta.nombre || tarjeta.telefono}"?`)) return;
      storage.saveTarjetas(tarjetas.filter((t) => t.id !== id));
      renderFidelidad();
      toast("Tarjeta eliminada");
      return;
    }
    storage.saveTarjetas(tarjetas);
    renderFidelidad();
  });

  /* ================= CONFIGURACIÓN / HORARIOS / LOCALES ================= */

  const renderConfig = () => {
    const horarios = storage.getHorarios();
    const config = storage.getConfig();

    $("#cfgAbierto").checked = !!horarios.abierto;
    $("#cfgHorario").value = horarios.texto || "";
    $("#cfgWhatsapp").value = config.whatsapp || "";
    $("#cfgNombre").value = config.nombre || "";

    $("#localeList").innerHTML = horarios.locales
      .map(
        (l, index) => `
          <div class="locale-item" data-index="${index}">
            <input data-field="nombre" value="${escapeHtml(l.nombre)}" placeholder="Nombre" />
            <input data-field="direccion" value="${escapeHtml(l.direccion)}" placeholder="Dirección" />
            <div class="locale-row">
              <input data-field="horario" value="${escapeHtml(l.horario)}" placeholder="Horario" />
              <input data-field="telefono" value="${escapeHtml(l.telefono)}" placeholder="Teléfono" />
            </div>
            <input data-field="whatsapp" value="${escapeHtml(l.whatsapp)}" placeholder="WhatsApp (solo número)" />
            <div class="row-actions">
              <label class="switch-row"><input type="checkbox" data-field="activo" ${l.activo ? "checked" : ""} /><span>Activo</span></label>
              <button class="danger" data-del-locale="${l.id}">Eliminar</button>
            </div>
          </div>`
      )
      .join("");

    $("#catList").innerHTML = storage
      .getCategorias()
      .map(
        (c, index) => `
          <div class="cat-item">
            <span>${escapeHtml(c)}</span>
            <button class="danger" data-del-cat="${index}">Quitar</button>
          </div>`
      )
      .join("");
  };

  $("#saveConfig").addEventListener("click", () => {
    const horarios = storage.getHorarios();
    horarios.abierto = $("#cfgAbierto").checked;
    horarios.texto = $("#cfgHorario").value.trim();

    const config = storage.getConfig();
    config.whatsapp = $("#cfgWhatsapp").value.trim();
    config.nombre = $("#cfgNombre").value.trim();

    storage.saveHorarios(horarios);
    storage.saveConfig(config);
    toast("Configuración guardada ✅");
  });

  $("#localeList").addEventListener("change", (event) => {
    const field = event.target.dataset.field;
    if (!field) return;
    const item = event.target.closest(".locale-item");
    const index = Number(item.dataset.index);
    const horarios = storage.getHorarios();
    horarios.locales[index][field] = field === "activo" ? event.target.checked : event.target.value;
    storage.saveHorarios(horarios);
  });

  $("#localeList").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-del-locale]");
    if (!button) return;
    const horarios = storage.getHorarios();
    horarios.locales = horarios.locales.filter((l) => l.id !== button.dataset.delLocale);
    storage.saveHorarios(horarios);
    renderConfig();
    toast("Local eliminado");
  });

  $("#newLocale").addEventListener("click", () => {
    const horarios = storage.getHorarios();
    horarios.locales.push({
      id: uid("l"),
      nombre: "Nuevo local",
      direccion: "",
      horario: "",
      telefono: "",
      whatsapp: "",
      activo: true,
    });
    storage.saveHorarios(horarios);
    renderConfig();
  });

  $("#catForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const nombre = $("#catName").value.trim();
    if (!nombre) return;
    const categorias = storage.getCategorias();
    if (!categorias.includes(nombre)) categorias.push(nombre);
    storage.saveCategorias(categorias);
    $("#catName").value = "";
    renderConfig();
    toast("Categoría agregada");
  });

  $("#catList").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-del-cat]");
    if (!button) return;
    const categorias = storage.getCategorias();
    categorias.splice(Number(button.dataset.delCat), 1);
    storage.saveCategorias(categorias);
    renderConfig();
  });

  /* ================= PEDIDOS ================= */

  const renderPedidos = () => {
    const pedidos = storage.getPedidos();
    $("#pedidoRows").innerHTML = pedidos.length
      ? pedidos
          .map((p) => {
            const fecha = new Date(p.fecha);
            return `
              <tr>
                <td>${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                <td><strong>${escapeHtml(p.nombre)}</strong><br /><small>${escapeHtml(p.telefono)}</small></td>
                <td>${p.modo === "delivery" ? "🛵 Delivery" : "🛍️ Recojo"}<br /><small>${escapeHtml(p.direccion || "")}</small></td>
                <td>${formatPrice(p.total)}</td>
                <td><span class="badge">${escapeHtml(p.estado)}</span></td>
                <td>
                  <div class="row-actions">
                    <button data-estado="${p.id}">Cambiar estado</button>
                    <button class="danger" data-del="${p.id}">Eliminar</button>
                  </div>
                </td>
              </tr>`;
          })
          .join("")
      : '<tr><td colspan="6">Aún no hay pedidos guardados.</td></tr>';
  };

  $("#pedidoRows").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const estados = ["nuevo", "preparando", "listo", "entregado", "cancelado"];

    if (button.dataset.estado) {
      const pedido = storage.getPedidos().find((p) => p.id === button.dataset.estado);
      const actual = estados.indexOf(pedido.estado);
      pedido.estado = estados[(actual + 1) % estados.length];
      storage.updatePedido(pedido.id, { estado: pedido.estado });
      renderPedidos();
      toast(`Estado: ${pedido.estado}`);
    }
    if (button.dataset.del) {
      storage.deletePedido(button.dataset.del);
      renderPedidos();
      toast("Pedido eliminado");
    }
  });

  /* ---------- Render general ---------- */

  function renderAll() {
    renderProducts();
    renderToppings();
    renderCremas();
    renderFidelidad();
    renderPedidos();
    renderConfig();
  }

  renderSession();
})();
