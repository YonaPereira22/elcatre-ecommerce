let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let total = parseFloat(localStorage.getItem("total")) || 0;

// Productos ficticios (reemplazá las imágenes con las reales en /img)
const productos = [
  { id: 1, nombre: "Silla moderna", precio: 120, categoria: "sillas", imagen: "img/silla1.jpg" },
  { id: 2, nombre: "Silla de madera", precio: 150, categoria: "sillas", imagen: "img/silla2.jpg" },
  { id: 3, nombre: "Mesa comedor", precio: 300, categoria: "mesas", imagen: "img/mesa1.jpg" },
  { id: 4, nombre: "Mesa ratona", precio: 180, categoria: "mesas", imagen: "img/mesa2.jpg" },
  { id: 5, nombre: "Estantería metálica", precio: 200, categoria: "estanterias", imagen: "img/estanteria1.jpg" },
  { id: 6, nombre: "Estantería de madera", precio: 250, categoria: "estanterias", imagen: "img/estanteria2.jpg" },
  { id: 7, nombre: "Sofá 2 cuerpos", precio: 500, categoria: "sofas", imagen: "img/sofa1.jpg" },
  { id: 8, nombre: "Cama matrimonial", precio: 700, categoria: "camas", imagen: "img/cama1.jpg" },
  { id: 9, nombre: "Escritorio gamer", precio: 400, categoria: "escritorios", imagen: "img/escritorio1.jpg" },
  { id: 10, nombre: "Escritorio clásico", precio: 280, categoria: "escritorios", imagen: "img/escritorio2.jpg" }
];

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  localStorage.setItem("total", total);
}

function agregarAlCarrito(nombre, precio) {
  carrito.push({ nombre, precio });
  total += precio;
  guardarCarrito();
  actualizarCarrito();
  mostrarNotificacion(`${nombre} agregado al carrito`);
}

function mostrarNotificacion(mensaje) {
  const noti = document.getElementById("notificacion");
  if (!noti) return;

  noti.textContent = mensaje;
  noti.style.display = "block";
  noti.style.opacity = "1";

  setTimeout(() => {
    noti.style.opacity = "0";
    setTimeout(() => {
      noti.style.display = "none";
    }, 500);
  }, 2000);
}

function actualizarCarrito() {
  const lista = document.getElementById("lista-carrito");
  const totalSpan = document.getElementById("total");

  if (!lista || !totalSpan) return;

  lista.innerHTML = "";
  carrito.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.nombre} - $${item.precio}`;
    lista.appendChild(li);
  });

  totalSpan.textContent = total.toFixed(2);
}

// Renderizar productos
function renderizarProductos(filtroNombre = "", filtroCategoria = "todos") {
  const contenedor = document.getElementById("contenedor-productos");
  contenedor.innerHTML = "";

  const filtrados = productos.filter(p =>
    (filtroCategoria === "todos" || p.categoria === filtroCategoria) &&
    p.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  filtrados.forEach(p => {
    const div = document.createElement("div");
    div.className = "producto";
    div.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}">
      <h3>${p.nombre}</h3>
      <p>Precio: $${p.precio}</p>
      <button onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">Agregar al carrito</button>
    `;
    contenedor.appendChild(div);
  });
}

// Filtros
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("contenedor-productos")) {
    renderizarProductos();

    document.getElementById("buscador").addEventListener("input", (e) => {
      const texto = e.target.value;
      renderizarProductos(texto);
    });
  }

  if (document.getElementById("lista-carrito")) {
    actualizarCarrito();
  }
});

// Función global para botones de categorías
function filtrarCategoria(categoria) {
  const texto = document.getElementById("buscador").value;
  renderizarProductos(texto, categoria);
}
