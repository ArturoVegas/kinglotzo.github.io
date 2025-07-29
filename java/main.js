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

  

  // Sistema de animaciones de entrada - Solo una vez al cargar
  let animacionesInicialesEjecutadas = false;
  
  function ejecutarAnimacionesIniciales() {
    if (animacionesInicialesEjecutadas) return;
    
    animacionesInicialesEjecutadas = true;
    
    // Aplicar animaciones iniciales directamente a las cards existentes
    const popularCards = document.querySelectorAll('.popular-card-wrapper');
    popularCards.forEach((card, index) => {
      // Marcar inmediatamente como procesada para evitar reactivación
      card.setAttribute('data-animation-processed', 'true');
      
      // Resetear estado inicial con !important via atributo de estilo
      card.setAttribute('style', 'opacity: 0 !important; transform: translateY(30px) !important; transition: opacity 0.6s ease-out, transform 0.6s ease-out !important;');
      
      // Aplicar animación con delay
      setTimeout(() => {
        // Estado final con !important para que no sea sobrescrito
        card.setAttribute('style', 'opacity: 1 !important; transform: translateY(0) !important; transition: opacity 0.6s ease-out, transform 0.6s ease-out !important;');
        
        // Marcar como animada después de la transición
        setTimeout(() => {
          card.classList.add('animated');
          // Estado final permanente sin transición
          card.setAttribute('style', 'opacity: 1 !important; transform: translateY(0) !important;');
        }, 600);
      }, (index + 1) * 100);
    });
    
    // También aplicar a otras secciones si existen
    const sections = document.querySelectorAll('.col-md-6, .col-md-4');
    sections.forEach((section, index) => {
      section.style.opacity = '1';
      section.style.transform = 'translateX(0)';
      section.setAttribute('data-animation-processed', 'true');
    });
    
    console.log('✅ Animaciones iniciales ejecutadas una sola vez');
  }
  
  // Ejecutar animaciones iniciales después del contenido cargado
  // Esperar tanto el DOM como el contenido dinámico Y el mobile optimizer
  function esperarYEjecutarAnimaciones() {
    // Verificar si hay contenido cargado
    const checkContent = () => {
      const popularCards = document.querySelectorAll('.popular-card-wrapper');
      if (popularCards.length > 0) {
        // Asegurar que las cards estén en estado inicial correcto
        popularCards.forEach(card => {
          if (!card.classList.contains('animated')) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
          }
        });
        ejecutarAnimacionesIniciales();
      } else {
        // Reintentar después de un breve delay
        setTimeout(checkContent, 300);
      }
    };
    
    // Esperar más tiempo para que mobile optimizer termine
    setTimeout(checkContent, 1500);
  }
  
  esperarYEjecutarAnimaciones();
  
  // Sistema de protección para evitar que las animaciones se reactiven
  function protegerAnimacionesCards() {
    // Observer para proteger las cards animadas de modificaciones externas
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          
          // Solo proteger cards que ya han sido animadas
          if (target.classList.contains('popular-card-wrapper') && 
              target.classList.contains('animated') &&
              target.getAttribute('data-animation-processed') === 'true') {
            
            // Verificar si el estilo fue modificado por código externo
            const currentStyle = target.getAttribute('style') || '';
            
            // Si no tiene el estado final correcto, restaurarlo
            if (!currentStyle.includes('opacity: 1 !important') || 
                !currentStyle.includes('translateY(0)')) {
              
              console.log('🛡️ Protegiendo card de modificación externa');
              target.setAttribute('style', 'opacity: 1 !important; transform: translateY(0) !important;');
            }
          }
        }
      });
    });
    
    // Observar cambios en el documento
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    });
    
    console.log('🛡️ Sistema de protección de animaciones activado');
  }
  
  // Activar protección después de las animaciones iniciales
  setTimeout(() => {
    protegerAnimacionesCards();
  }, 3000);

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
