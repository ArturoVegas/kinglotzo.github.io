import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";

let listaMangas = [];
let listaFiltrada = [];
let paginaActual = 1;

const contenedor = document.getElementById("contenedor-mangas");
const paginacion = document.getElementById("paginacion");
const dropdownGenero = document.getElementById("dropdown-genero");
const btnEstadoFiltro = document.getElementById("btnEstadoFiltro");
const listaEstado = document.getElementById("listaEstado");
const btnFrecuenciaFiltro = document.getElementById("btnFrecuenciaFiltro");
const listaFrecuencia = document.getElementById("listaFrecuencia");

let generosSeleccionados = new Set();
let estadoSeleccionado = "";
let frecuenciaSeleccionada = "";

function getMangasPorPagina() {
  return window.innerWidth < 768 ? 9 : 12;
}

function renderizarPagina(pagina) {
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const mangasPorPagina = getMangasPorPagina();
  const inicio = (pagina - 1) * mangasPorPagina;
  const fin = inicio + mangasPorPagina;
  const mangasAMostrar = listaFiltrada.slice(inicio, fin);

  if (mangasAMostrar.length === 0) {
    contenedor.innerHTML = "<p class='text-light'>No hay mangas que coincidan con los filtros.</p>";
    paginacion.innerHTML = "";
    return;
  }

  mangasAMostrar.forEach(([nombre, data], index) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "col manga-card-wrapper";
    
    // Añadir animación escalonada
    tarjeta.style.opacity = '0';
    tarjeta.style.transform = 'translateY(30px)';
    tarjeta.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    // Formatear información
    const tituloFormateado = nombre.replaceAll("_", " ");
    const imagenSrc = data.portada || '../Recursos/imagenes/placeholder-manga.jpg';
    
    // Formatear estado
    const estadoTexto = {
      'En emisión': 'En Emisión',
      'Finalizado': 'Completado',
      'Pausado': 'Pausado',
      'ongoing': 'En Emisión',
      'completed': 'Completado',
      'paused': 'Pausado'
    }[data.estado] || data.estado || 'Sin estado';
    
    // Formatear géneros (máximo 3)
    const generosTexto = data.generos && data.generos.length > 0 
      ? data.generos.slice(0, 3).join(', ')
      : 'Sin géneros';
    
    // Obtener último capítulo
    let ultimoCapitulo = 'N/A';
    if (data.capitulos && typeof data.capitulos === 'object') {
      const capitulos = Object.keys(data.capitulos);
      if (capitulos.length > 0) {
        // Ordenar capítulos numéricamente
        const capitulosOrdenados = capitulos.sort((a, b) => {
          const numA = parseFloat(a) || 0;
          const numB = parseFloat(b) || 0;
          return numB - numA;
        });
        ultimoCapitulo = capitulosOrdenados[0];
      }
    }

    tarjeta.innerHTML = `
      <a href="../html/infoMangas.html?manga=${encodeURIComponent(nombre)}" class="text-decoration-none text-reset manga-link">
        <div class="card h-100 manga-card">
          <div class="card-image-container">
            <img src="${imagenSrc}" 
                 class="card-img-top manga-img" 
                 alt="${tituloFormateado}"
                 loading="lazy"
                 onerror="this.src='../Recursos/imagenes/placeholder-manga.jpg'; this.alt='Imagen no disponible';" />
            <div class="card-overlay">
              <i class="bi bi-eye-fill"></i>
              <span>Ver Detalles</span>
            </div>
            <div class="manga-status-badge status-${data.estado?.toLowerCase() || 'unknown'}">
              ${estadoTexto}
            </div>
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title manga-title" title="${tituloFormateado}">${tituloFormateado}</h5>
            <div class="manga-info flex-grow-1">
              <div class="manga-genres" title="${generosTexto}">
                <i class="bi bi-tags-fill me-1"></i>
                <span>${generosTexto}</span>
              </div>
              <div class="manga-chapter">
                <i class="bi bi-bookmark-fill me-1"></i>
                <span>Cap. ${ultimoCapitulo}</span>
              </div>
            </div>
            <div class="manga-footer mt-auto">
              <div class="manga-status">
                <span class="status-indicator status-${data.estado?.toLowerCase() || 'unknown'}"></span>
                ${estadoTexto}
              </div>
            </div>
          </div>
        </div>
      </a>
    `;

    contenedor.appendChild(tarjeta);
    
    // Aplicar animación escalonada
    setTimeout(() => {
      tarjeta.style.opacity = '1';
      tarjeta.style.transform = 'translateY(0)';
    }, index * 100);
  });
}


