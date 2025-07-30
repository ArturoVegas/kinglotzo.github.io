// Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { initAuth } from "./auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyArUObX1yvBE1F7JOotiFVBVp_FuFGtLks",
  authDomain: "prueba-base-de-datos-270a7.firebaseapp.com",
  databaseURL: "https://prueba-base-de-datos-270a7-default-rtdb.firebaseio.com",
  projectId: "prueba-base-de-datos-270a7",
  storageBucket: "prueba-base-de-datos-270a7.appspot.com",
  messagingSenderId: "190031828502",
  appId: "1:190031828502:web:e8c9ba978b037cce008737",
  measurementId: "G-W512T7N7GB"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==============================
// REFERENCIAS DOM
// ==============================
const contenedorItems = document.getElementById('contenedor-items');
const btnTodos = document.getElementById('btnTodos');
const btnMangas = document.getElementById('btnMangas');
const btnNovelas = document.getElementById('btnNovelas');
const inputBuscar = document.getElementById('input-buscar');
const dropdownGenero = document.getElementById('dropdown-genero');
const btnEstadoFiltro = document.getElementById('btnEstadoFiltro');
const btnFrecuenciaFiltro = document.getElementById('btnFrecuenciaFiltro');

// Variables globales
let allItems = [];
let filteredItems = [];
let currentFilters = {
  tipo: '',
  genero: '',
  estado: '',
  frecuencia: '',
  busqueda: ''
};

// Variables de paginación
let currentPage = 1;
const itemsPerPage = 12; // Número de elementos por página

// Géneros disponibles
const generosValidos = ["Acción", "Aventura", "Romance", "Comedia", "Drama", "Fantasia", "Recuentos de la vida", "Terror", "Misterio"];

// ==============================
// CARGAR DATOS
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [mangasSnapshot, novelasSnapshot] = await Promise.all([
      get(ref(db, 'mangas')),
      get(ref(db, 'novelas'))
    ]);

    if (mangasSnapshot.exists()) {
      const mangas = mangasSnapshot.val();
      Object.keys(mangas).forEach(key => {
        allItems.push({ ...mangas[key], id: key, tipo: 'manga' });
      });
    }

    if (novelasSnapshot.exists()) {
      const novelas = novelasSnapshot.val();
      Object.keys(novelas).forEach(key => {
        allItems.push({ ...novelas[key], id: key, tipo: 'novela' });
      });
    }
    
    initializeGenreFilter();
    initializeStateFilter();
    initializeFrequencyFilter();
    initializeTypeButtons();
    initializeSearch();
    initializePagination();
    initAuth();
    
    filteredItems = [...allItems];
    displayItems(filteredItems);
  } catch (error) {
    console.error("Error al cargar la biblioteca:", error);
  }
});

// ==============================
// MOSTRAR ITEMS CON PAGINACIÓN
// ==============================
function displayItems(items) {
  // Calcular elementos para la página actual
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToShow = items.slice(startIndex, endIndex);
  
  contenedorItems.innerHTML = '';
  itemsToShow.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'col manga-card-wrapper';
    
    // Añadir animación escalonada
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    // Formatear información
    const tituloFormateado = item.id.replaceAll("_", " ");
    const imagenSrc = item.portada || 'https://via.placeholder.com/300x400/2a2a2a/ffffff?text=Sin+Imagen';
    
    // Formatear estado
    const estadoTexto = {
      'En emisión': 'En Emisión',
      'Finalizado': 'Completado',
      'Pausado': 'Pausado',
      'ongoing': 'En Emisión',
      'completed': 'Completado',
      'paused': 'Pausado'
    }[item.estado] || item.estado || 'Sin estado';
    
    // Formatear géneros (máximo 3)
    const generosTexto = item.generos && item.generos.length > 0 
      ? item.generos.slice(0, 3).join(', ')
      : 'Sin géneros';
    
    // Obtener último capítulo
    let ultimoCapitulo = 'N/A';
    if (item.capitulos && typeof item.capitulos === 'object') {
      const capitulos = Object.keys(item.capitulos);
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

    card.innerHTML = `
      <a href="infoMangas.html?id=${encodeURIComponent(item.id)}&tipo=${item.tipo}" class="text-decoration-none text-reset manga-link">
        <div class="card h-100 manga-card">
          <div class="card-image-container">
            <img src="${imagenSrc}" 
                 class="card-img-top manga-img" 
                 alt="${tituloFormateado}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x400/2a2a2a/ffffff?text=Sin+Imagen'; this.alt='Imagen no disponible';" />
            <div class="card-overlay">
              <i class="bi bi-eye-fill"></i>
              <span>Ver Detalles</span>
            </div>
            <div class="manga-status-badge status-${item.estado?.toLowerCase() || 'unknown'}">
              ${estadoTexto}
            </div>
            <div class="tipo-badge ${item.tipo}-badge">
              ${item.tipo.toUpperCase()}
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
                <span class="status-indicator status-${item.estado?.toLowerCase() || 'unknown'}"></span>
                ${estadoTexto}
              </div>
            </div>
          </div>
        </div>
      </a>
    `;

    contenedorItems.appendChild(card);
    
    // Aplicar animación escalonada
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });
  
  // Actualizar controles de paginación
  updatePagination(items.length);
}

