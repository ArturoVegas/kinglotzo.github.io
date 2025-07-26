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
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

console.log("🔥 auth-page.js cargado y ejecutándose");

// Configuración Firebase
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

// Inicializar app Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const adminUID = "Cqh5y2MlsObi4ox90jlbAiRGu4D2";

// Elementos DOM
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

// Variable para controlar el redirect durante el registro
let registroEnProceso = false;

// Redirigir si ya está autenticado (pero no durante el registro)
onAuthStateChanged(auth, (user) => {
  console.log('🔄 Estado de autenticación cambió:', user ? user.uid : 'no autenticado');
  
  // Solo redirigir si hay un usuario autenticado Y no estamos en proceso de registro
  if (user && !registroEnProceso) {
    console.log('📍 Redirigiendo usuario autenticado...');
    setTimeout(() => {
      window.location.href = user.uid === adminUID ? "admin.html" : "../index.html";
    }, 100);
  }
});

// Mostrar formularios
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

// Mensajes UI
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

// Traducción de errores Firebase
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

// Recordar usuario
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

// Guardar perfil en Realtime Database
// Esta función crea automáticamente la estructura de la base de datos si no existe
async function guardarPerfilUsuario(user) {
  console.log("🟢 === INICIANDO GUARDADO EN REALTIME DATABASE ===");
  console.log("🔍 Usuario a guardar:", {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName
  });
  console.log("🔍 Database URL:", db.app.options.databaseURL);
  
  try {
    // Verificar que tenemos acceso a la base de datos
    console.log("🔍 Verificando conexión a base de datos...");
    
    // Crear referencia al usuario en la base de datos
    const userPath = `usuarios/${user.uid}`;
    const userRef = ref(db, userPath);
    console.log("🔍 Ruta en la base de datos:", userPath);
    console.log("🔍 Referencia creada:", userRef.toString());
    
    // Datos del perfil del usuario
    const perfilUsuario = {
      nombre: user.displayName || user.email.split('@')[0],
      email: user.email,
      uid: user.uid, // Agregar UID explícitamente
      comentarios: 0,
      capitulosLeidos: 0,
      favoritos: { 
        inicializado: "0" 
      },
      listas: {
        leyendo: { inicializado: "0" },
        pendientes: { inicializado: "0" },
        terminados: { inicializado: "0" }
      },
      fechaRegistro: new Date().toISOString(),
      creadoEn: Date.now(),
      activo: true
    };
    
    console.log("🔍 Datos a guardar:", JSON.stringify(perfilUsuario, null, 2));
    console.log("🟡 Ejecutando set() en Firebase...");
    
    // Guardar en la base de datos
    await set(userRef, perfilUsuario);
    
    console.log("✅ === GUARDADO EXITOSO ===");
    console.log("📊 Datos confirmados en Firebase Realtime Database");
    console.log("🔗 Verifica en: https://prueba-base-de-datos-270a7-default-rtdb.firebaseio.com/usuarios/" + user.uid);
    
    // Verificación adicional: intentar leer lo que acabamos de escribir
    setTimeout(async () => {
      try {
        const { get } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js");
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          console.log("✅ VERIFICACIÓN: Usuario encontrado en DB:", snapshot.val());
        } else {
          console.log("❌ VERIFICACIÓN: Usuario NO encontrado en DB");
        }
      } catch (verifyError) {
        console.log("⚠️ VERIFICACIÓN: Error leyendo:", verifyError);
      }
    }, 1000);
    
  } catch (error) {
    console.error("❌ === ERROR EN GUARDADO ===");
    console.error("❌ Error completo:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error stack:", error.stack);
    
    // Información adicional para debug
    console.error("❌ Detalles del contexto:", {
      userId: user.uid,
      userEmail: user.email,
      databaseURL: db.app.options.databaseURL,
      authState: auth.currentUser ? 'authenticated' : 'not authenticated'
    });
    
    throw error;
  }
}

// Prueba rápida de escritura en DB (para debug)
async function pruebaEscritura() {
  try {
    await set(ref(db, 'test/prueba'), { mensaje: "Hola mundo desde test", timestamp: Date.now() });
    console.log("✅ Escritura en DB exitosa");
    alert("✅ Escritura en DB exitosa");
  } catch (error) {
    console.error("❌ Error escribiendo en DB:", error);
    alert("❌ Error escribiendo en DB: " + error.message);
  }
}

