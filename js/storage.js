/*
 * storage.js — Única capa que toca localStorage en todo el proyecto.
 * Las páginas NUNCA usan localStorage directamente: usan window.ICAFRESA_STORAGE.
 * En el futuro se puede reemplazar este archivo por llamadas a una API sin
 * cambiar el resto de la interfaz.
 */
window.ICAFRESA_STORAGE = (() => {
  const PREFIX = "icaFresa:";

  const KEYS = {
    CONFIG: "config",
    CATEGORIAS: "categorias",
    PRODUCTOS: "productos",
    TOPPINGS: "toppings",
    CREMAS: "cremas",
    HORARIOS: "horarios",
    CARRITO: "carrito",
    PEDIDOS: "pedidos",
    TARJETAS: "tarjetas",
  };

  /* ---------- Primitivas genéricas ---------- */

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  const remove = (key) => {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* noop */
    }
  };

  /* ---------- Semillado con datos de demostración ---------- */

  const seed = () => {
    const data = window.ICAFRESA_DATA;
    if (read(KEYS.CONFIG, null) === null) write(KEYS.CONFIG, data.config);
    if (read(KEYS.CATEGORIAS, null) === null) write(KEYS.CATEGORIAS, data.categorias);
    if (read(KEYS.PRODUCTOS, null) === null) write(KEYS.PRODUCTOS, data.productos);
    if (read(KEYS.TOPPINGS, null) === null) write(KEYS.TOPPINGS, data.toppings);
    if (read(KEYS.CREMAS, null) === null) write(KEYS.CREMAS, data.cremas);
    if (read(KEYS.HORARIOS, null) === null) write(KEYS.HORARIOS, data.horarios);
    if (read(KEYS.CARRITO, null) === null) write(KEYS.CARRITO, []);
    if (read(KEYS.PEDIDOS, null) === null) write(KEYS.PEDIDOS, []);
    if (read(KEYS.TARJETAS, null) === null) write(KEYS.TARJETAS, data.tarjetas || []);
  };

  /* ---------- Configuración general ---------- */

  const getConfig = () => read(KEYS.CONFIG, window.ICAFRESA_DATA.config);
  const saveConfig = (config) => write(KEYS.CONFIG, config);

  /* ---------- Categorías ---------- */

  const getCategorias = () => read(KEYS.CATEGORIAS, [...window.ICAFRESA_DATA.categorias]);
  const saveCategorias = (lista) => write(KEYS.CATEGORIAS, lista);

  /* ---------- Productos ---------- */

  const getProductos = () => read(KEYS.PRODUCTOS, [...window.ICAFRESA_DATA.productos]);
  const saveProductos = (lista) => write(KEYS.PRODUCTOS, lista);
  const getProductoById = (id) => getProductos().find((p) => p.id === id) || null;

  /* ---------- Toppings ---------- */

  const getToppings = () => read(KEYS.TOPPINGS, [...window.ICAFRESA_DATA.toppings]);
  const saveToppings = (lista) => write(KEYS.TOPPINGS, lista);

  /* ---------- Cremas ---------- */

  const getCremas = () => read(KEYS.CREMAS, [...window.ICAFRESA_DATA.cremas]);
  const saveCremas = (lista) => write(KEYS.CREMAS, lista);

  /* ---------- Horarios y locales ---------- */

  const getHorarios = () => read(KEYS.HORARIOS, JSON.parse(JSON.stringify(window.ICAFRESA_DATA.horarios)));
  const saveHorarios = (horarios) => write(KEYS.HORARIOS, horarios);

  /* ---------- Carrito ---------- */

  const getCarrito = () => read(KEYS.CARRITO, []);
  const saveCarrito = (items) => write(KEYS.CARRITO, items);
  const clearCarrito = () => write(KEYS.CARRITO, []);

  /* ---------- Tarjetas de fidelidad ---------- */

  const getTarjetas = () => read(KEYS.TARJETAS, [...(window.ICAFRESA_DATA.tarjetas || [])]);
  const saveTarjetas = (lista) => write(KEYS.TARJETAS, lista);
  const getTarjetaById = (id) => getTarjetas().find((t) => t.id === id) || null;

  /* Crea o actualiza la tarjeta de una clienta por teléfono (login por teléfono + clave). */
  const upsertTarjeta = ({ nombre, telefono, clave }) => {
    const lista = getTarjetas();
    const normalizado = String(telefono).trim();
    let tarjeta = lista.find((t) => String(t.telefono).trim() === normalizado);
    if (tarjeta) {
      if (nombre) tarjeta.nombre = nombre;
      if (clave) tarjeta.clave = clave;
    } else {
      tarjeta = {
        id: window.ICAFRESA_UTILS.uid("tc"),
        nombre,
        telefono: normalizado,
        clave,
        sellos: 0,
        compras: 0,
        canjes: 0,
        fecha: new Date().toISOString(),
      };
      lista.push(tarjeta);
    }
    write(KEYS.TARJETAS, lista);
    return tarjeta;
  };

  const addSello = (tarjetaId) => {
    const lista = getTarjetas();
    const tarjeta = lista.find((t) => t.id === tarjetaId);
    if (!tarjeta) return null;
    tarjeta.sellos = Number(tarjeta.sellos || 0) + 1;
    tarjeta.compras = Number(tarjeta.compras || 0) + 1;
    write(KEYS.TARJETAS, lista);
    return tarjeta;
  };

  /* ---------- Pedidos ---------- */

  const getPedidos = () => read(KEYS.PEDIDOS, []);
  const savePedido = (pedido) => {
    const lista = getPedidos();
    lista.unshift(pedido);
    write(KEYS.PEDIDOS, lista);
    return pedido;
  };
  const updatePedido = (id, cambios) => {
    const lista = getPedidos();
    const index = lista.findIndex((p) => p.id === id);
    if (index === -1) return null;
    lista[index] = { ...lista[index], ...cambios };
    write(KEYS.PEDIDOS, lista);
    return lista[index];
  };
  const deletePedido = (id) => write(KEYS.PEDIDOS, getPedidos().filter((p) => p.id !== id));

  /* ---------- Utilidades internas ---------- */

  const resetAll = () => {
    Object.values(KEYS).forEach(remove);
    seed();
  };

  seed();

  return {
    KEYS,
    read,
    write,
    remove,
    seed,
    resetAll,
    getConfig,
    saveConfig,
    getCategorias,
    saveCategorias,
    getProductos,
    saveProductos,
    getProductoById,
    getToppings,
    saveToppings,
    getCremas,
    saveCremas,
    getHorarios,
    saveHorarios,
    getCarrito,
    saveCarrito,
    clearCarrito,
    getTarjetas,
    saveTarjetas,
    getTarjetaById,
    upsertTarjeta,
    addSello,
    getPedidos,
    savePedido,
    updatePedido,
    deletePedido,
  };
})();
