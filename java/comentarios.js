
import {
  getDatabase,
  ref,
  push,
  onValue,
  get,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyArUObX1yvBE1F7JOotiFVBVp_FuFGtLks",
  authDomain: "prueba-base-de-datos-270a7.firebaseapp.com",
  databaseURL: "https://prueba-base-de-datos-270a7-default-rtdb.firebaseio.com",
  projectId: "prueba-base-de-datos-270a7",
  storageBucket: "prueba-base-de-datos-270a7.appspot.com",
  messagingSenderId: "190031828502",
  appId: "1:190031828502:web:e8c9ba978b037cce008737",
  measurementId: "G-W512T7N7GB"
};

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getDatabase(app);
const auth = getAuth(app);

// Cambia este UID por el UID real del admin
const ADMIN_UID = "Cqh5y2MlsObi4ox90jlbAiRGu4D2";

// Obtener parámetros manga y capítulo de la URL
function getParams() {
  const url = new URLSearchParams(window.location.search);
  return {
    manga: url.get("manga"),
    cap: url.get("cap")
  };
}

// Formatea fechas como "hace X minutos/hours/días"
function formatoFechaRelativa(fechaISO) {
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const diffMs = ahora - fecha;

  const segundos = Math.floor(diffMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias > 0) return `hace ${dias} día${dias > 1 ? "s" : ""}`;
  if (horas > 0) return `hace ${horas} hora${horas > 1 ? "s" : ""}`;
  if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  return "hace unos segundos";
}

// Elementos DOM
const btnIniciar = document.getElementById("btn-iniciar-sesion");
const btnLogout = document.getElementById("btn-logout");
const formComentario = document.getElementById("comment-form");
const listaComentarios = document.getElementById("lista-comentarios");
const contadorComentarios = document.querySelector(".comment-count-custom");
const inputComentario = document.getElementById("input-comentario");
const userAvatar = document.getElementById("user-avatar");

let usuarioActual = null;

onAuthStateChanged(auth, (user) => {
  usuarioActual = user;
  actualizarUI(user);
  cargarComentarios();
});

btnIniciar?.addEventListener("click", () => {
  window.location.href = "../html/auth.html";
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.removeItem('rememberUser');
  localStorage.removeItem('userEmail');
  mostrarNotificacion("Sesión cerrada correctamente.", "success");
  setTimeout(() => location.reload(), 1000);
});

document.getElementById("btn-publicar-comentario")?.addEventListener("click", publicarComentario);

// Actualiza la UI según si está logueado o no
function actualizarUI(user) {
  if (user) {
    if (btnIniciar) btnIniciar.style.display = "none";
    if (btnLogout) btnLogout.style.display = "inline-block";
    if (formComentario) formComentario.style.display = "flex";
    if (userAvatar) {
      // Obtener avatar del usuario actual
      const displayName = user.displayName || user.email?.split('@')[0] || "Usuario";
      getUserAvatar(user.uid, displayName).then(avatarUrl => {
        // Convertir el div de avatar a imagen
        userAvatar.innerHTML = '';
        const avatarImg = document.createElement('img');
        avatarImg.src = avatarUrl;
        avatarImg.alt = `Avatar de ${displayName}`;
        avatarImg.style.width = '100%';
        avatarImg.style.height = '100%';
        avatarImg.style.objectFit = 'cover';
        avatarImg.style.borderRadius = '50%';
        userAvatar.appendChild(avatarImg);
      }).catch(() => {
        // Fallback al texto si hay error
        userAvatar.textContent = displayName.charAt(0).toUpperCase();
      });
    }
  } else {
    if (btnIniciar) btnIniciar.style.display = "inline-block";
    if (btnLogout) btnLogout.style.display = "none";
    if (formComentario) formComentario.style.display = "none";
    if (userAvatar) userAvatar.textContent = "U";
  }
}