function renderizarPaginacion() {
  if (!paginacion) return;

  paginacion.innerHTML = "";

  const mangasPorPagina = getMangasPorPagina();
  const totalPaginas = Math.ceil(listaFiltrada.length / mangasPorPagina);

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

  if (totalPaginas === 0) return;

  paginacion.appendChild(crearBoton("Anterior", paginaActual - 1, paginaActual === 1));
  for (let i = 1; i <= totalPaginas; i++) {
    paginacion.appendChild(crearBoton(i, i, false, i === paginaActual));
  }
  paginacion.appendChild(crearBoton("Siguiente", paginaActual + 1, paginaActual === totalPaginas));
}

function filtrarMangas() {
  if (
    !estadoSeleccionado &&
    !frecuenciaSeleccionada &&
    generosSeleccionados.size === 0
  ) {
    listaFiltrada = listaMangas;
  } else {
    listaFiltrada = listaMangas.filter(([_, data]) => {
      const coincideEstado = estadoSeleccionado
        ? data.estado === estadoSeleccionado
        : false;

      const coincideFrecuencia = frecuenciaSeleccionada
        ? data.frecuencia === frecuenciaSeleccionada
        : false;

      let coincideGenero = false;
      if (generosSeleccionados.size > 0 && Array.isArray(data.generos)) {
        for (const gen of generosSeleccionados) {
          if (data.generos.includes(gen)) {
            coincideGenero = true;
            break;
          }
        }
      }

      return coincideEstado || coincideFrecuencia || coincideGenero;
    });
  }

  paginaActual = 1;
  renderizarPagina(paginaActual);
  renderizarPaginacion();
}


function crearCheckboxGenero(genero) {
  const li = document.createElement("li");
  li.className = "dropdown-item";

  const id = `gen-${genero.replace(/\s+/g, '-')}`;

  li.innerHTML = `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" value="${genero}" id="${id}">
      <label class="form-check-label" for="${id}">${genero}</label>
    </div>
  `;

  const checkbox = li.querySelector("input");
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) generosSeleccionados.add(genero);
    else generosSeleccionados.delete(genero);
    filtrarMangas();
  });

  return li;
}

function llenarDropdownGeneros() {
  if (!dropdownGenero) return;
  dropdownGenero.innerHTML = "";

  const generosUnicos = new Set();

  listaMangas.forEach(([_, data]) => {
    if (data.generos && Array.isArray(data.generos)) {
      data.generos.forEach(g => generosUnicos.add(g));
    }
  });

  Array.from(generosUnicos).sort().forEach(genero => {
    dropdownGenero.appendChild(crearCheckboxGenero(genero));
  });
}

function configurarFiltrosEstado() {
  if (!listaEstado || !btnEstadoFiltro) return;
  listaEstado.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      estadoSeleccionado = a.dataset.estado || "";
      btnEstadoFiltro.textContent = estadoSeleccionado || "Estado Todo";
      filtrarMangas();
    });
  });
}

function configurarFiltrosFrecuencia() {
  if (!listaFrecuencia || !btnFrecuenciaFiltro) return;
  listaFrecuencia.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      frecuenciaSeleccionada = a.dataset.frecuencia || "";
      btnFrecuenciaFiltro.textContent = frecuenciaSeleccionada || "Frecuencia Todo";
      filtrarMangas();
    });
  });
}

async function cargarMangas() {
  if (!contenedor) return;

  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (snapshot.exists()) {
      listaMangas = Object.entries(snapshot.val());
      listaMangas.sort((a, b) => a[0].localeCompare(b[0]));
      listaFiltrada = listaMangas;

      llenarDropdownGeneros();
      configurarFiltrosEstado();
      configurarFiltrosFrecuencia();

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

function setupResizeListener() {
  window.addEventListener('resize', () => {
    if (!contenedor) return;
    const mangasPorPagina = getMangasPorPagina();
    const totalPaginas = Math.ceil(listaFiltrada.length / mangasPorPagina);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas > 0 ? totalPaginas : 1;
    renderizarPagina(paginaActual);
    renderizarPaginacion();
  });
}

export { cargarMangas, setupResizeListener };
