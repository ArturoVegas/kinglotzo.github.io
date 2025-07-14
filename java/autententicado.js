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
const adminUID = "Cqh5y2MlsObi4ox90jlbAiRGu4D2";
// Detectar la ruta actual
const path = location.pathname;

// ==============================
// PÁGINA DE INICIO DE SESIÓN
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
        const credenciales = await signInWithEmailAndPassword(auth, email, password);
const user = credenciales.user;

if (user.uid === adminUID) {
  window.location.href = "admin.html"; // Redirige al panel si es admin
} else {
  // Redirige al sitio normal de lectores/comentarios
  window.location.href = "infoMangas.html";
}

      } catch (error) {
        console.error("Login error:", error.message);
        errorMsg.textContent = "Error: " + error.message;
      }
    });
  }
}

// ==============================
// PÁGINA DE ADMINISTRACIÓN
// ==============================
if (path.includes("admin.html")) {
  onAuthStateChanged(auth, (user) => {
    // Si no está logueado, redirigir al login
    if (!user) {
      window.location.href = "inicioSesion.html";
      return;
    }

    // Referencias a secciones y botones
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

    // Alternar entre secciones
    nuevoMangaSection?.classList.remove("d-none");
    subirCapituloSection?.classList.add("d-none");

    btnNuevoManga?.addEventListener("click", () => {
      nuevoMangaSection.classList.remove("d-none");
      subirCapituloSection.classList.add("d-none");
    });

    btnSubirCapitulo?.addEventListener("click", () => {
      subirCapituloSection.classList.remove("d-none");
      nuevoMangaSection.classList.add("d-none");
    });

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

      const nombreMangaInput = document.getElementById("nombreManga");
      const nombreManga = nombreMangaInput.value.trim();

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

      // Limpiar y formatear clave manga para base de datos
      const claveManga = nombreManga
        .replace(/[^A-Za-z0-9\sáéíóúÁÉÍÓÚñÑüÜ.,;:¡!¿?'"()\-]/g, "")
        .trim();

      // Verificar si manga ya existe
      try {
        const mangaSnapshot = await get(ref(db, `mangas/${claveManga}`));
        if (mangaSnapshot.exists()) {
          alert(`El manga "${claveManga}" ya existe en la base de datos.`);
          return;
        }
      } catch (err) {
        console.error("Error al verificar manga existente:", err);
        alert("Error al verificar manga existente.");
        return;
      }

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
          capitulos: {},
          visitas:0
        };

        // Guardar el manga en Firebase
        await set(ref(db, `mangas/${claveManga}`), mangaData);

        // Crear nodo de comentarios con campo creadoEn para que no esté vacío
        await update(ref(db, "comentarios"), {
          [claveManga]: { creadoEn: Date.now() }
        });

        alert("Manga guardado correctamente con portada subida.");
        formNuevoManga.reset();
        cargarMangasEnDatalist(); // recargar lista mangas
      } catch (error) {
        console.error("Error:", error);
        alert("Error al subir imagen o guardar manga: " + error.message);
      }
    });

    // ==============================
    // Cargar mangas en el datalist para autocompletar
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
    // Mostrar capítulos existentes en select al cambiar manga seleccionado
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
    // Crear barra de progreso visual para subir imágenes de capítulo
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

      if (!nombreManga || !numeroCapitulo || imagenesInput.files.length === 0) {
        alert("Completa todos los campos.");
        return;
      }

      // Verificar si capítulo ya existe
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

      progresoContainer.innerHTML = ""; // Limpiar barra de progreso anterior

      // Subir imágenes una por una con barra de progreso
      for (let i = 0; i < imagenes.length; i++) {
        const img = imagenes[i];

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

        // Subida con XMLHttpRequest para mostrar progreso
        const urlSubida = await new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append("file", img);
          formData.append("upload_preset", "para subir mangas");
          formData.append("folder", carpetaCloud);

          const xhr = new XMLHttpRequest();
          xhr.open("POST", "https://api.cloudinary.com/v1_1/djxnb3qrn/image/upload");

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
          throw err; // Detener la subida si hay error
        });

        urlsSubidas.push(urlSubida);
      }

      // Guardar capítulo en Firebase con timestamp
      try {
        const capRef = ref(db, `mangas/${nombreManga}/capitulos/${numeroCapitulo}`);
        await set(capRef, {
          imagenes: urlsSubidas,
          fecha: Date.now()
        });

        // Crear nodo de comentarios para el capítulo, con campo creadoEn vacío para evitar errores
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
