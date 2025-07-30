// ==============================
// IMPORTACIÓN DE MÓDULOS FIREBASE
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-functions.js";

// ==============================
// CONFIGURACIÓN DE FIREBASE
// ==============================
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

// ==============================
// INICIALIZACIÓN
// ==============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const functions = getFunctions(app);

// ==============================
// REFERENCIAS DOM
// ==============================
const editor = document.getElementById('editor');
const btnVolver = document.getElementById('btnVolver');
const btnPreview = document.getElementById('btnPreview');
const btnGuardarBorrador = document.getElementById('btnGuardarBorrador');
const btnPublicar = document.getElementById('btnPublicar');
const btnConfirmarPublicacion = document.getElementById('btnConfirmarPublicacion');

const novelaSeleccionada = document.getElementById('novelaSeleccionada');
const numeroCapitulo = document.getElementById('numeroCapitulo');
const tituloCapitulo = document.getElementById('tituloCapitulo');
const listaNovelas = document.getElementById('listaNovelas');

const imagenSubir = document.getElementById('imagenSubir');
const enlaceGenerado = document.getElementById('enlaceGenerado');
const btnCopiarEnlace = document.getElementById('btnCopiarEnlace');
const listaImagenesSubidas = document.getElementById('lista-imagenes-subidas');

// Array para gestionar las imágenes subidas
let imagenesSubidas = [];

const contadorPalabras = document.getElementById('contadorPalabras');
const contadorCaracteres = document.getElementById('contadorCaracteres');
const contadorParrafos = document.getElementById('contadorParrafos');

const fontSelect = document.getElementById('fontSelect');
const sizeSelect = document.getElementById('sizeSelect');
const btnSeparador = document.getElementById('btnSeparador');
const btnSaltoLinea = document.getElementById('btnSaltoLinea');

const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
const previewContent = document.getElementById('previewContent');

// ==============================
// AUTENTICACIÓN
// ==============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("No autenticado. Redirigiendo a inicio de sesión.");
    window.location.href = "auth.html";
    return;
  }

  try {
    const rolSnap = await get(ref(db, `usuarios/${user.uid}/rol`));
    const rol = rolSnap.exists() ? rolSnap.val() : null;

    if (rol !== "admin") {
      alert("Acceso denegado. Solo administradores pueden usar el editor.");
      window.location.href = "auth.html";
      return;
    }

    cargarNovelas();
  } catch (error) {
    console.error("Error al verificar rol:", error);
    alert("Error al verificar permisos.");
    window.location.href = "auth.html";
  }
});

// ==============================
// CARGAR NOVELAS
// ==============================
async function cargarNovelas() {
  try {
    const snapshot = await get(ref(db, 'novelas'));
    listaNovelas.innerHTML = "";
    
    if (snapshot.exists()) {
      const novelas = snapshot.val();
      Object.keys(novelas).forEach(nombre => {
        const option = document.createElement("option");
        option.value = nombre;
        listaNovelas.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error al cargar novelas:", err);
  }
}

// ==============================
// FUNCIONES CLOUDINARY
// ==============================
async function subirImagenCloudinary(file, folder) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "para subir mangas");
  if (folder) formData.append("folder", folder);

  const resp = await fetch("https://api.cloudinary.com/v1_1/djxnb3qrn/image/upload", {
    method: "POST",
    body: formData
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || "Error al subir imagen");
  return {
    url: data.secure_url,
    publicId: data.public_id,
    originalName: file.name
  };
}

async function eliminarImagenCloudinary(publicId) {
  try {
    console.log('Marcando imagen para eliminación:', publicId);
    
    // Guardar en la base de datos la imagen que debe ser eliminada
    const imagenesParaEliminar = ref(db, 'imagenes_para_eliminar');
    const nuevaEliminacion = {
      publicId: publicId,
      fechaMarcado: new Date().toISOString(),
      usuario: auth.currentUser.uid
    };
    
    await set(ref(db, `imagenes_para_eliminar/${publicId.replace(/\//g, '_')}`), nuevaEliminacion);
    
    console.log('Imagen marcada para eliminación exitosamente');
    mostrarNotificacion('Imagen marcada para eliminación. Se eliminará de Cloudinary en la próxima limpieza.', 'info');
    
    return true;
  } catch (error) {
    console.error('Error al marcar imagen para eliminación:', error);
    mostrarNotificacion('Error al marcar imagen para eliminación', 'error');
    return false;
  }
}

// ==============================
// HERRAMIENTAS DEL EDITOR
// ==============================

// Botones de formato
document.querySelectorAll('[data-command]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const command = btn.getAttribute('data-command');
    document.execCommand(command, false, null);
    editor.focus();
  });
});