// ==============================
// FILTROS
// ==============================

function applyFilters() {
  filteredItems = allItems.filter(item => {
    const matchTipo = currentFilters.tipo === '' || item.tipo === currentFilters.tipo;
    const matchGenero = currentFilters.genero === '' || (item.generos && item.generos.includes(currentFilters.genero));
    const matchEstado = currentFilters.estado === '' || item.estado === currentFilters.estado;
    const matchFrecuecia = currentFilters.frecuencia === '' || item.frecuencia === currentFilters.frecuencia;
    const matchBusqueda = currentFilters.busqueda === '' || item.id.toLowerCase().includes(currentFilters.busqueda);

    return matchTipo && matchGenero && matchEstado && matchFrecuecia && matchBusqueda;
  });

  // Resetear a la primera página cuando se apliquen filtros
  currentPage = 1;
  displayItems(filteredItems);
}

// Inicializar botones de tipo de contenido
function initializeTypeButtons() {
  const buttons = [btnTodos, btnMangas, btnNovelas];
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilters.tipo = button.getAttribute('data-tipo');
      applyFilters();
    });
  });
}

// Inicializar filtro de género
function initializeGenreFilter() {
  dropdownGenero.innerHTML = '<li><a class="dropdown-item" href="#" data-genero="">Todos</a></li>';
  generosValidos.forEach(genero => {
    const li = document.createElement('li');
    li.innerHTML = `<a class="dropdown-item" href="#" data-genero="${genero}">${genero}</a>`;
    dropdownGenero.appendChild(li);
  });

  dropdownGenero.addEventListener('click', (e) => {
    if (e.target.matches('.dropdown-item')) {
      e.preventDefault();
      currentFilters.genero = e.target.getAttribute('data-genero');
      applyFilters();
    }
  });
}

// Inicializar filtro de estado
function initializeStateFilter() {
  const listaEstado = document.getElementById('listaEstado');
  listaEstado.addEventListener('click', (e) => {
    if (e.target.matches('.dropdown-item')) {
      e.preventDefault();
      currentFilters.estado = e.target.getAttribute('data-estado');
      btnEstadoFiltro.textContent = `Estado ${currentFilters.estado || 'Todo'}`;
      applyFilters();
    }
  });
}

// Inicializar filtro de frecuencia
function initializeFrequencyFilter() {
  const listaFrecuencia = document.getElementById('listaFrecuencia');
  listaFrecuencia.addEventListener('click', (e) => {
    if (e.target.matches('.dropdown-item')) {
      e.preventDefault();
      currentFilters.frecuencia = e.target.getAttribute('data-frecuencia');
      btnFrecuenciaFiltro.textContent = `Frecuencia ${currentFilters.frecuencia || 'Todo'}`;
      applyFilters();
    }
  });
}

// Inicializar búsqueda
function initializeSearch() {
  inputBuscar.addEventListener('input', () => {
    currentFilters.busqueda = inputBuscar.value.trim().toLowerCase();
    applyFilters();
  });
}

// ==============================
// SISTEMA DE PAGINACIÓN
// ==============================
function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Referencias a elementos de paginación
  const btnAnterior = document.getElementById('btnAnterior');
  const btnSiguiente = document.getElementById('btnSiguiente');
  const paginaActual = document.getElementById('paginaActual');
  
  if (!btnAnterior || !btnSiguiente || !paginaActual) return;
  
  // Actualizar texto de página actual
  paginaActual.textContent = `${currentPage} de ${totalPages}`;
  
  // Actualizar estado del botón anterior
  const btnAnteriorParent = btnAnterior.parentElement;
  if (currentPage <= 1) {
    btnAnteriorParent.classList.add('disabled');
  } else {
    btnAnteriorParent.classList.remove('disabled');
  }
  
  // Actualizar estado del botón siguiente
  const btnSiguienteParent = btnSiguiente.parentElement;
  if (currentPage >= totalPages) {
    btnSiguienteParent.classList.add('disabled');
  } else {
    btnSiguienteParent.classList.remove('disabled');
  }
}

// Inicializar controles de paginación
function initializePagination() {
  const btnAnterior = document.getElementById('btnAnterior');
  const btnSiguiente = document.getElementById('btnSiguiente');
  
  if (btnAnterior) {
    btnAnterior.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        displayItems(filteredItems);
      }
    });
  }
  
  if (btnSiguiente) {
    btnSiguiente.addEventListener('click', (e) => {
      e.preventDefault();
      const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        displayItems(filteredItems);
      }
    });
  }
}
