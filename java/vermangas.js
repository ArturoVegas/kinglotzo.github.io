import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";

// Variables globales para navegación
let mangaActual = null;
let capituloActual = null;
let capitulosDisponibles = [];

function cargarCapitulo(manga, capKey, tituloCap, imagenesContainer) {
  if (!tituloCap || !imagenesContainer) return;

  if (!manga || !capKey) {
    tituloCap.textContent = "Parámetros inválidos";
    imagenesContainer.innerHTML = "<p>No se pudo cargar el capítulo porque faltan parámetros válidos en la URL.</p>";
    return;
  }

  // Guardar datos actuales
  mangaActual = manga;
  capituloActual = capKey;

  tituloCap.textContent = `${manga.replaceAll("_", " ")} - Capítulo ${capKey}`;
  
  // Configurar botón volver al manga
  configurarBotonVolverManga(manga);

  async function cargar() {
    try {
      // Primero cargar los capítulos disponibles para navegación
      await cargarCapitulosDisponibles(manga);
      
      const capRef = ref(db, `mangas/${manga}/capitulos/${capKey}`);
      const snapshot = await get(capRef);

      if (!snapshot.exists()) {
        imagenesContainer.innerHTML = `<p>No se encontraron imágenes para este capítulo.</p>`;
        return;
      }

      const data = snapshot.val();

      // data tiene forma { fecha: ..., imagenes: { "0": url0, "1": url1, ... } }
      if (!data.imagenes) {
        imagenesContainer.innerHTML = `<p>No se encontraron imágenes para este capítulo.</p>`;
        return;
      }

      // Convertimos objeto imagenes a array filtrando solo strings válidas que empiezan con http
      const imagenes = Object.values(data.imagenes).filter(url => typeof url === "string" && url.startsWith("http"));

      if (imagenes.length === 0) {
        imagenesContainer.innerHTML = `<p>No se encontraron imágenes para este capítulo.</p>`;
        return;
      }

      imagenesContainer.innerHTML = "";

      imagenes.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.alt = `Página del capítulo ${capKey} de ${manga.replaceAll("_", " ")}`;
        img.className = "img-fluid rounded shadow mb-3";
        imagenesContainer.appendChild(img);
      });
      
      // Configurar botones de navegación después de cargar las imágenes
      configurarNavegacionCapitulos();
      
    } catch (error) {
      console.error("Error cargando capítulo:", error);
      imagenesContainer.innerHTML = "<p>Error al cargar las imágenes del capítulo.</p>";
    }
  }

  cargar();
}

// Función para cargar los capítulos disponibles
async function cargarCapitulosDisponibles(manga) {
  try {
    const mangaRef = ref(db, `mangas/${manga}/capitulos`);
    const snapshot = await get(mangaRef);
    
    if (snapshot.exists()) {
      const capitulos = snapshot.val();
      capitulosDisponibles = Object.keys(capitulos).sort((a, b) => parseInt(a) - parseInt(b));
    } else {
      capitulosDisponibles = [];
    }
  } catch (error) {
    console.error("Error cargando capítulos:", error);
    capitulosDisponibles = [];
  }
}

// Función para configurar el botón volver al manga
function configurarBotonVolverManga(manga) {
  const botonesVolver = document.querySelectorAll('#btn-volver-manga, #btn-volver-manga-bottom');
  botonesVolver.forEach(btn => {
    btn.href = `infoMangas.html?manga=${encodeURIComponent(manga)}`;
  });
}

// Función para configurar la navegación entre capítulos
function configurarNavegacionCapitulos() {
  const currentIndex = capitulosDisponibles.indexOf(capituloActual);
  
  // Botones anteriores
  const botonesAnterior = document.querySelectorAll('#btn-capitulo-anterior, #btn-capitulo-anterior-bottom');
  botonesAnterior.forEach(btn => {
    if (currentIndex > 0) {
      btn.disabled = false;
      btn.style.display = 'flex';
      btn.onclick = () => navegarCapitulo(capitulosDisponibles[currentIndex - 1]);
    } else {
      btn.style.display = 'none';
    }
  });
  
  // Botones siguientes
  const botonesSiguiente = document.querySelectorAll('#btn-capitulo-siguiente, #btn-capitulo-siguiente-bottom');
  botonesSiguiente.forEach(btn => {
    if (currentIndex < capitulosDisponibles.length - 1) {
      btn.disabled = false;
      btn.style.display = 'flex';
      btn.onclick = () => navegarCapitulo(capitulosDisponibles[currentIndex + 1]);
    } else {
      btn.style.display = 'none';
    }
  });
}

// Función para navegar a un capítulo
function navegarCapitulo(nuevoCapitulo) {
  const url = new URL(window.location);
  url.searchParams.set('cap', nuevoCapitulo);
  window.location.href = url.toString();
}

export { cargarCapitulo };
