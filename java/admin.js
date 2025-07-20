// ==============================
// IMPORTACIÓN DE MÓDULOS FIREBASE
// ==============================
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

// ==============================
// CONFIGURACIÓN DE FIREBASE
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

// ==============================
// INICIALIZACIÓN
// ==============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const adminUID = "Cqh5y2MlsObi4ox90jlbAiRGu4D2";
const path = location.pathname;

// ==============================
// VERIFICACIÓN DE PÁGINA ADMIN
// ==============================
if (!path.includes("admin.html")) {
  console.warn("No es la página de admin. Script detenido.");
} else {

  // ==============================
  // REFERENCIAS A ELEMENTOS DEL DOM
  // ==============================
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
  const selectCapitulos = document.getElementById("capituloSeleccionado");
  const progresoContainer = document.getElementById("progresoContainer");

  const formNuevoManga = document.getElementById("formNuevoManga");
  const formSubirCapitulo = document.getElementById("formSubirCapitulo");
  const formNoticia = document.getElementById("formNoticia");
  const textoNoticia = document.getElementById("textoNoticia");
  const imagenNoticia = document.getElementById("imagenNoticia");
  const listaNoticias = document.getElementById("listaNoticias");

  const formCarrusel = document.getElementById("formCarrusel");
  const imagenCarrusel = document.getElementById("imagenCarrusel");
  const tituloCarrusel = document.getElementById("tituloCarrusel");
  const descripcionCarrusel = document.getElementById("descripcionCarrusel");
  const listaCarrusel = document.getElementById("listaCarrusel");

  // ==============================
  // AUTENTICACIÓN DE ADMIN
  // ==============================
  onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== adminUID) {
      alert("No autorizado. Redirigiendo a inicio de sesión.");
      window.location.href = "auth.html";
      return;
    }

    mostrarSeccion("nuevoMangaSection");
    await inicializarNodosVacios();
    cargarMangasEnDatalist();
    cargarNoticias();
    cargarCarrusel();
  });

  // ==============================
  // NAVEGACIÓN ENTRE SECCIONES
  // ==============================
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
    signOut(auth).then(() => {
      localStorage.removeItem('rememberUser');
      localStorage.removeItem('userEmail');
      window.location.href = "auth.html";
    });
  });

  // ==============================
  // INICIALIZAR NODOS SI NO EXISTEN
  // ==============================
  async function inicializarNodosVacios() {
    try {
      const comentariosSnap = await get(ref(db, "comentarios"));
      if (!comentariosSnap.exists()) await set(ref(db, "comentarios"), { initialized: true });

      const noticiasSnap = await get(ref(db, "noticias"));
      if (!noticiasSnap.exists()) await set(ref(db, "noticias"), { initialized: true });

      const carruselSnap = await get(ref(db, "carrusel"));
      if (!carruselSnap.exists()) await set(ref(db, "carrusel"), { initialized: true });
    } catch (e) {
      console.error("Error inicializando nodos:", e);
    }
  }

  // ==============================
  // FUNCIONES DE MANGAS
  // ==============================

  // Cargar mangas en datalist
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

  // Mostrar capítulos existentes al seleccionar manga
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

  // ==============================
  // FUNCIONES DE CLOUDINARY
  // ==============================
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

  // ==============================
  // GÉNEROS (input con autocompletado + botón añadir + lista visual)
  // ==============================
  const generosValidos = ["Acción", "Aventura", "Romance", "Comedia", "Drama", "Fantasia", "Recuentos de la vida", "Terror", "Misterio"];

  const inputGenero = document.getElementById("inputGenero");
  const btnAgregar = document.getElementById("btnAgregarGenero");
  const listaGenerosDiv = document.getElementById("listaGenerosSeleccionados");

  let generosSeleccionados = [];

  // Autocompletado con sugerencias dinámicas
  inputGenero.addEventListener("input", () => {
    const val = inputGenero.value.toLowerCase();

    const sugerencias = generosValidos.filter(g => g.toLowerCase().startsWith(val) && !generosSeleccionados.includes(g));

    mostrarSugerencias(sugerencias);
  });

  function mostrarSugerencias(sugerencias) {
    let contenedor = document.getElementById("contenedorSugerencias");
    if (!contenedor) {
      contenedor = document.createElement("div");
      contenedor.id = "contenedorSugerencias";
      contenedor.style.border = "1px solid #ccc";
      contenedor.style.position = "absolute";
      contenedor.style.backgroundColor = "white";
      contenedor.style.zIndex = 1000;
      contenedor.style.maxHeight = "150px";
      contenedor.style.overflowY = "auto";
      contenedor.style.width = inputGenero.offsetWidth + "px";
      inputGenero.parentNode.appendChild(contenedor);
    }

    contenedor.innerHTML = "";

    if (sugerencias.length === 0) {
      contenedor.style.display = "none";
      return;
    }
    contenedor.style.display = "block";

    sugerencias.forEach(genero => {
      const div = document.createElement("div");
      div.textContent = genero;
      div.style.padding = "4px";
      div.style.cursor = "pointer";

      div.addEventListener("mousedown", (e) => {
        e.preventDefault();
        agregarGenero(genero);
        contenedor.style.display = "none";
      });

      contenedor.appendChild(div);
    });
  }


  function agregarGenero(genero) {
    if (!genero) return alert("Escribe o selecciona un género");
    if (!generosValidos.includes(genero)) return alert("Género no válido");
    if (generosSeleccionados.includes(genero)) return alert("Género ya agregado");

    generosSeleccionados.push(genero);
    inputGenero.value = "";
    actualizarLista();
  }

  function actualizarLista() {
    listaGenerosDiv.innerHTML = "";
    generosSeleccionados.forEach((g, i) => {
      const tag = document.createElement("span");
      tag.textContent = g;
      tag.className = "badge bg-info text-dark me-2";

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "×";
      btnEliminar.className = "btn btn-sm btn-link text-dark ms-1 p-0";
      btnEliminar.onclick = () => {
        generosSeleccionados.splice(i, 1);
        actualizarLista();
      };

      tag.appendChild(btnEliminar);
      listaGenerosDiv.appendChild(tag);
    });
  }

  document.addEventListener("click", (e) => {
    const contenedor = document.getElementById("contenedorSugerencias");
    if (contenedor && !inputGenero.contains(e.target) && !contenedor.contains(e.target)) {
      contenedor.style.display = "none";
    }
  });

  // ==============================
  // FORMULARIO NUEVO MANGA
  // ==============================
  formNuevoManga.addEventListener("submit", async e => {
    e.preventDefault();

    const nombreManga = document.getElementById("nombreManga").value.trim();
    const sinopsis = document.getElementById("sinopsis").value.trim();
    const autor = document.getElementById("autor").value.trim();
    const generos = generosSeleccionados;
    const estado = document.getElementById("estado").value;
    const frecuencia = document.getElementById("frecuencia").value;
    const fechaLanzamiento = document.getElementById("fechaLanzamiento").value;
    const cloudinaryFolder = document.getElementById("cloudinaryFolder")?.value.trim() || "";

    const portadaInput = document.getElementById("portada");
    if (!portadaInput || portadaInput.files.length === 0) {
      alert("Debes seleccionar una imagen de portada.");
      return;
    }

    const claveManga = nombreManga
      .replace(/[^A-Za-z0-9\sáéíóúÁÉÍÓÚñÑüÜ.,;:¡!¿?'"()\-]/g, "")
      .trim();

    try {
      const snapshot = await get(ref(db, `mangas/${claveManga}`));
      if (snapshot.exists()) {
        alert(`El manga "${claveManga}" ya existe.`);
        return;
      }

      const urlPortada = await subirImagenCloudinary(portadaInput.files[0], cloudinaryFolder || `mangas/${nombreManga}`);

      const mangaData = {
        portada: urlPortada,
        sinopsis,
        autor,
        generos,
        estado,
        frecuencia,
        fechaLanzamiento,
        capitulos: {},
        visitas: 0
      };

      await set(ref(db, `mangas/${claveManga}`), mangaData);
      await update(ref(db, `comentarios/${claveManga}`), { creadoEn: Date.now() });

      alert("Manga guardado correctamente.");
      formNuevoManga.reset();
      generosSeleccionados = [];
      actualizarLista();
      cargarMangasEnDatalist();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al subir imagen o guardar manga: " + error.message);
    }
  });

  // ==============================
  // FORMULARIO SUBIR CAPÍTULO
  // ==============================
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

    const snapshot = await get(ref(db, `mangas/${nombreManga}/capitulos/${numeroCapitulo}`));
    if (snapshot.exists()) {
      alert(`El capítulo "${numeroCapitulo}" ya existe.`);
      return;
    }

    const urlsSubidas = [];
    progresoContainer.innerHTML = "";

    for (let i = 0; i < imagenesInput.files.length; i++) {
      const img = imagenesInput.files[i];

      const barraWrapper = document.createElement("div");
      const label = document.createElement("div");
      const barraProgreso = document.createElement("progress");

      label.textContent = `Subiendo imagen ${i + 1}: ${img.name}`;
      barraProgreso.max = 100;
      barraProgreso.value = 0;

      barraWrapper.appendChild(label);
      barraWrapper.appendChild(barraProgreso);
      progresoContainer.appendChild(barraWrapper);

      try {
        // Subida sin progreso visible porque fetch no da progreso nativo en JS puro
        const url = await subirImagenCloudinary(img, `${carpetaCloud}/cap${numeroCapitulo}`);
        barraProgreso.value = 100;
        urlsSubidas.push(url);
      } catch (error) {
        alert(`Error subiendo la imagen ${img.name}: ${error.message}`);
        return;
      }
    }

    try {
      await set(ref(db, `mangas/${nombreManga}/capitulos/${numeroCapitulo}`), {
  fecha: new Date().toISOString(),
  imagenes: urlsSubidas
});
      await update(ref(db, `comentarios/${nombreManga}/${numeroCapitulo}`), { creadoEn: Date.now() });
      alert("Capítulo subido con éxito.");
      formSubirCapitulo.reset();
      progresoContainer.innerHTML = "";
      cargarMangasEnDatalist();
    } catch (error) {
      alert("Error guardando capítulo en Firebase: " + error.message);
    }
  });

  // ==============================
  // GESTIÓN DE NOTICIAS
  // ==============================
  formNoticia.addEventListener("submit", async e => {
    e.preventDefault();

    const texto = textoNoticia.value.trim();
    if (!texto) {
      alert("El texto de la noticia no puede estar vacío.");
      return;
    }

    try {
      let urlImagen = "";
      if (imagenNoticia.files.length > 0) {
        urlImagen = await subirImagenCloudinary(imagenNoticia.files[0], "noticias");
      }

      const nuevaNoticiaRef = push(ref(db, "noticias"));
      await set(nuevaNoticiaRef, { texto, imagen: urlImagen, titulo: texto.substring(0, 20) });

      alert("Noticia añadida.");
      formNoticia.reset();
      cargarNoticias();
    } catch (error) {
      alert("Error al añadir noticia: " + error.message);
    }
  });

  async function cargarNoticias() {
    try {
      const snapshot = await get(ref(db, "noticias"));
      listaNoticias.innerHTML = "";
      if (!snapshot.exists()) return;
      const noticias = snapshot.val();

      if (noticias.initialized) delete noticias.initialized;

      Object.entries(noticias).forEach(([key, noticia]) => {
        const div = document.createElement("div");
        div.classList.add("noticia", "mb-3", "p-2", "border", "rounded", "position-relative");
        div.innerHTML = `
          <h5>${noticia.titulo || "Sin título"}</h5>
          <p>${noticia.texto || ""}</p>
          ${noticia.imagen ? `<img src="${noticia.imagen}" alt="Imagen noticia" style="max-width: 200px;">` : ""}
          <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 btn-eliminar-noticia" data-id="${key}" title="Eliminar noticia">×</button>
        `;
        listaNoticias.appendChild(div);
      });

      document.querySelectorAll(".btn-eliminar-noticia").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          if (confirm("¿Seguro que quieres eliminar esta noticia?")) {
            try {
              await remove(ref(db, `noticias/${id}`));
              alert("Noticia eliminada");
              cargarNoticias();
            } catch (err) {
              alert("Error al eliminar noticia: " + err.message);
            }
          }
        });
      });
    } catch (error) {
      console.error("Error al cargar noticias:", error);
    }
  }

  // ==============================
  // GESTIÓN DE CARRUSEL
  // ==============================
  formCarrusel.addEventListener("submit", async e => {
    e.preventDefault();

    const titulo = tituloCarrusel.value.trim();
    const descripcion = descripcionCarrusel.value.trim();

    if (!titulo || !descripcion) {
      alert("Título y descripción son obligatorios.");
      return;
    }

    try {
      let urlImagen = "";
      if (imagenCarrusel.files.length > 0) {
        urlImagen = await subirImagenCloudinary(imagenCarrusel.files[0], "carrusel");
      }

      const nuevoItemRef = push(ref(db, "carrusel"));
      await set(nuevoItemRef, { titulo, descripcion, imagen: urlImagen });

      alert("Elemento añadido al carrusel.");
      formCarrusel.reset();
      cargarCarrusel();
    } catch (error) {
      alert("Error al añadir elemento al carrusel: " + error.message);
    }
  });

  async function cargarCarrusel() {
    try {
      const snapshot = await get(ref(db, "carrusel"));
      listaCarrusel.innerHTML = "";
      if (!snapshot.exists()) return;
      const carrusel = snapshot.val();

      if (carrusel.initialized) delete carrusel.initialized;

      Object.entries(carrusel).forEach(([key, item]) => {
        const div = document.createElement("div");
        div.classList.add("carrusel-item", "mb-3", "p-2", "border", "rounded", "position-relative");
        div.innerHTML = `
          <h5>${item.titulo || "Sin título"}</h5>
          <p>${item.descripcion || ""}</p>
          ${item.imagen ? `<img src="${item.imagen}" alt="Imagen carrusel" style="max-width: 200px;">` : ""}
          <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 btn-eliminar-carrusel" data-id="${key}" title="Eliminar carrusel">×</button>
        `;
        listaCarrusel.appendChild(div);
      });

      document.querySelectorAll(".btn-eliminar-carrusel").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          if (confirm("¿Seguro que quieres eliminar este elemento del carrusel?")) {
            try {
              await remove(ref(db, `carrusel/${id}`));
              alert("Elemento del carrusel eliminado");
              cargarCarrusel();
            } catch (err) {
              alert("Error al eliminar carrusel: " + err.message);
            }
          }
        });
      });
    } catch (error) {
      console.error("Error al cargar carrusel:", error);
    }
  }
}