async function publicarComentario() {
  const { manga, cap } = getParams();
  if (!manga || !cap) {
    mostrarNotificacion("Error: No se especificó manga o capítulo.", "error");
    return;
  }

  if (!usuarioActual) {
    mostrarNotificacion("Debes iniciar sesión para comentar.", "warning");
    return;
  }

  const texto = inputComentario?.value.trim();
  if (!texto) {
    mostrarNotificacion("Escribe un comentario antes de publicar.", "warning");
    return;
  }

  // Deshabilitar botón durante envío
  const btnPublicar = document.getElementById("btn-publicar-comentario");
  const textoOriginal = btnPublicar?.textContent;
  if (btnPublicar) {
    btnPublicar.disabled = true;
    btnPublicar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Publicando...';
  }

  const nick = usuarioActual.displayName?.trim() || usuarioActual.email?.split("@")[0] || "Anónimo";

  const comentario = {
    usuario: nick && nick !== "" ? nick : "Anónimo",
    uid: usuarioActual.uid,
    texto,
    fecha: new Date().toISOString(),
    manga,
    capitulo: cap,
    respuestaA: null, // Para comentarios principales
    respuestas: [] // Array de IDs de respuestas
  };

  const comentariosRef = ref(db, `comentarios/${manga}/${cap}`);

  try {
    await push(comentariosRef, comentario);
    inputComentario.value = "";
    mostrarNotificacion("¡Comentario publicado con éxito!", "success");

    // Actualizar contador en usuario
    const userRef = ref(db, `usuarios/${usuarioActual.uid}`);
    const snapshot = await get(userRef);
    const currentComentarios = snapshot.exists() ? snapshot.val().comentarios || 0 : 0;
    await update(userRef, { comentarios: currentComentarios + 1 });

    cargarComentarios();
  } catch (error) {
    console.error("Error al publicar comentario:", error);
    mostrarNotificacion("No se pudo publicar el comentario. Inténtalo de nuevo.", "error");
  } finally {
    // Rehabilitar botón
    if (btnPublicar) {
      btnPublicar.disabled = false;
      btnPublicar.textContent = textoOriginal;
    }
  }
}

function cargarComentarios() {
  const { manga, cap } = getParams();
  if (!manga || !cap) return;

  // Mostrar spinner de carga
  mostrarCargandoComentarios();

  const comentariosRef = ref(db, `comentarios/${manga}/${cap}`);

  onValue(comentariosRef, (snapshot) => {
    setTimeout(() => {
      listaComentarios.innerHTML = "";
      if (!snapshot.exists()) {
        contadorComentarios.textContent = "0 Comentarios";
        mostrarEstadoVacio();
        return;
      }

    const comentarios = snapshot.val();
    const arrayComentarios = Object.entries(comentarios).sort(
      (a, b) => new Date(b[1].fecha) - new Date(a[1].fecha)
    );

    contadorComentarios.textContent = `${arrayComentarios.length} Comentario${arrayComentarios.length !== 1 ? "s" : ""}`;

    const { manga, cap } = getParams();

      arrayComentarios.forEach(([key, com], index) => {
        // Solo mostrar comentarios principales (no respuestas)
        if (com.respuestaA) return;
        
        const div = document.createElement("div");
        div.className = "comentario-box";
        div.setAttribute('data-key', key);
        div.style.animationDelay = `${index * 0.1}s`;

    // Header del comentario mejorado
    const userInfo = document.createElement("div");
    userInfo.className = "comment-user-info";

    // Avatar del usuario
    const userAvatar = document.createElement("img");
    userAvatar.className = "comment-user-avatar";
    
    // Obtener datos del usuario para el avatar
    getUserAvatar(com.uid, com.usuario).then(avatarUrl => {
      userAvatar.src = avatarUrl;
      userAvatar.alt = `Avatar de ${com.usuario}`;
    });

    const username = document.createElement("span");
    username.className = "comment-username";
    username.textContent = com.usuario;

        // Badge de admin
        if (com.uid === ADMIN_UID) {
          const adminBadge = document.createElement("span");
          adminBadge.className = "comment-admin-badge";
          adminBadge.textContent = "Admin";
          username.appendChild(adminBadge);
        }

        const fechaElem = document.createElement("small");
        fechaElem.className = "fecha-comentario";
        fechaElem.textContent = formatoFechaRelativa(com.fecha);

    userInfo.appendChild(userAvatar);
    userInfo.appendChild(username);
    userInfo.appendChild(fechaElem);

        const textoElem = document.createElement("p");
        textoElem.className = "comment-text";
        textoElem.textContent = com.texto;

        div.appendChild(userInfo);
        div.appendChild(textoElem);

        if (com.editado) {
          const editadoSpan = document.createElement("small");
          editadoSpan.className = "comment-edited-badge";
          editadoSpan.textContent = "✏️ editado";
          userInfo.appendChild(editadoSpan);
        }

        // Botón de responder (visible para todos los usuarios autenticados)
        if (usuarioActual && !com.respuestaA) { // Solo en comentarios principales
          const btnResponder = document.createElement("button");
          btnResponder.className = "btn btn-sm btn-outline-info me-2";
          btnResponder.innerHTML = '💬 Responder';
          btnResponder.onclick = () => mostrarFormularioRespuesta(key, com);
          
          const accionesRespuesta = document.createElement("div");
          accionesRespuesta.className = "mt-2 comment-reply-actions";
          accionesRespuesta.appendChild(btnResponder);
          div.appendChild(accionesRespuesta);
        }

      // Mostrar botones solo para comentarios propios o admin
      if (
        usuarioActual &&
        (com.uid === usuarioActual.uid || usuarioActual.uid === ADMIN_UID)
      ) {
        const acciones = document.createElement("div");
        acciones.className = "mt-2 comment-admin-actions";

        const btnEditar = document.createElement("button");
        btnEditar.className = "btn btn-sm btn-outline-primary me-2";
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => editarComentario(key, com, manga, cap);

        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-sm btn-outline-danger";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.onclick = () => eliminarComentario(key, com.uid, manga, cap);

        acciones.appendChild(btnEditar);
        acciones.appendChild(btnEliminar);
        div.appendChild(acciones);
      }

      // Cargar y mostrar respuestas si las hay
      if (com.respuestas && Object.keys(com.respuestas).length > 0) {
        const respuestasContainer = document.createElement("div");
        respuestasContainer.className = "replies-container";
        cargarRespuestas(respuestasContainer, key, manga, cap);
        div.appendChild(respuestasContainer);
      }

        listaComentarios.appendChild(div);
      });
    }, 300); // Pequeño delay para mostrar el loading
  });
}

