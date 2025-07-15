// login.js

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
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
      const credenciales = await signInWithEmailAndPassword(auth, email, password);
      const user = credenciales.user;

      // Redirigir según rol
      if (user.uid === adminUID) {
        window.location.href = "admin.html"; // Panel admin
      } else {
        window.location.href = "../index.html"; // Usuario normal
      }
    } catch (error) {
      console.error("Login error:", error.message);
      if (errorMsg) errorMsg.textContent = "Error: " + error.message;
    }
  });
}
