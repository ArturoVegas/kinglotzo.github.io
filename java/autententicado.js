// Importa módulos Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const path = location.pathname;

// ✅ LOGIN PAGE
if (path.includes("inicioSesion.html")) {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "admin.html";
      } catch (error) {
        console.error("Login error:", error.message);
        errorMsg.textContent = "Error: " + error.message;
      }
    });
  }
}

// ✅ ADMIN PAGE
if (path.includes("admin.html")) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "inicioSesion.html";
      return;
    }

    console.log("Usuario autenticado:", user.email);

    const nuevoMangaSection = document.getElementById("nuevoMangaSection");
    const subirCapituloSection = document.getElementById("subirCapituloSection");
    const btnNuevoManga = document.getElementById("btnNuevoManga");
    const btnSubirCapitulo = document.getElementById("btnSubirCapitulo");
    const btnLogout = document.getElementById("btnLogout");

    if (nuevoMangaSection && subirCapituloSection) {
      nuevoMangaSection.classList.remove("d-none");
      subirCapituloSection.classList.add("d-none");
    }

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

    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        signOut(auth).then(() => {
          window.location.href = "inicioSesion.html";
        });
      });
    }

    const formNuevoManga = document.getElementById("formNuevoManga");

    if (formNuevoManga) {
      formNuevoManga.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombreManga = document.getElementById("nombreManga").value.trim();
        const sinopsis = document.getElementById("sinopsis").value.trim();
        const autor = document.getElementById("autor").value.trim();
        const generos = document.getElementById("generos").value.trim();
        const estado = document.getElementById("estado").value;
        const frecuencia = document.getElementById("frecuencia").value;
        const fechaLanzamiento = document.getElementById("fechaLanzamiento").value;
        const cloudinaryFolderInput = document.getElementById("cloudinaryFolder")?.value.trim() || "";

        const portadaInput = document.getElementById("portada");
        if (!portadaInput || portadaInput.files.length === 0) {
          alert("Debes seleccionar una imagen de portada.");
          return;
        }
        const portadaFile = portadaInput.files[0];
        const folderPath = cloudinaryFolderInput || `mangas/${nombreManga}`;

        const formData = new FormData();
        formData.append("file", portadaFile);
        formData.append("upload_preset", "para subir mangas");
        formData.append("folder", folderPath);

        try {
          const response = await fetch("https://api.cloudinary.com/v1_1/djxnb3qrn/image/upload", {
            method: "POST",
            body: formData
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error?.message || "Error al subir imagen");
          }

          const urlPortada = data.secure_url;

          const mangaData = {
            portada: urlPortada,
            sinopsis,
            autor,
            generos: generos.split(",").map(g => g.trim()),
            estado,
            frecuencia,
            fechaLanzamiento,
            capitulos: []
          };

          const claveManga = nombreManga.replace(/\s+/g, "_").toLowerCase();

          await set(ref(db, `mangas/${claveManga}`), mangaData);

          alert("Manga guardado correctamente con portada subida.");
          formNuevoManga.reset();
        } catch (error) {
          console.error("Error:", error);
          alert("Error al subir imagen o guardar manga: " + error.message);
        }
      });
    }
  });
}
