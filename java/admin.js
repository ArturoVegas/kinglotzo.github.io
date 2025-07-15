// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  push
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Config Firebase (ajusta a tu proyecto)
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

const path = location.pathname;

if (!path.includes("admin.html")) {
  console.warn("No es la página de admin. Script detenido.");
} else {
  // DOM
  const nuevoMangaSection = document.getElementById("nuevoMangaSection");
  const subirCapituloSection = document.getElementById("subirCapituloSection");
  const gestionNoticiasSection = document.getElementById("gestionNoticiasSection");

  const btnNuevoManga = document.getElementById("btnNuevoManga");
  const btnSubirCapitulo = document.getElementById("btnSubirCapitulo");
  const btnGestionNoticias = document.getElementById("btnGestionNoticias");
  const btnLogout = document.getElementById("btnLogout");

  const inputManga = document.getElementById("mangaSeleccionado");
  const datalist = document.getElementById("listaMangas");
  const capitulosExistentes = document.getElementById("capitulosExistentes");
  const formNuevoManga = document.getElementById("formNuevoManga");
  const formSubirCapitulo = document.getElementById("formSubirCapitulo");
  const selectCapitulos = document.getElementById("capituloSeleccionado");
  const progresoContainer = document.getElementById("progresoContainer");

  const formNoticia = document.getElementById("formNoticia");
  const textoNoticia = document.getElementById("textoNoticia");
  const imagenNoticia = document.getElementById("imagenNoticia");
  const listaNoticias = document.getElementById("listaNoticias");

  const formCarrusel = document.getElementById("formCarrusel");
  const imagenCarrusel = document.getElementById("imagenCarrusel");
  const tituloCarrusel = document.getElementById("tituloCarrusel");
  const descripcionCarrusel = document.getElementById("descripcionCarrusel");
  const listaCarrusel = document.getElementById("listaCarrusel");

  // Autenticación y redirección
  onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== adminUID) {
      alert("No autorizado. Redirigiendo a inicio de sesión.");
      window.location.href = "inicioSesion.html";
      return;
    }
    mostrarSeccion("nuevoMangaSection");
    await inicializarNodosVacios();
    cargarMangasEnDatalist();
    cargarNoticias();
    cargarCarrusel();
  });

  // Navegación secciones
  function mostrarSeccion(nombre) {
    nuevoMangaSection.classList.add("d-none");
    subirCapituloSection.classList.add("d-none");
    gestionNoticiasSection.classList.add("d-none");
    if (nombre === "nuevoMangaSection") nuevoMangaSection.classList.remove("d-none");
    if (nombre === "subirCapituloSection") subirCapituloSection.classList.remove("d-none");
    if (nombre === "gestionNoticiasSection") gestionNoticiasSection.classList.remove("d-none");
  }

  btnNuevoManga.addEventListener("click", () => mostrarSeccion("nuevoMangaSection"));
  btnSubirCapitulo.addEventListener("click", () => mostrarSeccion("subirCapituloSection"));
  btnGestionNoticias.addEventListener("click", () => mostrarSeccion("gestionNoticiasSection"));

  btnLogout.addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "inicioSesion.html");
  });

  // Crear nodos vacíos si no existen
  async function inicializarNodosVacios() {
    try {
      const comentariosSnap = await get(ref(db, "comentarios"));
      if (!comentariosSnap.exists()) {
        await set(ref(db, "comentarios"), { initialized: true });
      }
      const noticiasSnap = await get(ref(db, "noticias"));
      if (!noticiasSnap.exists()) {
        await set(ref(db, "noticias"), { initialized: true });
      }
      const carruselSnap = await get(ref(db, "carrusel"));
      if (!carruselSnap.exists()) {
        await set(ref(db, "carrusel"), { initialized: true });
      }
    } catch (e) {
      console.error("Error inicializando nodos:", e);
    }
  }

  // Cargar mangas para datalist autocompletado
  async function cargarMangasEnDatalist() {
    try {
      const snapshot = await get(ref(db, 'mangas'));
      datalist.innerHTML = "";
      if (snapshot.exists()) {
        const mangas = snapshot.val();
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

  // Mostrar capítulos existentes al elegir manga
  inputManga.addEventListener("change", async () => {
    const nombre = inputManga.value.trim();
    selectCapitulos.innerHTML = '<option value="">-- Selecciona un capítulo --</option>';
    capitulosExistentes.textContent = "";

    if (!nombre) return;

    try {
      const snapshot = await get(ref(db, `mangas/${nombre}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.capitulos && typeof data.capitulos === "object") {
          const keysCaps = Object.keys(data.capitulos);
          if (keysCaps.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.text = "No hay capítulos disponibles";
            selectCapitulos.appendChild(option);
            capitulosExistentes.textContent = "No hay capítulos subidos aún.";
          } else {
            keysCaps.forEach(capNum => {
              const option = document.createElement("option");
              option.value = capNum;
              option.text = `Capítulo ${capNum}`;
              selectCapitulos.appendChild(option);
            });
            capitulosExistentes.textContent = `Capítulos existentes: ${keysCaps.length}`;
          }
        } else {
          capitulosExistentes.textContent = "No hay capítulos subidos aún.";
        }
      } else {
        capitulosExistentes.innerHTML = `<span class="text-warning">Manga no encontrado</span>`;
      }
    } catch (error) {
      console.error("Error al buscar manga:", error);
    }
  });

  // Subir imagen a Cloudinary (función auxiliar)
  async function subirImagenCloudinary(file, folder) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "para subir mangas");
    if (folder) formData.append("folder", folder);

    const resp = await fetch("https://api.cloudinary.com/v1_1/djxnb3qrn/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || "Error al subir imagen");
    return data.secure_url;
  }

  // Formulario nuevo manga
  formNuevoManga.addEventListener("submit", async e => {
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

    const claveManga = nombreManga
      .replace(/[^A-Za-z0-9\sáéíóúÁÉÍÓÚñÑüÜ.,;:¡!¿?'"()\-]/g, "")
      .trim();

    try {
      // Verificar si el manga ya existe
      const mangaSnapshot = await get(ref(db, `mangas/${claveManga}`));
      if (mangaSnapshot.exists()) {
        alert(`El manga "${claveManga}" ya existe en la base de datos.`);
        return;
      }

      // Subir portada a Cloudinary
      const urlPortada = await subirImagenCloudinary(portadaFile, folderPath);

      // Crear objeto manga
      const mangaData = {
        portada: urlPortada,
        sinopsis,
        autor,
        generos: generos.split(",").map(g => g.trim()),
        estado,
        frecuencia,
        fechaLanzamiento,
        capitulos: {},
        visitas: 0
      };

      // Guardar en Firebase
      await set(ref(db, `mangas/${claveManga}`), mangaData);

      // Crear nodo comentarios vacío para manga
      await update(ref(db, `comentarios/${claveManga}`), { creadoEn: Date.now() });

      alert("Manga guardado correctamente con portada subida.");
      formNuevoManga.reset();
      cargarMangasEnDatalist();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al subir imagen o guardar manga: " + error.message);
    }
  });

  // Formulario subir capítulo
  formSubirCapitulo.addEventListener("submit", async e => {
    e.preventDefault();

    const nombreManga = inputManga.value.trim();
    const numeroCapitulo = document.getElementById("numeroCapitulo").value.trim();
    const imagenesInput = document.getElementById("imagenesCapitulo");
    const carpetaCloud = document.getElementById("rutaCloudinary").value.trim() || `mangas/${nombreManga}/cap${numeroCapitulo}`;

    if (!nombreManga || !numeroCapitulo || imagenesInput.files.length === 0) {
      alert("Completa todos los campos.");
      return;
    }

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

    progresoContainer.innerHTML = "";

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
            const resp = JSON.parse(xhr.responseText);
            resolve(resp.secure_url);
          } else {
            reject(new Error(`Error al subir la imagen ${img.name}`));
          }
        };

        xhr.onerror = () => reject(new Error("Error en la conexión de red."));

        xhr.send(formData);
      });

      urlsSubidas.push(urlSubida);
    }

    try {
      // Guardar urls en Firebase en la ruta del capítulo
      await set(ref(db, `mangas/${nombreManga}/capitulos/${numeroCapitulo}`), urlsSubidas);
      // Crear nodo comentarios vacío para capítulo
      await update(ref(db, `comentarios/${nombreManga}/${numeroCapitulo}`), { creadoEn: Date.now() });

      alert("Capítulo subido con éxito.");
      formSubirCapitulo.reset();
      progresoContainer.innerHTML = "";
      // Recargar capítulos existentes
      inputManga.dispatchEvent(new Event("change"));
    } catch (error) {
      console.error("Error al guardar capítulo:", error);
      alert("Error al guardar capítulo: " + error.message);
    }
  });

  // Gestión Noticias

  async function cargarNoticias() {
    try {
      const snapshot = await get(ref(db, "noticias"));
      listaNoticias.innerHTML = "";
      if (!snapshot.exists()) return;

      const noticias = snapshot.val();
      // Eliminar clave "initialized" si está
      if ("initialized" in noticias) delete noticias.initialized;

      for (const key in noticias) {
        if (!noticias.hasOwnProperty(key)) continue;
        const noticia = noticias[key];
        const li = document.createElement("li");
        li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
        li.textContent = noticia.texto || "(Sin texto)";

        if (noticia.imagen) {
          const img = document.createElement("img");
          img.src = noticia.imagen;
          img.style.width = "50px";
          img.style.height = "auto";
          img.classList.add("ms-3");
          li.appendChild(img);
        }

        const btnBorrar = document.createElement("button");
        btnBorrar.textContent = "Eliminar";
        btnBorrar.classList.add("btn", "btn-sm", "btn-danger");
        btnBorrar.addEventListener("click", () => eliminarNoticia(key));

        li.appendChild(btnBorrar);
        listaNoticias.appendChild(li);
      }
    } catch (e) {
      console.error("Error cargando noticias:", e);
    }
  }

  formNoticia.addEventListener("submit", async e => {
    e.preventDefault();

    const texto = textoNoticia.value.trim();
    if (!texto) {
      alert("El texto es obligatorio");
      return;
    }

    try {
      let urlImagen = "";
      if (imagenNoticia.files.length > 0) {
        urlImagen = await subirImagenCloudinary(imagenNoticia.files[0], "noticias");
      }

      // Push nueva noticia
      const nuevaRef = push(ref(db, "noticias"));
      await set(nuevaRef, {
        texto,
        imagen: urlImagen,
        creadoEn: Date.now()
      });

      formNoticia.reset();
      cargarNoticias();
    } catch (e) {
      console.error("Error subiendo noticia:", e);
      alert("Error al subir noticia.");
    }
  });

  async function eliminarNoticia(key) {
    if (!confirm("¿Seguro que quieres eliminar esta noticia?")) return;
    try {
      await remove(ref(db, `noticias/${key}`));
      cargarNoticias();
    } catch (e) {
      console.error("Error eliminando noticia:", e);
      alert("Error al eliminar noticia.");
    }
  }

  // Gestión Carrusel

  async function cargarCarrusel() {
    try {
      const snapshot = await get(ref(db, "carrusel"));
      listaCarrusel.innerHTML = "";
      if (!snapshot.exists()) return;

      const carrusel = snapshot.val();
      if ("initialized" in carrusel) delete carrusel.initialized;

      for (const key in carrusel) {
        if (!carrusel.hasOwnProperty(key)) continue;
        const item = carrusel[key];

        const li = document.createElement("li");
        li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

        const titulo = item.titulo || "(Sin título)";
        const descripcion = item.descripcion || "";
        const textoLi = document.createElement("div");
        textoLi.innerHTML = `<strong>${titulo}</strong><br/><small>${descripcion}</small>`;
        li.appendChild(textoLi);

        if (item.imagen) {
          const img = document.createElement("img");
          img.src = item.imagen;
          img.style.width = "50px";
          img.style.height = "auto";
          img.classList.add("ms-3");
          li.appendChild(img);
        }

        const btnBorrar = document.createElement("button");
        btnBorrar.textContent = "Eliminar";
        btnBorrar.classList.add("btn", "btn-sm", "btn-danger");
        btnBorrar.addEventListener("click", () => eliminarCarrusel(key));

        li.appendChild(btnBorrar);
        listaCarrusel.appendChild(li);
      }
    } catch (e) {
      console.error("Error cargando carrusel:", e);
    }
  }

  formCarrusel.addEventListener("submit", async e => {
    e.preventDefault();

    try {
      if (!imagenCarrusel.files.length) {
        alert("Debes seleccionar una imagen para el carrusel");
        return;
      }

      // Limitar max 5 imágenes
      const snapshot = await get(ref(db, "carrusel"));
      const carruselActual = snapshot.exists() ? snapshot.val() : {};
      const cantidadActual = Object.keys(carruselActual).filter(k => k !== "initialized").length;
      if (cantidadActual >= 5) {
        alert("El carrusel ya tiene el máximo de 5 imágenes.");
        return;
      }

      const urlImg = await subirImagenCloudinary(imagenCarrusel.files[0], "carrusel");
      const titulo = tituloCarrusel.value.trim();
      const descripcion = descripcionCarrusel.value.trim();

      const nuevaRef = push(ref(db, "carrusel"));
      await set(nuevaRef, { imagen: urlImg, titulo, descripcion, creadoEn: Date.now() });

      formCarrusel.reset();
      cargarCarrusel();
    } catch (error) {
      console.error("Error subiendo imagen carrusel:", error);
      alert("Error al subir imagen del carrusel.");
    }
  });

  async function eliminarCarrusel(key) {
    if (!confirm("¿Seguro que quieres eliminar esta imagen del carrusel?")) return;
    try {
      await remove(ref(db, `carrusel/${key}`));
      cargarCarrusel();
    } catch (e) {
      console.error("Error eliminando imagen carrusel:", e);
      alert("Error al eliminar imagen del carrusel.");
    }
  }
}
