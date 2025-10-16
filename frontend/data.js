/***********************
 *   CONFIG INICIAL    *
 ***********************/
const N_IMAGES = 34;                  // cantidad de imágenes
const FOLDER   = "img";               // carpeta de imágenes
const BASENAME = "Image";             // prefijo
const EXT      = ".jpg";              // extensión
const PAD2     = true;                // Image 01.jpg
const START_AT = 1;

/* Categorías que usás en el sitio (mueblería) */
const CATEGORIAS = [
  { key: "sillas", nombre: "Sillas", rango: [2500, 6000] },
  { key: "mesas", nombre: "Mesas", rango: [8000, 12000] },
  { key: "estanterias", nombre: "Estanterías", rango: [3500, 7000] },
  { key: "sofas", nombre: "Sofás", rango: [20000, 30000] },
  { key: "camas", nombre: "Camas", rango: [12000, 26000] },
  { key: "escritorios", nombre: "Escritorios", rango: [5000, 9000] },
  { key: "placares", nombre: "Placares", rango: [11000, 19000] },
  { key: "roperos", nombre: "Roperos", rango: [10000, 17000] }
];

/* Utilidades */
function precioAlAzar([min, max]) { const step=10; return Math.round((Math.random()*(max-min)+min)/step)*step; }
function pad(n){ return PAD2 ? n.toString().padStart(2,"0") : n; }
function buildFilename(i){ return `${FOLDER}/${BASENAME} ${pad(i)}${EXT}`; }

/********************************************
 *        CATALOGO + OVERRIDES (fijos)      *
 ********************************************/
/* Base inicial (reparte categorías en ciclo, solo para arrancar) */
function generarBase(){
  const prods = [];
  for(let i=START_AT;i<START_AT+N_IMAGES;i++){
    const cat = CATEGORIAS[(i-START_AT)%CATEGORIAS.length];
    const nombre = `${cat.nombre} ${i}`;
    prods.push({
      id:i, nombre, categoria:cat.key,
      precio: precioAlAzar(cat.rango),
      imagen: buildFilename(i),
      alt: nombre
    });
  }
  return prods;
}

/* Pega acá el JSON que copiaste de la consola (localStorage 'catalog_overrides') */
const OVERRIDES_JSON = 
/* ======= PASTE OVERRIDES HERE (por ejemplo: {"1":{"nombre":"Silla Eames","categoria":"sillas"}} ) ======= */ 
{};
/* =============================================================================================== */

function aplicarOverrides(base){
  let overrides = {};
  try { overrides = (typeof OVERRIDES_JSON === 'string') ? JSON.parse(OVERRIDES_JSON) : OVERRIDES_JSON; }
  catch(_) { overrides = {}; }
  return base.map(p=>{
    const o = overrides[p.id];
    if(!o) return p;
    return {...p, ...o, alt: o.nombre || p.nombre};
  });
}

/********************************************
 *                 ESTADO                   *
 ********************************************/
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let total   = parseFloat(localStorage.getItem("total")) || 0;

function guardarCarrito(){
  localStorage.setItem("carrito", JSON.stringify(carrito));
  localStorage.setItem("total", total);
}

/********************************************
 *                RENDER UI                 *
 ********************************************/
function categoriasUnicas(productos){
  const set = new Set(productos.map(p=>p.categoria));
  return ["todos", ...Array.from(set)];
}

function renderTabs(productos){
  const cont = document.getElementById("tabs-categorias");
  if(!cont) return;
  const cats = categoriasUnicas(productos);
  cont.innerHTML = cats.map(c=>{
    const label = c==="todos" ? "Todos" : (CATEGORIAS.find(x=>x.key===c)?.nombre || c);
    return `<button data-cat="${c}" ${c==="todos"?'class="active"':''}>${label}</button>`;
  }).join("");
  cont.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      cont.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.getAttribute("data-cat");
      const q = document.getElementById("buscador")?.value || "";
      renderCatalogo(productos, q, cat);
    });
  });
}

function renderCatalogo(productos, filtroNombre="", filtroCategoria="todos"){
  const cont = document.getElementById("contenedor-productos");
  if(!cont) return;

  const filtrados = productos.filter(p =>
    (filtroCategoria==="todos" || p.categoria===filtroCategoria) &&
    p.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  cont.innerHTML = filtrados.map(p=>{
    return `
    <div class="producto">
      <img src="${p.imagen}" alt="${p.alt}">
      <h3>${p.nombre}</h3>
      <div class="meta">
        <p>UYU ${p.precio.toLocaleString("es-UY")}</p>
      </div>
      <button onclick="agregarAlCarrito('${p.nombre}', ${p.precio})">Agregar al carrito</button>
    </div>`;
  }).join("");
}

/********************************************
 *              ACCIONES                     *
 ********************************************/
function agregarAlCarrito(nombre, precio){
  carrito.push({nombre, precio});
  total += precio;
  guardarCarrito();
  actualizarCarrito();
  mostrarNotificacion(`${nombre} agregado al carrito`);
}
function quitarDelCarrito(index){
  total -= carrito[index].precio;
  carrito.splice(index,1);
  guardarCarrito();
  actualizarCarrito();
}
function actualizarCarrito(){
  const lista = document.getElementById("lista-carrito");
  const totalSpan = document.getElementById("total");
  if(!lista || !totalSpan) return;

  lista.innerHTML = carrito.map((item,i)=>`
    <li>
      <span>${item.nombre}</span>
      <span>UYU ${item.precio.toLocaleString("es-UY")}</span>
      <button onclick="quitarDelCarrito(${i})" class="btn-secondary">Quitar</button>
    </li>
  `).join("");

  totalSpan.textContent = (total||0).toLocaleString("es-UY");

  const btnLimpiar   = document.getElementById("limpiar-carrito");
  const btnFinalizar = document.getElementById("finalizar-compra");
  if(btnLimpiar) btnLimpiar.onclick = ()=>{ carrito=[]; total=0; guardarCarrito(); actualizarCarrito(); };
  if(btnFinalizar) btnFinalizar.onclick = ()=>{
    const ok = confirm("¿Confirmás la compra? (Simulación académica)");
    if(ok){ carrito=[]; total=0; guardarCarrito(); actualizarCarrito(); alert("¡Gracias por tu compra!"); }
  };

  const form = document.getElementById("form-pago");
  if(form){
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      if(!form.checkValidity()){ alert("Revisá los campos del formulario."); return; }
      alert("Pago validado (simulación). ¡Pedido confirmado!");
      carrito=[]; total=0; guardarCarrito(); actualizarCarrito();
    }, { once:true });
  }
}

function mostrarNotificacion(msg){
  const n = document.getElementById("notificacion");
  if(!n) return;
  n.textContent = msg;
  n.style.display = "block";
  setTimeout(()=> n.style.display = "none", 1500);
}

/********************************************
 *                  BOOT                     *
 ********************************************/
function boot(){
  const base = generarBase();
  const productos = aplicarOverrides(base);
  renderTabs(productos);
  const q = document.getElementById("buscador")?.value || "";
  const active = document.querySelector(".categorias button.active")?.getAttribute("data-cat") || "todos";
  renderCatalogo(productos, q, active);
}

document.addEventListener("DOMContentLoaded", ()=>{
  if(document.getElementById("lista-carrito")) actualizarCarrito();
  boot();
});