// Función para mostrar loading
function mostrarCargandoComentarios() {
  listaComentarios.innerHTML = `
    <div class="loading-comments">
      <div class="loading-spinner"></div>
      <span>Cargando comentarios...</span>
    </div>
  `;
}

// Función para mostrar estado vacío
function mostrarEstadoVacio() {
  listaComentarios.innerHTML = `
    <div class="empty-comments">
      <div class="empty-comments-icon">💭</div>
      <div class="empty-comments-text">¡Sé el primero en comentar!</div>
      <div class="empty-comments-subtext">Comparte tu opinión sobre este capítulo</div>
    </div>
  `;
}
function editarComentario(key, comentario, manga, cap) {
  mostrarModalEdicion(comentario.texto, async (nuevoTexto) => {
    if (!usuarioActual) {
      mostrarNotificacion("Debes iniciar sesión para editar.", "warning");
      return;
    }
    if (
      usuarioActual.uid !== comentario.uid &&
      usuarioActual.uid !== ADMIN_UID
    ) {
      mostrarNotificacion("No tienes permiso para editar este comentario.", "error");
      return;
    }

    const comentarioRef = ref(db, `comentarios/${manga}/${cap}/${key}`);

    try {
      await update(comentarioRef, {
        texto: nuevoTexto,
        editado: true,
        fechaEdicion: new Date().toISOString()
      });
      cargarComentarios();
    } catch (err) {
      console.error("Error editando comentario:", err);
      mostrarNotificacion("Error al editar el comentario.", "error");
    }
  });
}

function eliminarComentario(key, uid, manga, cap) {
  mostrarModalConfirmacion("¿Estás seguro de eliminar este comentario?", "Eliminar", async () => {
    if (!usuarioActual) {
      mostrarNotificacion("Debes iniciar sesión para eliminar.", "warning");
      return;
    }
    if (
      usuarioActual.uid !== uid &&
      usuarioActual.uid !== ADMIN_UID
    ) {
      mostrarNotificacion("No tienes permiso para eliminar este comentario.", "error");
      return;
    }

    const comentarioRef = ref(db, `comentarios/${manga}/${cap}/${key}`);
    try {
      await remove(comentarioRef);
      // Reducir contador de comentarios del usuario
      const userRef = ref(db, `usuarios/${uid}`);
      const snapshot = await get(userRef);
      const currentComentarios = snapshot.exists() ? snapshot.val().comentarios || 1 : 1;
      await update(userRef, { comentarios: Math.max(0, currentComentarios - 1) });
      cargarComentarios();
    } catch (err) {
      console.error("Error al eliminar comentario:", err);
      mostrarNotificacion("No se pudo eliminar el comentario.", "error");
    }
  });
}

