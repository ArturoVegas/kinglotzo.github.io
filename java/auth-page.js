// auth-page.js - Funcionalidad para la página de autenticación unificada

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
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
const adminUID = "Cqh5y2MlsObi4ox90jlbAiRGu4D2";

// Elementos del DOM
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');

// Verificar si el usuario ya está autenticado
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Si ya está autenticado, redirigir al inicio
    window.location.href = '../index.html';
  }
});

// Funciones para cambiar entre pestañas
function showLogin() {
  // Actualizar tabs
  loginTab.classList.add('active');
  registerTab.classList.remove('active');

  // Ocultar formulario de registro con animación
  registerForm.classList.add('fade-out');
  registerForm.classList.remove('fade-in');

  // Después de la animación, ocultar y mostrar el login
  setTimeout(() => {
    registerForm.classList.add('d-none');
    registerForm.classList.remove('fade-out');
    
    // Mostrar formulario de login
    loginForm.classList.remove('d-none');
    loginForm.classList.add('fade-in');
    
    // Cambiar altura del contenedor
    setTimeout(() => {
      const formHeight = loginForm.offsetHeight;
      document.querySelector('.forms-container').style.height = formHeight + 'px';
    }, 50);
  }, 200);

  clearMessages();
}

function showRegister() {
  // Actualizar tabs
  registerTab.classList.add('active');
  loginTab.classList.remove('active');

  // Ocultar formulario de login con animación
  loginForm.classList.add('fade-out');
  loginForm.classList.remove('fade-in');

  // Después de la animación, ocultar y mostrar el registro
  setTimeout(() => {
    loginForm.classList.add('d-none');
    loginForm.classList.remove('fade-out');
    
    // Mostrar formulario de registro
    registerForm.classList.remove('d-none');
    registerForm.classList.add('fade-in');
    
    // Cambiar altura del contenedor
    setTimeout(() => {
      const formHeight = registerForm.offsetHeight;
      document.querySelector('.forms-container').style.height = formHeight + 'px';
    }, 50);
  }, 200);

  clearMessages();
}

function clearMessages() {
  loginError.classList.add('d-none');
  registerError.classList.add('d-none');
  registerSuccess.classList.add('d-none');
}

function showError(element, message) {
  element.textContent = message;
  element.classList.remove('d-none');
}

function showSuccess(element, message) {
  element.textContent = message;
  element.classList.remove('d-none');
}

// Event listeners para las pestañas
loginTab.addEventListener('click', showLogin);
registerTab.addEventListener('click', showRegister);

// Manejo del formulario de login
loginFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showError(loginError, 'Por favor, completa todos los campos.');
    return;
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Redirigir según el tipo de usuario
    if (user.uid === adminUID) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "../index.html";
    }
  } catch (error) {
    console.error('Error de login:', error);
    let errorMessage;
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Error al iniciar sesión: la cuenta no existe';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Error al iniciar sesión: usuario o contraseña incorrectos';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Error al iniciar sesión: correo electrónico inválido';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Error al iniciar sesión: usuario o contraseña incorrectos';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Error al iniciar sesión: esta cuenta ha sido deshabilitada';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Error al iniciar sesión: demasiados intentos fallidos. Intenta más tarde';
        break;
      default:
        errorMessage = 'Error al iniciar sesión: usuario o contraseña incorrectos';
    }
    
    showError(loginError, errorMessage);
  }
});

// Manejo del formulario de registro
registerFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();
  
  const nick = document.getElementById('registerNick').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  
  // Validaciones
  if (!nick || !email || !password || !confirmPassword) {
    showError(registerError, 'Por favor, completa todos los campos.');
    return;
  }
  
  if (password !== confirmPassword) {
    showError(registerError, 'Las contraseñas no coinciden.');
    return;
  }
  
  if (password.length < 6) {
    showError(registerError, 'La contraseña debe tener al menos 6 caracteres.');
    return;
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: nick
    });
    
    showSuccess(registerSuccess, 'Cuenta creada exitosamente. Redirigiendo...');
    registerFormElement.reset();
    
    // Redirigir después de un breve delay
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error de registro:', error);
    let errorMessage = 'Error al crear la cuenta. ';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage += 'Este correo electrónico ya está en uso.';
        break;
      case 'auth/invalid-email':
        errorMessage += 'Correo electrónico inválido.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage += 'El registro no está habilitado.';
        break;
      case 'auth/weak-password':
        errorMessage += 'La contraseña es muy débil.';
        break;
      default:
        errorMessage += error.message;
    }
    
    showError(registerError, errorMessage);
  }
});

// Mejorar la experiencia del usuario con validación en tiempo real
document.getElementById('registerConfirmPassword').addEventListener('input', function() {
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = this.value;
  
  if (confirmPassword && password !== confirmPassword) {
    this.style.borderColor = '#dc3545';
  } else {
    this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
  }
});

// Limpiar mensajes de error cuando el usuario empiece a escribir
document.getElementById('loginEmail').addEventListener('input', clearMessages);
document.getElementById('loginPassword').addEventListener('input', clearMessages);
document.getElementById('registerNick').addEventListener('input', clearMessages);
document.getElementById('registerEmail').addEventListener('input', clearMessages);
document.getElementById('registerPassword').addEventListener('input', clearMessages);
document.getElementById('registerConfirmPassword').addEventListener('input', clearMessages);
