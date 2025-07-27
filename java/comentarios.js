import {
  getDatabase,
  ref,
  push,
  onValue,
  get,
  update,
  remove
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

// Cambia este UID por el UID real del admin
const ADMIN_UID = "Cqh5y2MlsObi4ox90jlbAiRGu4D2";

// Obtener parámetros manga y capítulo de la URL
function getParams() {
  const url = new URLSearchParams(window.location.search);
  return {
    manga: url.get("manga"),
    cap: url.get("cap")
  };
}

// Formatea fechas como "hace X minutos/hours/días"
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

// Elementos DOM
const btnIniciar = document.getElementById("btn-iniciar-sesion");
const btnLogout = document.getElementById("btn-logout");
const formComentario = document.getElementById("comment-form");
const listaComentarios = document.getElementById("lista-comentarios");
const contadorComentarios = document.querySelector(".comment-count-custom");
const inputComentario = document.getElementById("input-comentario");
const userAvatar = document.getElementById("user-avatar");

let usuarioActual = null;

onAuthStateChanged(auth, (user) => {
  usuarioActual = user;
  actualizarUI(user);
  cargarComentarios();
});

btnIniciar?.addEventListener("click", () => {
  window.location.href = "../html/auth.html";
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.removeItem('rememberUser');
  localStorage.removeItem('userEmail');
  alert("Sesión cerrada.");
  location.reload();
});

document.getElementById("btn-publicar-comentario")?.addEventListener("click", publicarComentario);

// Actualiza la UI según si está logueado o no
function actualizarUI(user) {
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

async function publicarComentario() {
  const { manga, cap } = getParams();
  if (!manga || !cap) return alert("No se especificó manga o capítulo.");

  if (!usuarioActual) {
    alert("Debes iniciar sesión para comentar.");
    return;
  }

  const texto = inputComentario?.value.trim();
  if (!texto) {
    alert("Escribe un comentario antes de publicar.");
    return;
  }

  const nick = usuarioActual.displayName?.trim() || usuarioActual.email?.split("@")[0] || "Anónimo";

  const comentario = {
    usuario: nick && nick !== "" ? nick : "Anónimo",
    uid: usuarioActual.uid,
    texto,
    fecha: new Date().toISOString(),
    manga,
    capitulo: cap
  };

  const comentariosRef = ref(db, `comentarios/${manga}/${cap}`);

  try {
    await push(comentariosRef, comentario);
    inputComentario.value = "";

    // Actualizar contador en usuario
    const userRef = ref(db, `usuarios/${usuarioActual.uid}`);
    const snapshot = await get(userRef);
    const currentComentarios = snapshot.exists() ? snapshot.val().comentarios || 0 : 0;
    await update(userRef, { comentarios: currentComentarios + 1 });

    cargarComentarios();
  } catch (error) {
    console.error("Error al publicar comentario:", error);
    alert("No se pudo publicar el comentario.");
  }
}

function cargarComentarios() {
  const { manga, cap } = getParams();
  if (!manga || !cap) return;

  const comentariosRef = ref(db, `comentarios/${manga}/${cap}`);

  onValue(comentariosRef, (snapshot) => {
    listaComentarios.innerHTML = "";
    if (!snapshot.exists()) {
      contadorComentarios.textContent = "0 Comentarios";
      listaComentarios.innerHTML = "<p class='text-light'>Sin comentarios aún.</p>";
      return;
    }

    const comentarios = snapshot.val();
    const arrayComentarios = Object.entries(comentarios).sort(
      (a, b) => new Date(b[1].fecha) - new Date(a[1].fecha)
    );

    contadorComentarios.textContent = `${arrayComentarios.length} Comentario${arrayComentarios.length !== 1 ? "s" : ""}`;

    const { manga, cap } = getParams();

    arrayComentarios.forEach(([key, com]) => {
      const div = document.createElement("div");
      div.className = "comentario-box";

      const header = document.createElement("div");
      header.className = "d-flex justify-content-between align-items-center";

      const usuarioElem = document.createElement("strong");
      usuarioElem.textContent = com.usuario;

      const fechaElem = document.createElement("small");
      fechaElem.className = "fecha-comentario";
      fechaElem.textContent = formatoFechaRelativa(com.fecha);

      header.appendChild(usuarioElem);
      header.appendChild(fechaElem);

      const textoElem = document.createElement("p");
      textoElem.className = "mb-1";
      textoElem.textContent = com.texto;

      div.appendChild(header);
      div.appendChild(textoElem);

      if (com.editado) {
        const editadoSpan = document.createElement("small");
        editadoSpan.className = "text-muted";
        editadoSpan.textContent = " (editado)";
        usuarioElem.appendChild(editadoSpan);
      }

      // Mostrar botones solo para comentarios propios o admin
      if (
        usuarioActual &&
        (com.uid === usuarioActual.uid || usuarioActual.uid === ADMIN_UID)
      ) {
        const acciones = document.createElement("div");
        acciones.className = "mt-2";

        const btnEditar = document.createElement("button");
        btnEditar.className = "btn btn-sm btn-outline-primary me-2";
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => editarComentario(key, com, manga, cap);

        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-sm btn-outline-danger";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.onclick = () => eliminarComentario(key, com.uid, manga, cap);

        acciones.appendChild(btnEditar);
        acciones.appendChild(btnEliminar);
        div.appendChild(acciones);
      }

      listaComentarios.appendChild(div);
    });
  });
}

function editarComentario(key, comentario, manga, cap) {
  const nuevoTexto = prompt("Edita tu comentario:", comentario.texto);
  if (!nuevoTexto || nuevoTexto.trim() === "" || nuevoTexto === comentario.texto) return;

  if (!usuarioActual) return alert("Debes iniciar sesión para editar.");
  if (
    usuarioActual.uid !== comentario.uid &&
    usuarioActual.uid !== ADMIN_UID
  ) {
    return alert("No tienes permiso para editar este comentario.");
  }

  const comentarioRef = ref(db, `comentarios/${manga}/${cap}/${key}`);

  update(comentarioRef, {
    texto: nuevoTexto,
    editado: true,
    fechaEdicion: new Date().toISOString()
  })
    .then(() => {
      cargarComentarios();
    })
    .catch((err) => {
      console.error("Error editando comentario:", err);
      alert("Error al editar el comentario.");
    });
}

function eliminarComentario(key, uid, manga, cap) {
  if (!confirm("¿Estás seguro de eliminar este comentario?")) return;

  if (!usuarioActual) return alert("Debes iniciar sesión para eliminar.");
  if (
    usuarioActual.uid !== uid &&
    usuarioActual.uid !== ADMIN_UID
  ) {
    return alert("No tienes permiso para eliminar este comentario.");
  }

  const comentarioRef = ref(db, `comentarios/${manga}/${cap}/${key}`);
  remove(comentarioRef)
    .then(async () => {
      // Reducir contador de comentarios del usuario
      const userRef = ref(db, `usuarios/${uid}`);
      const snapshot = await get(userRef);
      const currentComentarios = snapshot.exists() ? snapshot.val().comentarios || 1 : 1;
      await update(userRef, { comentarios: Math.max(0, currentComentarios - 1) });
      cargarComentarios();
    })
    .catch((err) => {
      console.error("Error al eliminar comentario:", err);
      alert("No se pudo eliminar el comentario.");
    });
}
