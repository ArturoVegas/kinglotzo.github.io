import { cargarMangas, setupResizeListener } from "./mangas.js";
import { cargarInfoManga } from "./infoMangas.js";
import { cargarCapitulo } from "./vermangas.js";
import { cargarUltimasActualizaciones } from "./index.js";
import { cargarNombresMangas, inicializarBuscadorConAutocomplete } from "./buscador.js";
import { cargarMangasPopulares } from "./mangasPopulares.js";
import { cargarCarruselPrincipal } from "./carrusel.js";
import { cargarNoticias } from "./noticias.js";
import { initAuth } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const pathname = window.location.pathname;

  if (pathname.endsWith("mangas.html")) {
    cargarMangas();
    setupResizeListener();
  }

  if (pathname.endsWith("infoMangas.html")) {
    cargarInfoManga();
  }

  if (pathname.endsWith("vermangas.html")) {
    const params = new URLSearchParams(window.location.search);
    const manga = params.get("manga");
    const cap = params.get("cap");

    const tituloCap = document.getElementById("titulo-capitulo");
    const imagenesContainer = document.getElementById("imagenes-capitulo");

    cargarCapitulo(manga, cap, tituloCap, imagenesContainer);
  }

const page = window.location.pathname.split("/").pop();

if (page === "" || page === "index.html") {
  console.log("✅ Página index detectada, cargando últimas actualizaciones...");
  cargarUltimasActualizaciones()
    .then(() => console.log("✅ Últimas actualizaciones cargadas correctamente"))
    .catch(err => console.error("❌ Error cargando últimas actualizaciones:", err));
}

  

  // Buscador (para todas las páginas que tengan el formulario)
  cargarNombresMangas().then(() => {
    inicializarBuscadorConAutocomplete();
    cargarMangasPopulares();
     cargarCarruselPrincipal();
    cargarNoticias();
  });

  // Inicializar sistema de autenticación
  initAuth();
});
