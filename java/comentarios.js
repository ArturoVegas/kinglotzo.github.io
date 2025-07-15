// scripts_comentarios.js

import {
  getDatabase,
  ref,
  push,
  onValue
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
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

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getDatabase(app);
const auth = getAuth(app);

function getParams() {
  const url = new URLSearchParams(window.location.search);
  return {
    manga: url.get("manga"),
    cap: url.get("cap")
  };
}

function formatoFechaRelativa(fechaISO) {
  const fecha = new Date(fechaISO);
  const ahora = new Date();
  const diffMs = ahora - fecha;

  const segundos = Math.floor(diffMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias > 0) return `hace ${dias} día${dias > 1 ? "s" : ""}`;
  if (horas > 0) return `hace ${horas} hora${horas > 1 ? "s" : ""}`;
  if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? "s" : ""}`;
  return "hace unos segundos";
}

function cargarComentarios() {
  const { manga, cap } = getParams();
  if (!manga || !cap) return;

  const comentariosRef = ref(db, `comentarios/${manga}/${cap}`);

  onValue(comentariosRef, (snapshot) => {
    const contenedor = document.getElementById("lista-comentarios");
    const contador = document.querySelector(".comment-count-custom");
    if (!contenedor || !contador) return;

    contenedor.innerHTML = "";

    if (!snapshot.exists()) {
      contador.textContent = "0 Comentarios";
      contenedor.innerHTML = "<p class='text-light'>Sin comentarios aún.</p>";
      return;
    }

    const comentarios = snapshot.val();
    const arrayComentarios = Object.values(comentarios).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    contador.textContent = `${arrayComentarios.length} Comentario${arrayComentarios.length > 1 ? "s" : ""}`;

    arrayComentarios.forEach(com => {
      const div = document.createElement("div");
      div.className = "comentario-box";

      div.innerHTML = `
        <strong>${com.usuario}</strong>
        <p class="mb-1">${com.texto}</p>
        <small class="fecha-comentario">${formatoFechaRelativa(com.fecha)}</small>

      `;
      contenedor.appendChild(div);
    });
  });
}

async function publicarComentario() {
  const { manga, cap } = getParams();
  if (!manga || !cap) return alert("No se especificó manga o capítulo.");

  const texto = document.getElementById("input-comentario")?.value.trim();
  const user = auth.currentUser;

  if (!user) {
    alert("Debes iniciar sesión para comentar.");
    return;
  }

  if (!texto) {
    alert("Escribe un comentario antes de publicar.");
    return;
  }

  const nick = user.displayName?.trim() || user.email?.split("@")[0] || "Anónimo";


const comentario = {
  usuario: nick && nick !== "" ? nick : "Anónimo",
  uid: user.uid,
  texto,
  fecha: new Date().toISOString()
};


  const comentariosRef = ref(db, `comentarios/${manga}/${cap}`);
  await push(comentariosRef, comentario);

  if (document.getElementById("input-comentario")) {
    document.getElementById("input-comentario").value = "";
  }
}

function actualizarUI(user) {
  const btnIniciar = document.getElementById("btn-iniciar-sesion");
  const btnLogout = document.getElementById("btn-logout");
  const formComentario = document.getElementById("comment-form");
  const userAvatar = document.getElementById("user-avatar");

  if (user) {
    if (btnIniciar) btnIniciar.style.display = "none";
    if (btnLogout) btnLogout.style.display = "inline-block";
    if (formComentario) formComentario.style.display = "flex";
    if (userAvatar) {
      userAvatar.textContent = (user.displayName || user.email || "U").charAt(0).toUpperCase();
    }
  } else {
    if (btnIniciar) btnIniciar.style.display = "inline-block";
    if (btnLogout) btnLogout.style.display = "none";
    if (formComentario) formComentario.style.display = "none";
    if (userAvatar) userAvatar.textContent = "U";
  }
}

function redirigirLogin() {
  window.location.href = "../html/inicioSesion.html";
}

async function logout() {
  await signOut(auth);
  alert("Sesión cerrada.");
}

// Eventos botones
document.getElementById("btn-publicar-comentario")?.addEventListener("click", publicarComentario);
document.getElementById("btn-iniciar-sesion")?.addEventListener("click", redirigirLogin);
document.getElementById("btn-logout")?.addEventListener("click", logout);

// Carga inicial y escucha estado autenticación
onAuthStateChanged(auth, (user) => {
  actualizarUI(user);
  cargarComentarios();
});
