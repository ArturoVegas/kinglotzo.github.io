// scripts.js (unificado para mangas.html e infoMangas.html)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyArUObX1yvBE1F7JOotiFVBVp_FuFGtLks",
  authDomain: "prueba-base-de-datos-270a7.firebaseapp.com",
  databaseURL: "https://prueba-base-de-datos-270a7-default-rtdb.firebaseio.com",
  projectId: "prueba-base-de-datos-270a7",
  storageBucket: "prueba-base-de-datos-270a7.firebasestorage.app",
  messagingSenderId: "190031828502",
  appId: "1:190031828502:web:e8c9ba978b037cce008737",
  measurementId: "G-W512T7N7GB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --------------- Código para mangas.html ---------------

const contenedor = document.getElementById("contenedor-mangas");
const paginacion = document.getElementById("paginacion");

let listaMangas = [];
let paginaActual = 1;

function getMangasPorPagina() {
  return window.innerWidth < 768 ? 6 : 12; // 6 en móvil, 12 en desktop
}

function renderizarPagina(pagina) {
  if (!contenedor) return; // Si no existe el contenedor (no estamos en mangas.html), salimos

  contenedor.innerHTML = "";

  const mangasPorPagina = getMangasPorPagina();
  const inicio = (pagina - 1) * mangasPorPagina;
  const fin = inicio + mangasPorPagina;
  const mangasAMostrar = listaMangas.slice(inicio, fin);

  mangasAMostrar.forEach(([nombre, data]) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = window.innerWidth < 768 ? "col-6" : "col-2"; // 2 por fila móvil, 6 por fila desktop

    tarjeta.innerHTML = `
      <a href="../html/infoMangas.html?manga=${encodeURIComponent(nombre)}" class="text-decoration-none text-reset">
        <div class="card h-100">
          <img src="${data.portada}" class="card-img-top" alt="${nombre}" />
          <div class="card-body text-center">
            <h5 class="card-title">${nombre.replaceAll("_", " ")}</h5>
            <p class="card-text">Haz clic para ver más</p>
          </div>
        </div>
      </a>
    `;

    contenedor.appendChild(tarjeta);
  });
}

function renderizarPaginacion() {
  if (!paginacion) return; // Si no existe la paginación (no estamos en mangas.html), salimos

  paginacion.innerHTML = "";

  const mangasPorPagina = getMangasPorPagina();
  const totalPaginas = Math.ceil(listaMangas.length / mangasPorPagina);

  function crearBoton(texto, pagina, disabled = false, active = false) {
    const li = document.createElement("li");
    li.className = "page-item";
    if (disabled) li.classList.add("disabled");
    if (active) li.classList.add("active");
    li.innerHTML = `<a class="page-link" href="#">${texto}</a>`;
    li.addEventListener("click", e => {
      e.preventDefault();
      if (!disabled && pagina !== paginaActual) {
        paginaActual = pagina;
        renderizarPagina(paginaActual);
        renderizarPaginacion();
      }
    });
    return li;
  }

  paginacion.appendChild(crearBoton("Anterior", paginaActual - 1, paginaActual === 1));
  for (let i = 1; i <= totalPaginas; i++) {
    paginacion.appendChild(crearBoton(i, i, false, i === paginaActual));
  }
  paginacion.appendChild(crearBoton("Siguiente", paginaActual + 1, paginaActual === totalPaginas));
}

async function cargarMangas() {
  if (!contenedor) return; // No estamos en mangas.html, no cargamos

  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (snapshot.exists()) {
      listaMangas = Object.entries(snapshot.val());

      // Ordenar alfabéticamente
      listaMangas.sort((a, b) => a[0].localeCompare(b[0]));

      paginaActual = 1;
      renderizarPagina(paginaActual);
      renderizarPaginacion();
    } else {
      contenedor.innerHTML = "<p class='text-light'>No hay mangas disponibles.</p>";
    }
  } catch (error) {
    console.error("Error al leer Firebase:", error);
    contenedor.innerHTML = "<p class='text-danger'>Error al cargar los mangas.</p>";
  }
}

