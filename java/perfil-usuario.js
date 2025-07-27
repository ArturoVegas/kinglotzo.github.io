import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

const perfilContainer = document.getElementById('perfil-container');
const loadingContainer = document.getElementById('loading-container');
const userNameElem = document.getElementById('user-name');
const userEmailElem = document.getElementById('user-email');
const favoritosCount = document.getElementById('favoritos-count');
const comentariosCount = document.getElementById('comentarios-count');
const capitulosCount = document.getElementById('capitulos-count');
const userSinceElem = document.getElementById('user-since');
const editProfileBtn = document.getElementById('edit-profile-btn');
const logoutBtn = document.getElementById('logout-btn');
const editProfileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
const editNameInput = document.getElementById('edit-name');
const editAvatarInput = document.getElementById('edit-avatar');
const saveProfileBtn = document.getElementById('save-profile-btn');

// Modal para cambiar imagen
const changeImageModal = new bootstrap.Modal(document.getElementById('changeImageModal'));
const imageUrlInput = document.getElementById('image-url-input');
const imageFileInput = document.getElementById('image-file-input');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const saveImageBtn = document.getElementById('save-image-btn');
let currentImageType = null; // 'avatar' o 'banner'

/* Función para cargar datos de usuario desde Firebase Realtime Database */
async function cargarDatosUsuario(uid) {
  try {
    const userRef = ref(db, `usuarios/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      console.log('📊 Datos del usuario cargados:', userData);
      
      // Cargar información básica
      userNameElem.textContent = userData.nombre || 'Usuario';
      userEmailElem.textContent = userData.email || 'Sin email';
      
     const listas = userData.listas || {};
const favoritosLista = listas.favoritos || {};
const favoritosCountValue = Object.keys(favoritosLista).length;
favoritosCount.textContent = favoritosCountValue;

// Contar capítulos leídos desde "visto"
let capitulosLeidos = 0;
const vistos = userData.visto || {};

for (const manga in vistos) {
  if (vistos.hasOwnProperty(manga)) {
    capitulosLeidos += Object.keys(vistos[manga]).length;
  }
}
capitulosCount.textContent = capitulosLeidos;
comentariosCount.textContent = userData.comentarios || 0;

      
      // Fecha de registro
      if (userData.creadoEn) {
        userSinceElem.textContent = new Date(userData.creadoEn).getFullYear();
      } else {
        userSinceElem.textContent = '2024';
      }
      
      // Avatar del usuario
      const avatarImg = document.getElementById('user-avatar');
      if (userData.avatarURL) {
        avatarImg.src = userData.avatarURL;
      } else {
        // Avatar por defecto usando un servicio de avatares
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nombre || 'Usuario')}&background=0d6efd&color=fff&size=200`;
      }
      
      // Banner personalizado del usuario
      const profileBanner = document.getElementById('profile-banner');
      if (userData.bannerURL) {
        profileBanner.style.backgroundImage = `url('${userData.bannerURL}')`;
      }
      
      // Cargar las listas de mangas (cards visuales)
      cargarListasMangas(userData);
      
      // Mostrar el perfil y ocultar el loading
      loadingContainer.style.display = 'none';
      perfilContainer.style.display = 'block';
    } else {
      console.log('❌ No hay datos para este usuario en la base de datos.');
      alert('No se encontraron datos del perfil. Redirigiendo...');
      window.location.href = '../index.html';
    }
  } catch (error) {
    console.error('Error al cargar datos del usuario:', error);
  }
}

/* Configurar listener de cambio de autenticación */
onAuthStateChanged(auth, (user) => {
  if (user) {
    cargarDatosUsuario(user.uid);
  } else {
    window.location.href = '../index.html';
  }
});

/* Función para cargar las listas de mangas del usuario */
function cargarListasMangas(userData) {
  console.log('📚 Cargando listas de mangas...');

  // Accede correctamente a todas las listas desde userData.listas
  const listas = userData.listas || {};

  cargarMangasEnGrid('favoritos', listas.favoritos || {});
  cargarMangasEnGrid('leyendo', listas.leyendo || {});
  cargarMangasEnGrid('pendientes', listas.pendientes || {});
  cargarMangasEnGrid('terminados', listas.terminados || {});
}

