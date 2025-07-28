// =======================================
// SISTEMA DE NOTIFICACIONES DE OPTIMIZACIÓN
// =======================================

class OptimizationNotifications {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.isVisible = false;
    this.autoHideTimeout = null;
    
    this.init();
  }

  init() {
    this.createNotificationContainer();
    this.createStyles();
  }

  createNotificationContainer() {
    // Crear contenedor principal
    this.container = document.createElement('div');
    this.container.id = 'optimization-notifications';
    this.container.className = 'optimization-notifications-container';
    
    document.body.appendChild(this.container);
  }

  createStyles() {
    const style = document.createElement('style');
    style.id = 'optimization-notifications-styles';
    style.textContent = `
      .optimization-notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 350px;
        pointer-events: none;
      }
      
      .optimization-notification {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.95) 0%, rgba(139, 195, 74, 0.95) 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        margin-bottom: 10px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        position: relative;
        overflow: hidden;
      }
      
      .optimization-notification.show {
        transform: translateX(0);
        opacity: 1;
      }
      
      .optimization-notification::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%);
      }
      
      .notification-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .notification-icon {
        font-size: 18px;
        margin-right: 10px;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .notification-title {
        font-weight: 600;
        font-size: 15px;
      }
      
      .notification-message {
        margin: 8px 0;
        opacity: 0.95;
      }
      
      .notification-details {
        font-size: 12px;
        opacity: 0.8;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .notification-close {
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .notification-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }
      
      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: rgba(255, 255, 255, 0.6);
        transform-origin: left;
        animation: progress-countdown 8s linear;
      }
      
      @keyframes progress-countdown {
        0% { transform: scaleX(1); }
        100% { transform: scaleX(0); }
      }
      
      /* Diferentes tipos de notificaciones */
      .notification-mobile {
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.95) 0%, rgba(30, 136, 229, 0.95) 100%);
      }
      
      .notification-battery {
        background: linear-gradient(135deg, rgba(255, 152, 0, 0.95) 0%, rgba(255, 193, 7, 0.95) 100%);
      }
      
      .notification-emergency {
        background: linear-gradient(135deg, rgba(244, 67, 54, 0.95) 0%, rgba(229, 57, 53, 0.95) 100%);
        animation: shake 0.5s;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      /* Responsive */
      @media (max-width: 480px) {
        .optimization-notifications-container {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }
        
        .optimization-notification {
          font-size: 13px;
          padding: 14px 16px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  show(options) {
    const notification = this.createNotification(options);
    this.container.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Auto-hide después de 8 segundos
    const autoHideTime = options.duration || 8000;
    setTimeout(() => {
      this.hide(notification);
    }, autoHideTime);
    
    // Limitar número de notificaciones visibles
    this.limitNotifications();
    
    return notification;
  }

  createNotification(options) {
    const notification = document.createElement('div');
    notification.className = `optimization-notification ${options.type || ''}`;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'notification-progress';
    
    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-icon">${options.icon || '⚡'}</span>
        <span class="notification-title">${options.title || 'Optimización Aplicada'}</span>
      </div>
      <div class="notification-message">${options.message}</div>
      ${options.details ? `<div class="notification-details">${options.details}</div>` : ''}
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    notification.appendChild(progressBar);
    
    // Evento de cerrar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.hide(notification);
    });
    
    return notification;
  }

  hide(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }

  limitNotifications() {
    const notifications = this.container.querySelectorAll('.optimization-notification');
    if (notifications.length > 3) {
      // Remover las más antiguas
      for (let i = 0; i < notifications.length - 3; i++) {
        this.hide(notifications[i]);
      }
    }
  }

  // Métodos específicos para diferentes tipos de optimizaciones
  showMobileOptimization(details = []) {
    const detailsText = details.length > 0 ? 
      `Optimizaciones: ${details.join(', ')}` : 
      'Se han aplicado optimizaciones automáticas';
      
    return this.show({
      type: 'notification-mobile',
      icon: '📱',
      title: 'Optimización Móvil Activada',
      message: 'Para mejorar tu experiencia hemos desactivado algunos efectos visuales pesados.',
      details: detailsText,
      duration: 10000
    });
  }

  showBatterySaving() {
    return this.show({
      type: 'notification-battery',
      icon: '🔋',
      title: 'Modo Ahorro Activado',
      message: 'Se ha detectado batería baja. Hemos pausado animaciones para ahorrar energía.',
      details: 'Las animaciones se reactivarán automáticamente al conectar el cargador',
      duration: 12000
    });
  }

  showSlowConnection() {
    return this.show({
      type: 'notification-mobile',
      icon: '📶',
      title: 'Conexión Lenta Detectada',
      message: 'Hemos optimizado la carga de contenido para mejorar la velocidad.',
      details: 'Se ha reducido la precarga de recursos y activado lazy loading agresivo',
      duration: 8000
    });
  }

  showEmergencyMode() {
    return this.show({
      type: 'notification-emergency',
      icon: '🚨',
      title: 'Modo Emergencia Activado',
      message: 'Se ha detectado rendimiento bajo. Todos los efectos visuales han sido desactivados.',
      details: 'Esto mejorará significativamente la fluidez de navegación',
      duration: 15000
    });
  }

  showImageOptimization(originalSize, optimizedSize, savings) {
    return this.show({
      type: 'notification-mobile',
      icon: '🖼️',
      title: 'Imagen Optimizada',
      message: 'La imagen ha sido automáticamente optimizada para mejor rendimiento.',
      details: `Tamaño reducido: ${originalSize}KB → ${optimizedSize}KB (${savings}% ahorro)`,
      duration: 6000
    });
  }

  showLowEndDevice() {
    return this.show({
      type: 'notification-mobile',
      icon: '⚡',
      title: 'Dispositivo de Gama Baja Detectado',
      message: 'Hemos ajustado la calidad visual para garantizar una navegación fluida.',
      details: 'Efectos reducidos, imágenes optimizadas y animaciones simplificadas',
      duration: 10000
    });
  }

  // Método para mostrar notificación personalizada
  showCustom(title, message, details = '', icon = '✨', type = '', duration = 8000) {
    return this.show({
      type: `notification-${type}`,
      icon,
      title,
      message,
      details,
      duration
    });
  }

  // Limpiar todas las notificaciones
  clearAll() {
    const notifications = this.container.querySelectorAll('.optimization-notification');
    notifications.forEach(notification => {
      this.hide(notification);
    });
  }
}

// Crear instancia global
if (!window.optimizationNotifications) {
  window.optimizationNotifications = new OptimizationNotifications();
}

export default OptimizationNotifications;
