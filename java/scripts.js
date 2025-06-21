import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyArUObX1yvBE1F7JOotiFVBVp_FuFGtLks",
  authDomain: "prueba-base-de-datos-270a7.firebaseapp.com",
  databaseURL: "https://prueba-base-de-datos-270a7-default-rtdb.firebaseio.com",
  projectId: "prueba-base-de-datos-270a7",
  storageBucket: "prueba-base-de-datos-270a7.firebasestorage.app",
  messagingSenderId: "190031828502",
  appId: "1:190031828502:web:e8c9ba978b037cce008737",
  measurementId: "G-W512T7N7GB"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", async () => {
  const estado = document.getElementById("estadoCarga");
  const lista = document.getElementById("lista-mangas");

  try {
    const snapshot = await get(ref(db, "mangas"));
    const data = snapshot.val();

    if (!data) {
      estado.textContent = "No hay mangas.";
      return;
    }

    Object.values(data).forEach(manga => {
      const li = document.createElement("li");
      li.textContent = manga.nombre || "Sin nombre";
      lista.appendChild(li);
    });

    estado.textContent = "Mangas cargados correctamente.";
  } catch (error) {
    console.error("Error al leer Firebase:", error);
    estado.textContent = "Error al cargar datos.";
  }
});
