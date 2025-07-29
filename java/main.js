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
    
// Remove blur effect in standard version mode
    const standardMode = document.body.classList.contains('standard-version');
    if (!standardMode) {
      if (scrolled > 50) {
        mangaBanner.classList.add('blurred');
      } else {
        mangaBanner.classList.remove('blurred');
      }
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

  

  // Sistema de activación de animaciones durante el scroll
  let scrollTimeout;
  let isScrolling = false;
  
  function activarAnimacionesScroll() {
    // Si no está ya scrolleando, activar animaciones
    if (!isScrolling) {
      isScrolling = true;
      
      // IMPORTANTE: Los elementos de carga NO están en esta lista
      // porque deben mantenerse siempre activos
      const elementosAnimados = [
        'body::before', // Partículas de fondo
        '.status-dot',  // Indicadores de estado
        '.card-overlay i', // Íconos de cards
        '.skeleton-card', // Loaders skeleton
        '.skeleton-img',
        '.skeleton-title', 
        '.skeleton-text'
        // REMOVIDO: '.spinner-inner', '.loader-text', '.loading::after'
        // Estos elementos de carga se mantienen siempre activos
      ];
      
      // Añadir clase para activar animaciones
      document.body.classList.add('scrolling-active');
    }
    
    // Limpiar timeout anterior
    clearTimeout(scrollTimeout);
    
    // Pausar animaciones después de 800ms sin scroll
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      document.body.classList.remove('scrolling-active');
    }, 800);
  }
  
  // Usar passive listener para mejor rendimiento
  window.addEventListener('scroll', activarAnimacionesScroll, { passive: true });

  // === SISTEMA DE VERSIÓN ESTÁNDAR ===
  let performanceWarningShown = false;
  let standardVersion = localStorage.getItem('standardVersion') === 'true';
  
  // Aplicar versión estándar al cargar si está guardada
  if (standardVersion) {
    document.body.classList.add('standard-version');
  }
  
  // Crear botón de advertencia de rendimiento
  function createPerformanceWarning() {
    const warningBtn = document.getElementById('performance-warning-btn');
    if (!warningBtn) return;

    // Show button
    warningBtn.style.display = 'block';

    warningBtn.addEventListener('click', () => {
      toggleStandardVersion();
      warningBtn.style.display = 'none';
    });
  }
  
  // Alternar entre versión completa y estándar
  function toggleStandardVersion() {
    standardVersion = !standardVersion;
    
    if (standardVersion) {
      document.body.classList.add('standard-version');
      localStorage.setItem('standardVersion', 'true');
      showVersionNotification('Versión estándar activada - Animaciones reducidas');
    } else {
      document.body.classList.remove('standard-version');
      localStorage.setItem('standardVersion', 'false');
      showVersionNotification('Versión completa activada - Todas las animaciones');
    }
    
    // Ocultar el botón de advertencia
    const warningBtn = document.querySelector('.performance-warning');
    if (warningBtn) {
      warningBtn.style.display = 'none';
    }
  }
  
  // Mostrar notificación de cambio de versión
  function showVersionNotification(message) {
    // Remover notificación existente
    const existingNotification = document.querySelector('.version-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'version-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
      notification.style.display = 'block';
    }, 100);
    
    // Ocultar después de 4 segundos
    setTimeout(() => {
      notification.style.display = 'none';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }
  
  // Detectar posibles problemas de rendimiento
  function detectPerformanceIssues() {
    if (performanceWarningShown || standardVersion) return;
    
    let lagCount = 0;
    let lastTime = performance.now();
    
    function checkFrameRate() {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      // Si el frame tarda más de 20ms (menos de 50 FPS)
      if (deltaTime > 20) {
        lagCount++;
        
        // Si detectamos lag en 10 frames seguidos
        if (lagCount >= 10 && !performanceWarningShown) {
          performanceWarningShown = true;
          createPerformanceWarning();
          return; // Detener el monitoreo
        }
      } else {
        lagCount = Math.max(0, lagCount - 1);
      }
      
      lastTime = currentTime;
      requestAnimationFrame(checkFrameRate);
    }
    
    // Comenzar monitoreo después de 3 segundos
    setTimeout(() => {
      requestAnimationFrame(checkFrameRate);
    }, 3000);
  }
  
  // Mostrar botón de advertencia durante la carga inicial (solo si no está en modo estándar)
  if (!standardVersion) {
    createPerformanceWarning();
    
    // Ocultar el botón después de 10 segundos si no se usa
    setTimeout(() => {
      const warningBtn = document.querySelector('.performance-warning');
      if (warningBtn && warningBtn.style.display === 'block') {
        warningBtn.style.opacity = '0.7';
        setTimeout(() => {
          if (warningBtn && warningBtn.style.display === 'block') {
            warningBtn.style.display = 'none';
          }
        }, 2000);
      }
    }, 10000);
  }
  
  // Iniciar detección de rendimiento
  detectPerformanceIssues();
  
  // === BOTÓN DE ALTERNANCIA EN EL HEADER ===
  const versionToggleBtn = document.getElementById('version-toggle-btn');
  const versionIcon = document.getElementById('version-icon');
  const versionText = document.getElementById('version-text');
  
  // Elementos del botón móvil
  const versionToggleBtnMobile = document.getElementById('version-toggle-btn-mobile');
  const versionIconMobile = document.getElementById('version-icon-mobile');
  const versionTextMobile = document.getElementById('version-text-mobile');
  
  // Función para actualizar el botón del header
  function updateHeaderButton() {
    if (!versionToggleBtn) return;
    
    if (standardVersion) {
      // En versión estándar - mostrar opción para activar completa
      versionIcon.className = 'bi bi-stars me-1';
      versionText.textContent = 'Completa';
      versionToggleBtn.className = 'btn btn-outline-primary ms-3 d-none d-lg-inline-flex';
      versionToggleBtn.title = 'Cambiar a versión completa con todas las animaciones';
      // Actualizar botón móvil si existe
      if (versionIconMobile && versionTextMobile) {
        versionIconMobile.className = 'bi bi-stars me-2';
        versionTextMobile.textContent = 'Cambiar a Completa';
      }
    } else {
      // En versión completa - mostrar opción para activar estándar
      versionIcon.className = 'bi bi-lightning me-1';
      versionText.textContent = 'Estándar';
      versionToggleBtn.className = 'btn btn-outline-warning ms-3 d-none d-lg-inline-flex';
      versionToggleBtn.title = 'Cambiar a versión estándar con animaciones reducidas';
      // Actualizar botón móvil si existe
      if (versionIconMobile && versionTextMobile) {
        versionIconMobile.className = 'bi bi-lightning me-2';
        versionTextMobile.textContent = 'Cambiar a Estándar';
      }
    }
    // Las clases de Bootstrap se encargan de la visibilidad
    // d-none d-lg-inline-flex: oculto por defecto, visible solo en lg y superior
    // d-lg-none: visible por defecto, oculto en lg y superior
  }
  
  // Event listener para el botón del header
  if (versionToggleBtn) {
    versionToggleBtn.addEventListener('click', () => {
      toggleStandardVersion();
    });
    
    // Actualizar botón al cargar
    updateHeaderButton();
    // Actualizar botón al ajustar tamaño
    window.addEventListener('resize', updateHeaderButton);
  }
  
  // Event listener para el botón móvil si existe
  if (versionToggleBtnMobile) {
    versionToggleBtnMobile.addEventListener('click', () => {
      toggleStandardVersion();
    });
  }
  
  // Sobrescribir la función toggleStandardVersion para incluir actualización del botón
  const originalToggle = toggleStandardVersion;
  toggleStandardVersion = function() {
    originalToggle();
    updateHeaderButton();
  };

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
