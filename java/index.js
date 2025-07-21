import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";
import { tiempoDesde } from "./utils.js";



async function cargarUltimasActualizaciones() {
  const ultimasActualizacionesCont = document.getElementById("ultimas-actualizaciones");
  if (!ultimasActualizacionesCont) return;

  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (!snapshot.exists()) {
      ultimasActualizacionesCont.innerHTML = "<p class='text-light'>No hay mangas disponibles.</p>";
      return;
    }

    const mangas = snapshot.val();
    const capitulosArray = [];

    Object.entries(mangas).forEach(([nombreManga, dataManga]) => {
      if (!dataManga.capitulos) return;

      Object.entries(dataManga.capitulos).forEach(([claveCap, capData]) => {
        let fechaSubida = null;

        if (
          capData &&
          typeof capData === "object" &&
          !Array.isArray(capData) &&
          capData.fecha
        ) {
          fechaSubida = capData.fecha;
        }

        if (!fechaSubida) return;

        capitulosArray.push({
          manga: nombreManga,
          portada: dataManga.portada || "",
          capitulo: claveCap,
          fecha: fechaSubida
        });
      });
    });

    capitulosArray.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const recientes = capitulosArray.slice(0, 6);

    ultimasActualizacionesCont.innerHTML = "";

    if (recientes.length === 0) {
      ultimasActualizacionesCont.innerHTML = "<p class='text-light'>No hay actualizaciones recientes.</p>";
      return;
    }

    recientes.forEach(({ manga, portada, capitulo, fecha }) => {
      const card = document.createElement("div");
      card.className = "col";

      card.innerHTML = `
        <a href="./html/vermangas.html?manga=${encodeURIComponent(manga)}&cap=${encodeURIComponent(capitulo)}" class="text-decoration-none text-reset">
          <div class="card h-100">
            <img src="${portada}" class="card-img-top" alt="${manga.replaceAll("_", " ")}" />
            <div class="card-body">
              <h5 class="card-title">${manga.replaceAll("_", " ")}</h5>
              <p class="card-text">Capítulo ${capitulo} - ${tiempoDesde(fecha)}</p>
            </div>
          </div>
        </a>
      `;

      ultimasActualizacionesCont.appendChild(card);
    });

  } catch (error) {
    console.error("Error al cargar últimas actualizaciones:", error);
    ultimasActualizacionesCont.innerHTML = "<p class='text-danger'>Error al cargar últimas actualizaciones.</p>";
  }
}

export { cargarUltimasActualizaciones };
