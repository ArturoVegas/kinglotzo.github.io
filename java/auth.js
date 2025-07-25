// auth.js - Sistema de autenticación para manejar el estado del usuario

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
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

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);

// Función para actualizar la interfaz según el estado del usuario
function updateAuthUI(user) {
  const authDropdown = document.getElementById('authDropdown');
  const dropdownMenu = document.querySelector('#authDropdown + .dropdown-menu');
  
  if (user && authDropdown && dropdownMenu) {
    // Usuario autenticado - cambiar el dropdown
    authDropdown.innerHTML = `<i class="bi bi-person-circle me-1"></i>${user.displayName || user.email.split('@')[0]}`;
    dropdownMenu.innerHTML = `
      <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</a></li>
    `;
    
      // Agregar evento de logout
      document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
          // Limpiar datos del checkbox "recordarme"
          localStorage.removeItem('rememberUser');
          localStorage.removeItem('userEmail');
          window.location.reload();
        }).catch((error) => {
          console.error('Error al cerrar sesión:', error);
        });
      });
  } else if (!user && authDropdown && dropdownMenu) {
    // Usuario no autenticado - mostrar opciones de login/registro
    authDropdown.innerHTML = `<i class="bi bi-person-circle me-1"></i>Cuenta`;
    
    // Determinar rutas correctas según la ubicación actual
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
