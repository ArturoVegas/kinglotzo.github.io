

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

// OPTIMIZADOR AUTOMÁTICO DE IMÁGENES
import { subirImagenOptimizada, showOptimizedPreview } from './image-optimizer.js';

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
  const eliminarContenidoSection = document.getElementById("eliminarContenidoSection");
  
  const datalistNovelas = document.getElementById("listaNovelas");
  const datalistNovelasCapitulo = document.getElementById("listaNovelasCapitulo");
  const datalistNovelasVolumen = document.getElementById("listaNovelasVolumen");

  // Secciones de novelas
  const nuevaNovelaSection = document.getElementById("nuevaNovelaSection");
  const subirCapituloNovelaSection = document.getElementById("subirCapituloNovelaSection");
  const subirVolumenNovelaSection = document.getElementById("subirVolumenNovelaSection");

  const btnNuevoManga = document.getElementById("btnNuevoManga");
  const btnSubirCapitulo = document.getElementById("btnSubirCapitulo");
  const btnActualizarManga = document.getElementById("btnActualizarManga");
  const btnGestionNoticias = document.getElementById("btnGestionNoticias");
  const btnEliminarContenido = document.getElementById("btnEliminarContenido");
  
  // Botones de novelas
  const btnNuevaNovela = document.getElementById("btnNuevaNovela");
  const btnSubirCapituloNovela = document.getElementById("btnSubirCapituloNovela");
  const btnSubirVolumenNovela = document.getElementById("btnSubirVolumenNovela");
  
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
  if (!user) {
    alert("No autenticado. Redirigiendo a inicio de sesión.");
    window.location.href = "auth.html";
    return;
  }

  try {
    // Leer rol desde la base de datos
    const rolSnap = await get(ref(db, `usuarios/${user.uid}/rol`));
    const rol = rolSnap.exists() ? rolSnap.val() : null;

    if (rol !== "admin") {
      alert("Acceso denegado. Solo administradores pueden ingresar.");
      window.location.href = "auth.html";
      return;
    }

    // Usuario autenticado y es admin → continuar
    mostrarSeccion("nuevoMangaSection");
    cargarMangasEnDatalist();
    cargarNoticias();
    cargarCarrusel();
    cargarNovelasEnDatalist();

  } catch (error) {
    console.error("Error al verificar rol:", error);
    alert("Error al verificar permisos.");
    window.location.href = "auth.html";
  }
});

  // ==============================
  // NAVEGACIÓN ENTRE SECCIONES
  // ==============================
  function mostrarSeccion(nombre) {
    // Ocultar todas las secciones
    nuevoMangaSection.classList.add("d-none");
    subirCapituloSection.classList.add("d-none");
    actualizarMangaSection.classList.add("d-none");
    gestionNoticiasSection.classList.add("d-none");
    
    // Secciones de novelas
    if (nuevaNovelaSection) nuevaNovelaSection.classList.add("d-none");
    if (subirCapituloNovelaSection) subirCapituloNovelaSection.classList.add("d-none");
    if (subirVolumenNovelaSection) subirVolumenNovelaSection.classList.add("d-none");
    if (eliminarContenidoSection) eliminarContenidoSection.classList.add("d-none");

    // Mostrar la sección seleccionada
    const seccionActiva = document.getElementById(nombre);
    if (seccionActiva) {
      seccionActiva.classList.remove("d-none");
    }
  }

  btnNuevoManga.addEventListener("click", () => mostrarSeccion("nuevoMangaSection"));
  btnSubirCapitulo.addEventListener("click", () => mostrarSeccion("subirCapituloSection"));
  btnActualizarManga.addEventListener("click", () => mostrarSeccion("actualizarMangaSection"));
  btnGestionNoticias.addEventListener("click", () => mostrarSeccion("gestionNoticiasSection"));
  if (btnEliminarContenido) btnEliminarContenido.addEventListener("click", () => mostrarSeccion("eliminarContenidoSection"));
  
  // Event listeners para botones de novelas
  if (btnNuevaNovela) btnNuevaNovela.addEventListener("click", () => mostrarSeccion("nuevaNovelaSection"));
  if (btnSubirCapituloNovela) btnSubirCapituloNovela.addEventListener("click", () => mostrarSeccion("subirCapituloNovelaSection"));
  if (btnSubirVolumenNovela) btnSubirVolumenNovela.addEventListener("click", () => mostrarSeccion("subirVolumenNovelaSection"));

  // Botón para abrir el editor avanzado de novelas
  const btnAbrirEditor = document.getElementById("btnAbrirEditor");
  if (btnAbrirEditor) {
    btnAbrirEditor.addEventListener("click", () => {
      window.open("editor-novela.html", "_blank");
    });
  }

  btnLogout.addEventListener("click", () => {
    signOut(auth).then(() => {
      localStorage.removeItem('rememberUser');
      localStorage.removeItem('userEmail');
      window.location.href = "auth.html";
    });
  });


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
  // FUNCIONES DE CLOUDINARY CON OPTIMIZACIÓN MÓVIL
  // ==============================
  
  // FUNCIÓN ORIGINAL MANTENIDA COMO FALLBACK
  async function subirImagenCloudinaryOriginal(file, folder) {
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

  // NUEVA FUNCIÓN CON OPTIMIZACIÓN AUTOMÁTICA
  async function subirImagenCloudinary(file, folder) {
    try {
      // Usar optimizador automático móvil-friendly
      return await subirImagenOptimizada(file, folder);
    } catch (error) {
      console.warn('Error en optimización, usando método original:', error);
      // Fallback a método original si falla
      return await subirImagenCloudinaryOriginal(file, folder);
    }
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
    const noticias = snapshot.exists() ? snapshot.val() : {};

    listaNoticias.innerHTML = "";

    Object.entries(noticias).forEach(([id, noticia]) => {
      const li = document.createElement("li");
      li.classList.add("list-group-item", "bg-dark", "text-light", "d-flex", "justify-content-between", "align-items-center");

      const contenido = document.createElement("div");

      // Texto noticia
      const texto = document.createElement("p");
      texto.textContent = noticia.texto || "Sin texto";
      contenido.appendChild(texto);

      // Imagen noticia (si existe)
      if (noticia.imagen) {
        const img = document.createElement("img");
        img.src = noticia.imagen;
        img.alt = "Imagen noticia";
        img.style.maxWidth = "150px";
        img.style.marginTop = "5px";
        contenido.appendChild(img);
      }

      li.appendChild(contenido);

      // Botón eliminar
      const btnEliminar = document.createElement("button");
      btnEliminar.classList.add("btn", "btn-sm", "btn-danger");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.onclick = async () => {
        if (confirm("¿Seguro que quieres eliminar esta noticia?")) {
          try {
            await remove(ref(db, `noticias/${id}`));
            cargarNoticias();
          } catch (error) {
            console.error("Error eliminando noticia:", error);
          }
        }
      };

      li.appendChild(btnEliminar);

      listaNoticias.appendChild(li);
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
    const carrusel = snapshot.exists() ? snapshot.val() : {};

    listaCarrusel.innerHTML = "";

    Object.entries(carrusel).forEach(([id, item]) => {
      const li = document.createElement("li");
      li.classList.add("list-group-item", "bg-dark", "text-light", "d-flex", "justify-content-between", "align-items-center");

      const contenido = document.createElement("div");

      // Título y descripción
      const titulo = document.createElement("strong");
      titulo.textContent = item.titulo || "Sin título";
      contenido.appendChild(titulo);

      if (item.descripcion) {
        const desc = document.createElement("p");
        desc.textContent = item.descripcion;
        contenido.appendChild(desc);
      }

      // Imagen carrusel (si existe)
      if (item.imagen) {
        const img = document.createElement("img");
        img.src = item.imagen;
        img.alt = "Imagen carrusel";
        img.style.maxWidth = "150px";
        img.style.marginTop = "5px";
        contenido.appendChild(img);
      }

      li.appendChild(contenido);

      // Botón eliminar
      const btnEliminar = document.createElement("button");
      btnEliminar.classList.add("btn", "btn-sm", "btn-danger");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.onclick = async () => {
        if (confirm("¿Seguro que quieres eliminar esta imagen del carrusel?")) {
          try {
            await remove(ref(db, `carrusel/${id}`));
            cargarCarrusel();
          } catch (error) {
            console.error("Error eliminando carrusel:", error);
          }
        }
      };

      li.appendChild(btnEliminar);

      listaCarrusel.appendChild(li);
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
  
  // Referencias para el modal de imágenes (solo si existe el elemento)
  const profileBannerModalElement = document.getElementById('profileBannerModal');
  let profileBannerModal = null;
  if (profileBannerModalElement) {
    profileBannerModal = new bootstrap.Modal(profileBannerModalElement);
  }
  const modalTitle = document.getElementById('modalTitle');
  const imageUrlInput = document.getElementById('imageUrl');
  const imageFileInput = document.getElementById('imageFile');
  const imagePreview = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');
  const saveImageBtn = document.getElementById('saveImageBtn');
  
  let currentImageType = null; // 'profile' o 'banner'
  
  // Función para abrir modal de perfil
  window.openProfileModal = function() {
    if (profileBannerModal && modalTitle) {
      currentImageType = 'profile';
      modalTitle.textContent = 'Cambiar Imagen de Perfil';
      resetModal();
      profileBannerModal.show();
    }
  };
  
  // Función para abrir modal de banner
  window.openBannerModal = function() {
    if (profileBannerModal && modalTitle) {
      currentImageType = 'banner';
      modalTitle.textContent = 'Cambiar Banner';
      resetModal();
      profileBannerModal.show();
    }
  };
  
  // Función para resetear el modal
  function resetModal() {
    if (imageUrlInput) imageUrlInput.value = '';
    if (imageFileInput) imageFileInput.value = '';
    if (imagePreview) imagePreview.style.display = 'none';
    if (previewImage) previewImage.src = '';
  }
  
  // Preview de imagen desde URL (solo si existe el elemento)
  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        if (previewImage) previewImage.src = url;
        if (imagePreview) imagePreview.style.display = 'block';
        // Limpiar input de archivo si hay URL
        if (imageFileInput) imageFileInput.value = '';
      } else {
        if (imagePreview) imagePreview.style.display = 'none';
      }
    });
  }
  
  // Preview de imagen desde archivo (solo si existe el elemento)
  if (imageFileInput) {
    imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (previewImage) previewImage.src = e.target.result;
          if (imagePreview) imagePreview.style.display = 'block';
          // Limpiar input de URL si hay archivo
          if (imageUrlInput) imageUrlInput.value = '';
        };
        reader.readAsDataURL(file);
      } else {
        if (imagePreview) imagePreview.style.display = 'none';
      }
    });
  }
  
  // Guardar imagen (perfil o banner) - solo si existe el botón
  if (saveImageBtn) {
    saveImageBtn.addEventListener('click', async () => {
    try {
      let imageUrl = '';
      
      // Determinar si usar URL o archivo
      if (imageUrlInput && imageUrlInput.value.trim()) {
        imageUrl = imageUrlInput.value.trim();
      } else if (imageFileInput && imageFileInput.files.length > 0) {
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
  }
  
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
  
  // Cargar imágenes del usuario solo si está autenticado y es admin
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Solo intentar cargar imágenes si el usuario tiene rol de admin
      get(ref(db, `usuarios/${user.uid}/rol`)).then(rolSnap => {
        if (rolSnap.exists() && rolSnap.val() === 'admin') {
          loadUserImages();
        }
      }).catch(error => {
        console.error('Error verificando rol para imágenes:', error);
      });
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

  // ==============================
  // FUNCIONES DE NOVELAS
  // ==============================

  async function cargarNovelasEnDatalist() {
    try {
      const snapshot = await get(ref(db, 'novelas'));
      if (datalistNovelas) datalistNovelas.innerHTML = "";
      if (datalistNovelasCapitulo) datalistNovelasCapitulo.innerHTML = "";
      if (datalistNovelasVolumen) datalistNovelasVolumen.innerHTML = "";
      
      if (snapshot.exists()) {
        const novelas = snapshot.val();
        Object.keys(novelas).forEach(nombre => {
          const option = document.createElement("option");
          option.value = nombre;
          if (datalistNovelas) datalistNovelas.appendChild(option.cloneNode(true));
          if (datalistNovelasCapitulo) datalistNovelasCapitulo.appendChild(option.cloneNode(true));
          if (datalistNovelasVolumen) datalistNovelasVolumen.appendChild(option.cloneNode(true));
        });
      }
    } catch (err) {
      console.error("Error al cargar novelas:", err);
    }
  }
  
  // Formulario para nueva novela
  const formNuevaNovela = document.getElementById('formNuevaNovela');
  if (formNuevaNovela) {
    formNuevaNovela.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const nombreNovela = document.getElementById('nombreNovela').value.trim();
      const portadaInput = document.getElementById('portadaNovela');
      const sinopsis = document.getElementById('sinopsisNovela').value.trim();
      const autor = document.getElementById('autorNovela').value.trim();
      const generos = generosSeleccionados; // Reutilizamos la lógica de géneros
      const estado = document.getElementById('estadoNovela').value;
      const frecuencia = document.getElementById('frecuenciaNovela').value;
      const fechaLanzamiento = document.getElementById('fechaLanzamientoNovela').value;
      
      if (!nombreNovela || !portadaInput || portadaInput.files.length === 0) {
        alert('Nombre y portada son obligatorios.');
        return;
      }
  
      try {
        const snapshot = await get(ref(db, `novelas/${nombreNovela}`));
        if (snapshot.exists()) {
          alert(`La novela "${nombreNovela}" ya existe.`);
          return;
        }
  
        const urlPortada = await subirImagenCloudinary(portadaInput.files[0], `novelas/${nombreNovela}`);
  
        const novelaData = {
          portada: urlPortada,
          sinopsis,
          autor,
          generos,
          estado,
          frecuencia,
          fechaLanzamiento,
          capitulos: {},
          volumenes: {},
          visitas: 0,
          tipo: 'novela'
        };
  
        await set(ref(db, `novelas/${nombreNovela}`), novelaData);
        alert('Novela guardada correctamente.');
        formNuevaNovela.reset();
        cargarNovelasEnDatalist();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al subir imagen o guardar novela: ' + error.message);
      }
    });
  }
  
  // Formulario para subir capítulo de novela
  const formSubirCapituloNovela = document.getElementById('formSubirCapituloNovela');
  if (formSubirCapituloNovela) {
    const editor = document.getElementById('editorCapitulo');
    const preview = document.getElementById('previewCapitulo');
    const imagenCapituloNovela = document.getElementById('imagenCapituloNovela');
    const enlaceImagenGenerado = document.getElementById('enlaceImagenGenerado');
  
    // Actualizar preview
    if (editor && preview) {
      editor.addEventListener('input', () => {
        preview.innerHTML = editor.value;
      });
    }
  
    // Subir imagen y mostrar enlace
    if (imagenCapituloNovela && enlaceImagenGenerado) {
      imagenCapituloNovela.addEventListener('change', async () => {
        if (imagenCapituloNovela.files.length > 0) {
          try {
            const url = await subirImagenCloudinary(imagenCapituloNovela.files[0], 'novelas/capitulos');
            enlaceImagenGenerado.value = url;
            alert('Enlace de la imagen copiado al portapapeles.');
            navigator.clipboard.writeText(url);
          } catch (error) {
            alert('Error al subir la imagen.');
          }
        }
      });
    }
  
    formSubirCapituloNovela.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const nombreNovela = document.getElementById('novelaseleccionada').value.trim();
      const numeroCapitulo = document.getElementById('numeroCapituloNovela').value.trim();
      const contenido = editor ? editor.value : '';
  
      if (!nombreNovela || !numeroCapitulo || !contenido) {
        alert('Completa todos los campos.');
        return;
      }
  
      try {
        await set(ref(db, `novelas/${nombreNovela}/capitulos/${numeroCapitulo}`), {
          fecha: new Date().toISOString(),
          contenido: contenido
        });
        alert('Capítulo de novela subido con éxito.');
        formSubirCapituloNovela.reset();
        if (preview) preview.innerHTML = '';
      } catch (error) {
        alert('Error guardando el capítulo: ' + error.message);
      }
    });
  }
  
  // Formulario para subir volumen de novela
  const formSubirVolumenNovela = document.getElementById('formSubirVolumenNovela');
  if (formSubirVolumenNovela) {
    formSubirVolumenNovela.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const nombreNovela = document.getElementById('novelaseleccionadaVolumen').value.trim();
      const numeroVolumen = document.getElementById('numeroVolumenNovela').value.trim();
      const enlaceMediafire = document.getElementById('enlaceVolumen').value.trim();
  
      if (!nombreNovela || !numeroVolumen || !enlaceMediafire) {
        alert('Completa todos los campos.');
        return;
      }
  
      try {
        await set(ref(db, `novelas/${nombreNovela}/volumenes/${numeroVolumen}`), {
          fecha: new Date().toISOString(),
          enlace: enlaceMediafire
        });
        alert('Volumen de novela subido con éxito.');
        formSubirVolumenNovela.reset();
      } catch (error) {
        alert('Error guardando el volumen: ' + error.message);
      }
    });
  }

  // ==============================
  // FUNCIONALIDAD DE ELIMINACIÓN DE CONTENIDO
  // ==============================
  
  // Referencias DOM para eliminación
  const radioManga = document.getElementById('radioManga');
  const radioNovela = document.getElementById('radioNovela');
  const contenidoAEliminarInput = document.getElementById('contenidoAEliminar');
  const listaContenidoEliminar = document.getElementById('listaContenidoEliminar');
  const contenidoSeleccionadoInfo = document.getElementById('contenidoSeleccionadoInfo');
  const nombreContenidoSeleccionado = document.getElementById('nombreContenidoSeleccionado');
  const tipoContenidoSeleccionado = document.getElementById('tipoContenidoSeleccionado');
  const capitulosContenidoSeleccionado = document.getElementById('capitulosContenidoSeleccionado');
  const portadaContenidoSeleccionado = document.getElementById('portadaContenidoSeleccionado');
  const confirmarEliminacionCheck = document.getElementById('confirmarEliminacion');
  const confirmacionTextoInput = document.getElementById('confirmacionTexto');
  const btnEliminarContenidoAccion = document.getElementById('btnEliminarContenidoAccion');
  const btnCancelarEliminacion = document.getElementById('btnCancelarEliminacion');
  
  let contenidoSeleccionadoData = null;
  let tipoContenidoActual = 'manga';
  let listaContenidoCompleta = []; // Para almacenar todos los datos del contenido
  let contenedorAutocompleteEliminar = null; // Para el autocompletado visual
  
  // Cargar contenido según el tipo seleccionado
  async function cargarContenidoPorTipo(tipo) {
    try {
      const snapshot = await get(ref(db, tipo === 'manga' ? 'mangas' : 'novelas'));
      listaContenidoEliminar.innerHTML = '';
      listaContenidoCompleta = []; // Limpiar lista anterior
      
      if (snapshot.exists()) {
        const contenido = snapshot.val();
        
        // Llenar datalist (para compatibilidad) y lista completa
        Object.keys(contenido).forEach(nombre => {
          const option = document.createElement('option');
          option.value = nombre;
          listaContenidoEliminar.appendChild(option);
          
          // Guardar datos completos para autocompletado visual
          const datosContenido = contenido[nombre];
          listaContenidoCompleta.push({
            nombre: nombre,
            titulo: datosContenido.titulo || nombre.replaceAll("_", " "),
            portada: datosContenido.portada || '',
            estado: datosContenido.estado || 'ongoing',
            generos: datosContenido.generos || [],
            tipo: tipo,
            numCapitulos: datosContenido.capitulos ? Object.keys(datosContenido.capitulos).length : 0
          });
        });
      }
      
      console.log(`📚 Cargados ${listaContenidoCompleta.length} ${tipo}s para eliminación`);
    } catch (error) {
      console.error(`Error al cargar ${tipo}s:`, error);
    }
  }
  
  // Eventos de radio buttons para cambiar tipo
  if (radioManga && radioNovela) {
    radioManga.addEventListener('change', () => {
      if (radioManga.checked) {
        tipoContenidoActual = 'manga';
        cargarContenidoPorTipo('manga');
        resetearFormularioEliminacion();
      }
    });
    
    radioNovela.addEventListener('change', () => {
      if (radioNovela.checked) {
        tipoContenidoActual = 'novela';
        cargarContenidoPorTipo('novela');
        resetearFormularioEliminacion();
      }
    });
  }
  
  // Cargar datos del contenido seleccionado con autocompletado
  if (contenidoAEliminarInput) {
    let clickEnSugerencia = false;

    contenidoAEliminarInput.addEventListener('input', () => {
      const valor = contenidoAEliminarInput.value.trim().toLowerCase();
      
      if (!valor) {
        ocultarSugerenciasEliminar();
        contenidoSeleccionadoInfo.style.display = 'none';
        contenidoSeleccionadoData = null;
        validarFormularioEliminacion();
        return;
      }

      const filtrados = listaContenidoCompleta.filter(item =>
        item.titulo.toLowerCase().includes(valor)
      ).slice(0, 5); // Mostrar hasta 5 sugerencias

      mostrarSugerenciasEliminar(filtrados);
    });

    contenidoAEliminarInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (!clickEnSugerencia) {
          ocultarSugerenciasEliminar();
        }
        clickEnSugerencia = false;
      }, 150);
    });

    // --- Funciones de autocompletado anidadas para compartir el scope ---

    function mostrarSugerenciasEliminar(items) {
      if (!contenedorAutocompleteEliminar) {
        contenedorAutocompleteEliminar = document.createElement('ul');
        contenedorAutocompleteEliminar.classList.add('autocomplete-list');
        contenidoAEliminarInput.parentNode.style.position = 'relative';
        contenidoAEliminarInput.parentNode.appendChild(contenedorAutocompleteEliminar);
      }
      
      contenedorAutocompleteEliminar.innerHTML = '';
      
      if (items.length === 0) {
        contenedorAutocompleteEliminar.innerHTML = `<li class="autocomplete-no-results">No se encontraron resultados</li>`;
      } else {
        items.forEach(item => {
          const li = document.createElement('li');
          li.classList.add('autocomplete-item');
          
          const imagenSrc = item.portada || 'https://via.placeholder.com/50x70/333/fff?text=' + item.tipo.toUpperCase();
          const generosTexto = item.generos.length > 0 ? item.generos.slice(0, 2).join(', ') : 'Sin géneros';
          
          li.innerHTML = `
            <img src="${imagenSrc}" alt="${item.titulo}" class="autocomplete-item-image" onerror="this.src='https://via.placeholder.com/40x55/333/fff?text=${item.tipo.toUpperCase()}'" />
            <div class="autocomplete-item-content">
              <span class="autocomplete-item-title" title="${item.titulo}">${item.titulo}</span>
              <div class="autocomplete-item-details">
                <span class="badge bg-primary">${item.tipo.toUpperCase()}</span>
                <span>${item.numCapitulos} caps</span>
                <span>${generosTexto}</span>
              </div>
            </div>
          `;
          
          li.addEventListener('mousedown', (e) => {
            e.preventDefault();
            clickEnSugerencia = true;
            contenidoAEliminarInput.value = item.nombre;
            cargarDatosContenidoSeleccionado(item);
            ocultarSugerenciasEliminar();
          });
          
          contenedorAutocompleteEliminar.appendChild(li);
        });
      }
      
      contenedorAutocompleteEliminar.style.display = 'block';
    }

    function ocultarSugerenciasEliminar() {
      if (contenedorAutocompleteEliminar) {
        contenedorAutocompleteEliminar.style.display = 'none';
      }
    }

    async function cargarDatosContenidoSeleccionado(item) {
      const ruta = item.tipo === 'manga' ? 'mangas' : 'novelas';
      const snapshot = await get(ref(db, `${ruta}/${item.nombre}`)).catch(err => {
        console.error('Error al cargar datos del contenido:', err);
        contenidoSeleccionadoInfo.style.display = 'none';
        contenidoSeleccionadoData = null;
        validarFormularioEliminacion();
      });

      if (snapshot && snapshot.exists()) {
        contenidoSeleccionadoData = { nombre: item.nombre, tipo: item.tipo, datos: snapshot.val() };
        nombreContenidoSeleccionado.textContent = item.titulo;
        tipoContenidoSeleccionado.textContent = item.tipo.toUpperCase();
        capitulosContenidoSeleccionado.textContent = item.numCapitulos;
        portadaContenidoSeleccionado.src = item.portada || '';
        portadaContenidoSeleccionado.style.display = item.portada ? 'block' : 'none';
        contenidoSeleccionadoInfo.style.display = 'block';
      } else {
        contenidoSeleccionadoInfo.style.display = 'none';
        contenidoSeleccionadoData = null;
      }
      validarFormularioEliminacion();
    }

    document.addEventListener('click', (e) => {
      if (!contenidoAEliminarInput.contains(e.target) && 
          (!contenedorAutocompleteEliminar || !contenedorAutocompleteEliminar.contains(e.target))) {
        ocultarSugerenciasEliminar();
      }
    });
  }
  
  // Validar formulario de eliminación
  function validarFormularioEliminacion() {
    const tieneContenido = contenidoSeleccionadoData !== null;
    const checkboxMarcado = confirmarEliminacionCheck?.checked || false;
    const textoConfirmacion = confirmacionTextoInput?.value.trim().toUpperCase() === 'ELIMINAR';
    
    const formularioValido = tieneContenido && checkboxMarcado && textoConfirmacion;
    
    if (btnEliminarContenidoAccion) {
      btnEliminarContenidoAccion.disabled = !formularioValido;
    }
  }
  
  // Event listeners para validación
  if (confirmarEliminacionCheck) {
    confirmarEliminacionCheck.addEventListener('change', validarFormularioEliminacion);
  }
  
  if (confirmacionTextoInput) {
    confirmacionTextoInput.addEventListener('input', validarFormularioEliminacion);
  }
  
  // Resetear formulario de eliminación
  function resetearFormularioEliminacion() {
    if (contenidoAEliminarInput) contenidoAEliminarInput.value = '';
    if (confirmarEliminacionCheck) confirmarEliminacionCheck.checked = false;
    if (confirmacionTextoInput) confirmacionTextoInput.value = '';
    if (contenidoSeleccionadoInfo) contenidoSeleccionadoInfo.style.display = 'none';
    contenidoSeleccionadoData = null;
    validarFormularioEliminacion();
  }
  
  // Función principal de eliminación
  async function eliminarContenido() {
    if (!contenidoSeleccionadoData) {
      return;
    }
    
    const { nombre, tipo } = contenidoSeleccionadoData;
    
    // Confirmación final
    const confirmacionFinal = confirm(
      `⚠️ ÚLTIMA CONFIRMACIÓN ⚠️\n\n` +
      `¿Estás COMPLETAMENTE SEGURO de que quieres eliminar "${nombre}"?\n\n` +
      `Esta acción es IRREVERSIBLE y eliminará:\n` +
      `• Toda la información del ${tipo}\n` +
      `• Todos los capítulos y contenido asociado\n` +
      `• Todos los comentarios\n` +
      `• Datos de visitas y estadísticas\n\n` +
      `Escribe "SÍ, ELIMINAR" en la siguiente ventana si estás seguro.`
    );
    
    if (!confirmacionFinal) {
      return;
    }
    
    const confirmacionTextoFinal = prompt(
      `Para confirmar la eliminación de "${nombre}", escribe exactamente:\nSÍ, ELIMINAR`
    );
    
    if (confirmacionTextoFinal !== 'SÍ, ELIMINAR') {
      alert('Confirmación incorrecta. Eliminación cancelada.');
      return;
    }
    
    try {
      // Mostrar indicador de carga
      if (btnEliminarContenidoAccion) {
        btnEliminarContenidoAccion.disabled = true;
        btnEliminarContenidoAccion.innerHTML = '<i class="bi bi-hourglass-split"></i> Eliminando...';
      }
      
      const ruta = tipo === 'manga' ? 'mangas' : 'novelas';
      
      // Eliminar el contenido principal
      await remove(ref(db, `${ruta}/${nombre}`));
      
      // Eliminar comentarios asociados
      try {
        await remove(ref(db, `comentarios/${nombre}`));
      } catch (error) {
        console.warn('No se pudieron eliminar los comentarios o no existían:', error);
      }
      
      // Eliminar de favoritos de usuarios (si existe esa funcionalidad)
      try {
        const usuariosSnapshot = await get(ref(db, 'usuarios'));
        if (usuariosSnapshot.exists()) {
          const usuarios = usuariosSnapshot.val();
          const promesasEliminacion = [];
          
          Object.keys(usuarios).forEach(uid => {
            if (usuarios[uid].favoritos && usuarios[uid].favoritos[nombre]) {
              promesasEliminacion.push(
                remove(ref(db, `usuarios/${uid}/favoritos/${nombre}`))
              );
            }
          });
          
          if (promesasEliminacion.length > 0) {
            await Promise.all(promesasEliminacion);
          }
        }
      } catch (error) {
        console.warn('Error al eliminar de favoritos:', error);
      }
      
      alert(`✅ "${nombre}" ha sido eliminado completamente del sistema.`);
      
      // Resetear formulario y recargar listas
      resetearFormularioEliminacion();
      cargarContenidoPorTipo(tipoContenidoActual);
      cargarMangasEnDatalist();
      cargarNovelasEnDatalist();
      
    } catch (error) {
      console.error('Error al eliminar contenido:', error);
      alert(`❌ Error al eliminar "${nombre}": ${error.message}`);
    } finally {
      // Restaurar botón
      if (btnEliminarContenidoAccion) {
        btnEliminarContenidoAccion.disabled = false;
        btnEliminarContenidoAccion.innerHTML = '<i class="bi bi-trash-fill"></i> Eliminar Contenido';
      }
    }
  }
  
  // Event listeners para botones de eliminación
  if (btnEliminarContenidoAccion) {
    btnEliminarContenidoAccion.addEventListener('click', eliminarContenido);
  }
  
  if (btnCancelarEliminacion) {
    btnCancelarEliminacion.addEventListener('click', () => {
      resetearFormularioEliminacion();
    });
  }
  
  // Cargar contenido inicial cuando se abra la sección
  if (btnEliminarContenido) {
    btnEliminarContenido.addEventListener('click', () => {
      cargarContenidoPorTipo(tipoContenidoActual);
      resetearFormularioEliminacion();
    });
  }


}