// Selector de fuente
fontSelect.addEventListener('change', () => {
  document.execCommand('fontName', false, fontSelect.value);
  editor.focus();
});

// Selector de tamaño
sizeSelect.addEventListener('change', () => {
  document.execCommand('fontSize', false, '3');
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const spans = editor.querySelectorAll('font[size="3"]');
    spans.forEach(span => {
      span.style.fontSize = sizeSelect.value + 'px';
      span.removeAttribute('size');
    });
  }
  editor.focus();
});

// Insertar separador
btnSeparador.addEventListener('click', () => {
  const separador = document.createElement('div');
  separador.innerHTML = '<hr style="border: 1px solid #666; margin: 20px 0;">';
  insertarElemento(separador);
});

// Insertar salto de línea
btnSaltoLinea.addEventListener('click', () => {
  const salto = document.createElement('br');
  insertarElemento(salto);
});

function insertarElemento(elemento) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(elemento);
    range.setStartAfter(elemento);
    range.setEndAfter(elemento);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  editor.focus();
}

// ==============================
// SUBIDA DE IMÁGENES
// ==============================
imagenSubir.addEventListener('change', async () => {
  if (imagenSubir.files.length > 0) {
    try {
    const { url, publicId, originalName } = await subirImagenCloudinary(imagenSubir.files[0], 'novelas/capitulos');
    enlaceGenerado.value = url;
    
    // Añadir a la lista de imágenes
    imagenesSubidas.push({ url, publicId, name: originalName });
    actualizarListaImagenes();
    
    // Copiar automáticamente al portapapeles
    await navigator.clipboard.writeText(url);
    
    // Mostrar notificación
    mostrarNotificacion('Enlace copiado al portapapeles', 'success');
    
    // Insertar enlace de imagen en el editor (estilo GitHub)
    const linkHtml = `<p><a href="${url}" class="imagen-enlace" data-imagen-url="${url}" style="color: #64b5f6; text-decoration: underline;">${url}</a></p>`;
    document.execCommand('insertHTML', false, linkHtml);
    
      
    } catch (error) {
      mostrarNotificacion('Error al subir la imagen', 'error');
      console.error('Error:', error);
    }
  }
});

// Copiar enlace manualmente
btnCopiarEnlace.addEventListener('click', async () => {
  if (enlaceGenerado.value) {
    try {
      await navigator.clipboard.writeText(enlaceGenerado.value);
      mostrarNotificacion('Enlace copiado al portapapeles', 'success');
    } catch (error) {
      mostrarNotificacion('Error al copiar enlace', 'error');
    }
  }
});

// ==============================
// CONTADOR DE ESTADÍSTICAS
// ==============================
function actualizarEstadisticas() {
  let texto = editor.innerText || editor.textContent || '';
  
  // Remover texto placeholder para el cálculo
  const textoLimpio = texto.replace(/Comienza a escribir tu historia aquí\.\.\./g, '').trim();
  
  const palabras = textoLimpio === '' ? 0 : textoLimpio.split(/\s+/).filter(word => word.length > 0).length;
  const caracteres = textoLimpio.length;
  
  // Contar párrafos reales (excluyendo el placeholder)
  const contenidoHTML = editor.innerHTML;
  let parrafos = 0;
  
  if (contenidoHTML.includes('Comienza a escribir tu historia aquí...')) {
    parrafos = 0; // No hay contenido real
  } else {
    const elementosParrafo = editor.querySelectorAll('p, div');
    parrafos = Array.from(elementosParrafo).filter(el => {
      const textoElemento = el.innerText.trim();
      return textoElemento && textoElemento !== 'Comienza a escribir tu historia aquí...';
    }).length;
  }
  
  contadorPalabras.textContent = palabras;
  contadorCaracteres.textContent = caracteres;
  contadorParrafos.textContent = parrafos;
}

// Actualizar estadísticas en tiempo real
editor.addEventListener('input', actualizarEstadisticas);
editor.addEventListener('keyup', actualizarEstadisticas);

// ==============================
// FUNCIONES DE GUARDADO
// ==============================

