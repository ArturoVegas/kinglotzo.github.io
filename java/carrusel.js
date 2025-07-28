// carrusel.js
import { db } from "./firebaseInit.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Función para mostrar loader mientras carga
function mostrarLoaderCarrusel(container) {
  const isMobile = window.innerWidth <= 768;
  const height = isMobile ? '300px' : '400px';
  
  container.innerHTML = `
    <div class="carousel-item active d-flex justify-content-center align-items-center" style="height: ${height};">
      <div class="text-center text-white">
        <div class="spinner-border mb-3" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p style="font-size: ${isMobile ? '0.9rem' : '1rem'}">Cargando carrusel...</p>
      </div>
    </div>
  `;
}

// Función para crear slides con animación
async function crearSlidesAnimados(slides, inner, indicators) {
  inner.innerHTML = ''; // Limpiar loader
  const isMobile = window.innerWidth <= 768;
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    
    // Crear indicador con animación
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-bs-target", "#carouselExampleCaptions");
    button.setAttribute("data-bs-slide-to", i);
    button.setAttribute("aria-label", `Slide ${i + 1}`);
    if (i === 0) {
      button.classList.add("active");
      button.setAttribute("aria-current", "true");
    }
    indicators.appendChild(button);

    // Crear slide
    const div = document.createElement("div");
    div.className = `carousel-item${i === 0 ? " active" : ""}`;
    div.style.opacity = '0';
    div.style.transform = 'scale(0.95)';
    div.style.transition = 'all 0.6s ease';

    // Crear imagen con lazy loading y optimización móvil
    const img = document.createElement("img");
    img.className = "d-block w-100 carousel-image";
    img.alt = slide.titulo || `Slide ${i + 1}`;
    img.loading = i === 0 ? "eager" : "lazy"; // Primera imagen eager, resto lazy
    img.style.filter = 'brightness(0.7)';
    
    // Precargar solo la primera imagen en móviles para mejor rendimiento
    if (i === 0 || !isMobile) {
      await precargarImagen(slide.imagen);
    }
    img.src = slide.imagen;

    // Crear caption mejorado con truncamiento en móviles
    const caption = document.createElement("div");
    caption.className = "carousel-caption d-block";
    
    // Truncar descripción en móviles
    let descripcion = slide.descripcion || '';
    if (isMobile && descripcion.length > 80) {
      descripcion = descripcion.substring(0, 80) + '...';
    }
    
    caption.innerHTML = `
      <div class="carousel-caption-content">
        ${slide.titulo ? `<h2 class="carousel-title">${slide.titulo}</h2>` : ''}
        ${descripcion ? `<p class="carousel-description">${descripcion}</p>` : ''}
        ${slide.enlace ? `<a href="${slide.enlace}" class="btn btn-primary carousel-btn">Ver más</a>` : ''}
      </div>
    `;

    div.appendChild(img);
    div.appendChild(caption);
    inner.appendChild(div);
    
    // Animar entrada del slide con menor delay en móviles
    const delay = isMobile ? i * 50 : i * 100;
    setTimeout(() => {
      div.style.opacity = '1';
      div.style.transform = 'scale(1)';
    }, delay);
  }
}

// Función para precargar imágenes
function precargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Error cargando imagen: ${src}`));
    img.src = src;
  });
}

// Función para mostrar carrusel por defecto
function mostrarCarruselPorDefecto() {
  const inner = document.querySelector("#carouselExampleCaptions .carousel-inner");
  const indicators = document.querySelector("#carouselExampleCaptions .carousel-indicators");
  
  if (!inner || !indicators) return;
  
  // Altura adaptable según el dispositivo
  const isMobile = window.innerWidth <= 768;
  const height = isMobile ? '300px' : '400px';
  
  inner.innerHTML = `
    <div class="carousel-item active">
      <div class="d-flex justify-content-center align-items-center bg-gradient" style="height: ${height}; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div class="text-center text-white">
          <h2 style="font-size: ${isMobile ? '1.5rem' : '2rem'}">Bienvenido a White Pearl Translation</h2>
          <p style="font-size: ${isMobile ? '0.9rem' : '1rem'}">Los mejores mangas traducidos al español</p>
        </div>
      </div>
    </div>
  `;
  
  indicators.innerHTML = `<button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>`;
}

// Función para inicializar funcionalidades avanzadas del carrusel
function inicializarCarruselAvanzado() {
  const carouselElement = document.getElementById('carouselExampleCaptions');
  if (!carouselElement) return;
  
  // Pausar en hover
  carouselElement.addEventListener('mouseenter', () => {
    const bootstrap = window.bootstrap;
    if (bootstrap) {
      const carousel = bootstrap.Carousel.getInstance(carouselElement);
      if (carousel) carousel.pause();
    }
  });
  
  // Reanudar al salir
  carouselElement.addEventListener('mouseleave', () => {
    const bootstrap = window.bootstrap;
    if (bootstrap) {
      const carousel = bootstrap.Carousel.getInstance(carouselElement);
      if (carousel) carousel.cycle();
    }
  });
  
  // Agregar indicador de progreso
  agregarIndicadorProgreso();
}

// Función para agregar indicador de progreso
function agregarIndicadorProgreso() {
  const carouselElement = document.getElementById('carouselExampleCaptions');
  if (!carouselElement) return;
  
  // Crear barra de progreso
  const progressBar = document.createElement('div');
  progressBar.className = 'carousel-progress';
  progressBar.innerHTML = '<div class="carousel-progress-bar"></div>';
  carouselElement.appendChild(progressBar);
  
  const progressBarFill = progressBar.querySelector('.carousel-progress-bar');
  
  // Actualizar progreso
  carouselElement.addEventListener('slide.bs.carousel', () => {
    progressBarFill.style.width = '0%';
  });
  
  carouselElement.addEventListener('slid.bs.carousel', () => {
    progressBarFill.style.width = '100%';
  });
}

export async function cargarCarruselPrincipal() {
  console.log("🎠 Iniciando carga del carrusel principal...");
  
  try {
    const snapshot = await get(ref(db, "carrusel"));
    if (!snapshot.exists()) {
      console.log("⚠️ No hay datos del carrusel en Firebase");
      mostrarCarruselPorDefecto();
      return;
    }

    const carrusel = snapshot.val();
    if ("initialized" in carrusel) delete carrusel.initialized;

    const inner = document.querySelector("#carouselExampleCaptions .carousel-inner");
    const indicators = document.querySelector("#carouselExampleCaptions .carousel-indicators");

    if (!inner || !indicators) {
      console.error("❌ No se encontraron elementos del carrusel");
      return;
    }

    // Limpiar contenido existente
    inner.innerHTML = "";
    indicators.innerHTML = "";

    // Agregar loader mientras carga
    mostrarLoaderCarrusel(inner);

    let index = 0;
    const slides = [];
    
    // Preparar slides
    for (const key in carrusel) {
      const item = carrusel[key];
      if (!item.imagen) continue; // Skip items sin imagen
      
      slides.push({ ...item, index });
      index++;
    }

    if (slides.length === 0) {
      console.log("⚠️ No hay slides válidos");
      mostrarCarruselPorDefecto();
      return;
    }

    // Crear slides con animación
    await crearSlidesAnimados(slides, inner, indicators);
    
    console.log(`✅ Carrusel cargado con ${slides.length} slides`);
    
    // Inicializar funcionalidades adicionales
    inicializarCarruselAvanzado();

  } catch (e) {
    console.error("❌ Error al cargar carrusel:", e);
    mostrarCarruselPorDefecto();
  }
}
