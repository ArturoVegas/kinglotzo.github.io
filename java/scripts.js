// scripts.js (unificado para mangas.html, infoMangas.html, vermangas.html, index.html)

// Importación y configuración Firebase
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

// ------------------- Función para calcular tiempo relativo -------------------

/**
 * Calcula una cadena con tiempo relativo desde un timestamp dado.
 * Ejemplo: "hace 1 día y 3 horas"
 * @param {string|number|Date} timestamp - Fecha en formato válido
 * @returns {string} - Tiempo relativo en español
 */
function tiempoDesde(timestamp) {
  if (!timestamp) return "";

  let segundos = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (segundos < 0) return "justo ahora";

  const unidades = [
    { nombre: "año", valor: 31536000 },
    { nombre: "mes", valor: 2592000 },
    { nombre: "día", valor: 86400 },
    { nombre: "hora", valor: 3600 },
    { nombre: "minuto", valor: 60 },
    { nombre: "segundo", valor: 1 }
  ];

  const partes = [];

  for (let unidad of unidades) {
    const cantidad = Math.floor(segundos / unidad.valor);
    if (cantidad > 0) {
      partes.push(`${cantidad} ${unidad.nombre}${cantidad > 1 ? "s" : ""}`);
      segundos = segundos % unidad.valor; // resto
      if (partes.length === 2) break; // máximo dos unidades
    }
  }

  return partes.length ? `hace ${partes.join(" y ")}` : "justo ahora";
}

// ------------------- Código para mangas.html -------------------

const contenedor = document.getElementById("contenedor-mangas");
const paginacion = document.getElementById("paginacion");

let listaMangas = [];
let paginaActual = 1;

/**
 * Determina la cantidad de mangas a mostrar por página
 * según el tamaño de ventana (responsive).
 * @returns {number}
 */
function getMangasPorPagina() {
  return window.innerWidth < 768 ? 6 : 12;
}

/**
 * Renderiza las tarjetas de mangas en la página actual.
 * @param {number} pagina
 */