// Vista previa
btnPreview.addEventListener('click', () => {
  // Obtener contenido y filtrar el placeholder
  let contenido = editor.innerHTML;
  
  // Remover el texto placeholder si está presente
  if (contenido.includes('Comienza a escribir tu historia aquí...')) {
    contenido = contenido.replace(/Comienza a escribir tu historia aquí\.\.\./g, '');
    contenido = contenido.replace(/<p>\s*<\/p>/g, ''); // Remover párrafos vacíos
  }
  
  // Si no hay contenido real, mostrar mensaje
  if (!contenido.trim() || contenido === '<p></p>' || contenido === '') {
    contenido = '<p class="text-muted text-center">No hay contenido para mostrar</p>';
  }
  
  // Convertir enlaces de imágenes en imágenes reales para la vista previa
  contenido = convertirEnlacesAImagenes(contenido);
  
  previewContent.innerHTML = contenido;
  previewModal.show();
});

// Guardar borrador
btnGuardarBorrador.addEventListener('click', async () => {
  if (!validarFormulario()) return;

  try {
    await guardarBorrador();
    mostrarNotificacion('Borrador guardado correctamente', 'success');
  } catch (error) {
    mostrarNotificacion('Error al guardar borrador', 'error');
    console.error('Error:', error);
  }
});

// Publicar capítulo
btnPublicar.addEventListener('click', () => {
  if (!validarFormulario()) return;
  
  // Obtener contenido y filtrar el placeholder
  let contenido = editor.innerHTML;
  
  // Remover el texto placeholder si está presente
  if (contenido.includes('Comienza a escribir tu historia aquí...')) {
    contenido = contenido.replace(/Comienza a escribir tu historia aquí\.\.\./g, '');
    contenido = contenido.replace(/<p>\s*<\/p>/g, ''); // Remover párrafos vacíos
  }
  
  previewContent.innerHTML = contenido;
  previewModal.show();
});

// Confirmar publicación
btnConfirmarPublicacion.addEventListener('click', async () => {
  try {
    await publicarCapitulo();
    mostrarNotificacion('Capítulo publicado correctamente', 'success');
    previewModal.hide();
    limpiarEditor();
  } catch (error) {
    mostrarNotificacion('Error al publicar capítulo', 'error');
    console.error('Error:', error);
  }
});

async function guardarBorrador() {
  const contenido = editor.innerHTML;
  const clave = `borrador_${novelaSeleccionada.value}_${numeroCapitulo.value}`;
  
  const borradorData = {
    novela: novelaSeleccionada.value,
    capitulo: numeroCapitulo.value,
    titulo: tituloCapitulo.value || '',
    contenido: contenido,
    fechaGuardado: new Date().toISOString()
  };

  await set(ref(db, `borradores/${clave}`), borradorData);
}

async function publicarCapitulo() {
  const contenido = editor.innerHTML;
  
  const capituloData = {
    fecha: new Date().toISOString(),
    titulo: tituloCapitulo.value || '',
    contenido: contenido
  };

  await set(ref(db, `novelas/${novelaSeleccionada.value}/capitulos/${numeroCapitulo.value}`), capituloData);
  
  // Eliminar borrador si existe
  const claveBorrador = `borrador_${novelaSeleccionada.value}_${numeroCapitulo.value}`;
  try {
    await set(ref(db, `borradores/${claveBorrador}`), null);
  } catch (error) {
    console.log('No había borrador para eliminar');
  }
}

function validarFormulario() {
  if (!novelaSeleccionada.value.trim()) {
    mostrarNotificacion('Selecciona una novela', 'error');
    return false;
  }
  
  if (!numeroCapitulo.value.trim()) {
    mostrarNotificacion('Ingresa el número de capítulo', 'error');
    return false;
  }
  
  const contenido = editor.innerText || editor.textContent;
  const contenidoLimpio = contenido.replace(/Comienza a escribir tu historia aquí\.\.\./g, '').trim();
  
  if (!contenidoLimpio || contenidoLimpio === '') {
    mostrarNotificacion('Escribe el contenido del capítulo', 'error');
    return false;
  }
  
  return true;
}

function limpiarEditor() {
  editor.innerHTML = '<p>Comienza a escribir tu historia aquí...</p>';
  numeroCapitulo.value = '';
  tituloCapitulo.value = '';
  enlaceGenerado.value = '';
  imagenesSubidas = [];
  actualizarListaImagenes();
  actualizarEstadisticas();
}

