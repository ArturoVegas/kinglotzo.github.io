// login.js

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence
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

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      // Configurar persistencia solo durante la sesión (sin checkbox)
      await setPersistence(auth, browserSessionPersistence);
      
      const credenciales = await signInWithEmailAndPassword(auth, email, password);
      const user = credenciales.user;

      // Redirigir según rol
      if (user.uid === adminUID) {
        window.location.href = "admin.html"; // Panel admin
      } else {
        // Usuario normal - redirigir inmediatamente
        window.location.href = "../index.html";
      }
    } catch (error) {
      console.error("Login error:", error.message);
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
      
      if (errorMsg) errorMsg.textContent = errorMessage;
    }
  });
}