/* Función para cargar mangas en una grid específica con cards visuales */
function cargarMangasEnGrid(tipo, mangas) {
  const grid = document.getElementById(`${tipo}-grid`);
  const total = document.getElementById(`${tipo}-total`);
  
  // Limpiar el grid antes de rellenar
  grid.innerHTML = '';

  // Filtrar mangas válidos (excluir 'inicializado')
  const mangasValidos = Object.entries(mangas).filter(([key]) => key !== 'inicializado');
  
  // Actualizar contador
  total.textContent = `${mangasValidos.length} manga${mangasValidos.length !== 1 ? 's' : ''}`;
  
  if (mangasValidos.length === 0) {
    // Mostrar estado vacío si existe
    const emptyState = grid.querySelector('.empty-state');
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  
  // Ocultar estado vacío si existe
  const emptyState = grid.querySelector('.empty-state');
  if (emptyState) emptyState.style.display = 'none';

  mangasValidos.forEach(([key, manga]) => {
    const titulo = manga.titulo || key;
    const portada = manga.portada || `https://via.placeholder.com/160x220/495057/ffffff?text=${encodeURIComponent(titulo)}`;

    // Crear card
    const mangaCard = document.createElement('div');
    mangaCard.className = 'manga-card card m-2 shadow-sm';
    mangaCard.style.width = '160px';
    mangaCard.style.cursor = 'pointer';

    mangaCard.innerHTML = `
      <img src="${portada}" class="card-img-top" alt="${titulo}" style="height:220px; object-fit: cover;">
      <div class="card-body p-2">
        <h6 class="card-title text-truncate" title="${titulo}">${titulo}</h6>
      </div>
    `;

    mangaCard.addEventListener('click', () => {
      window.location.href = `../html/infoMangas.html?manga=${encodeURIComponent(titulo)}`;
    });

    grid.appendChild(mangaCard);
  });
}

/* Función para guardar cambios en el perfil */
async function guardarCambiosPerfil() {
  try {
    const displayName = editNameInput.value.trim();
    const avatarURL = editAvatarInput.value.trim();
    
    if (!displayName) {
      alert('El nombre de usuario es obligatorio');
      return;
    }
    
    const userRef = ref(db, `usuarios/${auth.currentUser.uid}`);
    const updateData = {
      nombre: displayName
    };
    
    if (avatarURL) {
      updateData.avatarURL = avatarURL;
    }
    
    await update(userRef, updateData);
    
    // Actualizar el perfil visualmente
    userNameElem.textContent = displayName;
    
    if (avatarURL) {
      document.getElementById('user-avatar').src = avatarURL;
    } else {
      // Regenerar avatar con el nuevo nombre
      document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0d6efd&color=fff&size=200`;
    }
    
    editProfileModal.hide();
    
    // Mostrar mensaje de éxito
    const toast = document.createElement('div');
    toast.className = 'toast-container position-fixed top-0 end-0 p-3';
    toast.innerHTML = `
      <div class="toast show" role="alert">
        <div class="toast-header bg-success text-white">
          <strong class="me-auto">Perfil actualizado</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">Los cambios se han guardado correctamente.</div>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
    
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    alert('Error al guardar los cambios. Inténtalo de nuevo.');
  }
}

/* Efecto blur en scroll */
function initScrollBlurEffect() {
  const profileBanner = document.getElementById('profile-banner');
  let ticking = false;
  
  function updateBlur() {
    const scrolled = window.pageYOffset;
    
    if (scrolled > 50) {
      profileBanner.classList.add('blurred');
    } else {
      profileBanner.classList.remove('blurred');
    }
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateBlur);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick);
}

/* Función para abrir modal de cambio de imagen */
function abrirModalCambioImagen(tipo) {
  currentImageType = tipo;
  // Limpiar campos
  imageUrlInput.value = '';
  imageFileInput.value = '';
  imagePreview.style.display = 'none';
  
  // Cambiar título del modal
  const modalTitle = document.getElementById('changeImageModalLabel');
  modalTitle.innerHTML = tipo === 'avatar' 
    ? '<i class="bi bi-person-circle me-2"></i>Cambiar Avatar'
    : '<i class="bi bi-image me-2"></i>Cambiar Banner';
  
  changeImageModal.show();
}

/* Función para manejar cambio de URL */
function manejarCambioURL() {
  const url = imageUrlInput.value.trim();
  if (url) {
    previewImg.src = url;
    imagePreview.style.display = 'block';
    // Limpiar el input de archivo
    imageFileInput.value = '';
  } else {
    imagePreview.style.display = 'none';
  }
}

/* Función para manejar archivo seleccionado */
function manejarArchivoSeleccionado() {
  const file = imageFileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      imagePreview.style.display = 'block';
      // Limpiar el input de URL
      imageUrlInput.value = '';
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.style.display = 'none';
  }
}

