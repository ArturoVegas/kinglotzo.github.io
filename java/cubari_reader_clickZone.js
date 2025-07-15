// cubari-reader.js - Funcionalidad del lector de manga

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // TOGGLE CONTROLS FUNCTIONALITY
    // ========================================
    
    const toggleBtn = document.getElementById('toggle-controls');
    const controls = document.getElementById('reader-controls');
    let isControlsVisible = false;

    if (toggleBtn && controls) {
        // Función para mostrar/ocultar controles
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            isControlsVisible = !isControlsVisible;
            
            if (isControlsVisible) {
                controls.classList.add('visible');
                toggleBtn.classList.add('active');
            } else {
                controls.classList.remove('visible');
                toggleBtn.classList.remove('active');
            }
        });

        // Cerrar controles al hacer clic fuera
        document.addEventListener('click', function(event) {
            if (!toggleBtn.contains(event.target) && !controls.contains(event.target)) {
                controls.classList.remove('visible');
                toggleBtn.classList.remove('active');
                isControlsVisible = false;
            }
        });

        // Evitar que los clicks dentro de los controles los cierren
        controls.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // ========================================
    // READER CONTROLS FUNCTIONALITY
    // ========================================
    
    const readerContainer = document.getElementById('reader-container');
    let currentReadingMode = 'vertical';
    let currentImageFit = 'fit-width';
    let currentZoom = 100;
    let currentSpacing = 10;

    // Botones de modo de lectura
    document.querySelectorAll('[data-mode]').forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            // Actualizar botones activos
            document.querySelectorAll('[data-mode]').forEach(btn => 
                btn.classList.remove('active')
            );
            this.classList.add('active');
            
            // Cambiar modo del contenedor
            if (readerContainer) {
                readerContainer.className = `reader-container ${mode}`;
                currentReadingMode = mode;
            }
            
            console.log(`Modo de lectura cambiado a: ${mode}`);
        });
    });

    // Botones de ajuste de imagen
    document.querySelectorAll('[data-fit]').forEach(button => {
        button.addEventListener('click', function() {
            const fit = this.dataset.fit;
            
            // Actualizar botones activos
            document.querySelectorAll('[data-fit]').forEach(btn => 
                btn.classList.remove('active')
            );
            this.classList.add('active');
            
            // Aplicar ajuste a todas las imágenes
            document.querySelectorAll('.reader-image').forEach(img => {
                img.className = `reader-image ${fit}`;
            });
            
            currentImageFit = fit;
            console.log(`Ajuste de imagen cambiado a: ${fit}`);
        });
    });

    // Control de espaciado
    const spacingSlider = document.getElementById('spacing-slider');
    if (spacingSlider) {
        spacingSlider.addEventListener('input', function() {
            const spacing = this.value;
            currentSpacing = spacing;
            
            // Aplicar espaciado al contenedor
            if (readerContainer) {
                readerContainer.style.gap = `${spacing}px`;
            }
            
            console.log(`Espaciado cambiado a: ${spacing}px`);
        });
    }

    // Controles de zoom
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomLevel = document.getElementById('zoom-level');

    if (zoomIn && zoomOut && zoomLevel) {
        zoomIn.addEventListener('click', function() {
            if (currentZoom < 200) {
                currentZoom += 10;
                updateZoom();
            }
        });

        zoomOut.addEventListener('click', function() {
            if (currentZoom > 50) {
                currentZoom -= 10;
                updateZoom();
            }
        });

        function updateZoom() {
            zoomLevel.textContent = `${currentZoom}%`;
            
            // Aplicar zoom a todas las imágenes
            document.querySelectorAll('.reader-image').forEach(img => {
                img.style.transform = `scale(${currentZoom / 100})`;
            });
            
            console.log(`Zoom cambiado a: ${currentZoom}%`);
        }
    }

    

    // ========================================
    // CLICK ZONES FUNCTIONALITY
    // ========================================
    
    const clickOverlay = document.getElementById('click-overlay');
    const clickPrev = document.getElementById('click-prev');
    const clickNext = document.getElementById('click-next');
    const clickMenu = document.getElementById('click-menu');

    if (clickPrev) {
        clickPrev.addEventListener('click', function() {
            console.log('Click zona anterior');
            // Lógica para página anterior
        });
    }

    if (clickNext) {
        clickNext.addEventListener('click', function() {
            console.log('Click zona siguiente');
            // Lógica para página siguiente
        });
    }

    if (clickMenu) {
        clickMenu.addEventListener('click', function() {
            console.log('Click zona menú');
            // Mostrar/ocultar menú
            if (controls) {
                const isVisible = controls.classList.contains('visible');
                if (isVisible) {
                    controls.classList.remove('visible');
                    toggleBtn.classList.remove('active');
                } else {
                    controls.classList.add('visible');
                    toggleBtn.classList.add('active');
                }
                isControlsVisible = !isVisible;
            }
        });
    }

    // ========================================
    // PROGRESS BAR FUNCTIONALITY
    // ========================================
    
    const progressBar = document.getElementById('progress-bar');
    
    function updateProgress() {
        if (progressBar) {
            const scrollTop = window.pageYOffset;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            progressBar.style.width = scrollPercent + '%';
        }
    }

    // Actualizar progreso al hacer scroll
    window.addEventListener('scroll', updateProgress);

    // ========================================
    // KEYBOARD NAVIGATION
    // ========================================
    
    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case 'ArrowLeft':
                console.log('Tecla izquierda - Página anterior');
                // Lógica para página anterior
                break;
            case 'ArrowRight':
                console.log('Tecla derecha - Página siguiente');
                // Lógica para página siguiente
                break;
            case 'ArrowUp':
                console.log('Tecla arriba - Scroll up');
                window.scrollBy(0, -100);
                break;
            case 'ArrowDown':
                console.log('Tecla abajo - Scroll down');
                window.scrollBy(0, 100);
                break;
            case 'Escape':
                // Cerrar controles
                if (controls) {
                    controls.classList.remove('visible');
                    toggleBtn.classList.remove('active');
                    isControlsVisible = false;
                }
                break;
        }
    });

    // ========================================
    // INITIALIZATION
    // ========================================
    
    console.log('Cubari Reader initialized successfully');
    
    // Habilitar click overlay
    if (clickOverlay) {
        clickOverlay.classList.add('enabled');
    }
    
    // Inicializar configuración por defecto
    updateProgress();
});