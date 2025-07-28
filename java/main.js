import { cargarMangas, setupResizeListener } from "./mangas.js";
import { cargarInfoManga } from "./infoMangas.js";
import { cargarCapitulo } from "./vermangas.js";
import { cargarUltimasActualizaciones } from "./index.js";
import { cargarNombresMangas, inicializarBuscadorConAutocomplete } from "./buscador.js";
import { cargarMangasPopulares } from "./mangasPopulares.js";
import { cargarCarruselPrincipal } from "./carrusel.js";
import { cargarNoticias } from "./noticias.js";
import { initAuth } from "./auth.js";
import { agregarMangaALista } from "./infoMangas.js";

// Función para mostrar notificaciones toast
function mostrarToast(mensaje, tipo = 'info') {
  const toastContainer = document.getElementById('toast-container') || crearContainerToast();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${tipo}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="bi bi-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
      <span>${mensaje}</span>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="bi bi-x"></i>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Animación de entrada
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function crearContainerToast() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Función para manejar errores globales
function manejarErrorGlobal(error, contexto = '') {
  console.error(`Error en ${contexto}:`, error);
  mostrarToast(`Error: ${error.message || 'Algo salió mal'}`, 'error');
}

/* Efecto blur en scroll para el banner del manga */
function initScrollBlurEffect() {
  const mangaBanner = document.getElementById('manga-banner');
  if (!mangaBanner) return;
  
  let ticking = false;
  
  function updateBlur() {
    const scrolled = window.pageYOffset;
    
    if (scrolled > 50) {
      mangaBanner.classList.add('blurred');
    } else {
      mangaBanner.classList.remove('blurred');
    }
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateBlur);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick);
}

// Event listener para errores no manejados
window.addEventListener('error', (event) => {
  manejarErrorGlobal(event.error, 'JavaScript');
});

window.addEventListener('unhandledrejection', (event) => {
  manejarErrorGlobal(event.reason, 'Promise');
});

document.addEventListener("DOMContentLoaded", () => {
  const pathname = window.location.pathname;

  if (pathname.endsWith("mangas.html")) {
    cargarMangas();
    setupResizeListener();
  }

  if (pathname.endsWith("infoMangas.html")) {
    cargarInfoManga();
     const dropdownItems = document.querySelectorAll(".dropdown-menu .dropdown-item");
    dropdownItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const lista = item.dataset.lista;
        agregarMangaALista(lista);
      });
    });
    
    // Inicializar efecto blur en scroll para el banner
    initScrollBlurEffect();
  }

  if (pathname.endsWith("vermangas.html")) {
    const params = new URLSearchParams(window.location.search);
    const manga = params.get("manga");
    const cap = params.get("cap");

    const tituloCap = document.getElementById("titulo-capitulo");
    const imagenesContainer = document.getElementById("imagenes-capitulo");

    cargarCapitulo(manga, cap, tituloCap, imagenesContainer);
  }

const page = window.location.pathname.split("/").pop();

if (page === "" || page === "index.html") {
  console.log("✅ Página index detectada, cargando últimas actualizaciones...");
  cargarUltimasActualizaciones()
    .then(() => console.log("✅ Últimas actualizaciones cargadas correctamente"))
    .catch(err => console.error("❌ Error cargando últimas actualizaciones:", err));
}

  

  // Buscador (para todas las páginas que tengan el formulario)
  cargarNombresMangas().then(() => {
    inicializarBuscadorConAutocomplete();
    cargarMangasPopulares();
     cargarCarruselPrincipal();
    cargarNoticias();
  });

  // Inicializar sistema de autenticación
  initAuth();
});
