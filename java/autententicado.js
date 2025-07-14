// ==============================
// IMPORTACIÓN DE MÓDULOS FIREBASE
// ==============================
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
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// ==============================
// CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==============================
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

// UID del administrador para control de acceso
const adminUID = "Cqh5y2MlsObi4ox90jlbAiRGu4D2";

// Obtener la ruta actual para controlar comportamiento por página
const path = location.pathname;

// ==============================
// PÁGINA DE INICIO DE SESIÓN (inicioSesion.html)
// ==============================
if (path.includes("inicioSesion.html")) {
  const loginForm = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      try {
        // Intentar login con email y contraseña
        const credenciales = await signInWithEmailAndPassword(auth, email, password);
        const user = credenciales.user;

        // Redireccionar según sea admin o usuario normal
        if (user.uid === adminUID) {
          window.location.href = "admin.html"; // Panel de administración
        } else {
          window.location.href = "../index.html"; // Página principal para usuarios
        }

      } catch (error) {
        console.error("Login error:", error.message);
        errorMsg.textContent = "Error: " + error.message;
      }
    });
  }
}

// ==============================
// PÁGINA DE ADMINISTRACIÓN (admin.html)
// ==============================
if (path.includes("admin.html")) {
  onAuthStateChanged(auth, (user) => {
    // Si no hay usuario autenticado, redirigir a login
    if (!user) {
      window.location.href = "inicioSesion.html";
      return;
    }

    // Referencias a elementos DOM usados en admin.html
    const nuevoMangaSection = document.getElementById("nuevoMangaSection");
    const subirCapituloSection = document.getElementById("subirCapituloSection");
    const btnNuevoManga = document.getElementById("btnNuevoManga");
    const btnSubirCapitulo = document.getElementById("btnSubirCapitulo");
    const btnLogout = document.getElementById("btnLogout");

    const inputManga = document.getElementById("mangaSeleccionado");
    const datalist = document.getElementById("listaMangas");
    const capitulosExistentes = document.getElementById("capitulosExistentes");
    const formNuevoManga = document.getElementById("formNuevoManga");
    const formSubirCapitulo = document.getElementById("formSubirCapitulo");
    const selectCapitulos = document.getElementById("capituloSeleccionado");

    // Mostrar por defecto la sección "Nuevo Manga" y ocultar "Subir Capítulo"
    nuevoMangaSection?.classList.remove("d-none");
    subirCapituloSection?.classList.add("d-none");

    // Botones para alternar entre secciones sin recargar la página
    btnNuevoManga?.addEventListener("click", () => {
      nuevoMangaSection.classList.remove("d-none");
      subirCapituloSection.classList.add("d-none");
    });

    btnSubirCapitulo?.addEventListener("click", () => {
      subirCapituloSection.classList.remove("d-none");
      nuevoMangaSection.classList.add("d-none");
    });

    // Botón para cerrar sesión y redirigir a login
    btnLogout?.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.href = "inicioSesion.html";
      });
    });

    // ==============================
    // FORMULARIO: NUEVO MANGA
    // ==============================
    formNuevoManga?.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Obtener datos del formulario nuevo manga
      const nombreMangaInput = document.getElementById("nombreManga");
      const nombreManga = nombreMangaInput.value.trim();

      const sinopsis = document.getElementById("sinopsis").value.trim();
      const autor = document.getElementById("autor").value.trim();
      const generos = document.getElementById("generos").value.trim();
      const estado = document.getElementById("estado").value;
      const frecuencia = document.getElementById("frecuencia").value;
      const fechaLanzamiento = document.getElementById("fechaLanzamiento").value;
      const cloudinaryFolderInput = document.getElementById("cloudinaryFolder")?.value.trim() || "";

      // Validar que se haya seleccionado una portada
      const portadaInput = document.getElementById("portada");
      if (!portadaInput || portadaInput.files.length === 0) {
        alert("Debes seleccionar una imagen de portada.");
        return;
      }
      const portadaFile = portadaInput.files[0];

      // Carpeta en Cloudinary para subir portada
      const folderPath = cloudinaryFolderInput || `mangas/${nombreManga}`;

      // Limpiar nombre manga para clave Firebase (solo caracteres permitidos)
      const claveManga = nombreManga
        .replace(/[^A-Za-z0-9\sáéíóúÁÉÍÓÚñÑüÜ.,;:¡!¿?'"()\-]/g, "")
        .trim();

      try {
        // Verificar si el manga ya existe en la base de datos
        const mangaSnapshot = await get(ref(db, `mangas/${claveManga}`));
        if (mangaSnapshot.exists()) {
          alert(`El manga "${claveManga}" ya existe en la base de datos.`);
          return;
        }

        // Subir portada a Cloudinary
        const formData = new FormData();
        formData.append("file", portadaFile);
        formData.append("upload_preset", "para subir mangas");
        formData.append("folder", folderPath);

        const response = await fetch("https://api.cloudinary.com/v1_1/djxnb3qrn/image/upload", {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Error al subir imagen");
        }

        const urlPortada = data.secure_url;

        // Preparar objeto con datos del manga
        const mangaData = {
          portada: urlPortada,
          sinopsis,
          autor,
          generos: generos.split(",").map(g => g.trim()),
          estado,
          frecuencia,
          fechaLanzamiento,
          capitulos: {},  // Inicialmente vacío
          visitas: 0
        };

        // Guardar manga en Firebase Realtime Database
        await set(ref(db, `mangas/${claveManga}`), mangaData);

        // Crear nodo inicial para comentarios del manga
        await update(ref(db, `comentarios/${claveManga}`), {
          creadoEn: Date.now()
        });

        alert("Manga guardado correctamente con portada subida.");
        formNuevoManga.reset();

        // Recargar lista de mangas en datalist para formulario de subir capítulos
        cargarMangasEnDatalist();

      } catch (error) {
        console.error("Error:", error);
        alert("Error al subir imagen o guardar manga: " + error.message);
      }
    });

    // ==============================
    // CARGAR MANGAS EN DATALIST (autocompletado para subir capítulos)
    // ==============================
    async function cargarMangasEnDatalist() {
      try {
        const snapshot = await get(ref(db, 'mangas'));
        if (snapshot.exists()) {
          const mangas = snapshot.val();
          datalist.innerHTML = "";
          Object.keys(mangas).forEach(nombre => {
            const option = document.createElement("option");
            option.value = nombre;
            datalist.appendChild(option);
          });
        }
      } catch (err) {
        console.error("Error al cargar mangas:", err);
      }
    }
    cargarMangasEnDatalist();

    // ==============================
    // MOSTRAR CAPÍTULOS EXISTENTES AL SELECCIONAR UN MANGA
    // ==============================
    inputManga?.addEventListener("change", async () => {
      const nombre = inputManga.value.trim();

      // Limpiar select de capítulos
      if (selectCapitulos) {
        selectCapitulos.innerHTML = '<option value="">-- Selecciona un capítulo --</option>';
      }

      if (!nombre) {
        capitulosExistentes.innerHTML = "";
        return;
      }

      try {
        const snapshot = await get(ref(db, `mangas/${nombre}`));
        if (snapshot.exists()) {
          const data = snapshot.val();

          if (data.capitulos && typeof data.capitulos === "object") {
            const keysCaps = Object.keys(data.capitulos);

            if (keysCaps.length === 0) {
              if (selectCapitulos) {
                const option = document.createElement("option");
                option.value = "";
                option.text = "No hay capítulos disponibles";
                selectCapitulos.appendChild(option);
              }
              capitulosExistentes.innerHTML = "No hay capítulos subidos aún.";
            } else {
              keysCaps.forEach(capNum => {
                if (selectCapitulos) {
                  const option = document.createElement("option");
                  option.value = capNum;
                  option.text = `Capítulo ${capNum}`;
                  selectCapitulos.appendChild(option);
                }
              });
              capitulosExistentes.innerHTML = `Capítulos existentes: ${keysCaps.length}`;
            }
          } else {
            capitulosExistentes.innerHTML = "No hay capítulos subidos aún.";
          }
        } else {
          capitulosExistentes.innerHTML = `<span class="text-warning">Manga no encontrado</span>`;
        }
      } catch (error) {
        console.error("Error al buscar manga:", error);
      }
    });

    // ==============================
    // BARRA DE PROGRESO PARA SUBIDA DE IMÁGENES
    // ==============================
    const progresoContainer = document.createElement("div");
    progresoContainer.id = "progresoContainer";
    progresoContainer.style.marginTop = "10px";
    formSubirCapitulo.appendChild(progresoContainer);

    // ==============================
    // FORMULARIO: SUBIR CAPÍTULO
    // ==============================
    formSubirCapitulo?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombreManga = inputManga.value.trim();
      const numeroCapitulo = document.getElementById("numeroCapitulo").value.trim();
      const imagenesInput = document.getElementById("imagenesCapitulo");
      const carpetaCloud = document.getElementById("rutaCloudinary").value.trim() || `mangas/${nombreManga}/cap${numeroCapitulo}`;

      // Validaciones básicas
      if (!nombreManga || !numeroCapitulo || imagenesInput.files.length === 0) {
        alert("Completa todos los campos.");
        return;
      }

      // Verificar si capítulo ya existe para evitar duplicados
      try {
        const capSnapshot = await get(ref(db, `mangas/${nombreManga}/capitulos/${numeroCapitulo}`));
        if (capSnapshot.exists()) {
          alert(`El capítulo "${numeroCapitulo}" ya existe para el manga "${nombreManga}".`);
          return;
        }
      } catch (err) {
        console.error("Error al verificar capítulo existente:", err);
        alert("Error al verificar capítulo existente.");
        return;
      }

      const imagenes = imagenesInput.files;
      const urlsSubidas = [];

      progresoContainer.innerHTML = ""; // Limpiar barra de progreso previa

      // Subir cada imagen a Cloudinary con barra de progreso visual
      for (let i = 0; i < imagenes.length; i++) {
        const img = imagenes[i];

        // Crear elementos de barra de progreso para cada imagen
        const barraWrapper = document.createElement("div");
        barraWrapper.style.marginBottom = "5px";

        const label = document.createElement("div");
        label.textContent = `Subiendo imagen ${i + 1} de ${imagenes.length}: ${img.name}`;
        label.style.fontSize = "0.9rem";
        label.style.marginBottom = "2px";

        const barraProgreso = document.createElement("progress");
        barraProgreso.max = 100;
        barraProgreso.value = 0;
        barraProgreso.style.width = "100%";

        barraWrapper.appendChild(label);
        barraWrapper.appendChild(barraProgreso);
        progresoContainer.appendChild(barraWrapper);

        // Subida con XMLHttpRequest para seguimiento de progreso
        const urlSubida = await new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append("file", img);
          formData.append("upload_preset", "para subir mangas");
          formData.append("folder", carpetaCloud);

          const xhr = new XMLHttpRequest();
          xhr.open("POST", "https://api.cloudinary.com/v1_1/djxnb3qrn/image/upload");

          // Actualizar barra de progreso
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const porcentaje = (event.loaded / event.total) * 100;
              barraProgreso.value = porcentaje;
            }
          });

          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              resolve(response.secure_url);
            } else {
              reject(new Error(`Error al subir imagen ${img.name}: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error(`Error de red al subir imagen ${img.name}`));

          xhr.send(formData);
        }).catch((err) => {
          alert(err.message);
          throw err; // Parar si hay error
        });

        urlsSubidas.push(urlSubida);
      }

      // Guardar capítulo con URLs y fecha en Firebase
      try {
        const capRef = ref(db, `mangas/${nombreManga}/capitulos/${numeroCapitulo}`);
        await set(capRef, {
          imagenes: urlsSubidas,
          fecha: Date.now()
        });

        // Crear nodo de comentarios para capítulo para evitar errores al leerlos después
        await set(ref(db, `comentarios/${nombreManga}/${numeroCapitulo}`), { creadoEn: Date.now() });

        alert("Capítulo subido correctamente.");
        formSubirCapitulo.reset();
        progresoContainer.innerHTML = "";
        capitulosExistentes.innerHTML = "";

      } catch (err) {
        console.error("Error al guardar en Firebase:", err);
        alert("Error al guardar capítulo en Firebase");
      }
    });
  });
}
