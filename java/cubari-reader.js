import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";

class CubariReader {
  constructor() {
    this.currentManga = null;
    this.currentChapter = null;
    this.images = [];
    this.currentImageIndex = 0;
    this.availableChapters = [];
    this.readingMode = 'vertical'; // vertical, horizontal, webtoon
    this.fitMode = 'fit-width'; // fit-width, fit-height, original-size
    this.spacing = 10;

    // NUEVO: Control para toggle UI y barra/nombre
    this.isUIVisible = false;     // Controla el panel config (engrane)
    this.isBarVisible = false;    // Controla la barra y título que aparece al mover mouse
    this.autoHideTimer = null;

    this.initializeElements();
    this.setupEventListeners();
    this.loadChapterFromURL();
  }

  initializeElements() {
    console.log("[initializeElements] Buscando elementos del DOM");

    this.readerContainer = document.getElementById('reader-container');
    this.readerControls = document.getElementById('reader-controls'); // panel config engranaje
    this.readerNavigation = document.getElementById('reader-navigation'); // barra inferior botones
    this.readerInfo = document.getElementById('reader-info');
    this.toggleControls = document.getElementById('toggle-controls'); // boton engranaje
    this.clickOverlay = document.getElementById('click-overlay');
    this.progressBar = document.getElementById('progress-bar');
    this.commentsSection = document.getElementById('comments-section');
    this.loadingIndicator = document.getElementById('reader-loading');

    this.chapterTitle = document.getElementById('chapter-title');  // Nombre manga + capitulo
    this.chapterProgress = document.getElementById('chapter-progress');
    this.zoomLevelSpan = document.getElementById('zoom-level');

    this.spacingSlider = document.getElementById('spacing-slider');

    this.navPrevChapter = document.getElementById('nav-prev-chapter');
    this.navPrevPage = document.getElementById('nav-prev-page');
    this.navBackManga = document.getElementById('nav-back-manga');
    this.navNextPage = document.getElementById('nav-next-page');
    this.navNextChapter = document.getElementById('nav-next-chapter');

    this.clickPrev = document.getElementById('click-prev');
    this.clickMenu = document.getElementById('click-menu');
    this.clickNext = document.getElementById('click-next');

    if (!this.toggleControls) console.warn("[initializeElements] No se encontró el botón toggle-controls");
    if (!this.readerControls) console.warn("[initializeElements] No se encontró el contenedor reader-controls");
  }

  setupEventListeners() {
    console.log("[setupEventListeners] Registrando listeners");

    // Click botón engranaje: toggle solo con click, no con mousemove
    this.toggleControls.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleEngrane();
    });

    // Mostrar barra/nombre al mover mouse o touch (independiente del engranaje)
    document.addEventListener('mousemove', () => this.showBar());
    document.addEventListener('touchstart', () => this.showBar());

    // Click fuera del panel config para ocultarlo
    document.addEventListener('click', (e) => {
      if (
        this.isUIVisible &&
        !this.readerControls.contains(e.target) &&
        !this.toggleControls.contains(e.target)
      ) {
        this.hideEngrane();
      }
    });

    // Lectura modos
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => this.changeReadingMode(e.target.dataset.mode));
    });

    // Fit modos
    document.querySelectorAll('[data-fit]').forEach(btn => {
      btn.addEventListener('click', (e) => this.changeFitMode(e.target.dataset.fit));
    });


    // Slider espacio
    if (this.spacingSlider) this.spacingSlider.addEventListener('input', (e) => this.changeSpacing(e.target.value));

    // Navegacion capítulos y páginas
    if (this.navPrevChapter) this.navPrevChapter.addEventListener('click', () => this.previousChapter());
    if (this.navPrevPage) this.navPrevPage.addEventListener('click', () => this.previousPage());
    if (this.navNextPage) this.navNextPage.addEventListener('click', () => this.nextPage());
    if (this.navNextChapter) this.navNextChapter.addEventListener('click', () => this.nextChapter());

    // Zonas click para páginas
    if (this.clickPrev) this.clickPrev.addEventListener('click', () => this.previousPage());
    if (this.clickMenu) this.clickMenu.addEventListener('click', () => this.toggleUI()); // Este toggleUI es distinto al engranaje
    if (this.clickNext) this.clickNext.addEventListener('click', () => this.nextPage());

    // Teclado
    document.removeEventListener('keydown', this.handleKeyPress); // evitar duplicados
    document.addEventListener('keydown', this.handleKeyPress.bind(this));

    // Scroll progreso
    window.addEventListener('scroll', () => this.updateProgress());

    // Responsive
    window.addEventListener('resize', () => this.adjustLayout());
  }

  // Toggle solo panel config (engrane)
  toggleEngrane() {
    this.isUIVisible = !this.isUIVisible;
    if (this.isUIVisible) {
      this.readerControls.classList.add('visible');
      this.toggleControls.classList.add('active');
    } else {
      this.readerControls.classList.remove('visible');
      this.toggleControls.classList.remove('active');
    }
  }

  hideEngrane() {
    this.isUIVisible = false;
    this.readerControls.classList.remove('visible');
    this.toggleControls.classList.remove('active');
  }

  // Mostrar barra y título al mover mouse/touch (independiente del engranaje)
  showBar() {
  if (this.isBarVisible) {
    clearTimeout(this.autoHideTimer);
    this.autoHideTimer = setTimeout(() => this.hideBar(), 3000);

    return;
  }
  this.isBarVisible = true;
  this.readerNavigation.classList.add('visible');
  this.readerInfo.classList.add('visible'); // <--- aquí, mostrar contenedor completo
  
  
  clearTimeout(this.autoHideTimer);
  this.autoHideTimer = setTimeout(() => this.hideBar(), 3000);
}

hideBar() {
  this.isBarVisible = false;
  this.readerNavigation.classList.remove('visible');
  this.readerInfo.classList.remove('visible');  // <--- ocultar contenedor completo
}

  // Este toggleUI está separado del engranaje, para el clickMenu (zona central)
  toggleUI() {
    // Si quieres manejar que el clickMenu haga algo, implementa aquí
    // Por ejemplo, mostrar u ocultar barra/nombre:
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
      this.showBar(); // Mostrar barra con título al cargar capítulo
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
      imgElement.loading = 'lazy';

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

    this.navPrevChapter.disabled = currentIndex <= 0;
    this.navNextChapter.disabled = currentIndex >= this.availableChapters.length - 1;

    this.navBackManga.href = `infoMangas.html?manga=${encodeURIComponent(this.currentManga)}`;

    this.clickOverlay.classList.add('enabled');

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
        this.hideEngrane();
        break;
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

  adjustClickOverlay() {
    const commentsTop = this.commentsSection.offsetTop;
    this.clickOverlay.style.height = `${commentsTop}px`;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  adjustLayout() {
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
}

// Inicializar el lector cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  console.log("[DOMContentLoaded] Página cargada, inicializando CubariReader");
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
      // Comentarios visibles: ocultar elementos
      elementsToHide.forEach(el => el.classList.add('hidden'));
    } else {
      // Comentarios no visibles: mostrar elementos
      elementsToHide.forEach(el => el.classList.remove('hidden'));
    }
  });
}, {
  root: null, // usa el viewport
  threshold: 0.1 // se activa si al menos el 10% del comments-section entra en pantalla
});

// Empieza a observar los comentarios
observer.observe(document.getElementById('comments-section'));