// Función para obtener el avatar del usuario
async function getUserAvatar(uid, username) {
  try {
    const userRef = ref(db, `usuarios/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists() && snapshot.val().avatarURL) {
      return snapshot.val().avatarURL;
    } else {
      // Fallback a ui-avatars.com
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=54a3ff&color=fff&size=40`;
    }
  } catch (error) {
    console.error('Error obteniendo avatar del usuario:', error);
    // Fallback en caso de error
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=54a3ff&color=fff&size=40`;
  }
}

// Sistema de notificaciones mejorado
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Remover notificaciones existentes
  const existente = document.querySelector('.notification-toast');
  if (existente) existente.remove();

  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${tipo}`;
  
  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }[tipo] || 'ℹ️';
  
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${mensaje}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(notification);
  
  // Mostrar con animación
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Auto-remover después de 4 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Mostrar formulario para respuesta
function mostrarFormularioRespuesta(parentKey, comentarioPadre, respuestaKey = null) {
  const respuestaContainer = document.createElement("div");
  respuestaContainer.className = "respuesta-form-container mt-3";

  const textareaRespuesta = document.createElement("textarea");
  textareaRespuesta.className = "form-control mb-2";
  textareaRespuesta.rows = "3";
  
  // Si es respuesta a una respuesta, mencionar al usuario
  if (respuestaKey) {
    textareaRespuesta.placeholder = `Respondiendo a ${comentarioPadre.usuario}...`;
    textareaRespuesta.value = `@${comentarioPadre.usuario} `;
  } else {
    textareaRespuesta.placeholder = `Respondiendo a ${comentarioPadre.usuario}...`;
  }

  const btnEnviarRespuesta = document.createElement("button");
  btnEnviarRespuesta.className = "btn btn-success btn-sm me-2";
  btnEnviarRespuesta.textContent = "Enviar respuesta";
  btnEnviarRespuesta.onclick = () => enviarRespuesta(textareaRespuesta, parentKey, respuestaKey);

  const btnCancelar = document.createElement("button");
  btnCancelar.className = "btn btn-secondary btn-sm";
  btnCancelar.textContent = "Cancelar";
  btnCancelar.onclick = () => {
    respuestaContainer.remove();
    cargarComentarios(); // Recargar para restaurar botones originales
  };

  const buttonsContainer = document.createElement("div");
  buttonsContainer.appendChild(btnEnviarRespuesta);
  buttonsContainer.appendChild(btnCancelar);

  respuestaContainer.appendChild(textareaRespuesta);
  respuestaContainer.appendChild(buttonsContainer);

  // Buscar el elemento correcto para reemplazar
  let targetElement;
  if (respuestaKey) {
    // Es una respuesta a respuesta - buscar en el contenedor de respuestas
    const repliesContainer = document.querySelector(`[data-key="${parentKey}"] .replies-container`);
    if (repliesContainer) {
      repliesContainer.appendChild(respuestaContainer);
    }
  } else {
    // Es respuesta a comentario principal
    const accionesRespuesta = document.querySelector(`[data-key="${parentKey}"] .comment-reply-actions`);
    if (accionesRespuesta) {
      accionesRespuesta.replaceWith(respuestaContainer);
    }
  }
  
  // Focus en el textarea
  setTimeout(() => {
    textareaRespuesta.focus();
    if (respuestaKey) {
      // Colocar cursor al final si hay mención
      textareaRespuesta.setSelectionRange(textareaRespuesta.value.length, textareaRespuesta.value.length);
    }
  }, 100);
}

// Enviar respuesta a comentario
async function enviarRespuesta(textarea, parentKey, respuestaOriginalKey = null) {
  const { manga, cap } = getParams();
  const texto = textarea.value.trim();

  if (!texto) {
    mostrarNotificacion("Escribe una respuesta antes de enviar.", "warning");
    return;
  }

  const nick = usuarioActual.displayName?.trim() || usuarioActual.email?.split("@")[0] || "Anónimo";
  const respuesta = {
    usuario: nick,
    uid: usuarioActual.uid,
    texto,
    fecha: new Date().toISOString(),
    respuestaA: parentKey,
    manga,
    capitulo: cap
  };

  try {
    // Crear la respuesta como un comentario separado
    const comentariosRef = ref(db, `comentarios/${manga}/${cap}`);
    const nuevaRespuestaRef = await push(comentariosRef, respuesta);

    // Actualizar el comentario padre para incluir la referencia a la respuesta
    const parentRef = ref(db, `comentarios/${manga}/${cap}/${parentKey}`);
    const parentSnapshot = await get(parentRef);
    
    if (parentSnapshot.exists()) {
      const parentData = parentSnapshot.val();
      const respuestasActuales = parentData.respuestas || {};
      respuestasActuales[nuevaRespuestaRef.key] = true;
      
      await update(parentRef, {
        respuestas: respuestasActuales
      });
    }

    mostrarNotificacion("¡Respuesta publicada con éxito!", "success");
    cargarComentarios();
  } catch (error) {
    console.error("Error al enviar respuesta:", error);
    mostrarNotificacion("No se pudo enviar la respuesta. Inténtalo de nuevo.", "error");
  }
}

// Función para cargar respuestas de un comentario
async function cargarRespuestas(container, parentKey, manga, cap) {
  try {
    const comentariosRef = ref(db, `comentarios/${manga}/${cap}`);
    const snapshot = await get(comentariosRef);
    
    if (!snapshot.exists()) return;
    
    const comentarios = snapshot.val();
    const respuestas = [];
    
    // Buscar todas las respuestas a este comentario
    Object.entries(comentarios).forEach(([key, comentario]) => {
      if (comentario.respuestaA === parentKey) {
        respuestas.push([key, comentario]);
      }
    });
    
    // Ordenar respuestas por fecha
    respuestas.sort((a, b) => new Date(a[1].fecha) - new Date(b[1].fecha));
    
    container.innerHTML = '';
    
    respuestas.forEach(([respuestaKey, respuesta]) => {
      const respuestaDiv = document.createElement('div');
      respuestaDiv.className = 'respuesta-item';
      
      const userInfo = document.createElement('div');
      userInfo.className = 'comment-user-info';
      
      const userAvatar = document.createElement('img');
      userAvatar.className = 'comment-user-avatar comment-user-avatar-small';
      
      getUserAvatar(respuesta.uid, respuesta.usuario).then(avatarUrl => {
        userAvatar.src = avatarUrl;
        userAvatar.alt = `Avatar de ${respuesta.usuario}`;
      });
      
      const username = document.createElement('span');
      username.className = 'comment-username';
      username.textContent = respuesta.usuario;
      
      if (respuesta.uid === ADMIN_UID) {
        const adminBadge = document.createElement('span');
        adminBadge.className = 'comment-admin-badge';
        adminBadge.textContent = 'Admin';
        username.appendChild(adminBadge);
      }
      
      const fechaElem = document.createElement('small');
      fechaElem.className = 'fecha-comentario';
      fechaElem.textContent = formatoFechaRelativa(respuesta.fecha);
      
      userInfo.appendChild(userAvatar);
      userInfo.appendChild(username);
      userInfo.appendChild(fechaElem);
      
      const textoElem = document.createElement('p');
      textoElem.className = 'comment-text';
      textoElem.textContent = respuesta.texto;
      
      respuestaDiv.appendChild(userInfo);
      respuestaDiv.appendChild(textoElem);
      
      // Botón de responder a respuesta (para usuarios autenticados)
      if (usuarioActual) {
        const btnResponderRespuesta = document.createElement('button');
        btnResponderRespuesta.className = 'btn btn-sm btn-outline-info me-2';
        btnResponderRespuesta.innerHTML = '↩️ Responder';
        btnResponderRespuesta.style.fontSize = '0.75rem';
        btnResponderRespuesta.onclick = () => mostrarFormularioRespuesta(parentKey, respuesta, respuestaKey);
        
        const accionesRespuestaAnidada = document.createElement('div');
        accionesRespuestaAnidada.className = 'mt-1 comment-reply-actions-nested';
        accionesRespuestaAnidada.appendChild(btnResponderRespuesta);
        respuestaDiv.appendChild(accionesRespuestaAnidada);
      }
      
      // Botones de editar/eliminar para respuestas
      if (usuarioActual && (respuesta.uid === usuarioActual.uid || usuarioActual.uid === ADMIN_UID)) {
        const acciones = document.createElement('div');
        acciones.className = 'mt-1 comment-admin-actions';
        
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-sm btn-outline-primary me-2';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => editarComentario(respuestaKey, respuesta, manga, cap);
        
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-sm btn-outline-danger';
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.onclick = () => eliminarComentario(respuestaKey, respuesta.uid, manga, cap);
        
        acciones.appendChild(btnEditar);
        acciones.appendChild(btnEliminar);
        respuestaDiv.appendChild(acciones);
      }
      
      container.appendChild(respuestaDiv);
    });
  } catch (error) {
    console.error('Error cargando respuestas:', error);
  }
}

// === SISTEMA DE MODALES MODERNOS ===
function crearModal() {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';

  const modalTitle = document.createElement('h5');
  modalTitle.className = 'modal-title';
  modalHeader.appendChild(modalTitle);

  const modalClose = document.createElement('button');
  modalClose.className = 'modal-close';
  modalClose.innerHTML = '&times;';
  modalClose.onclick = () => cerrarModal(modalOverlay);
  modalHeader.appendChild(modalClose);

  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';

  const modalText = document.createElement('p');
  modalText.className = 'modal-text';
  modalBody.appendChild(modalText);

  const modalTextarea = document.createElement('textarea');
  modalTextarea.className = 'modal-textarea';
  modalTextarea.style.display = 'none'; // Oculto por defecto
  modalBody.appendChild(modalTextarea);

  const modalActions = document.createElement('div');
  modalActions.className = 'modal-actions';

  const cancelarBtn = document.createElement('button');
  cancelarBtn.className = 'modal-btn modal-btn-cancel';
  cancelarBtn.textContent = 'Cancelar';
  cancelarBtn.onclick = () => cerrarModal(modalOverlay);

  const confirmarBtn = document.createElement('button');
  confirmarBtn.className = 'modal-btn modal-btn-confirm';
  confirmarBtn.textContent = 'Confirmar';

  modalActions.appendChild(cancelarBtn);
  modalActions.appendChild(confirmarBtn);
  modalBody.appendChild(modalActions);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalOverlay.appendChild(modalContent);

  // Cerrar al hacer clic fuera del modal
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      cerrarModal(modalOverlay);
    }
  };

  // Cerrar con tecla Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      cerrarModal(modalOverlay);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  document.body.appendChild(modalOverlay);

  return { modalOverlay, modalTitle, modalText, modalTextarea, confirmarBtn, cancelarBtn };
}

