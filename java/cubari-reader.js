import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

import { db } from "./firebaseInit.js";

class CubariReader {
  constructor() {
    this.currentUser = null;

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    this.currentUser = user;
  }
});

    this.currentManga = null;
    this.currentChapter = null;
    this.images = [];
    this.currentImageIndex = 0;
    this.availableChapters = [];
    this.readingMode = 'vertical'; // vertical, horizontal, webtoon
    this.fitMode = 'fit-width'; // fit-width, fit-height, original-size
    this.spacing = 10;

    this.isUIVisible = false;
    this.isBarVisible = false;
    this.autoHideTimer = null;

    this.initializeElements();
    this.setupEventListeners();
    this.loadUserSettings();
    this.loadChapterFromURL();
  }

  initializeElements() {
    this.readerContainer = document.getElementById('reader-container');
    this.readerControls = document.getElementById('reader-controls'); // engranaje panel
    this.readerNavigation = document.getElementById('reader-navigation'); // barra inferior botones
    this.readerInfo = document.getElementById('reader-info'); // contenedor título + info
    this.toggleControls = document.getElementById('toggle-controls'); // botón engranaje
    this.clickOverlay = document.getElementById('click-overlay'); // overlay clics, puede ser creado luego
    this.progressBar = document.getElementById('progress-bar');
    this.commentsSection = document.getElementById('comments-section');
    this.loadingIndicator = document.getElementById('reader-loading');

    this.chapterTitle = document.getElementById('chapter-title');
    this.chapterProgress = document.getElementById('chapter-progress');
    this.zoomLevelSpan = document.getElementById('zoom-level');

    this.spacingSlider = document.getElementById('spacing-slider');

    this.navPrevChapter = document.getElementById('nav-prev-chapter');
    this.navPrevPage = document.getElementById('nav-prev-page');
    this.navBackManga = document.getElementById('nav-back-manga');
    this.navNextPage = document.getElementById('nav-next-page');
    this.navNextChapter = document.getElementById('nav-next-chapter');
    
    // Debug: verificar si los elementos de navegación existen
    console.log('Navigation elements found:', {
      navPrevChapter: !!this.navPrevChapter,
      navPrevPage: !!this.navPrevPage,
      navBackManga: !!this.navBackManga,
      navNextPage: !!this.navNextPage,
      navNextChapter: !!this.navNextChapter
    });
  }

  setupEventListeners() {
    if (this.toggleControls) {
      this.toggleControls.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleEngrane();
      });
    }

    document.addEventListener('mousemove', () => this.showBar());
    document.addEventListener('touchstart', () => this.showBar());

    document.addEventListener('click', (e) => {
      if (
        this.isUIVisible &&
        this.readerControls &&
        !this.readerControls.contains(e.target) &&
        this.toggleControls &&
        !this.toggleControls.contains(e.target)
      ) {
        this.hideEngrane();
      }
    });

    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => this.changeReadingMode(e.target.dataset.mode));
    });

    document.querySelectorAll('[data-fit]').forEach(btn => {
      btn.addEventListener('click', (e) => this.changeFitMode(e.target.dataset.fit));
    });

    if (this.spacingSlider) this.spacingSlider.addEventListener('input', (e) => this.changeSpacing(e.target.value));

    if (this.navPrevChapter) this.navPrevChapter.addEventListener('click', () => this.previousChapter());
    if (this.navPrevPage) this.navPrevPage.addEventListener('click', () => this.previousPage());
    if (this.navNextPage) this.navNextPage.addEventListener('click', () => this.nextPage());
    if (this.navNextChapter) this.navNextChapter.addEventListener('click', () => this.nextChapter());

    // Configurar botón "regresar al manga" con event listener directo
    this.setupBackButton();

    // Setup overlay click zones
    this.setupClickOverlay();

    document.removeEventListener('keydown', this.handleKeyPress);
    document.addEventListener('keydown', this.handleKeyPress.bind(this));

    window.addEventListener('scroll', () => this.updateProgress());
    window.addEventListener('resize', () => this.adjustLayout());
  }

  toggleEngrane() {
    this.isUIVisible = !this.isUIVisible;
    if (this.isUIVisible) {
      this.readerControls?.classList.add('visible');
      this.toggleControls?.classList.add('active');
    } else {
      this.readerControls?.classList.remove('visible');
      this.toggleControls?.classList.remove('active');
    }
  }

  hideEngrane() {
    this.isUIVisible = false;
    this.readerControls?.classList.remove('visible');
    this.toggleControls?.classList.remove('active');
  }

  showBar() {
    if (this.isBarVisible) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = setTimeout(() => this.hideBar(), 3000);
      return;
    }
    this.isBarVisible = true;
    this.readerNavigation?.classList.add('visible');
    this.readerInfo?.classList.add('visible');

    clearTimeout(this.autoHideTimer);
    this.autoHideTimer = setTimeout(() => this.hideBar(), 3000);
  }

  hideBar() {
    this.isBarVisible = false;
    this.readerNavigation?.classList.remove('visible');
    this.readerInfo?.classList.remove('visible');
  }

  toggleUI() {
    if (this.isBarVisible) {
      this.hideBar();
    } else {
      this.showBar();
    }
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
      this.showBar();
    } catch (error) {
      console.error('Error cargando capítulo:', error);
      this.showError('Error al cargar el capítulo');
    }
  }

  loadUserSettings() {
    const settings = JSON.parse(localStorage.getItem('readerSettings')) || {};
    this.readingMode = settings.readingMode || 'vertical';
    this.fitMode = settings.fitMode || 'fit-width';
    this.spacing = settings.spacing || 10;
    this.renderImages();
    this.adjustLayout();
    console.log('Configuración cargada:', settings);
  }

  saveUserSettings() {
    const settings = {
      readingMode: this.readingMode,
      fitMode: this.fitMode,
      spacing: this.spacing,
    };
    localStorage.setItem('readerSettings', JSON.stringify(settings));
    console.log('Configuración guardada:', settings);
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
      if (this.currentUser) {
  const vistoRef = ref(db, `usuarios/${this.currentUser.uid}/visto/${this.currentManga}/${this.currentChapter}`);
  set(vistoRef, true).catch(err => console.error("Error al marcar como visto:", err));
}



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
      imgElement.loading = 'lazy';

      imgElement.addEventListener('load', () => {
        imageData.loaded = true;
        this.updateProgress();
      });

      // Aquí está el cambio importante para clicks izquierdo/derecho en todos los modos
     imgElement.addEventListener('click', (e) => {
  e.preventDefault();
  if (e.button === 0) {
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      this.previousPage();
    } else {
      this.nextPage();
    }
  }
});


      // Detectar click derecho para página anterior
      imgElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.previousPage();
      });

      this.readerContainer.appendChild(imgElement);
    });

    this.applySpacing();
    this.adjustLayout();
  }

  preloadImages() {
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

    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    this.renderImages();
    this.adjustLayout();
    this.saveUserSettings();
  }

  changeFitMode(fit) {
    this.fitMode = fit;

    document.querySelectorAll('[data-fit]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fit === fit);
    });

    document.querySelectorAll('.reader-image').forEach(img => {
      img.className = `reader-image ${fit}`;
    });

    this.adjustLayout();
    this.saveUserSettings();
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

  previousPage() {
    if (this.readingMode === 'horizontal') {
      this.readerContainer.scrollLeft -= window.innerWidth;
    } else {
      window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
    }
  }

  nextPage() {
    if (this.readingMode === 'horizontal') {
      this.readerContainer.scrollLeft += window.innerWidth;
    } else {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
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
    // Mostrar loading antes de navegar
    this.showLoading();
    
    // Pequeño delay para que se vea el loading
    setTimeout(() => {
      const url = new URL(window.location);
      url.searchParams.set('cap', chapter);
      window.location.href = url.toString();
    }, 100);
  }

  setupBackButton() {
    const configureBackButton = () => {
      const backButton = document.getElementById('nav-back-manga');
      if (backButton && this.currentManga) {
        // Determinar la ruta correcta basada en la ubicación actual
        const currentPath = window.location.pathname;
        let infoMangasPath;
        
        if (currentPath.includes('/html/')) {
          // Si estamos en el directorio html/, usar ruta relativa
          infoMangasPath = 'infoMangas.html';
        } else {
          // Si estamos en la raíz, usar ruta hacia html/
          infoMangasPath = 'html/infoMangas.html';
        }
        
        const targetUrl = `${infoMangasPath}?manga=${encodeURIComponent(this.currentManga)}`;
        backButton.href = targetUrl;
        
        // Remover cualquier event listener previo
        backButton.replaceWith(backButton.cloneNode(true));
        const freshBackButton = document.getElementById('nav-back-manga');
        
        // Agregar event listener con navegación forzada
        freshBackButton.addEventListener('click', (e) => {
          console.log('Back button clicked! Event details:', {
            target: e.target,
            currentTarget: e.currentTarget,
            defaultPrevented: e.defaultPrevented,
            href: freshBackButton.href,
            targetUrl: targetUrl
          });
          
          // Prevenir el comportamiento por defecto y forzar navegación
          e.preventDefault();
          e.stopPropagation();
          
          console.log('Forcing navigation to:', targetUrl);
          
          // Usar un pequeño delay para asegurar que otros event listeners no interfieran
          setTimeout(() => {
            window.location.href = targetUrl;
          }, 50);
        });
        
        console.log('Back button configured successfully:', {
          element: backButton,
          href: backButton.href,
          currentPath: currentPath,
          manga: this.currentManga
        });
        
        return true;
      }
      return false;
    };
    
    // Intentar configurar inmediatamente
    if (!configureBackButton()) {
      // Si falla, reintentar después de un breve delay
      setTimeout(() => {
        if (!configureBackButton()) {
          console.error('Failed to configure back button after retry');
        }
      }, 100);
    }
  }

  setupNavigation() {
    const currentIndex = this.availableChapters.indexOf(this.currentChapter);

    if (this.navPrevChapter) this.navPrevChapter.disabled = currentIndex <= 0;
    if (this.navNextChapter) this.navNextChapter.disabled = currentIndex >= this.availableChapters.length - 1;

    // Re-configurar el botón de regreso cuando se configura la navegación
    this.setupBackButton();
  }

  updateChapterInfo() {
    const mangaName = this.currentManga.replaceAll("_", " ");
    if (this.chapterTitle) this.chapterTitle.textContent = `${mangaName} - Capítulo ${this.currentChapter}`;
    if (this.chapterProgress) this.chapterProgress.textContent = `${this.images.length} páginas`;
  }

  updateProgress() {
    if (!this.progressBar) return;

    if (this.readingMode === 'horizontal') {
      const scrollPercent = (this.readerContainer.scrollLeft / (this.readerContainer.scrollWidth - this.readerContainer.clientWidth)) * 100;
      this.progressBar.style.width = `${scrollPercent}%`;
    } else {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      this.progressBar.style.width = `${Math.min(100, scrollPercent)}%`;
    }
  }

  handleKeyPress(event) {
    switch (event.key) {
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
        this.hideEngrane();
        break;
    }
  }

  showLoading() {
    if (this.loadingIndicator) this.loadingIndicator.style.display = 'flex';
  }

  hideLoading() {
    if (this.loadingIndicator) this.loadingIndicator.style.display = 'none';
  }

  showError(message) {
    this.hideLoading();
    if (this.chapterTitle) this.chapterTitle.textContent = 'Error';
    if (this.chapterProgress) this.chapterProgress.textContent = message;
    if (this.readerContainer)
      this.readerContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: var(--reader-text);">${message}</div>`;
  }

  setupClickOverlay() {
    if (!this.readerContainer) {
      console.warn('No se encontró #reader-container para colocar overlay de clic');
      return;
    }

    let overlay = document.getElementById('click-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'click-overlay';
      this.readerContainer.appendChild(overlay);
    }

    // overlay solo zona central para toggle UI (20% ancho x 20% alto en centro)
    overlay.style.position = 'absolute';
    overlay.style.top = '40%';
    overlay.style.left = '40%';
    overlay.style.width = '20%';
    overlay.style.height = '20%';
    overlay.style.zIndex = 20;
    overlay.style.cursor = 'pointer';
    overlay.style.pointerEvents = 'auto';

    // limpiar contenido y crear solo una zona
    overlay.innerHTML = '';

    overlay.onclick = (e) => {
      if (this.isClickAllowed(e)) {
        this.toggleUI();
      }
    };

    this.readerContainer.style.position = 'relative';
  }

  isClickAllowed(event) {
    if (!this.commentsSection) return true;

    const commentsRect = this.commentsSection.getBoundingClientRect();
    return event.clientY < commentsRect.top;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  adjustLayout() {
    if (!this.readerContainer) return;

    if (this.readingMode === 'horizontal') {
      this.readerContainer.style.height = '100vh';
      this.readerContainer.style.overflowX = 'auto';
      this.readerContainer.style.overflowY = 'hidden';
      this.readerContainer.style.display = 'flex';
      this.readerContainer.style.flexWrap = 'nowrap';
    } else {
      this.readerContainer.style.height = 'auto';
      this.readerContainer.style.overflowX = 'visible';
      this.readerContainer.style.overflowY = 'visible';
      this.readerContainer.style.display = 'block';
    }
  }

  toggleImageZoom(imgElement) {
    if (!imgElement) return;
    imgElement.classList.toggle('zoomed');
  }
}

// Al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  new CubariReader();
});

// Ocultar UI cuando la sección de comentarios está visible
(() => {
  const elementsToHide = [
    document.getElementById('reader-controls'),
    document.getElementById('reader-navigation'),
    document.getElementById('chapter-title'),
    document.getElementById('reader-info'),
  ].filter(Boolean);

  // Añadir clase 'fading' desde el inicio
  elementsToHide.forEach(el => el.classList.add('fading'));

  const commentsSection = document.getElementById('comments-section');
  if (!commentsSection) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Ocultar UI cuando comentarios visibles
        elementsToHide.forEach(el => el.classList.add('hidden'));
      } else {
        // Mostrar UI cuando comentarios no visibles
        elementsToHide.forEach(el => el.classList.remove('hidden'));
      }
    });
  }, {
    root: null,
    threshold: 0.1
  });

  observer.observe(commentsSection);
})();