// Al cambiar tamaño ventana, actualizamos vista paginada si estamos en mangas.html
window.addEventListener('resize', () => {
  if (!contenedor) return;
  const mangasPorPagina = getMangasPorPagina();
  const totalPaginas = Math.ceil(listaMangas.length / mangasPorPagina);
  if (paginaActual > totalPaginas) paginaActual = totalPaginas > 0 ? totalPaginas : 1;
  renderizarPagina(paginaActual);
  renderizarPaginacion();
});

// --------------- Código para infoMangas.html ---------------

function obtenerNombreMangaDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("manga");
}

async function cargarInfoManga() {
  // Solo cargar si estamos en infoMangas.html (detectamos por la existencia de id "manga-portada")
  const portadaEl = document.getElementById("manga-portada");
  if (!portadaEl) return;

  const nombreManga = obtenerNombreMangaDesdeURL();
  if (!nombreManga) return;

  try {
    const snapshot = await get(ref(db, `mangas/${nombreManga}`));
    if (snapshot.exists()) {
      const data = snapshot.val();

      const setText = (id, texto) => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto ?? "-";
      };

      portadaEl.src = data.portada || "";
      portadaEl.alt = decodeURIComponent(nombreManga).replaceAll("_", " ");

      setText("manga-titulo", decodeURIComponent(nombreManga).replaceAll("_", " "));
      setText("manga-sinopsis", data.sinopsis || "Sin sinopsis.");
      setText("manga-autor", data.autor || "Desconocido");
      setText("manga-genero", Array.isArray(data.generos) ? data.generos.join(", ") : (data.generos || "Sin géneros"));
      setText("manga-estado", data.estado || "Desconocido");
      setText("manga-fecha", data.fechaLanzamiento || data.fecha_lanzamiento || "Desconocida");
      setText("manga-frecuencia", data.frecuencia || "Desconocida");

      const lista = document.getElementById("lista-capitulos");
      if (lista) {
        lista.innerHTML = "";
        if (Array.isArray(data.capitulos)) {
          data.capitulos.forEach((capitulo, index) => {
            const li = document.createElement("li");
            li.className = "list-group-item p-0 rectangulo-item";
            li.innerHTML = `
              <a href="../html/vermangas.html?manga=${encodeURIComponent(nombreManga)}&cap=${index + 1}" 
                 class="enlace-cap d-block py-2 px-3">
                Capítulo ${index + 1}
              </a>`;
            lista.appendChild(li);
          });
        } else {
          lista.innerHTML = `<li class="list-group-item text-light">No hay capítulos disponibles.</li>`;
        }
      }

    } else {
      alert("Manga no encontrado.");
    }
  } catch (error) {
    console.error("Error cargando manga:", error);
  }
}

// --------------- Evento DOMContentLoaded ---------------

document.addEventListener("DOMContentLoaded", () => {
  cargarMangas();
  cargarInfoManga();
});
const params = new URLSearchParams(window.location.search);
const manga = params.get("manga");
const capParam = params.get("cap");
const capIndex = capParam ? parseInt(capParam, 10) - 1 : 0;

const tituloCap = document.getElementById("titulo-capitulo");
const imagenesContainer = document.getElementById("imagenes-capitulo");

if (!manga || isNaN(capIndex) || capIndex < 0) {
  tituloCap.textContent = "Parámetros inválidos";
  imagenesContainer.innerHTML = "<p>No se pudo cargar el capítulo porque faltan parámetros válidos en la URL.</p>";
  throw new Error("Parámetros inválidos en URL");
} else {
  tituloCap.textContent = `${manga} - Capítulo ${capIndex + 1}`;
}

async function cargarCapitulo() {
  try {
    const capRef = ref(db, `mangas/${manga}/capitulos/${capIndex}`);
    const snapshot = await get(capRef);

    if (!snapshot.exists()) {
      imagenesContainer.innerHTML = `<p>No se encontraron imágenes para este capítulo.</p>`;
      return;
    }

    const imagenes = snapshot.val();

    imagenesContainer.innerHTML = "";

    imagenes.forEach(url => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = `Página del capítulo ${capIndex + 1} de ${manga}`;
      img.className = "img-fluid rounded shadow";
      imagenesContainer.appendChild(img);
    });
  } catch (error) {
    console.error("Error cargando capítulo:", error);
    imagenesContainer.innerHTML = "<p>Error al cargar las imágenes del capítulo.</p>";
  }
}

cargarCapitulo();