/* Función para guardar la imagen */
async function guardarImagen() {
  try {
    let imageUrl = '';
    
    // Verificar si hay URL o archivo
    if (imageUrlInput.value.trim()) {
      imageUrl = imageUrlInput.value.trim();
    } else if (imageFileInput.files[0]) {
      // Para archivos, convertiremos a base64 (no recomendado para producción)
      const file = imageFileInput.files[0];
      imageUrl = await convertirArchivoABase64(file);
    } else {
      mostrarToast('Por favor, ingresa una URL o selecciona un archivo', 'warning');
      return;
    }
    
    // Aplicar la imagen
    if (currentImageType === 'avatar') {
      document.getElementById('user-avatar').src = imageUrl;
      if (auth.currentUser) {
        const userRef = ref(db, `usuarios/${auth.currentUser.uid}`);
        await update(userRef, { avatarURL: imageUrl });
      }
    } else if (currentImageType === 'banner') {
      document.getElementById('profile-banner').style.backgroundImage = `url('${imageUrl}')`;
      if (auth.currentUser) {
        const userRef = ref(db, `usuarios/${auth.currentUser.uid}`);
        await update(userRef, { bannerURL: imageUrl });
      }
    }
    
    changeImageModal.hide();
    mostrarToast('Imagen actualizada correctamente', 'success');
    
  } catch (error) {
    console.error('Error al guardar imagen:', error);
    mostrarToast('Error al guardar la imagen', 'danger');
  }
}

/* Función para convertir archivo a base64 */
function convertirArchivoABase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/* Función para mostrar toast personalizado */
function mostrarToast(mensaje, tipo = 'info') {
  const colorClass = {
    success: 'bg-success',
    danger: 'bg-danger', 
    warning: 'bg-warning',
    info: 'bg-info'
  }[tipo] || 'bg-info';
  
  const toast = document.createElement('div');
  toast.className = 'toast-container position-fixed top-0 end-0 p-3';
  toast.innerHTML = `
    <div class="toast show" role="alert">
      <div class="toast-header ${colorClass} text-white">
        <strong class="me-auto">Notificación</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">${mensaje}</div>
    </div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 3000);
}

/* Eventos de interacción */
editProfileBtn.onclick = () => {
  editNameInput.value = userNameElem.textContent;
  const currentAvatar = document.getElementById('user-avatar').src;
  if (!currentAvatar.includes('ui-avatars.com')) {
    editAvatarInput.value = currentAvatar;
  } else {
    editAvatarInput.value = '';
  }
  editProfileModal.show();
};

saveProfileBtn.onclick = guardarCambiosPerfil;

logoutBtn.onclick = async () => {
  await signOut(auth);
};

// Eventos para cambiar banner y avatar
document.getElementById('change-banner-btn').onclick = () => abrirModalCambioImagen('banner');
document.getElementById('change-avatar-btn').onclick = () => abrirModalCambioImagen('avatar');

// Event listeners del modal de imagen
imageUrlInput.addEventListener('input', manejarCambioURL);
imageFileInput.addEventListener('change', manejarArchivoSeleccionado);
saveImageBtn.onclick = guardarImagen;

// Inicializar efecto de scroll
initScrollBlurEffect();