// Función de diagnóstico completo
async function diagnosticoCompleto() {
  console.log("🔧 === DIAGNÓSTICO DE FIREBASE ===");
  
  // 1. Verificar configuración
  console.log("📋 Configuración Firebase:", {
    databaseURL: db.app.options.databaseURL,
    projectId: db.app.options.projectId,
    authDomain: db.app.options.authDomain
  });
  
  // 2. Verificar autenticación
  console.log("🔐 Estado de autenticación:", {
    user: auth.currentUser ? auth.currentUser.uid : 'no autenticado',
    email: auth.currentUser ? auth.currentUser.email : 'N/A'
  });
  
  // 3. Probar escritura simple
  try {
    console.log("📝 Probando escritura simple...");
    await set(ref(db, 'diagnostico/test'), {
      mensaje: "Prueba de diagnóstico",
      timestamp: Date.now(),
      fecha: new Date().toISOString()
    });
    console.log("✅ Escritura simple exitosa");
  } catch (error) {
    console.error("❌ Error en escritura simple:", error);
  }
  
  // 4. Probar escritura en usuarios
  if (auth.currentUser) {
    try {
      console.log("👤 Probando escritura en usuarios...");
      const testPath = `usuarios/test_${Date.now()}`;
      await set(ref(db, testPath), {
        nombre: "Usuario de prueba",
        email: "test@test.com",
        fecha: new Date().toISOString()
      });
      console.log("✅ Escritura en usuarios exitosa en:", testPath);
    } catch (error) {
      console.error("❌ Error en escritura usuarios:", error);
    }
  }
  
  console.log("🔧 === FIN DIAGNÓSTICO ===");
}

// Funciones de prueba disponibles para debug manual:
// - pruebaEscritura(): Prueba básica de escritura
// - diagnosticoCompleto(): Diagnóstico completo de Firebase

// Formulario Login
loginFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log("📝 Login: submit recibido");
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

    if (rememberMe) {
      localStorage.setItem('rememberUser', 'true');
      localStorage.setItem('userEmail', email);
    } else {
      localStorage.removeItem('rememberUser');
      localStorage.removeItem('userEmail');
    }

    window.location.href = user.uid === adminUID ? "admin.html" : "../index.html";

  } catch (error) {
    console.error('Error de login:', error);
    showError(loginError, traducirErrorFirebase(error.code, 'login'));
  }
});

// Formulario Registro
registerFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log("📝 Registro: submit recibido");
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
    // Marcar que el registro está en proceso para evitar redirects automáticos
    registroEnProceso = true;
    console.log("🟡 Iniciando proceso de registro...");
    
    // Paso 1: Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("✅ Usuario creado en Auth:", user.uid);

    // Paso 2: Actualizar perfil con displayName
    await updateProfile(user, { displayName: nick });
    console.log("✅ Perfil actualizado con displayName:", nick);

    // Esperar un momento para asegurar que el perfil se actualice completamente
    await new Promise(resolve => setTimeout(resolve, 500));

    // Paso 3: Refrescar el objeto user para obtener los datos actualizados
    await user.reload();
    const updatedUser = auth.currentUser;
    console.log("✅ Usuario recargado:", updatedUser.displayName);

    // Paso 4: Guardar perfil en Realtime Database ANTES del redirect
    console.log("🟡 Guardando perfil en base de datos...");
    await guardarPerfilUsuario({
      uid: updatedUser.uid,
      email: updatedUser.email,
      displayName: nick // Usar el nick directamente
    });
    
    console.log("✅ Perfil guardado exitosamente en base de datos");

    // Paso 5: Enviar correo de verificación (no bloquea el proceso)
    sendEmailVerification(updatedUser).catch(err => {
      console.warn("⚠️ Error enviando email de verificación:", err);
    });

    // Mostrar mensaje de éxito
    showSuccess(registerSuccess, 'Cuenta creada exitosamente. Redirigiendo...');
    registerFormElement.reset();
    
    // Marcar que el registro terminó
    registroEnProceso = false;
    
    // Redirigir después de que todo esté guardado
    setTimeout(() => {
      console.log("📍 Redirigiendo después de registro exitoso...");
      window.location.href = '../index.html';
    }, 1500);

  } catch (error) {
    console.error('❌ Error completo de registro:', error);
    
    // Resetear el flag de registro en proceso
    registroEnProceso = false;
    
    // Si el usuario fue creado pero falló algo después, intentar eliminar la cuenta
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

// Validación visual contraseña confirmación
document.getElementById('registerConfirmPassword').addEventListener('input', function () {
  const password = document.getElementById('registerPassword').value;
  this.style.borderColor = (this.value && password !== this.value) ? '#dc3545' : 'rgba(255, 255, 255, 0.2)';
});

// Limpiar mensajes al escribir
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

// Eventos iniciales
loginTab.addEventListener('click', showLogin);
registerTab.addEventListener('click', showRegister);
rememberMeCheckbox.addEventListener('change', () => {
  rememberMeLabel.classList.toggle('checked', rememberMeCheckbox.checked);
});
if (rememberMeCheckbox.checked) rememberMeLabel.classList.add('checked');
loadRememberedUser();
