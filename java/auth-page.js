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
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

console.log("🔥 auth-page.js cargado y ejecutándose");

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

// DOM elements
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

let registroEnProceso = false;

// 🔁 NUEVA LÓGICA EN onAuthStateChanged
onAuthStateChanged(auth, async (user) => {
  console.log('🔄 Estado de autenticación cambió:', user ? user.uid : 'no autenticado');

  if (user && !registroEnProceso) {
    if (!user.emailVerified) {
      console.warn("⚠️ Correo NO verificado. Cerrando sesión.");
      alert("Tu correo aún no ha sido verificado. Verifícalo y vuelve a iniciar sesión.");
      await auth.signOut();
      return;
    }

    try {
      const userRef = ref(db, `usuarios/${user.uid}`);
      const { get } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js");
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // Si no existe, guarda perfil sin rol (o con rol 'usuario' por defecto)
        await guardarPerfilUsuario({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          rol: 'usuario'  // asignar rol por defecto
        });
        window.location.href = "../index.html";
        return;
      }

      const userData = snapshot.val();

      if (userData.rol === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "../index.html";
      }

    } catch (error) {
      console.error("❌ Error verificando/guardando perfil:", error);
      alert("Error en la verificación de permisos.");
      await auth.signOut();
    }
  }
});


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

function loadRememberedUser() {
  const rememberUser = localStorage.getItem('rememberUser');
  const userEmail = localStorage.getItem('userEmail');

  if (rememberUser === 'true' && userEmail) {
    document.getElementById('loginEmail').value = userEmail;
    rememberMeCheckbox.checked = true;
    rememberMeLabel.classList.add('checked');
  } else {
    document.getElementById('loginEmail').value = '';
    rememberMeCheckbox.checked = false;
    rememberMeLabel.classList.remove('checked');
  }
}

async function guardarPerfilUsuario(user) {
  const userRef = ref(db, `usuarios/${user.uid}`);
  const perfilUsuario = {
    nombre: user.displayName || user.email.split('@')[0],
    email: user.email,
    uid: user.uid,
    comentarios: 0,
    fechaRegistro: new Date().toISOString(),
    creadoEn: Date.now(),
    activo: true,
    rol: user.rol || 'usuario'  // asigna rol por defecto si no viene
  };

  await set(userRef, perfilUsuario);
  console.log("✅ Perfil guardado en Firebase Realtime Database");
}


// LOGIN
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
      return alert("Tu correo no está verificado. Verifícalo antes de iniciar sesión.");
    }

    if (rememberMe) {
      localStorage.setItem('rememberUser', 'true');
      localStorage.setItem('userEmail', email);
    } else {
      localStorage.removeItem('rememberUser');
      localStorage.removeItem('userEmail');
    }

    // Redirección ocurre en onAuthStateChanged

  } catch (error) {
    console.error('Error de login:', error);
    showError(loginError, traducirErrorFirebase(error.code, 'login'));
  }
});

// REGISTRO
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
    await new Promise(resolve => setTimeout(resolve, 500));
    await user.reload();

    await sendEmailVerification(user);
    alert("📨 Te enviamos un correo de verificación.\n\nPor favor, revisa tu bandeja de entrada y luego vuelve a iniciar sesión.");

    await auth.signOut();
    registroEnProceso = false;
    registerFormElement.reset();

  } catch (error) {
    console.error('❌ Error completo de registro:', error);
    registroEnProceso = false;

    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
        console.log("🗑️ Usuario eliminado debido a error en registro");
      } catch (deleteError) {
        console.error("❌ Error eliminando usuario:", deleteError);
      }
    }

    showError(registerError, traducirErrorFirebase(error.code, 'registro'));
  }
});

// Validación confirmación
document.getElementById('registerConfirmPassword').addEventListener('input', function () {
  const password = document.getElementById('registerPassword').value;
  this.style.borderColor = (this.value && password !== this.value) ? '#dc3545' : 'rgba(255, 255, 255, 0.2)';
});

// Limpiar mensajes
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

loginTab.addEventListener('click', showLogin);
registerTab.addEventListener('click', showRegister);
rememberMeCheckbox.addEventListener('change', () => {
  rememberMeLabel.classList.toggle('checked', rememberMeCheckbox.checked);
});
if (rememberMeCheckbox.checked) rememberMeLabel.classList.add('checked');
loadRememberedUser();
