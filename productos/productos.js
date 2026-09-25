/*
 * productos.js — Lógica del menú.
 * Filtros por categoría, búsqueda, carrito persistente en localStorage
 * y modal de personalización (tamaño, crema y toppings).
 */
(() => {
  const { formatPrice, escapeHtml, parsePrice, toast } = window.ICAFRESA_UTILS;
  const storage = window.ICAFRESA_STORAGE;

  let filtroActual = "Todos";
  let busqueda = "";
  let productoActual = null;
  let extraTamaño = 0;

  /* ---------- Filtros ---------- */

  const renderFilters = () => {
    const categorias = ["Todos", ...storage.getCategorias()];
    const container = document.getElementById("filters");
    container.innerHTML = categorias
      .map(
        (cat) =>
          `<button type="button" data-cat="${escapeHtml(cat)}" class="${cat === filtroActual ? "selected" : ""}">${escapeHtml(cat)}</button>`
      )
      .join("");

    container.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        filtroActual = button.dataset.cat;
        renderFilters();
        renderProducts();
      });
    });
  };

  /* ---------- Grilla de productos ---------- */

  const puedePedir = (p) => p.disponible && !p.agotado;

  const renderProducts = () => {
    const grid = document.getElementById("productGrid");
    const texto = busqueda.toLowerCase();

    const productos = storage.getProductos().filter((p) => {
      const coincideCategoria = filtroActual === "Todos" || p.categoria === filtroActual;
      const coincideBusqueda =
        !texto || p.nombre.toLowerCase().includes(texto) || p.descripcion.toLowerCase().includes(texto);
      return coincideCategoria && coincideBusqueda;
    });

    grid.innerHTML = productos.length
      ? productos
          .map((p) => {
            const etiquetas = [
              p.etiqueta ? `<span>${escapeHtml(p.etiqueta)}</span>` : "",
              p.agotado ? '<span class="soldout">Agotado</span>' : "",
            ].join("");
            const accion = puedePedir(p)
              ? p.personalizable
                ? `<button class="add-link" data-custom="${p.id}">Personalizar +</button>`
                : `<button class="add-link" data-add="${p.id}">Agregar +</button>`
              : `<span class="no-stock">No disponible</span>`;

            return `
              <article class="product ${!p.disponible || p.agotado ? "soldout" : ""}">
                <div class="picture">
                  <img src="${escapeHtml(p.imagen)}" alt="${escapeHtml(p.nombre)}" />
                  ${etiquetas}
                </div>
                <div class="pbody">
                  <small>${escapeHtml(p.categoria)}</small>
                  <h3>${escapeHtml(p.nombre)}</h3>
                  <p>${escapeHtml(p.descripcion)}</p>
                  <div>
                    <strong>${formatPrice(p.precio)}</strong>
                    ${accion}
                  </div>
                </div>
              </article>`;
          })
          .join("")
      : '<p class="empty-note">No hay productos con esos criterios. 🍓</p>';

    grid.querySelectorAll("button[data-add]").forEach((button) => {
      button.addEventListener("click", () => addToCart(button.dataset.add, {}, 1));
    });
    grid.querySelectorAll("button[data-custom]").forEach((button) => {
      button.addEventListener("click", () => openCustom(button.dataset.custom));
    });
  };

  /* ---------- Carrito ---------- */

  const getCart = () => storage.getCarrito();
  const setCart = (items) => {
    storage.saveCarrito(items);
    renderCart();
  };

  const addToCart = (productoId, opciones = {}, cantidad = 1) => {
    const producto = storage.getProductoById(productoId);
    if (!producto || !puedePedir(producto)) return;

    const items = getCart();
    const firma = JSON.stringify({ id: productoId, ...opciones });
    const existente = items.find((i) => i.firma === firma);

    if (existente) {
      existente.cantidad += cantidad;
    } else {
      let total = producto.precio;
      for (const toppingId of opciones.toppings || []) {
        const t = storage.getToppings().find((x) => x.id === toppingId);
        if (t) total += t.precio;
      }
      items.push({
        firma,
        productoId: productoId,
        nombre: producto.nombre,
        base: producto.precio,
        opciones,
        precio: Number(total.toFixed(2)),
        cantidad,
      });
    }
    setCart(items);
    toast(`${producto.nombre} agregado 🛒`);
  };

  const changeQty = (firma, delta) => {
    const items = getCart();
    const item = items.find((i) => i.firma === firma);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) storage.saveCarrito(items.filter((i) => i.firma !== firma));
    else storage.saveCarrito(items);
    renderCart();
  };

  const removeItem = (firma) => {
    setCart(getCart().filter((i) => i.firma !== firma));
  };

  const describeOpciones = (item) => {
    const partes = [];
    if (item.opciones?.tamaño) partes.push(item.opciones.tamaño);
    if (item.opciones?.crema) partes.push(item.opciones.crema);
    for (const id of item.opciones?.toppings || []) {
      const t = storage.getToppings().find((x) => x.id === id);
      if (t) partes.push(t.nombre);
    }
    return partes.join(" · ");
  };

  const renderCart = () => {
    const items = getCart();
    const count = items.reduce((total, i) => total + i.cantidad, 0);
    const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

    document.getElementById("cartBadge").textContent = count;
    document.getElementById("cartCount").textContent = count;
    document.getElementById("cartTotal").textContent = formatPrice(total);

    const container = document.getElementById("cartItems");
    container.innerHTML = items.length
      ? items
          .map((i) => {
            const detalle = describeOpciones(i);
            return `
              <div class="cart-item">
                <strong>${escapeHtml(i.nombre)}</strong>
                <b>${formatPrice(i.precio * i.cantidad)}</b>
                <button class="remove-item" data-remove="${escapeHtml(i.firma)}" aria-label="Eliminar">×</button>
                <small>${i.cantidad} x ${formatPrice(i.precio)}${detalle ? ` · ${escapeHtml(detalle)}` : ""}</small>
                <div class="qty-controls">
                  <button data-minus="${escapeHtml(i.firma)}" aria-label="Menos">−</button>
                  <button data-plus="${escapeHtml(i.firma)}" aria-label="Más">+</button>
                </div>
              </div>`;
          })
          .join("")
      : '<p class="cart-empty">Aún no agregas productos.<br />¡Elige tu favorito!</p>';

    container.querySelectorAll("[data-remove]").forEach((b) =>
      b.addEventListener("click", () => removeItem(b.dataset.remove))
    );
    container.querySelectorAll("[data-plus]").forEach((b) =>
      b.addEventListener("click", () => changeQty(b.dataset.plus, 1))
    );
    container.querySelectorAll("[data-minus]").forEach((b) =>
      b.addEventListener("click", () => changeQty(b.dataset.minus, -1))
    );
  };

  /* ---------- Modal de personalización ---------- */

  const openCustom = (productoId) => {
    const producto = storage.getProductoById(productoId);
    if (!producto) return;
    productoActual = producto;
    extraTamaño = 0;

    document.getElementById("customImg").src = producto.imagen;
    document.getElementById("customName").textContent = producto.nombre;
    document.getElementById("customBase").textContent = `Desde ${formatPrice(producto.precio)}`;

    const cremas = storage.getCremas().filter((c) => c.disponible);
    document.getElementById("cremaRow").innerHTML = cremas
      .map(
        (c, index) =>
          `<button type="button" data-crema="${escapeHtml(c.nombre)}" class="${index === 0 ? "picked" : ""}">${escapeHtml(c.nombre)}</button>`
      )
      .join("");
    document.querySelectorAll("#cremaRow button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("#cremaRow button").forEach((b) => b.classList.remove("picked"));
        button.classList.add("picked");
        updateCustomTotal();
      });
    });

    const toppings = storage.getToppings().filter((t) => t.disponible);
    document.getElementById("toppingList").innerHTML = toppings
      .map(
        (t) => `
          <label class="check">
            <input type="checkbox" data-topping="${t.id}" data-precio="${t.precio}" />
            ${escapeHtml(t.nombre)} <span>+ ${formatPrice(t.precio)}</span>
          </label>`
      )
      .join("");
    document.querySelectorAll("#toppingList input").forEach((input) => {
      input.addEventListener("change", updateCustomTotal);
    });

    document.querySelectorAll("#sizeRow button").forEach((button) => {
      button.classList.toggle("picked", Number(button.dataset.extra) === 0);
      button.onclick = () => {
        document.querySelectorAll("#sizeRow button").forEach((b) => b.classList.remove("picked"));
        button.classList.add("picked");
        extraTamaño = Number(button.dataset.extra) || 0;
        updateCustomTotal();
      };
    });

    updateCustomTotal();
    document.getElementById("customOverlay").classList.add("open");
  };

  const updateCustomTotal = () => {
    if (!productoActual) return;
    let total = productoActual.precio + extraTamaño;
    document.querySelectorAll("#toppingList input:checked").forEach((input) => {
      total += Number(input.dataset.precio) || 0;
    });
    document.getElementById("addToCart").textContent = `Agregar · ${formatPrice(total)}`;
  };

  document.getElementById("closeCustom").addEventListener("click", () => {
    document.getElementById("customOverlay").classList.remove("open");
  });

  document.getElementById("addToCart").addEventListener("click", () => {
    if (!productoActual) return;
    const crema = document.querySelector("#cremaRow button.picked");
    const toppings = [...document.querySelectorAll("#toppingList input:checked")].map((i) => i.dataset.topping);
    const tamañoBtn = document.querySelector("#sizeRow button.picked");

    const opciones = {};
    if (tamañoBtn) opciones.tamaño = tamañoBtn.textContent.trim();
    if (crema) opciones.crema = crema.dataset.crema;
    if (toppings.length) opciones.toppings = toppings;

    let total = productoActual.precio + extraTamaño;
    for (const id of toppings) {
      const t = storage.getToppings().find((x) => x.id === id);
      if (t) total += t.precio;
    }

    const items = getCart();
    const firma = JSON.stringify({ id: productoActual.id, ...opciones });
    const existente = items.find((i) => i.firma === firma);
    if (existente) {
      existente.cantidad += 1;
      storage.saveCarrito(items);
    } else {
      items.push({
        firma,
        productoId: productoActual.id,
        nombre: productoActual.nombre,
        base: productoActual.precio,
        opciones,
        precio: Number(total.toFixed(2)),
        cantidad: 1,
      });
      storage.saveCarrito(items);
    }
    renderCart();
    document.getElementById("customOverlay").classList.remove("open");
    toast(`${productoActual.nombre} agregado 🛒`);
  });

  /* ---------- Búsqueda ---------- */

  document.getElementById("searchInput").addEventListener("input", (event) => {
    busqueda = event.target.value.trim();
    renderProducts();
  });

  /* ---------- Init ---------- */

  const catParam = window.ICAFRESA_UTILS.getParam("cat");
  if (catParam) filtroActual = catParam;

  renderFilters();
  renderProducts();
  renderCart();
})();
