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
    const memory = navigator.deviceMemory || 4; // Default 4GB
    const cores = navigator.hardwareConcurrency || 4; // Default 4 cores
    
    // Solo considerar gama baja si:
    // - Memoria RAM <= 2GB Y cores <= 2 (ambas condiciones)
    // - O es un móvil/tablet con especificaciones muy bajas
    const isLowEndSpecs = memory <= 2 && cores <= 2;
    const isVeryOldMobile = this.isMobile && memory <= 1;
    
    console.log('🔍 Detección de dispositivo:', {
      memory: memory + 'GB',
      cores: cores,
      isMobile: this.isMobile,
      isLowEnd: isLowEndSpecs || isVeryOldMobile
    });
    
    return isLowEndSpecs || isVeryOldMobile;
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

    // Mostrar notificación de optimización móvil
    setTimeout(() => {
      if (window.optimizationNotifications) {
        if (this.isLowEndDevice) {
          window.optimizationNotifications.showLowEndDevice();
        } else {
          window.optimizationNotifications.showMobileOptimization(optimizationsApplied);
        }
      }
    }, 2000); // Esperar 2 segundos para que la página cargue
  }

  reduceCSSEffects() {
    const style = document.createElement('style');
    style.id = 'mobile-optimizations';
    style.textContent = `
      /* OPTIMIZACIONES MÓVILES - Reducir efectos pesados */
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
      
      /* Dispositivos de muy baja gama */
      @media (max-width: 480px) {
        .row-personalizada {
          background: rgba(5, 66, 131, 0.95) !important;
        }
        
        * {
          transition: none !important;
          animation: none !important;
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
    
    // Mostrar notificación de conexión lenta
    setTimeout(() => {
      if (window.optimizationNotifications) {
        window.optimizationNotifications.showSlowConnection();
      }
    }, 1500);
  }

  applyBatterySavingMode() {
    console.log('🔋 Modo ahorro de batería activado...');

    // Pausar todas las animaciones
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);

    // Reducir frecuencia de actualizaciones
    if (window.reduceUpdateFrequency) {
      window.reduceUpdateFrequency();
    }

    console.log('🔋 Modo ahorro de batería aplicado');
    
    // Mostrar notificación de ahorro de batería
    setTimeout(() => {
      if (window.optimizationNotifications) {
        window.optimizationNotifications.showBatterySaving();
      }
    }, 1000);
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
      
      // Desactivar más efectos
      document.querySelectorAll('*').forEach(el => {
        el.style.transition = 'none';
      });
    }
  }

  handleLowFPS() {
    if (!this.emergencyModeActive) {
      this.emergencyModeActive = true;
      console.log('🚨 Modo emergencia activado por FPS bajo');
      
      // Desactivar todos los efectos visuales
      const emergencyStyle = document.createElement('style');
      emergencyStyle.textContent = `
        * { 
          animation: none !important;
          transition: none !important; 
          transform: none !important;
          filter: none !important;
          backdrop-filter: none !important;
        }
      `;
      document.head.appendChild(emergencyStyle);
      
      // Mostrar notificación de modo emergencia
      if (window.optimizationNotifications) {
        window.optimizationNotifications.showEmergencyMode();
      }
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
    // Cargar sistema de notificaciones primero
    import('./optimization-notifications.js').then(() => {
      window.mobileOptimizer = MobileOptimizer.getInstance();
    });
  });
} else {
  // Cargar sistema de notificaciones primero
  import('./optimization-notifications.js').then(() => {
    window.mobileOptimizer = MobileOptimizer.getInstance();
  });
}

export default MobileOptimizer;
