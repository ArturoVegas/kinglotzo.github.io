// =======================================
// OPTIMIZADOR AUTOMÁTICO DE IMÁGENES
// =======================================

/**
 * Optimiza una imagen automáticamente antes de subirla
 * @param {File} file - Archivo de imagen original
 * @param {Object} options - Opciones de optimización
 * @returns {Promise<File>} - Archivo optimizado
 */
export async function optimizeImage(file, options = {}) {
  // Detectar si es móvil y ajustar configuraciones
  const isMobile = window.mobileOptimizer?.isMobile || 
                   window.innerWidth <= 768 ||
                   /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const isLowEnd = window.mobileOptimizer?.isLowEndDevice || 
                   (navigator.deviceMemory && navigator.deviceMemory <= 2);

  const defaults = {
    maxWidth: isLowEnd ? 800 : (isMobile ? 1200 : 1920),
    maxHeight: isLowEnd ? 600 : (isMobile ? 900 : 1080),
    quality: isLowEnd ? 0.7 : (isMobile ? 0.8 : 0.85),
    format: 'webp', // Convertir a WebP por defecto
    maxSizeKB: isLowEnd ? 150 : (isMobile ? 300 : 500)
  };
  
  const config = { ...defaults, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo proporción
        const { width, height } = calculateDimensions(
          img.width, 
          img.height, 
          config.maxWidth, 
          config.maxHeight
        );
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a formato optimizado
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Error al optimizar imagen'));
            return;
          }
          
          // Verificar tamaño final
          const sizeKB = blob.size / 1024;
          const originalSizeKB = file.size / 1024;
          const savings = ((1 - blob.size / file.size) * 100).toFixed(1);
          
          console.log(`Imagen optimizada: ${file.name}`);
          console.log(`Tamaño original: ${originalSizeKB.toFixed(2)} KB`);
          console.log(`Tamaño optimizado: ${sizeKB.toFixed(2)} KB`);
          console.log(`Ahorro: ${savings}%`);
          
          
          // Si aún es muy grande, reducir calidad
          if (sizeKB > config.maxSizeKB && config.quality > 0.3) {
            const newOptions = { ...config, quality: config.quality - 0.1 };
            console.log(`Reoptimizando con calidad ${newOptions.quality}...`);
            optimizeImage(file, newOptions).then(resolve).catch(reject);
            return;
          }
          
          // Crear nuevo archivo optimizado
          const optimizedFile = new File(
            [blob], 
            getOptimizedFileName(file.name, config.format), 
            { type: `image/${config.format}` }
          );
          
          resolve(optimizedFile);
        }, `image/${config.format}`, config.quality);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calcula nuevas dimensiones manteniendo proporción
 */
function calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Redimensionar si excede límites
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Genera nombre optimizado para el archivo
 */
function getOptimizedFileName(originalName, format) {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_optimized.${format}`;
}

/**
 * Función mejorada para subir imagen con optimización automática
 */
export async function subirImagenOptimizada(file, folder, options = {}) {
  try {
    // Verificar si es imagen
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }
    
    // Verificar tamaño inicial
    const sizeKB = file.size / 1024;
    console.log(`Procesando imagen: ${file.name} (${sizeKB.toFixed(2)} KB)`);
    
    let processedFile = file;
    
    // Optimizar solo si es necesario (>100KB o no es WebP)
    if (sizeKB > 100 || !file.type.includes('webp')) {
      console.log('Optimizando imagen...');
      
      // Configuración específica según tipo de imagen
      const imageOptions = getImageOptions(folder, options);
      processedFile = await optimizeImage(file, imageOptions);
    }
    
    // Subir imagen optimizada a Cloudinary
    const formData = new FormData();
    formData.append("file", processedFile);
    formData.append("upload_preset", "para subir mangas");
    if (folder) formData.append("folder", folder);
    
    const response = await fetch("https://api.cloudinary.com/v1_1/djxnb3qrn/image/upload", {
      method: "POST",
      body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Error al subir imagen");
    }
    
    console.log('✅ Imagen subida correctamente:', data.secure_url);
    return data.secure_url;
    
  } catch (error) {
    console.error('❌ Error en optimización/subida:', error);
    throw error;
  }
}

/**
 * Configuraciones específicas según tipo de imagen
 */
function getImageOptions(folder, customOptions) {
  const baseOptions = {
    quality: 0.85,
    format: 'webp',
    maxSizeKB: 500
  };
  
  // Configuraciones específicas
  if (folder.includes('portada')) {
    return {
      ...baseOptions,
      maxWidth: 800,
      maxHeight: 1200,
      quality: 0.9,
      maxSizeKB: 300,
      ...customOptions
    };
  }
  
  if (folder.includes('banner')) {
    return {
      ...baseOptions,
      maxWidth: 1920,
      maxHeight: 600,
      quality: 0.85,
      maxSizeKB: 400,
      ...customOptions
    };
  }
  
  if (folder.includes('capitulo') || folder.includes('cap')) {
    return {
      ...baseOptions,
      maxWidth: 1200,
      maxHeight: 1800,
      quality: 0.8,
      maxSizeKB: 600,
      ...customOptions
    };
  }
  
  // Por defecto
  return { ...baseOptions, ...customOptions };
}

/**
 * Función para mostrar preview optimizado antes de subir
 */
export function showOptimizedPreview(file, previewElement, callback) {
  const originalSize = (file.size / 1024).toFixed(2);
  
  optimizeImage(file).then(optimizedFile => {
    const optimizedSize = (optimizedFile.size / 1024).toFixed(2);
    const savings = ((1 - optimizedFile.size / file.size) * 100).toFixed(1);
    
    // Mostrar preview
    const img = previewElement.querySelector('img') || document.createElement('img');
    img.src = URL.createObjectURL(optimizedFile);
    img.style.maxWidth = '200px';
    img.style.maxHeight = '200px';
    
    if (!previewElement.querySelector('img')) {
      previewElement.appendChild(img);
    }
    
    // Mostrar información de optimización
    const info = document.createElement('div');
    info.className = 'optimization-info mt-2';
    info.innerHTML = `
      <small class="text-success">
        <strong>✅ Imagen optimizada:</strong><br>
        Original: ${originalSize} KB → Optimizada: ${optimizedSize} KB<br>
        <span class="text-primary">Ahorro: ${savings}%</span>
      </small>
    `;
    
    // Remover info anterior si existe
    const oldInfo = previewElement.querySelector('.optimization-info');
    if (oldInfo) oldInfo.remove();
    
    previewElement.appendChild(info);
    
    if (callback) callback(optimizedFile);
  }).catch(error => {
    console.error('Error en preview optimizado:', error);
    if (callback) callback(file); // Usar original si falla
  });
}
