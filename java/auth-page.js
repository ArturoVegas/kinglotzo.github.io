// auth-page.js - Funcionalidad para autenticación unificada con Firebase

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// ✅ Firebase config
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const adminUID = "Cqh5y2MlsObi4ox90jlbAiRGu4D2";

// ✅ Elementos DOM
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');
const rememberMeCheckbox = document.getElementById('rememberMe');
const rememberMeLabel = document.querySelector('label[for="rememberMe"]');

// ✅ Variables de control
let registroEnProceso = false;

// ✅ Redirección y verificación
onAuthStateChanged(auth, async (user) => {
  if (user && user.emailVerified && !registroEnProceso) {
    const userRef = ref(db, `usuarios/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await guardarPerfilUsuario(user);
    }

    window.location.href = user.uid === adminUID ? "admin.html" : "../index.html";
  } else if (user && !user.emailVerified) {
    await auth.signOut();
    alert('Debes verificar tu correo electrónico antes de continuar.');
  }
});

// ✅ UI - Cambio de pestañas
function showRegister() {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  loginForm.classList.add('fade-out');
  loginForm.classList.remove('fade-in');
  setTimeout(() => {
    loginForm.classList.add('d-none');
    loginForm.classList.remove('fade-out');
    registerForm.classList.remove('d-none');
    registerForm.classList.add('fade-in');
    setTimeout(() => {
      document.querySelector('.forms-container').style.height = registerForm.offsetHeight + 'px';
    }, 50);
  }, 200);
  clearMessages();
}

function showLogin() {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  registerForm.classList.add('fade-out');
  registerForm.classList.remove('fade-in');
  setTimeout(() => {
    registerForm.classList.add('d-none');
    registerForm.classList.remove('fade-out');
    loginForm.classList.remove('d-none');
    loginForm.classList.add('fade-in');
    loadRememberedUser();
    setTimeout(() => {
      document.querySelector('.forms-container').style.height = loginForm.offsetHeight + 'px';
    }, 50);
  }, 200);
  clearMessages();
}

// ✅ Mensajes de error y éxito
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

// ✅ Traducción de errores
function traducirErrorFirebase(code, tipo = 'login') {
  const errores = {
    login: {
      'auth/user-not-found': 'La cuenta no existe.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-email': 'Correo electrónico inválido.',
      'auth/invalid-credential': 'Credenciales inválidas.',
      'auth/user-disabled': 'Cuenta deshabilitada.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.'
    },
    registro: {
      'auth/email-already-in-use': 'Este correo ya está en uso.',
      'auth/invalid-email': 'Correo inválido.',
      'auth/operation-not-allowed': 'El registro está deshabilitado.',
      'auth/weak-password': 'Contraseña muy débil.'
    }
  };
  return errores[tipo][code] || 'Error inesperado.';
}

// ✅ Recordar usuario
function loadRememberedUser() {
  const rememberUser = localStorage.getItem('rememberUser');
  const userEmail = localStorage.getItem('userEmail');

  if (rememberUser === 'true' && userEmail) {
    document.getElementById('loginEmail').value = userEmail;
    rememberMeCheckbox.checked = true;
    rememberMeLabel.classList.add('checked');
  } else {
    rememberMeCheckbox.checked = false;
    rememberMeLabel.classList.remove('checked');
  }
}

// ✅ Guardar en la base de datos tras verificación
async function guardarPerfilUsuario(user) {
  const userPath = `usuarios/${user.uid}`;
  const userRef = ref(db, userPath);

  const perfilUsuario = {
    nombre: user.displayName || user.email.split('@')[0],
    email: user.email,
    uid: user.uid,
    comentarios: 0,
    capitulosLeidos: 0,
    favoritos: { inicializado: "0" },
    listas: {
      leyendo: { inicializado: "0" },
      pendientes: { inicializado: "0" },
      terminados: { inicializado: "0" }
    },
    fechaRegistro: new Date().toISOString(),
    creadoEn: Date.now(),
    activo: true
  };

  await set(userRef, perfilUsuario);
}

// ✅ Login
loginFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = rememberMeCheckbox.checked;

  if (!email || !password) {
    showError(loginError, 'Por favor, completa todos los campos.');
    return;
  }

  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      await auth.signOut();
      alert("Debes verificar tu correo antes de iniciar sesión.");
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberUser', 'true');
      localStorage.setItem('userEmail', email);
    } else {
      localStorage.removeItem('rememberUser');
      localStorage.removeItem('userEmail');
    }

    window.location.href = user.uid === adminUID ? "admin.html" : "../index.html";

  } catch (error) {
    console.error('Login error:', error);
    showError(loginError, traducirErrorFirebase(error.code, 'login'));
  }
});

// ✅ Registro
registerFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const nick = document.getElementById('registerNick').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

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
    registroEnProceso = true;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: nick });
    await sendEmailVerification(user);
    await auth.signOut();

    showSuccess(registerSuccess, 'Se ha enviado un correo de verificación. Verifica tu cuenta antes de iniciar sesión.');
    registerFormElement.reset();
    registroEnProceso = false;

  } catch (error) {
    console.error('Registro error:', error);
    registroEnProceso = false;

    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (e) {
        console.error("No se pudo eliminar usuario:", e);
      }
    }

    showError(registerError, traducirErrorFirebase(error.code, 'registro'));
  }
});

// ✅ Validaciones visuales
document.getElementById('registerConfirmPassword').addEventListener('input', function () {
  const password = document.getElementById('registerPassword').value;
  this.style.borderColor = (this.value && password !== this.value) ? '#dc3545' : 'rgba(255, 255, 255, 0.2)';
});

// ✅ Limpieza dinámica de errores
[
  'loginEmail',
  'loginPassword',
  'registerNick',
  'registerEmail',
  'registerPassword',
  'registerConfirmPassword'
].forEach(id => {
  document.getElementById(id).addEventListener('input', clearMessages);
});

// ✅ Eventos iniciales
loginTab.addEventListener('click', showLogin);
registerTab.addEventListener('click', showRegister);
rememberMeCheckbox.addEventListener('change', () => {
  rememberMeLabel.classList.toggle('checked', rememberMeCheckbox.checked);
});
if (rememberMeCheckbox.checked) rememberMeLabel.classList.add('checked');
loadRememberedUser();
