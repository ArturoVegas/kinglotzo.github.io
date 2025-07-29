// =======================================
// OPTIMIZADOR AUTOMÁTICO PARA MÓVILES
// =======================================

class MobileOptimizer {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isLowEndDevice = this.detectLowEndDevice();
    this.connectionSpeed = this.detectConnection();
    this.batteryLevel = null;
    
    this.init();
  }

  // ===== DETECCIÓN DE DISPOSITIVOS =====
  detectMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    
    return mobileRegex.test(userAgent) || 
           window.innerWidth <= 768 ||
           ('ontouchstart' in window);
  }

  detectLowEndDevice() {
    // Detectar dispositivos de gama baja por memoria/CPU
    const memory = navigator.deviceMemory || 8; // Default más alto para no penalizar móviles modernos
    const cores = navigator.hardwareConcurrency || 8; // Default más alto
    
    // Solo considerar gama baja si:
    // - Memoria RAM < 2GB (estrictamente menor)
    // - O menos de 2 cores Y menos de 3GB de RAM (ambas condiciones)
    const isLowMemory = memory < 2;
    const isLowEndSpecs = cores < 2 && memory < 3;
    
    console.log('🔍 Detección de dispositivo:', {
      memory: memory + 'GB',
      cores: cores,
      isMobile: this.isMobile,
      isLowMemory: isLowMemory,
      isLowEndSpecs: isLowEndSpecs,
      isLowEnd: isLowMemory || isLowEndSpecs
    });
    
    return isLowMemory || isLowEndSpecs;
  }

  shouldDisableBackground() {
    const memory = navigator.deviceMemory || 4;
    
    // DESHABILITADO: No desactivar fondo automáticamente
    // El usuario prefiere mantener la versión estándar siempre
    const shouldDisable = false;
    
    console.log('🎨 Evaluación del fondo de partículas:', {
      isMobile: this.isMobile,
      isLowEndDevice: this.isLowEndDevice,
      memory: memory + 'GB',
      shouldDisableBackground: shouldDisable,
      note: 'Desactivación automática deshabilitada por preferencia del usuario'
    });
    
    return shouldDisable;
  }

  detectConnection() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      const slowConnections = ['slow-2g', '2g', '3g'];
      return {
        effectiveType: conn.effectiveType,
        isSlow: slowConnections.includes(conn.effectiveType)
      };
    }
    return { effectiveType: 'unknown', isSlow: false };
  }

  async detectBattery() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.batteryLevel = {
          level: battery.level * 100,
          charging: battery.charging,
          isLow: battery.level < 0.2
        };
      } catch (e) {
        console.log('Battery API no disponible');
      }
    }
  }

  // ===== OPTIMIZACIONES AUTOMÁTICAS =====
  init() {
    console.log('🚀 MobileOptimizer iniciado:', {
      isMobile: this.isMobile,
      isLowEnd: this.isLowEndDevice,
      connection: this.connectionSpeed
    });

    if (this.isMobile || this.isLowEndDevice) {
      this.applyMobileOptimizations();
    }

    if (this.connectionSpeed.isSlow) {
      this.applySlowConnectionOptimizations();
    }

    this.detectBattery().then(() => {
      if (this.batteryLevel?.isLow) {
        this.applyBatterySavingMode();
      }
    });

    this.setupPerformanceMonitoring();
  }

  applyMobileOptimizations() {
    console.log('📱 Aplicando optimizaciones móviles...');

    const optimizationsApplied = [];

    // 1. Reducir efectos visuales pesados
    this.reduceCSSEffects();
    optimizationsApplied.push('Efectos visuales reducidos');

    // 2. Lazy loading más agresivo
    this.setupAggressiveLazyLoading();
    optimizationsApplied.push('Lazy loading optimizado');

    // 3. Pausar animaciones innecesarias
    if (this.isLowEndDevice) {
      this.pauseHeavyAnimations();
      optimizationsApplied.push('Animaciones pausadas');
    }

    // 4. Optimizar scroll performance
    this.optimizeScrollPerformance();
    optimizationsApplied.push('Scroll optimizado');

    // 5. Reducir calidad de procesamiento de imágenes
    if (this.isLowEndDevice) {
      this.adjustImageProcessingQuality();
      optimizationsApplied.push('Calidad de imagen ajustada');
    }

    // 6. Optimizar cards populares específicamente
    this.optimizePopularCards();
    optimizationsApplied.push('Cards optimizadas');

    // 7. Desactivar fondo de partículas si es necesario
    if (this.shouldDisableBackground()) {
      this.disableParticleBackground();
      optimizationsApplied.push('Fondo de partículas desactivado');
    }

  }

  reduceCSSEffects() {
    // Solo aplicar estas optimizaciones en dispositivos de muy baja gama
    if (!this.isLowEndDevice) {
      console.log('📱 Dispositivo móvil normal detectado - manteniendo efectos visuales');
      return; // No aplicar optimizaciones agresivas
    }
    
    const style = document.createElement('style');
    style.id = 'mobile-optimizations';
    style.textContent = `
      /* OPTIMIZACIONES SOLO PARA DISPOSITIVOS DE MUY BAJA GAMA */
      @media (max-width: 768px), (pointer: coarse) {
        .row-personalizada {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          background: rgba(5, 66, 131, 0.8) !important;
        }
        
        .logo-img, .nombre-img {
          filter: none !important;
          transition: none !important;
        }
        
        .navbar-nav .nav-link::before {
          display: none !important;
        }
        
        .navbar-nav .nav-link:hover {
          backdrop-filter: none !important;
          transform: none !important;
        }
        
        #input-buscar {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Pausar animación de partículas en móviles */
        body::before {
          animation: none !important;
          background-image: none !important;
        }
      }
      
      /* Dispositivos de muy baja gama - optimizaciones específicas */
      @media (max-width: 480px) {
        .row-personalizada {
          background: rgba(5, 66, 131, 0.95) !important;
        }
        
        /* Pausar solo animaciones pesadas, no las de las cards */
        body::before, body::after,
        .navbar-nav .nav-link,
        .carousel-item,
        .btn:not(.card .btn),
        .dropdown-menu {
          transition: none !important;
          animation: none !important;
        }
        
        /* Mantener optimización ligera para cards populares */
        #carrusel-populares .card {
          transition: transform 0.1s ease !important;
        }
        
        #carrusel-populares .card:hover {
          transform: scale(1.02) !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    console.log('✅ Efectos CSS reducidos para móviles');
  }

  setupAggressiveLazyLoading() {
    // Lazy loading más agresivo para móviles
    const observerOptions = {
      root: null,
      rootMargin: this.isMobile ? '50px' : '100px', // Menor margen en móviles
      threshold: 0.1
    };

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, observerOptions);

    // Observar todas las imágenes con data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });

    console.log('✅ Lazy loading agresivo configurado');
  }

  pauseHeavyAnimations() {
    if (this.isLowEndDevice) {
      // Pausar animaciones CSS pesadas
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Pausar animaciones JavaScript
      if (window.pauseAnimations) {
        window.pauseAnimations();
      }
      
      console.log('⏸️ Animaciones pesadas pausadas');
    }
  }

  optimizeScrollPerformance() {
    // Debounced scroll handler para móviles
    let scrollTimeout;
    let lastScrollTop = 0;

    const debouncedScrollHandler = () => {
      const scrollTop = window.pageYOffset;
      const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
      
      // Solo procesamos scroll cada 16ms (60fps)
      requestAnimationFrame(() => {
        this.handleOptimizedScroll(scrollTop, scrollDirection);
        lastScrollTop = scrollTop;
      });
    };

    // Usar passive listeners para mejor performance
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = requestAnimationFrame(debouncedScrollHandler);
    }, { passive: true });

    console.log('🚀 Scroll optimizado para móviles');
  }

  handleOptimizedScroll(scrollTop, direction) {
    // Lógica optimizada de scroll
    if (this.isMobile) {
      // Ocultar/mostrar navbar en móviles para ganar espacio
      const navbar = document.querySelector('.row-personalizada');
      if (navbar) {
        if (direction === 'down' && scrollTop > 100) {
          navbar.style.transform = 'translateY(-100%)';
        } else if (direction === 'up') {
          navbar.style.transform = 'translateY(0)';
        }
      }
    }
  }

  adjustImageProcessingQuality() {
    // Reducir calidad de procesamiento para móviles lentos
    if (this.isLowEndDevice) {
      // Sobrescribir opciones del optimizador de imágenes
      if (window.mobileImageOptions) {
        window.mobileImageOptions = {
          maxWidth: 800,  // Reducido de 1920
          maxHeight: 600, // Reducido de 1080
          quality: 0.7,   // Reducido de 0.85
          maxSizeKB: 200  // Reducido de 500
        };
      }
    console.log('📷 Calidad de procesamiento de imágenes reducida');
    }
  }

  optimizePopularCards() {
    console.log('🃴 Optimizando cards populares para móviles...');
    
    // NO APLICAR optimizaciones que interfieran con las animaciones controladas por main.js
    // Solo aplicar optimizaciones de rendimiento básico
    const popularCardsStyle = document.createElement('style');
    popularCardsStyle.id = 'popular-cards-mobile-optimization';
    popularCardsStyle.textContent = `
      /* Optimizaciones NO INTRUSIVAS para cards populares en móviles */
      @media (max-width: 768px) {
        #carrusel-populares {
          /* Mejorar scroll performance */
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          will-change: scroll-position;
        }
        
        #carrusel-populares .card-img-top {
          /* Optimizar carga de imágenes */
          loading: lazy;
          will-change: auto;
          backface-visibility: hidden;
        }
      }
      
      /* NO interferir con las animaciones de entrada de las cards */
      /* Estas serán manejadas por main.js */
        
        #carrusel-populares .card:hover {
          transform: translateZ(0) scale(1.01) !important;
        }
        
        /* Optimizar imágenes para pantallas pequeñas */
        #carrusel-populares .card-img-top {
          height: 180px !important;
          object-fit: cover;
          image-rendering: optimizeSpeed;
        }
      }
    `;
    
    document.head.appendChild(popularCardsStyle);
    
    // Aplicar lazy loading inteligente a las imágenes de cards
    this.setupCardImageOptimization();
    
    console.log('✅ Cards populares optimizadas para móviles');
  }

  disableParticleBackground() {
    console.log('🎨 Desactivando fondo de partículas para mejor rendimiento...');
    
    // Crear estilo para desactivar el fondo de partículas
    const disableBackgroundStyle = document.createElement('style');
    disableBackgroundStyle.id = 'disable-particle-background';
    disableBackgroundStyle.textContent = `
      /* Desactivar fondo de partículas en móviles y dispositivos con poca RAM */
      body::before {
        display: none !important;
        animation: none !important;
      }
      
      /* Mejorar el fondo base para compensar */
      body {
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 100%) !important;
        background-attachment: fixed !important;
      }
      
      /* Asegurar que no se active con scroll */
      body.scrolling-active::before {
        display: none !important;
        animation: none !important;
      }
    `;
    
    document.head.appendChild(disableBackgroundStyle);
    console.log('✅ Fondo de partículas desactivado exitosamente');
  }
  
  setupCardImageOptimization() {
    // Esperar a que las cards se carguen
    setTimeout(() => {
      const cardImages = document.querySelectorAll('#carrusel-populares .card-img-top');
      
      cardImages.forEach((img, index) => {
        // Solo cargar las primeras 3 imágenes inmediatamente en móviles
        if (this.isMobile && index > 2) {
          // Usar intersection observer para las demás
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const image = entry.target;
                if (image.dataset.src) {
                  image.src = image.dataset.src;
                  image.removeAttribute('data-src');
                }
                observer.unobserve(image);
              }
            });
          }, {
            rootMargin: '50px'
          });
          
          observer.observe(img);
        }
        
        // Optimizar cada imagen
        img.style.willChange = 'auto';
        img.style.backfaceVisibility = 'hidden';
        
        // Manejar errores de carga
        img.addEventListener('error', () => {
          img.style.backgroundColor = '#f0f0f0';
          img.alt = 'Imagen no disponible';
        });
      });
    }, 1000);
  }

  applySlowConnectionOptimizations() {
    console.log('📶 Aplicando optimizaciones para conexión lenta...');

    // Precargar menos recursos
    document.querySelectorAll('link[rel="prefetch"]').forEach(link => {
      link.remove();
    });

    // Lazy loading más conservador
    document.querySelectorAll('img').forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });

    console.log('⚡ Optimizaciones para conexión lenta aplicadas');
  }

  applyBatterySavingMode() {
    console.log('🔋 Modo ahorro de batería activado...');

    // Pausar animaciones pesadas pero mantener las esenciales
    const style = document.createElement('style');
    style.textContent = `
      /* Pausar animaciones pesadas pero mantener cards funcionales */
      body::before, body::after,
      .carousel-item,
      .navbar-nav .nav-link,
      .btn:not(.card .btn):not(#carrusel-populares .btn),
      .dropdown-menu {
        animation: none !important;
        transition: none !important;
      }
      
      /* Mantener animación mínima para cards */
      #carrusel-populares .card,
      #ultimas-actualizaciones .card {
        transition: transform 0.1s ease !important;
      }
    `;
    document.head.appendChild(style);

    // Reducir frecuencia de actualizaciones
    if (window.reduceUpdateFrequency) {
      window.reduceUpdateFrequency();
    }

    console.log('🔋 Modo ahorro de batería aplicado');
  }

  setupPerformanceMonitoring() {
    // Monitorear rendimiento y ajustar dinámicamente
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.duration > 16) {
            console.warn(`⚠️ Operación lenta detectada: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
            this.handleSlowOperation(entry);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        console.log('Performance Observer no soportado');
      }
    }

    // FPS monitoring para móviles
    this.startFPSMonitoring();
  }

  startFPSMonitoring() {
    let lastTime = performance.now();
    let frames = 0;
    const targetFPS = 60;
    
    const measureFPS = (currentTime) => {
      frames++;
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        
        if (fps < targetFPS * 0.8) { // Si FPS < 48
          console.warn(`⚠️ FPS bajo detectado: ${fps}`);
          this.handleLowFPS();
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    if (this.isMobile) {
      requestAnimationFrame(measureFPS);
    }
  }

  handleSlowOperation(entry) {
    if (this.isMobile) {
      // Aplicar optimizaciones más agresivas
      console.log('🚨 Aplicando optimizaciones de emergencia para móviles');
      
      // Desactivar efectos pesados pero mantener cards
      document.querySelectorAll('.navbar-nav .nav-link, .carousel-item, .dropdown-menu').forEach(el => {
        el.style.transition = 'none';
        el.style.animation = 'none';
      });
      
      // Mantener funcionalidad mínima en cards
      document.querySelectorAll('#carrusel-populares .card, #ultimas-actualizaciones .card').forEach(el => {
        el.style.transition = 'transform 0.1s ease';
      });
    }
  }

  handleLowFPS() {
    if (!this.emergencyModeActive) {
      this.emergencyModeActive = true;
      console.log('🚨 Modo emergencia activado por FPS bajo');
      
      // Desactivar efectos visuales pesados pero mantener funcionalidad esencial
      const emergencyStyle = document.createElement('style');
      emergencyStyle.textContent = `
        /* Modo emergencia - mantener solo lo esencial */
        body::before, body::after,
        .carousel-item:not(.active),
        .navbar-nav .nav-link,
        .dropdown-menu {
          animation: none !important;
          transition: none !important; 
          transform: none !important;
          filter: none !important;
          backdrop-filter: none !important;
        }
        
        /* Mantener cards visibles con mínima animación */
        #carrusel-populares .card,
        #ultimas-actualizaciones .card {
          transition: opacity 0.1s ease !important;
        }
        
        #carrusel-populares .card:hover {
          transform: none !important;
        }
      `;
      document.head.appendChild(emergencyStyle);
    }
  }

  // ===== API PÚBLICA =====
  static getInstance() {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }
}

// Auto-inicializar cuando se carga el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = MobileOptimizer.getInstance();
  });
} else {
  window.mobileOptimizer = MobileOptimizer.getInstance();
}

export default MobileOptimizer;
