/***********************
 *   CONFIG INICIAL    *
 ***********************/
const N_IMAGES = 34;                  // cantidad de imágenes
const FOLDER   = "img";               // carpeta de imágenes
const BASENAME = "Image";             // prefijo
const EXT      = ".jpg";              // extensión
const PAD2     = true;                // Image 01.jpg
const START_AT = 1;

/* Categorías del sitio */
const CATEGORIAS = [
  { key: "comedor", nombre: "Comedor", rango: [2500, 6000] },
  { key: "living", nombre: "Living", rango: [8000, 12000] },
  { key: "cocina", nombre: "Cocina", rango: [3500, 7000] },
  { key: "baño", nombre: "Baño", rango: [20000, 30000] },
  { key: "camas", nombre: "Camas", rango: [12000, 26000] },
  { key: "oficina", nombre: "Oficina", rango: [5000, 9000] },
  { key: "electrodomesticos", nombre: "Electrodomésticos", rango: [11000, 19000] },
];
// 👉 el index usa window.CATEGORIAS
window.CATEGORIAS = CATEGORIAS;

/* Utilidades */
function precioAlAzar([min, max]) { const step=10; return Math.round((Math.random()*(max-min)+min)/step)*step; }
function pad(n){ return PAD2 ? n.toString().padStart(2,"0") : n; }
function buildFilename(i){ return `${FOLDER}/${BASENAME} ${pad(i)}${EXT}`; }

/********************************************
 *        CATALOGO + OVERRIDES (fijos)      *
 ********************************************/
function generarBase(){
  const prods = [];
  for (let i = START_AT; i < START_AT + N_IMAGES; i++){
    const cat = CATEGORIAS[(i - START_AT) % CATEGORIAS.length];
    const nombre = `${cat.nombre} ${i}`;
    prods.push({
      id: i,
      nombre,
      categoria: cat.key,
      precio: precioAlAzar(cat.rango),
      imagen: buildFilename(i),
      alt: nombre,
      descripcion: ""
    });
  }
  return prods;
}

let overrides = {}; // los de archivo (overrides.json)

async function cargarOverrides(){
  try{
    const r = await fetch('overrides.json?cache=' + Date.now());
    if (r.ok) overrides = await r.json();
  }catch(_){
    overrides = {};
  }
}

/* ---- overrides y ediciones locales del “lapiz” ---- */
function lsOverrides(){
  try{ return JSON.parse(localStorage.getItem('overrides')||'{}') || {}; }catch(_){ return {}; }
}
function lsAdded(){
  try{ return JSON.parse(localStorage.getItem('added_products')||'[]') || []; }catch(_){ return []; }
}
function lsRemoved(){
  try{ return JSON.parse(localStorage.getItem('removed_ids')||'[]') || []; }catch(_){ return []; }
}

/* Fusión final: base → overrides.json → overrides LS → +added → -removed */
function fusionarProductos(base){
  const ovFile = overrides || {};
  const ovLS   = lsOverrides();
  let out = base.map(p => ({ ...p, ...(ovFile[p.id]||{}), ...(ovLS[p.id]||{}) }));

  const added = lsAdded();
  if (Array.isArray(added) && added.length){
    // Evitar duplicados por id
    const ids = new Set(out.map(p=>p.id));
    for(const ap of added){
      if(!ids.has(ap.id)) out.push(ap);
    }
  }

  const removed = new Set(lsRemoved());
  if (removed.size){
    out = out.filter(p => !removed.has(p.id));
  }

  return out;
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
      renderCatalogo(window.__PRODUCTOS__, q, cat);
    });
  });
}

function renderCatalogo(productos, filtroNombre = "", filtroCategoria = "todos") {
  const cont = document.getElementById("contenedor-productos");
  if (!cont) return;

  const filtrados = productos.filter(p =>
    (filtroCategoria === "todos" || p.categoria === filtroCategoria) &&
    p.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  cont.innerHTML = filtrados.map(p => `
    <div class="producto" data-id="${p.id}">
      <img src="${p.imagen}" alt="${p.alt || p.nombre}">
      <h3>${p.nombre}</h3>
      <div class="meta">
        <p><strong>UYU ${Number(p.precio || 0).toLocaleString("es-UY")}</strong></p>
        <p style="color:${p.stock ? 'green' : 'red'};font-weight:600">
          ${p.stock ? '✔ Con stock' : '❌ Sin stock'}
        </p>
      </div>

      ${p.stock
        ? `<button class="btn-primary" onclick="agregarAlCarrito('${(p.nombre || '').replaceAll("'", "\\'")}', ${Number(p.precio || 0)})">
            Agregar al carrito 🛒
          </button>`
        : `<button class="btn-secondary" disabled>Sin stock</button>`
      }
    </div>
  `).join("");

  // guardamos la última lista pintada por si el index quiere engancharla
  window.__ULTIMO_RENDER__ = filtrados;
}


/********************************************
 *              ACCIONES                     *
 ********************************************/
function agregarAlCarrito(nombre, precio, id = Date.now()){
  carrito.push({id, nombre, precio, cantidad: 1});
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

  // Redirige al Checkout
  if(btnFinalizar) btnFinalizar.onclick = ()=>{ 
    if(!carrito.length){ alert("Tu carrito está vacío."); return; }
    window.location.href = "checkout.html";
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
async function boot(){
  const base = generarBase();
  await cargarOverrides();                    // ← ahora sí esperamos el JSON
  const productos = fusionarProductos(base);  // ← mezcla base + LS + JSON
  window.__PRODUCTOS__ = productos;           // cache global que reusa el index
  renderTabs(productos);
  const q = document.getElementById("buscador")?.value || "";
  const active = document.querySelector(".categorias button.active")?.getAttribute("data-cat") || "todos";
  renderCatalogo(productos, q, active);
}

document.addEventListener("DOMContentLoaded", ()=>{
  if(document.getElementById("lista-carrito")) actualizarCarrito();
  boot();
});
