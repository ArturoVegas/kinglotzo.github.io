// auth.js - Sistema de autenticación para manejar el estado del usuario

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getDatabase(app);

// Función para cargar datos del perfil del usuario
async function loadUserProfileData(uid) {
  try {
    const userRef = ref(db, `usuarios/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
    return null;
  }
}

// Función para actualizar la interfaz según el estado del usuario
function updateAuthUI(user) {
  const authDropdown = document.getElementById('authDropdown');
  const dropdownMenu = document.querySelector('#authDropdown + .dropdown-menu');

  if (user && authDropdown && dropdownMenu) {
    const displayName = user.displayName || user.email.split('@')[0];
    
    // Cargar datos del usuario para obtener el avatar
    loadUserProfileData(user.uid).then(userData => {
      const avatarUrl = userData?.avatarURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0d6efd&color=fff&size=32`;
      
      // Mostrar avatar + nombre en el dropdown button
      authDropdown.innerHTML = `
        <img src="${avatarUrl}" alt="Avatar" class="user-avatar-small me-2" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
        <span class="d-none d-md-inline">${displayName}</span>
      `;
      
      // Menú con opción "Mi perfil" y "Cerrar sesión"
      const currentPath = window.location.pathname;
      const isInSubfolder = currentPath.includes('/html/');
      const perfilPath = isInSubfolder ? 'perfilUsuario.html' : './html/perfilUsuario.html';

      dropdownMenu.innerHTML = `
        <li>
          <div class="dropdown-header d-flex align-items-center py-2">
            <img src="${avatarUrl}" alt="Avatar" class="me-2" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <div>
              <div class="fw-bold">${displayName}</div>
              <small class="text-muted">${user.email}</small>
            </div>
          </div>
        </li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="${perfilPath}"><i class="bi bi-person me-2"></i>Mi perfil</a></li>
        <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</a></li>
      `;
      
      // Evento logout (debe estar dentro del then para que el elemento exista)
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          signOut(auth).then(() => {
            localStorage.removeItem('rememberUser');
            localStorage.removeItem('userEmail');
            window.location.reload();
          }).catch((error) => {
            console.error('Error al cerrar sesión:', error);
          });
        });
      }
    });
  } else if (!user && authDropdown && dropdownMenu) {
    authDropdown.innerHTML = `<i class="bi bi-person-circle me-1"></i>Cuenta`;

    const currentPath = window.location.pathname;
    const isInSubfolder = currentPath.includes('/html/');
    const authPath = isInSubfolder ? '../html/auth.html' : './html/auth.html';

    dropdownMenu.innerHTML = `
      <li><a class="dropdown-item" href="${authPath}"><i class="bi bi-box-arrow-in-right me-2"></i>Iniciar sesión</a></li>
      <li><a class="dropdown-item" href="${authPath}"><i class="bi bi-person-plus me-2"></i>Registrarse</a></li>
    `;
  }
}


// Función para manejar el estado de autenticación en páginas específicas
function handlePageSpecificAuth() {
  const currentPath = window.location.pathname;
  
  // Si estamos en páginas de login/registro/auth, manejar según corresponda
  if (currentPath.includes('inicioSesion.html') || currentPath.includes('registro.html') || currentPath.includes('auth.html')) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Si ya está autenticado, redirigir al inicio
        window.location.href = '../index.html';
      }
    });
  } else {
    // En otras páginas, actualizar la UI
    onAuthStateChanged(auth, updateAuthUI);
  }
}

// Inicializar el sistema de autenticación
export function initAuth() {
  handlePageSpecificAuth();
}

// Función para verificar si el usuario está autenticado
export function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
}

// Función para cerrar sesión
export function logout() {
  return signOut(auth);
}
//prueba