// ==============================
// CONVERSIÓN DE ENLACES A IMÁGENES (VISTA PREVIA)
// ==============================
function convertirEnlacesAImagenes(contenidoHTML) {
  // Crear un elemento temporal para manipular el HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contenidoHTML;
  
  // Buscar todos los enlaces que son URLs de imágenes (con clase imagen-enlace)
  const enlacesImagen = tempDiv.querySelectorAll('a.imagen-enlace[data-imagen-url]');
  
  enlacesImagen.forEach(enlace => {
    const url = enlace.getAttribute('data-imagen-url');
    
    // Crear elemento de imagen
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Imagen del capítulo';
    img.style.cssText = 'max-width: 400px; height: auto; margin: 15px auto; display: block; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);';
    
    // Reemplazar el párrafo completo que contiene el enlace
    const parrafo = enlace.closest('p');
    if (parrafo) {
      parrafo.parentNode.replaceChild(img, parrafo);
    } else {
      enlace.parentNode.replaceChild(img, enlace);
    }
  });
  
  // También buscar URLs de Cloudinary directas que podrían estar como texto plano
  const regex = /https:\/\/res\.cloudinary\.com\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp)/gi;
  let contenidoConImagenes = tempDiv.innerHTML;
  
  contenidoConImagenes = contenidoConImagenes.replace(regex, (match) => {
    // Verificar si ya está dentro de un elemento img o a
    if (!contenidoConImagenes.includes(`<img src="${match}"`) && !contenidoConImagenes.includes(`data-imagen-url="${match}"`)) {
      return `<img src="${match}" alt="Imagen del capítulo" style="max-width: 400px; height: auto; margin: 15px auto; display: block; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" />`;
    }
    return match;
  });
  
  return contenidoConImagenes;
}

// ==============================
// GESTIÓN DE IMÁGENES SUBIDAS
// ==============================
function actualizarListaImagenes() {
  listaImagenesSubidas.innerHTML = '';

  if (imagenesSubidas.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'list-group-item text-muted text-center';
    emptyItem.textContent = 'No hay imágenes subidas.';
    listaImagenesSubidas.appendChild(emptyItem);
    return;
  }

  imagenesSubidas.forEach((img, index) => {
    const item = document.createElement('li');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    item.innerHTML = `
      <img src="${img.url}" alt="${img.name}" style="width: 40px; height: 40px; object-fit: cover; margin-right: 10px;">
      <span class="flex-grow-1" style="font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${img.name}</span>
      <button class="btn btn-danger btn-sm" data-index="${index}">&times;</button>
    `;
    
    item.querySelector('button').addEventListener('click', async (e) => {
      const imgIndex = parseInt(e.target.dataset.index);
      const imagen = imagenesSubidas[imgIndex];
      
      if (confirm(`¿Seguro que quieres eliminar la imagen "${imagen.name}"?`)) {
        const exito = await eliminarImagenCloudinary(imagen.publicId);
        if (exito) {
          imagenesSubidas.splice(imgIndex, 1);
          actualizarListaImagenes();
          
          // Eliminar la imagen del editor
          const imgEnEditor = editor.querySelector(`img[src="${imagen.url}"]`);
          if (imgEnEditor) {
            imgEnEditor.remove();
          }
          
          mostrarNotificacion('Imagen eliminada correctamente', 'success');
        } else {
          mostrarNotificacion('Error al eliminar la imagen', 'error');
        }
      }
    });
    
    listaImagenesSubidas.appendChild(item);
  });
}

// ==============================
// NAVEGACIÓN
// ==============================
btnVolver.addEventListener('click', () => {
  if (confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.')) {
    window.location.href = 'admin.html';
  }
});

// ==============================
// SISTEMA DE NOTIFICACIONES
// ==============================
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Crear notificación toast
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${tipo === 'error' ? 'danger' : tipo === 'success' ? 'success' : 'info'} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${mensaje}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  // Crear contenedor de toasts si no existe
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }

  toastContainer.appendChild(toast);
  
  // Mostrar toast
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Eliminar del DOM después de que se oculte
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// ==============================
// INICIALIZACIÓN
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  // Enfocar el editor
  editor.focus();
  
  // Actualizar estadísticas iniciales
  actualizarEstadisticas();
  
  // Inicializar lista de imágenes
  actualizarListaImagenes();
  
  // Configurar autosave cada 30 segundos
  setInterval(() => {
    if (validarFormulario()) {
      guardarBorrador().catch(err => console.log('Error en autosave:', err));
    }
  }, 30000);
  
  // Limpiar el input de archivo después de subir
  imagenSubir.addEventListener('change', () => {
    setTimeout(() => {
      imagenSubir.value = '';
    }, 1000);
  });
});

// ==============================
// ATAJOS DE TECLADO
// ==============================
document.addEventListener('keydown', (e) => {
  // Ctrl + S para guardar
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    btnGuardarBorrador.click();
  }
  
  // Ctrl + Enter para publicar
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    btnPublicar.click();
  }
});