function renderizarPagina(pagina) {
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const mangasPorPagina = getMangasPorPagina();
  const inicio = (pagina - 1) * mangasPorPagina;
  const fin = inicio + mangasPorPagina;
  const mangasAMostrar = listaMangas.slice(inicio, fin);

  mangasAMostrar.forEach(([nombre, data]) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = window.innerWidth < 768 ? "col-6" : "col-2";

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

/**
 * Renderiza los controles de paginación.
 */
function renderizarPaginacion() {
  if (!paginacion) return;

  paginacion.innerHTML = "";

  const mangasPorPagina = getMangasPorPagina();
  const totalPaginas = Math.ceil(listaMangas.length / mangasPorPagina);

  /**
   * Crea un botón para la paginación.
   */
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

/**
 * Carga la lista de mangas desde Firebase.
 */
async function cargarMangas() {
  if (!contenedor) return;

  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (snapshot.exists()) {
      listaMangas = Object.entries(snapshot.val());
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

// Redibujar paginación y mangas al cambiar tamaño ventana (responsive)
window.addEventListener('resize', () => {
  if (!contenedor) return;
  const mangasPorPagina = getMangasPorPagina();
  const totalPaginas = Math.ceil(listaMangas.length / mangasPorPagina);
  if (paginaActual > totalPaginas) paginaActual = totalPaginas > 0 ? totalPaginas : 1;
  renderizarPagina(paginaActual);
  renderizarPaginacion();
});

// ------------------- Código para infoMangas.html -------------------

/**
 * Obtiene el parámetro "manga" de la URL.
 * @returns {string|null}
 */
function obtenerNombreMangaDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("manga");
}

/**
 * Carga y muestra la información del manga seleccionado.
 */
async function cargarInfoManga() {
  const portadaEl = document.getElementById("manga-portada");
  if (!portadaEl) return;

  const nombreManga = obtenerNombreMangaDesdeURL();
  if (!nombreManga) return;

  try {
    const snapshot = await get(ref(db, `mangas/${nombreManga}`));
    if (snapshot.exists()) {
      const data = snapshot.val();

      // Helper para asignar texto a elemento por id
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
        if (typeof data.capitulos === "object" && data.capitulos !== null) {
          // Ordenar claves (capítulos) numérica o alfabéticamente
          const clavesOrdenadas = Object.keys(data.capitulos).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
          );

          clavesOrdenadas.forEach(clave => {
            const cap = data.capitulos[clave];
            let fecha = "";

            // Si la info de capítulo tiene fecha, calcular tiempo relativo
            if (cap && typeof cap === "object" && !Array.isArray(cap) && cap.fecha) {
              fecha = tiempoDesde(cap.fecha);
            }

            const li = document.createElement("li");
            li.className = "list-group-item p-0 rectangulo-item d-flex justify-content-between align-items-center";

            const enlace = document.createElement("a");
            enlace.href = `../html/vermangas.html?manga=${encodeURIComponent(nombreManga)}&cap=${encodeURIComponent(clave)}`;
            enlace.className = "enlace-cap py-2 px-3 flex-grow-1 text-decoration-none text-reset";
            enlace.textContent = `Capítulo ${clave}`;

            const spanFecha = document.createElement("span");
            spanFecha.className = "text-white small ms-2";
            spanFecha.textContent = fecha;

            li.appendChild(enlace);
            li.appendChild(spanFecha);

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

// ------------------- Código para vermangas.html -------------------

const params = new URLSearchParams(window.location.search);
const manga = params.get("manga");
const capKey = params.get("cap");

const tituloCap = document.getElementById("titulo-capitulo");
const imagenesContainer = document.getElementById("imagenes-capitulo");

if (tituloCap && imagenesContainer) {
  if (!manga || !capKey) {
    tituloCap.textContent = "Parámetros inválidos";
    imagenesContainer.innerHTML = "<p>No se pudo cargar el capítulo porque faltan parámetros válidos en la URL.</p>";
  } else {
    tituloCap.textContent = `${manga.replaceAll("_", " ")} - Capítulo ${capKey}`;

    /**
     * Carga las imágenes del capítulo y las muestra.
     */
    async function cargarCapitulo() {
      try {
        const capRef = ref(db, `mangas/${manga}/capitulos/${capKey}`);
        const snapshot = await get(capRef);

        if (!snapshot.exists()) {
          imagenesContainer.innerHTML = `<p>No se encontraron imágenes para este capítulo.</p>`;
          return;
        }

        const data = snapshot.val();

        // Soportar estructura array o objeto con key 'imagenes'
        const imagenes = Array.isArray(data) ? data : data.imagenes || [];

        imagenesContainer.innerHTML = "";

        imagenes.forEach(url => {
          const img = document.createElement("img");
          img.src = url;
          img.alt = `Página del capítulo ${capKey} de ${manga.replaceAll("_", " ")}`;
          img.className = "img-fluid rounded shadow mb-3";
          imagenesContainer.appendChild(img);
        });
      } catch (error) {
        console.error("Error cargando capítulo:", error);
        imagenesContainer.innerHTML = "<p>Error al cargar las imágenes del capítulo.</p>";
      }
    }

    cargarCapitulo();
  }
}

// ------------------- Código para index.html: Últimas actualizaciones -------------------

const ultimasActualizacionesCont = document.getElementById("ultimas-actualizaciones");

/**
 * Carga y muestra los capítulos más recientes actualizados.
 */
async function cargarUltimasActualizaciones() {
  if (!ultimasActualizacionesCont) return;

  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (!snapshot.exists()) {
      ultimasActualizacionesCont.innerHTML = "<p class='text-light'>No hay mangas disponibles.</p>";
      return;
    }

    const mangas = snapshot.val();
    const capitulosArray = [];

    // Extraer capítulos con fecha para ordenar por fecha de subida
    Object.entries(mangas).forEach(([nombreManga, dataManga]) => {
      if (!dataManga.capitulos) return;

      Object.entries(dataManga.capitulos).forEach(([claveCap, capData]) => {
        let fechaSubida = null;

        if (
          capData &&
          typeof capData === "object" &&
          !Array.isArray(capData) &&
          capData.fecha
        ) {
          fechaSubida = capData.fecha;
        }

        if (!fechaSubida) return;

        capitulosArray.push({
          manga: nombreManga,
          portada: dataManga.portada || "",
          capitulo: claveCap,
          fecha: fechaSubida
        });
      });
    });

    // Ordenar capítulos por fecha descendente (más recientes primero)
    capitulosArray.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const recientes = capitulosArray.slice(0, 6);

    ultimasActualizacionesCont.innerHTML = "";

    if (recientes.length === 0) {
      ultimasActualizacionesCont.innerHTML = "<p class='text-light'>No hay actualizaciones recientes.</p>";
      return;
    }

    // Renderizar las tarjetas con 3 columnas por fila (Bootstrap col-md-4)
    recientes.forEach(({ manga, portada, capitulo, fecha }) => {
      const card = document.createElement("div");
     card.className = "col"; // 6 columnas en md+, 3 en sm, 2 en xs


      card.innerHTML = `
        <a href="./html/vermangas.html?manga=${encodeURIComponent(manga)}&cap=${encodeURIComponent(capitulo)}" class="text-decoration-none text-reset">
          <div class="card h-100">
            <img src="${portada}" class="card-img-top" alt="${manga.replaceAll("_", " ")}" />
            <div class="card-body">
              <h5 class="card-title">${manga.replaceAll("_", " ")}</h5>
              <p class="card-text">Capítulo ${capitulo} - ${tiempoDesde(fecha)}</p>
            </div>
          </div>
        </a>
      `;

      ultimasActualizacionesCont.appendChild(card);
    });

  } catch (error) {
    console.error("Error al cargar últimas actualizaciones:", error);
    ultimasActualizacionesCont.innerHTML = "<p class='text-danger'>Error al cargar últimas actualizaciones.</p>";
  }
}

// ------------------- Evento de carga general -------------------

document.addEventListener("DOMContentLoaded", () => {
  cargarMangas();
  cargarInfoManga();
  cargarUltimasActualizaciones();
});
