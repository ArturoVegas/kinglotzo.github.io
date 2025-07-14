import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";

function cargarCapitulo(manga, capKey, tituloCap, imagenesContainer) {
  if (!tituloCap || !imagenesContainer) return;

  if (!manga || !capKey) {
    tituloCap.textContent = "Parámetros inválidos";
    imagenesContainer.innerHTML = "<p>No se pudo cargar el capítulo porque faltan parámetros válidos en la URL.</p>";
    return;
  }

  tituloCap.textContent = `${manga.replaceAll("_", " ")} - Capítulo ${capKey}`;

  async function cargar() {
    try {
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
    } catch (error) {
      console.error("Error cargando capítulo:", error);
      imagenesContainer.innerHTML = "<p>Error al cargar las imágenes del capítulo.</p>";
    }
  }

  cargar();
}

export { cargarCapitulo };
