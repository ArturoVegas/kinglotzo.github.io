// cubari-reader.js - Lector de manga estilo Cubari

import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";



class CubariReader {
  constructor() {
    this.currentManga = null;
    this.currentChapter = null;
    this.images = [];
    this.currentImageIndex = 0;
    this.availableChapters = [];
    this.zoomLevel = 1;
    this.readingMode = 'vertical'; // vertical, horizontal, webtoon
    this.fitMode = 'fit-width'; // fit-width, fit-height, original-size
    this.spacing = 10;
    this.autoHideTimer = null;
    this.isUIVisible = false;
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadChapterFromURL();
  }

  initializeElements() {
    // Elementos principales
    this.readerContainer = document.getElementById('reader-container');
    this.readerControls = document.getElementById('reader-controls');
    this.readerNavigation = document.getElementById('reader-navigation');
    this.readerInfo = document.getElementById('reader-info');
    this.toggleControls = document.getElementById('toggle-controls');
    this.clickOverlay = document.getElementById('click-overlay');
    this.progressBar = document.getElementById('progress-bar');
    this.commentsSection = document.getElementById('comments-section'); // Nuevo elemento para comentarios
    this.loadingIndicator = document.getElementById('reader-loading');
    
    // Elementos de información
    this.chapterTitle = document.getElementById('chapter-title');
    this.chapterProgress = document.getElementById('chapter-progress');
    this.zoomLevelSpan = document.getElementById('zoom-level');
    
    // Controles
    this.spacingSlider = document.getElementById('spacing-slider');
    this.zoomInBtn = document.getElementById('zoom-in');
    this.zoomOutBtn = document.getElementById('zoom-out');
    
    // Navegación
    this.navPrevChapter = document.getElementById('nav-prev-chapter');
    this.navPrevPage = document.getElementById('nav-prev-page');
    this.navBackManga = document.getElementById('nav-back-manga');
    this.navNextPage = document.getElementById('nav-next-page');
    this.navNextChapter = document.getElementById('nav-next-chapter');
    
    // Zonas de click
    this.clickPrev = document.getElementById('click-prev');
    this.clickMenu = document.getElementById('click-menu');
    this.clickNext = document.getElementById('click-next');
  }

