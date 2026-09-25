/*
 * data.js — Datos iniciales (semilla) de Ica Fresa.
 * Solo se usan la PRIMERA vez que se abre el proyecto (si localStorage está vacío).
 * Luego todo se modifica desde el Panel de Administrador (admin/admin.html).
 */
window.ICAFRESA_DATA = {
  config: {
    nombre: "Ica Fresa",
    whatsapp: "51999900001",
    pedidosyaUrl: "https://www.pedidosya.com.pe/",
    moneda: "S/",
    adminUsuario: "equipo",
    adminClave: "1234",
  },

  categorias: [
    "Fresas con crema",
    "Waffles",
    "Crepes",
    "Mini donas",
    "Bebidas",
    "Postres",
    "Promos",
  ],

  productos: [
    {
      id: "p1",
      nombre: "Vaso Clásico",
      categoria: "Fresas con crema",
      descripcion: "Fresas frescas, crema de la casa y topping.",
      precio: 11.5,
      imagen:
        "https://infobae.com/new-resizer/IIwfQV1BrzHYiqoVBYyDbHfIvNc=/arc-anglerfish-arc2-prod-infobae/public/TWP6YXWPVZGMHH7TUIIOGCR5PU.jpg",
      etiqueta: "Favorito",
      personalizable: false,
      disponible: true,
      agotado: false,
    },
    {
      id: "p2",
      nombre: "Fresas con Nutella",
      categoria: "Fresas con crema",
      descripcion: "La combinación más irresistible.",
      precio: 15.5,
      imagen:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHy15fWJfdVRvCq7KBlQmzkWCfT8XK8HRZ9Bpp-z8WVHTcaISNVfg8R4Cm&s=10",
      etiqueta: "Más pedido",
      personalizable: true,
      disponible: true,
      agotado: false,
    },
    {
      id: "p3",
      nombre: "Milkshake Oreo",
      categoria: "Bebidas",
      descripcion: "Cremoso batido con galleta Oreo.",
      precio: 12.0,
      imagen:
        "https://dcdn-us.mitiendanube.com/stores/001/309/364/products/oreo1-65726168dab7ff038d16038939405665-1024-1024.jpg",
      etiqueta: "",
      personalizable: true,
      disponible: true,
      agotado: false,
    },
    {
      id: "p4",
      nombre: "Waffle Clásico",
      categoria: "Waffles",
      descripcion: "Waffle doradito con fruta y salsa.",
      precio: 12.5,
      imagen:
        "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=900&q=85",
      etiqueta: "",
      personalizable: true,
      disponible: true,
      agotado: false,
    },
    {
      id: "p5",
      nombre: "Crepe Nutella",
      categoria: "Crepes",
      descripcion: "Crepe suave, Nutella y fresas.",
      precio: 14.0,
      imagen:
        "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=900&q=85",
      etiqueta: "",
      personalizable: true,
      disponible: true,
      agotado: false,
    },
    {
      id: "p6",
      nombre: "Mini Donas",
      categoria: "Mini donas",
      descripcion: "Tiernas, divertidas y llenas de sabor.",
      precio: 16.5,
      imagen:
        "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85",
      etiqueta: "",
      personalizable: false,
      disponible: true,
      agotado: false,
    },
    {
      id: "p7",
      nombre: "Brownie con fresa",
      categoria: "Postres",
      descripcion: "Brownie tibio, crema y fresa.",
      precio: 10.0,
      imagen:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85",
      etiqueta: "",
      personalizable: false,
      disponible: true,
      agotado: false,
    },
    {
      id: "p8",
      nombre: "Combo Antojito",
      categoria: "Promos",
      descripcion: "2 vasos clásicos + mini donas.",
      precio: 29.0,
      imagen:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSXUPa26PKJyddxbretBh_6IjA0wHqwPPf-SWM9j3UN0Ne-xCxRXff34pU9&s=10",
      etiqueta: "Ahorra S/ 6",
      personalizable: false,
      disponible: true,
      agotado: false,
    },
  ],

  toppings: [
    { id: "t1", nombre: "Oreo", precio: 2.0, disponible: true },
    { id: "t2", nombre: "Nutella extra", precio: 3.0, disponible: true },
    { id: "t3", nombre: "Chispas de chocolate", precio: 1.5, disponible: true },
    { id: "t4", nombre: "Fresas extras", precio: 2.5, disponible: true },
    { id: "t5", nombre: "Almendras", precio: 2.0, disponible: true },
  ],

  cremas: [
    { id: "c1", nombre: "Crema clásica", disponible: true },
    { id: "c2", nombre: "Crema de leche", disponible: true },
    { id: "c3", nombre: "Nutella", disponible: true },
    { id: "c4", nombre: "Manjar blanco", disponible: true },
  ],

  /* Tarjetas de fidelidad (creadas desde inicio o desde el panel). */
  tarjetas: [
    {
      id: "tc1",
      nombre: "Cliente Demo",
      telefono: "999888777",
      clave: "fresa123",
      sellos: 3,
      compras: 3,
      canjes: 0,
      fecha: new Date().toISOString(),
    },
  ],

  horarios: {
    abierto: true,
    texto: "1 p. m. - 10 p. m.",
    locales: [
      {
        id: "l1",
        nombre: "Local Ica",
        direccion: "Av. Los Maestros 214, Ica",
        horario: "Lun-Dom · 11:00 a. m. - 9:30 p. m.",
        telefono: "+51 999 900 001",
        whatsapp: "51999900001",
        activo: true,
      },
      {
        id: "l2",
        nombre: "Local Parcona",
        direccion: "Av. Parcona 680, Ica",
        horario: "Lun-Dom · 12:00 p. m. - 9:00 p. m.",
        telefono: "+51 999 900 002",
        whatsapp: "51999900002",
        activo: true,
      },
    ],
  },
};
