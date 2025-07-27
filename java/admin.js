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
  const actualizarMangaSection = document.getElementById("actualizarMangaSection");
  const gestionNoticiasSection = document.getElementById("gestionNoticiasSection");

  const btnNuevoManga = document.getElementById("btnNuevoManga");
  const btnSubirCapitulo = document.getElementById("btnSubirCapitulo");
  const btnActualizarManga = document.getElementById("btnActualizarManga");
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
  // ==============================
// AUTENTICACIÓN DE ADMIN POR ROL
// ==============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("No autorizado. Redirigiendo a inicio de sesión.");
    window.location.href = "auth.html";
    return;
  }

  try {
    const userSnapshot = await get(ref(db, `usuarios/${user.uid}`));
    if (!userSnapshot.exists()) {
      alert("Usuario no registrado. Acceso denegado.");
      await signOut(auth);
      window.location.href = "auth.html";
      return;
    }

    const userData = userSnapshot.val();
    if (userData.rol !== "admin") {
      alert("No tienes permisos de administrador.");
      await signOut(auth);
      window.location.href = "auth.html";
      return;
    }

    // Usuario admin autorizado
    mostrarSeccion("nuevoMangaSection");
    await inicializarNodosVacios();
    cargarMangasEnDatalist();
    cargarNoticias();
    cargarCarrusel();

  } catch (error) {
    console.error("Error verificando rol de usuario:", error);
    alert("Error en la verificación de permisos.");
    await signOut(auth);
    window.location.href = "auth.html";
  }
});

  // ==============================
  // NAVEGACIÓN ENTRE SECCIONES
  // ==============================
  function mostrarSeccion(nombre) {
    nuevoMangaSection.classList.add("d-none");
    subirCapituloSection.classList.add("d-none");
    actualizarMangaSection.classList.add("d-none");
    gestionNoticiasSection.classList.add("d-none");

    if (nombre === "nuevoMangaSection") nuevoMangaSection.classList.remove("d-none");
    if (nombre === "subirCapituloSection") subirCapituloSection.classList.remove("d-none");
    if (nombre === "actualizarMangaSection") actualizarMangaSection.classList.remove("d-none");
    if (nombre === "gestionNoticiasSection") gestionNoticiasSection.classList.remove("d-none");
  }

  btnNuevoManga.addEventListener("click", () => mostrarSeccion("nuevoMangaSection"));
  btnSubirCapitulo.addEventListener("click", () => mostrarSeccion("subirCapituloSection"));
  btnActualizarManga.addEventListener("click", () => mostrarSeccion("actualizarMangaSection"));
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

  // ==============================
  // FUNCIONALIDAD ACTUALIZAR MANGA
  // ==============================
  
  // Referencias DOM para actualizar manga
  const mangaActualizarInput = document.getElementById("mangaActualizar");
  const listaMangasActualizar = document.getElementById("listaMangasActualizar");
  const mangaSeleccionadoInfo = document.getElementById("mangaSeleccionadoInfo");
  const nombreMangaSeleccionado = document.getElementById("nombreMangaSeleccionado");
  const portadaActualImg = document.getElementById("portadaActualImg");
  const bannerActualImg = document.getElementById("bannerActualImg");
  const formActualizarManga = document.getElementById("formActualizarManga");
  const btnLimpiarFormActualizar = document.getElementById("btnLimpiarFormActualizar");
  
  // Preview de imágenes
  const nuevaPortadaInput = document.getElementById("nuevaPortada");
  const nuevoBannerInput = document.getElementById("nuevoBanner");
  const portadaPreview = document.getElementById("portadaPreview");
  const portadaPreviewImg = document.getElementById("portadaPreviewImg");
  const bannerPreview = document.getElementById("bannerPreview");
  const bannerPreviewImg = document.getElementById("bannerPreviewImg");
  
  // Variables para el filtrado de mangas
  let mangasDisponibles = {};
  let sugerenciasContainer = null;
  
  // Cargar mangas en datalist de actualizar
  async function cargarMangasActualizar() {
    try {
      const snapshot = await get(ref(db, 'mangas'));
      listaMangasActualizar.innerHTML = "";
      mangasDisponibles = {};
      
      if (snapshot.exists()) {
        const mangas = snapshot.val();
        mangasDisponibles = mangas;
        
        Object.keys(mangas).forEach(nombre => {
          const option = document.createElement("option");
          option.value = nombre;
          listaMangasActualizar.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Error al cargar mangas para actualizar:", err);
    }
  }
  
  // Funcionalidad mejorada de búsqueda con sugerencias
  mangaActualizarInput.addEventListener('input', (e) => {
    const valor = e.target.value.trim();
    
    if (valor.length === 0) {
      ocultarSugerencias();
      mangaSeleccionadoInfo.style.display = 'none';
      limpiarFormularioActualizar();
      return;
    }
    
    // Filtrar mangas que contengan el texto
    const mangasFiltrados = Object.keys(mangasDisponibles).filter(nombre => 
      nombre.toLowerCase().includes(valor.toLowerCase())
    );
    
    // Mostrar sugerencias
    mostrarSugerenciasManga(mangasFiltrados, valor);
    
    // Si hay coincidencia exacta, cargar los datos
    if (mangasDisponibles[valor]) {
      cargarDatosMangaActual(valor);
    }
  });
  
  // Mostrar sugerencias de mangas
  function mostrarSugerenciasManga(mangas, textoActual) {
    if (!sugerenciasContainer) {
      sugerenciasContainer = document.createElement('div');
      sugerenciasContainer.className = 'manga-sugerencias';
      sugerenciasContainer.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        width: 100%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
      mangaActualizarInput.parentNode.style.position = 'relative';
      mangaActualizarInput.parentNode.appendChild(sugerenciasContainer);
    }
    
    sugerenciasContainer.innerHTML = '';
    
    if (mangas.length === 0) {
      const noResultados = document.createElement('div');
      noResultados.textContent = 'No se encontraron mangas';
      noResultados.style.cssText = 'padding: 8px; color: #666; font-style: italic;';
      sugerenciasContainer.appendChild(noResultados);
      sugerenciasContainer.style.display = 'block';
      return;
    }
    
    mangas.slice(0, 8).forEach(nombreManga => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        transition: background-color 0.2s;
      `;
      
      // Resaltar el texto coincidente
      const regex = new RegExp(`(${textoActual})`, 'gi');
      const textoResaltado = nombreManga.replace(regex, '<strong>$1</strong>');
      item.innerHTML = textoResaltado;
      
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f0f0f0';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'white';
      });
      
      item.addEventListener('click', () => {
        mangaActualizarInput.value = nombreManga;
        cargarDatosMangaActual(nombreManga);
        ocultarSugerencias();
      });
      
      sugerenciasContainer.appendChild(item);
    });
    
    sugerenciasContainer.style.display = 'block';
  }
  
  // Ocultar sugerencias
  function ocultarSugerencias() {
    if (sugerenciasContainer) {
      sugerenciasContainer.style.display = 'none';
    }
  }
  
  // Cargar datos del manga actual en el formulario
  async function cargarDatosMangaActual(nombreManga) {
    try {
      const snapshot = await get(ref(db, `mangas/${nombreManga}`));
      if (!snapshot.exists()) {
        mangaSeleccionadoInfo.style.display = 'none';
        return;
      }
      
      const datosActuales = snapshot.val();
      
      // Mostrar información del manga seleccionado
      nombreMangaSeleccionado.textContent = nombreManga;
      
      // Mostrar portada actual
      if (datosActuales.portada && portadaActualImg) {
        portadaActualImg.src = datosActuales.portada;
        portadaActualImg.style.display = 'block';
      } else if (portadaActualImg) {
        portadaActualImg.style.display = 'none';
      }
      
      // Mostrar banner actual si existe
      if (datosActuales.banner && bannerActualImg) {
        bannerActualImg.src = datosActuales.banner;
        bannerActualImg.style.display = 'block';
      } else if (bannerActualImg) {
        bannerActualImg.style.display = 'none';
      }
      
      // Prellenar campos del formulario con datos actuales como placeholder
      document.getElementById('nombreMangaActual').placeholder = `Actual: ${nombreManga}`;
      document.getElementById('autorActual').placeholder = `Actual: ${datosActuales.autor || 'No especificado'}`;
      document.getElementById('sinopsisActual').placeholder = `Actual: ${datosActuales.sinopsis ? datosActuales.sinopsis.substring(0, 50) + '...' : 'No especificado'}`;
      document.getElementById('estadoActual').value = '';
      document.getElementById('frecuenciaActual').value = '';
      document.getElementById('fechaLanzamientoActual').value = '';
      
      // Mostrar la información del manga
      mangaSeleccionadoInfo.style.display = 'block';
      
    } catch (error) {
      console.error('Error al cargar datos del manga:', error);
      mangaSeleccionadoInfo.style.display = 'none';
    }
  }
  
  // Limpiar formulario de actualizar
  function limpiarFormularioActualizar() {
    const campos = ['nombreMangaActual', 'autorActual', 'sinopsisActual'];
    campos.forEach(campo => {
      const elemento = document.getElementById(campo);
      if (elemento) {
        elemento.placeholder = '';
        elemento.value = '';
      }
    });
    
    if (portadaActualImg) portadaActualImg.style.display = 'none';
    if (bannerActualImg) bannerActualImg.style.display = 'none';
  }
  
  // Ocultar sugerencias cuando se hace click fuera
  document.addEventListener('click', (e) => {
    if (!mangaActualizarInput.contains(e.target) && 
        (!sugerenciasContainer || !sugerenciasContainer.contains(e.target))) {
      ocultarSugerencias();
    }
  });
  
  // Preview de portada
  nuevaPortadaInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        portadaPreviewImg.src = e.target.result;
        portadaPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      portadaPreview.style.display = 'none';
    }
  });
  
  // Preview de banner
  nuevoBannerInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        bannerPreviewImg.src = e.target.result;
        bannerPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      bannerPreview.style.display = 'none';
    }
  });
  
  // Limpiar formulario de actualizar
  btnLimpiarFormActualizar.addEventListener('click', () => {
    formActualizarManga.reset();
    mangaSeleccionadoInfo.style.display = 'none';
    portadaPreview.style.display = 'none';
    bannerPreview.style.display = 'none';
  });
  
  // Procesar formulario de actualizar manga
  formActualizarManga.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombreMangaOriginal = mangaActualizarInput.value.trim();
    if (!nombreMangaOriginal) {
      alert('Primero selecciona un manga para actualizar');
      return;
    }
    
    try {
      // Verificar que el manga existe
      const snapshot = await get(ref(db, `mangas/${nombreMangaOriginal}`));
      if (!snapshot.exists()) {
        alert('El manga seleccionado no existe');
        return;
      }
      
      const datosActuales = snapshot.val();
      const datosActualizados = { ...datosActuales };
      
      // Actualizar campos de texto si tienen valor
      const nuevoNombre = document.getElementById('nombreMangaActual').value.trim();
      const nuevoAutor = document.getElementById('autorActual').value.trim();
      const nuevaSinopsis = document.getElementById('sinopsisActual').value.trim();
      const nuevoEstado = document.getElementById('estadoActual').value;
      const nuevaFrecuencia = document.getElementById('frecuenciaActual').value;
      const nuevaFecha = document.getElementById('fechaLanzamientoActual').value;
      
      if (nuevoAutor) datosActualizados.autor = nuevoAutor;
      if (nuevaSinopsis) datosActualizados.sinopsis = nuevaSinopsis;
      if (nuevoEstado) datosActualizados.estado = nuevoEstado;
      if (nuevaFrecuencia) datosActualizados.frecuencia = nuevaFrecuencia;
      if (nuevaFecha) datosActualizados.fechaLanzamiento = nuevaFecha;
      
      // Subir nueva portada si se seleccionó
      if (nuevaPortadaInput.files.length > 0) {
        const rutaPortada = document.getElementById('rutaPortadaActual').value.trim() || `mangas/${nombreMangaOriginal}/portada`;
        const urlPortada = await subirImagenCloudinary(nuevaPortadaInput.files[0], rutaPortada);
        datosActualizados.portada = urlPortada;
      }
      
      // Subir nuevo banner si se seleccionó
      if (nuevoBannerInput.files.length > 0) {
        const rutaBanner = document.getElementById('rutaBannerActual').value.trim() || `mangas/${nombreMangaOriginal}/banner`;
        const urlBanner = await subirImagenCloudinary(nuevoBannerInput.files[0], rutaBanner);
        datosActualizados.banner = urlBanner;
      }
      
      // Si se cambió el nombre, necesitamos mover el manga a una nueva clave
      if (nuevoNombre && nuevoNombre !== nombreMangaOriginal) {
        const claveNueva = nuevoNombre
          .replace(/[^A-Za-z0-9\sáéíóúÁÉÍÓÚñÑüÜ.,;:¡!¿?'"()\-]/g, "")
          .trim();
        
        // Verificar que la nueva clave no exista
        const snapshotNuevo = await get(ref(db, `mangas/${claveNueva}`));
        if (snapshotNuevo.exists()) {
          alert(`Ya existe un manga con el nombre "${claveNueva}"`);
          return;
        }
        
        // Crear el manga con el nuevo nombre
        await set(ref(db, `mangas/${claveNueva}`), datosActualizados);
        
        // Eliminar el manga antiguo
        await remove(ref(db, `mangas/${nombreMangaOriginal}`));
        
        // También mover los comentarios si existen
        const comentariosSnapshot = await get(ref(db, `comentarios/${nombreMangaOriginal}`));
        if (comentariosSnapshot.exists()) {
          await set(ref(db, `comentarios/${claveNueva}`), comentariosSnapshot.val());
          await remove(ref(db, `comentarios/${nombreMangaOriginal}`));
        }
        
        alert(`Manga actualizado correctamente. Nuevo nombre: "${claveNueva}"`);
      } else {
        // Solo actualizar los datos existentes
        await update(ref(db, `mangas/${nombreMangaOriginal}`), datosActualizados);
        alert('Manga actualizado correctamente');
      }
      
      // Limpiar formulario y recargar listas
      formActualizarManga.reset();
      mangaSeleccionadoInfo.style.display = 'none';
      portadaPreview.style.display = 'none';
      bannerPreview.style.display = 'none';
      cargarMangasEnDatalist();
      cargarMangasActualizar();
      
    } catch (error) {
      console.error('Error al actualizar manga:', error);
      alert('Error al actualizar manga: ' + error.message);
    }
  });
  
  // Llamar a cargar mangas de actualizar cuando se inicialice
  if (btnActualizarManga) {
    btnActualizarManga.addEventListener('click', () => {
      cargarMangasActualizar();
    });
  }

  // ==============================
  // MODAL PARA PERFIL Y BANNER
  // ==============================
  
  // Referencias para el modal de imágenes
  const profileBannerModal = new bootstrap.Modal(document.getElementById('profileBannerModal'));
  const modalTitle = document.getElementById('modalTitle');
  const imageUrlInput = document.getElementById('imageUrl');
  const imageFileInput = document.getElementById('imageFile');
  const imagePreview = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');
  const saveImageBtn = document.getElementById('saveImageBtn');
  
  let currentImageType = null; // 'profile' o 'banner'
  
  // Función para abrir modal de perfil
  window.openProfileModal = function() {
    currentImageType = 'profile';
    modalTitle.textContent = 'Cambiar Imagen de Perfil';
    resetModal();
    profileBannerModal.show();
  };
  
  // Función para abrir modal de banner
  window.openBannerModal = function() {
    currentImageType = 'banner';
    modalTitle.textContent = 'Cambiar Banner';
    resetModal();
    profileBannerModal.show();
  };
  
  // Función para resetear el modal
  function resetModal() {
    imageUrlInput.value = '';
    imageFileInput.value = '';
    imagePreview.style.display = 'none';
    previewImage.src = '';
  }
  
  // Preview de imagen desde URL
  imageUrlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      previewImage.src = url;
      imagePreview.style.display = 'block';
      // Limpiar input de archivo si hay URL
      imageFileInput.value = '';
    } else {
      imagePreview.style.display = 'none';
    }
  });
  
  // Preview de imagen desde archivo
  imageFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        imagePreview.style.display = 'block';
        // Limpiar input de URL si hay archivo
        imageUrlInput.value = '';
      };
      reader.readAsDataURL(file);
    } else {
      imagePreview.style.display = 'none';
    }
  });
  
  // Guardar imagen (perfil o banner)
  saveImageBtn.addEventListener('click', async () => {
    try {
      let imageUrl = '';
      
      // Determinar si usar URL o archivo
      if (imageUrlInput.value.trim()) {
        imageUrl = imageUrlInput.value.trim();
      } else if (imageFileInput.files.length > 0) {
        // Convertir archivo a base64 para almacenamiento directo
        const file = imageFileInput.files[0];
        imageUrl = await convertToBase64(file);
      } else {
        alert('Por favor, proporciona una URL o selecciona un archivo');
        return;
      }
      
      // Guardar en Firebase
      const user = auth.currentUser;
      if (!user) {
        alert('Usuario no autenticado');
        return;
      }
      
      const updateData = {};
      if (currentImageType === 'profile') {
        updateData.profileImage = imageUrl;
      } else if (currentImageType === 'banner') {
        updateData.bannerImage = imageUrl;
      }
      
      await update(ref(db, `users/${user.uid}`), updateData);
      
      // Actualizar la imagen en la interfaz
      updateUIImage(currentImageType, imageUrl);
      
      alert(`${currentImageType === 'profile' ? 'Imagen de perfil' : 'Banner'} actualizado correctamente`);
      profileBannerModal.hide();
      
    } catch (error) {
      console.error('Error al guardar imagen:', error);
      alert('Error al guardar la imagen: ' + error.message);
    }
  });
  
  // Función para convertir archivo a base64
  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
  
  // Función para actualizar la imagen en la UI
  function updateUIImage(type, imageUrl) {
    if (type === 'profile') {
      const profileImg = document.querySelector('.profile-image');
      if (profileImg) {
        profileImg.src = imageUrl;
      }
    } else if (type === 'banner') {
      const bannerImg = document.querySelector('.banner-image');
      if (bannerImg) {
        bannerImg.src = imageUrl;
      }
      const bannerContainer = document.querySelector('.profile-banner');
      if (bannerContainer) {
        bannerContainer.style.backgroundImage = `url(${imageUrl})`;
      }
    }
  }
  
  // Función para cargar imágenes existentes del usuario
  async function loadUserImages() {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const snapshot = await get(ref(db, `users/${user.uid}`));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        if (userData.profileImage) {
          updateUIImage('profile', userData.profileImage);
        }
        
        if (userData.bannerImage) {
          updateUIImage('banner', userData.bannerImage);
        }
      }
    } catch (error) {
      console.error('Error al cargar imágenes del usuario:', error);
    }
  }
  
  onAuthStateChanged(auth, (user) => {
    if (user && user.uid === adminUID) {
      loadUserImages();
    }
  });
  
  // También actualizar el formNuevoManga para incluir banner
  const bannerMangaInput = document.getElementById('bannerManga');
  const rutaBannerMangaInput = document.getElementById('rutaBannerManga');
  
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
    const rutaBannerManga = document.getElementById("rutaBannerManga")?.value.trim() || "";

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
      
      // Agregar banner si se seleccionó
      if (bannerMangaInput && bannerMangaInput.files.length > 0) {
        const urlBanner = await subirImagenCloudinary(bannerMangaInput.files[0], rutaBannerManga || `mangas/${nombreManga}/banner`);
        mangaData.banner = urlBanner;
      }

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

}