  setupEventListeners() {
    // Toggle de controles
    this.toggleControls.addEventListener('click', () => this.toggleUI());
    
    // Controles de modo de lectura
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => this.changeReadingMode(e.target.dataset.mode));
    });
    
    // Controles de ajuste de imagen
    document.querySelectorAll('[data-fit]').forEach(btn => {
      btn.addEventListener('click', (e) => this.changeFitMode(e.target.dataset.fit));
    });
    
    // Controles de zoom
    this.zoomInBtn.addEventListener('click', () => this.zoomIn());
    this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
    
    // Slider de espaciado
    this.spacingSlider.addEventListener('input', (e) => this.changeSpacing(e.target.value));
    
    // Navegación
    this.navPrevChapter.addEventListener('click', () => this.previousChapter());
    this.navPrevPage.addEventListener('click', () => this.previousPage());
    this.navNextPage.addEventListener('click', () => this.nextPage());
    this.navNextChapter.addEventListener('click', () => this.nextChapter());
    
    // Zonas de click
    this.clickPrev.addEventListener('click', () => this.previousPage());
    this.clickMenu.addEventListener('click', () => this.toggleUI());
    this.clickNext.addEventListener('click', () => this.nextPage());
    
    // Eventos de teclado
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    
    // Scroll para progreso
    window.addEventListener('scroll', () => this.updateProgress());
    
    // Auto-hide UI
    document.addEventListener('mousemove', () => this.showUI());
    document.addEventListener('touchstart', () => this.showUI());
    
    // Responsive
    window.addEventListener('resize', () => this.adjustLayout());
  }

 adjustClickOverlay() {
  // Obtener la posición en píxeles desde arriba donde inicia la sección de comentarios
  const commentsTop = this.commentsSection.offsetTop;

  // Ajustar la altura del clickOverlay para que no lo cubra
  this.clickOverlay.style.height = `${commentsTop}px`;


}






  async loadChapterFromURL() {
    this.showLoading();
    
    const urlParams = new URLSearchParams(window.location.search);
    this.currentManga = urlParams.get('manga');
    this.currentChapter = urlParams.get('cap');
    
    if (!this.currentManga || !this.currentChapter) {
      this.showError('Parámetros de URL inválidos');
      return;
    }
    
    try {
      await this.loadAvailableChapters();
      await this.loadChapterImages();
      this.setupNavigation();
      this.hideLoading();
      this.showUI();
    } catch (error) {
      console.error('Error cargando capítulo:', error);
      this.showError('Error al cargar el capítulo');
    }
  }

  async loadAvailableChapters() {
    try {
      const mangaRef = ref(db, `mangas/${this.currentManga}/capitulos`);
      const snapshot = await get(mangaRef);
      
      if (snapshot.exists()) {
        const chapters = snapshot.val();
        this.availableChapters = Object.keys(chapters).sort((a, b) => parseInt(a) - parseInt(b));
      } else {
        this.availableChapters = [];
      }
    } catch (error) {
      console.error('Error cargando capítulos:', error);
      this.availableChapters = [];
    }
  }

  async loadChapterImages() {
    try {
      const capRef = ref(db, `mangas/${this.currentManga}/capitulos/${this.currentChapter}`);
      const snapshot = await get(capRef);
      
      if (!snapshot.exists()) {
        this.showError('Capítulo no encontrado');
        return;
      }
      
      const data = snapshot.val();
      
      if (!data.imagenes) {
        this.showError('No se encontraron imágenes para este capítulo');
        return;
      }
      
      this.images = Object.values(data.imagenes)
        .filter(url => typeof url === "string" && url.startsWith("http"))
        .map((url, index) => ({
          url,
          index,
          loaded: false
        }));
      
      if (this.images.length === 0) {
        this.showError('No se encontraron imágenes válidas');
        return;
      }
      
      this.updateChapterInfo();
      this.renderImages();
      this.preloadImages();
      
    } catch (error) {
      console.error('Error cargando imágenes:', error);
      this.showError('Error al cargar las imágenes');
    }
  }

  renderImages() {
    this.readerContainer.innerHTML = '';
    this.readerContainer.className = `reader-container ${this.readingMode}`;
    
    this.images.forEach((imageData, index) => {
      const imgElement = document.createElement('img');
      imgElement.className = `reader-image ${this.fitMode}`;
      imgElement.src = imageData.url;
      imgElement.alt = `Página ${index + 1}`;
      imgElement.dataset.index = index;
      
      // Lazy loading
      imgElement.loading = 'lazy';
      
      // Event listeners para cada imagen
      imgElement.addEventListener('load', () => {
        imageData.loaded = true;
        this.updateProgress();
      });
      
      imgElement.addEventListener('click', (e) => {
        if (this.readingMode === 'horizontal') {
          this.nextPage();
        } else {
          this.toggleImageZoom(e.target);
        }
      });
      
      this.readerContainer.appendChild(imgElement);
    });
    
    this.applySpacing();
    this.adjustLayout();
  }

  preloadImages() {
    // Precargar las próximas 3 imágenes
    const startIndex = Math.max(0, this.currentImageIndex - 1);
    const endIndex = Math.min(this.images.length, this.currentImageIndex + 4);
    
    for (let i = startIndex; i < endIndex; i++) {
      if (!this.images[i].loaded) {
        const img = new Image();
        img.src = this.images[i].url;
      }
    }
  }

  changeReadingMode(mode) {
    this.readingMode = mode;
    
    // Actualizar botones activos
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    this.renderImages();
    this.adjustLayout();
  }

  changeFitMode(fit) {
    this.fitMode = fit;
    
    // Actualizar botones activos
    document.querySelectorAll('[data-fit]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fit === fit);
    });
    
    // Aplicar nueva clase a todas las imágenes
    document.querySelectorAll('.reader-image').forEach(img => {
      img.className = `reader-image ${fit}`;
    });
    
    this.adjustLayout();
  }

  changeSpacing(value) {
    this.spacing = parseInt(value);
    this.applySpacing();
  }

  applySpacing() {
    if (this.readingMode === 'vertical' || this.readingMode === 'webtoon') {
      this.readerContainer.style.gap = `${this.spacing}px`;
    }
  }

  zoomIn() {
    this.zoomLevel = Math.min(3, this.zoomLevel + 0.25);
    this.applyZoom();
  }

  zoomOut() {
    this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
    this.applyZoom();
  }

  applyZoom() {
    document.querySelectorAll('.reader-image').forEach(img => {
      img.style.transform = `scale(${this.zoomLevel})`;
    });
    
    this.zoomLevelSpan.textContent = `${Math.round(this.zoomLevel * 100)}%`;
  }

  toggleImageZoom(img) {
    const isZoomed = img.classList.contains('zoomed');
    
    // Limpiar zoom de todas las imágenes
    document.querySelectorAll('.reader-image').forEach(image => {
      image.classList.remove('zoomed');
    });
    
    if (!isZoomed) {
      img.classList.add('zoomed');
    }
  }

  previousPage() {
    if (this.readingMode === 'horizontal') {
      this.readerContainer.scrollLeft -= window.innerWidth;
    } else {
      window.scrollBy(0, -window.innerHeight * 0.8);
    }
  }

  nextPage() {
    if (this.readingMode === 'horizontal') {
      this.readerContainer.scrollLeft += window.innerWidth;
    } else {
      window.scrollBy(0, window.innerHeight * 0.8);
    }
  }

  previousChapter() {
    const currentIndex = this.availableChapters.indexOf(this.currentChapter);
    if (currentIndex > 0) {
      this.navigateToChapter(this.availableChapters[currentIndex - 1]);
    }
  }

  nextChapter() {
    const currentIndex = this.availableChapters.indexOf(this.currentChapter);
    if (currentIndex < this.availableChapters.length - 1) {
      this.navigateToChapter(this.availableChapters[currentIndex + 1]);
    }
  }

  navigateToChapter(chapter) {
    const url = new URL(window.location);
    url.searchParams.set('cap', chapter);
    window.location.href = url.toString();
  }

  setupNavigation() {
    const currentIndex = this.availableChapters.indexOf(this.currentChapter);
    
    // Configurar navegación entre capítulos
    this.navPrevChapter.disabled = currentIndex <= 0;
    this.navNextChapter.disabled = currentIndex >= this.availableChapters.length - 1;
    
    // Configurar botón volver al manga
    this.navBackManga.href = `infoMangas.html?manga=${encodeURIComponent(this.currentManga)}`;
    
    // Habilitar overlay de clicks
    this.clickOverlay.classList.add('enabled');
    // Ajustar zonas de click para no interferir con comentarios
    this.adjustClickOverlay();
  }

  updateChapterInfo() {
    const mangaName = this.currentManga.replaceAll("_", " ");
    this.chapterTitle.textContent = `${mangaName} - Capítulo ${this.currentChapter}`;
    this.chapterProgress.textContent = `${this.images.length} páginas`;
  }

  updateProgress() {
    if (this.readingMode === 'horizontal') {
      const scrollPercent = (this.readerContainer.scrollLeft / (this.readerContainer.scrollWidth - this.readerContainer.clientWidth)) * 100;
      this.progressBar.style.width = `${scrollPercent}%`;
    } else {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      this.progressBar.style.width = `${Math.min(100, scrollPercent)}%`;
    }
  }

  handleKeyPress(event) {
    switch(event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousPage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextPage();
        break;
      case 'ArrowUp':
        if (this.readingMode !== 'vertical') {
          event.preventDefault();
          this.previousPage();
        }
        break;

      case 'F3':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      case 'Escape':
        event.preventDefault();
        this.hideUI();
        break;
    }
  }

  toggleUI() {
    this.isUIVisible = !this.isUIVisible;
    
    if (this.isUIVisible) {
      this.showUI();
    } else {
      this.hideUI();
    }
  }

  showUI() {
    this.readerControls.classList.add('visible');
    this.readerNavigation.classList.add('visible');
    this.readerInfo.classList.add('visible');
    this.isUIVisible = true;
    
    // Auto-hide después de 3 segundos
    clearTimeout(this.autoHideTimer);
    this.autoHideTimer = setTimeout(() => {
      this.hideUI();
    }, 3000);
  }

  hideUI() {
    this.readerControls.classList.remove('visible');
    this.readerNavigation.classList.remove('visible');
    this.readerInfo.classList.remove('visible');
    this.isUIVisible = false;
    
    clearTimeout(this.autoHideTimer);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  adjustLayout() {
    // Ajustar layout según el modo de lectura
    if (this.readingMode === 'horizontal') {
      this.readerContainer.style.height = '100vh';
      this.readerContainer.style.overflowX = 'auto';
      this.readerContainer.style.overflowY = 'hidden';
    } else {
      this.readerContainer.style.height = 'auto';
      this.readerContainer.style.overflowX = 'visible';
      this.readerContainer.style.overflowY = 'visible';
    }
  }

  showLoading() {
    this.loadingIndicator.style.display = 'flex';
  }

  hideLoading() {
    this.loadingIndicator.style.display = 'none';
  }

  showError(message) {
    this.hideLoading();
    this.chapterTitle.textContent = 'Error';
    this.chapterProgress.textContent = message;
    this.readerContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: var(--reader-text);">${message}</div>`;
  }
}