function mostrarModalEdicion(textoInicial, callback) {
  const { modalOverlay, modalTitle, modalText, modalTextarea, confirmarBtn } = crearModal();

  modalTitle.innerHTML = '<span class="modal-icon modal-icon-edit">✏️</span> Editar Comentario';
  modalText.textContent = 'Modifica tu comentario abajo:';
  modalTextarea.style.display = 'block';
  modalTextarea.value = textoInicial;
  modalTextarea.placeholder = 'Escribe tu comentario aquí...';
  confirmarBtn.textContent = 'Guardar Cambios';
  confirmarBtn.className = 'modal-btn modal-btn-confirm';

  // Focus en el textarea
  setTimeout(() => {
    modalTextarea.focus();
    modalTextarea.setSelectionRange(modalTextarea.value.length, modalTextarea.value.length);
  }, 300);

  confirmarBtn.onclick = () => {
    const nuevoTexto = modalTextarea.value.trim();
    if (!nuevoTexto) {
      mostrarNotificacion('El comentario no puede estar vacío', 'warning');
      return;
    }
    if (nuevoTexto === textoInicial) {
      cerrarModal(modalOverlay);
      return;
    }
    
    // Mostrar loading
    confirmarBtn.disabled = true;
    confirmarBtn.innerHTML = '<div class="spinner"></div> Guardando...';
    
    callback(nuevoTexto);
    setTimeout(() => cerrarModal(modalOverlay), 500);
  };

  abrirModal(modalOverlay);
}

function mostrarModalConfirmacion(mensaje, accion, callback) {
  const { modalOverlay, modalTitle, modalText, confirmarBtn } = crearModal();

  modalTitle.innerHTML = '<span class="modal-icon modal-icon-delete">🗑️</span> Confirmar Acción';
  modalText.textContent = mensaje;
  confirmarBtn.textContent = accion;
  confirmarBtn.className = 'modal-btn modal-btn-danger';

  confirmarBtn.onclick = () => {
    // Mostrar loading
    confirmarBtn.disabled = true;
    confirmarBtn.innerHTML = '<div class="spinner"></div> Eliminando...';
    
    callback();
    setTimeout(() => cerrarModal(modalOverlay), 500);
  };

  abrirModal(modalOverlay);
}

function abrirModal(modalOverlay) {
  modalOverlay.classList.add('show');
  document.body.style.overflow = 'hidden'; // Prevenir scroll
}

function cerrarModal(modalOverlay) {
  modalOverlay.classList.remove('show');
  document.body.style.overflow = ''; // Restaurar scroll
  setTimeout(() => {
    if (modalOverlay.parentNode) {
      modalOverlay.remove();
    }
  }, 300);
}
