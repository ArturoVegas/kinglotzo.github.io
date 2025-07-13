import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
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
const analytics = getAnalytics(app);
const db = getDatabase(app);

const contenedor = document.getElementById("contenedor-mangas");
const paginacion = document.getElementById("paginacion");

let listaMangas = [];
let paginaActual = 1;

function getMangasPorPagina() {
  return window.innerWidth < 768 ? 6 : 12; // 6 en móvil, 12 en desktop
}

function renderizarPagina(pagina) {
  contenedor.innerHTML = "";

  const mangasPorPagina = getMangasPorPagina();
  const inicio = (pagina - 1) * mangasPorPagina;
  const fin = inicio + mangasPorPagina;
  const mangasAMostrar = listaMangas.slice(inicio, fin);

  mangasAMostrar.forEach(([nombre, data]) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "col-4 col-md-2"; // 3 por fila en móvil, 6 por fila en desktop

    tarjeta.innerHTML = `
      <a href="../html/infoMangas.html?manga=${encodeURIComponent(nombre)}" class="text-decoration-none text-reset">
        <div class="card h-100">
          <img src="${data.portada}" class="card-img-top" alt="${nombre}" />
          <div class="card-body text-center">
            <h5 class="card-title">${nombre}</h5>
            <p class="card-text">Haz clic para ver más</p>
          </div>
        </div>
      </a>
    `;

    contenedor.appendChild(tarjeta);
  });
}

function renderizarPaginacion() {
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
  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (snapshot.exists()) {
      listaMangas = Object.entries(snapshot.val());

      // Opcional: ordenar alfabéticamente por nombre de manga
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

// Para actualizar paginación y página al cambiar tamaño ventana (opcional)
window.addEventListener('resize', () => {
  const mangasPorPagina = getMangasPorPagina();
  const totalPaginas = Math.ceil(listaMangas.length / mangasPorPagina);
  // Ajustar paginaActual si queda fuera del rango después del resize
  if (paginaActual > totalPaginas) paginaActual = totalPaginas > 0 ? totalPaginas : 1;
  renderizarPagina(paginaActual);
  renderizarPaginacion();
});

document.addEventListener("DOMContentLoaded", cargarMangas);