// Inicializar el lector cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  new CubariReader();
});

// Elementos que deben ocultarse al mostrar los comentarios
const elementsToHide = [
  document.getElementById('reader-controls'),
  document.getElementById('reader-navigation'),
  document.getElementById('chapter-title'),
  document.getElementById('reader-info'),
];

// Añadir clase 'fading' a todos desde el inicio
elementsToHide.forEach(el => el.classList.add('fading'));

// Observador para detectar visibilidad de la sección de comentarios
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Comentarios visibles: ocultar
      elementsToHide.forEach(el => el.classList.add('hidden'));
    } else {
      // Comentarios no visibles: mostrar
      elementsToHide.forEach(el => el.classList.remove('hidden'));
    }
  });
}, {
  root: null, // usa el viewport
  threshold: 0.1 // se activa si al menos el 10% del comments-section entra en pantalla
});

// Empieza a observar los comentarios
observer.observe(document.getElementById('comments-section'));

const toggleButton = document.getElementById('toggle-controls');
const readerControls = document.getElementById('reader-controls');

// Alternar visibilidad al hacer clic en el engrane
toggleButton.addEventListener('click', () => {
  readerControls.classList.toggle('visible');
  toggleButton.classList.toggle('active');
});

// Cerrar al hacer clic fuera
document.addEventListener('click', (event) => {
  const isClickInsidePanel = readerControls.contains(event.target);
  const isClickOnButton = toggleButton.contains(event.target);

  if (!isClickInsidePanel && !isClickOnButton) {
    readerControls.classList.remove('visible');
    toggleButton.classList.remove('active');
  }
});

// Cerrar al presionar Escape
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    readerControls.classList.remove('visible');
    toggleButton.classList.remove('active');
  }
});




// Exportar para compatibilidad
export { CubariReader };