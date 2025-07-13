// Importa módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Configuración
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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Detectar en qué página estamos
const path = window.location.pathname;

// 🔐 LOGIN
if (path.includes("inicioSesion.html")) {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        // ✅ Redirige a admin si login fue exitoso
        window.location.href = "../html/admin.html";
      })
      .catch((error) => {
        errorMsg.textContent = "Error: " + error.message;
      });
  });
}

// 🔒 ADMIN
if (path.includes("admin.html")) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "inicioSesion.html";
    } else {
      console.log("Usuario autenticado:", user.email);

      const nuevoMangaSection = document.getElementById("nuevoMangaSection");
      const subirCapituloSection = document.getElementById("subirCapituloSection");

      if (nuevoMangaSection && subirCapituloSection) {
        nuevoMangaSection.classList.remove("d-none");
        subirCapituloSection.classList.add("d-none");
      }

      const btnNuevoManga = document.getElementById("btnNuevoManga");
      const btnSubirCapitulo = document.getElementById("btnSubirCapitulo");

      if (btnNuevoManga && btnSubirCapitulo) {
        btnNuevoManga.addEventListener("click", () => {
          nuevoMangaSection.classList.remove("d-none");
          subirCapituloSection.classList.add("d-none");
        });

        btnSubirCapitulo.addEventListener("click", () => {
          subirCapituloSection.classList.remove("d-none");
          nuevoMangaSection.classList.add("d-none");
        });
      }

      // 🔓 Cerrar sesión
      const btnLogout = document.getElementById("btnLogout");
      if (btnLogout) {
        btnLogout.addEventListener("click", () => {
          signOut(auth).then(() => {
            window.location.href = "inicioSesion.html";
          });
        });
      }
    }
  });
}
