import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { ref, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";
import { tiempoDesde } from "./utils.js";

async function incrementarVisitas(nombreManga) {
  if (!nombreManga) return;

  const vistasRef = ref(db, `mangas/${nombreManga}/vistas`);

  try {
    await runTransaction(vistasRef, (valorActual) => {
      return (valorActual || 0) + 1;
    });
  } catch (error) {
    console.error("Error incrementando visitas:", error);
  }
}
function agregarMangaALista(lista) {
  const auth = getAuth();
  const nombreManga = obtenerNombreMangaDesdeURL();
  if (!nombreManga) {
    alert("No se pudo obtener el nombre del manga.");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para usar esta función.");
      return;
    }

    try {
      // Obtener datos actuales del manga
      const mangaSnap = await get(ref(db, `mangas/${nombreManga}`));
      if (!mangaSnap.exists()) {
        alert("El manga no existe en la base de datos.");
        return;
      }
      const manga = mangaSnap.val();

      const mangaData = {
        titulo: decodeURIComponent(nombreManga).replaceAll("_", " "),
        portada: manga.portada || "",
        timestamp: Date.now()
      };

      const userPath = `usuarios/${user.uid}/listas/${lista}/${nombreManga}`;
      await set(ref(db, userPath), mangaData);

      alert(`Agregado a tu lista de "${lista}".`);
    } catch (error) {
      console.error("Error al agregar a la lista:", error);
      alert("Ocurrió un error al guardar el manga.");
    }
  });
}

function obtenerNombreMangaDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("manga");
}

async function cargarInfoManga() {
  const portadaEl = document.getElementById("manga-portada");
  if (!portadaEl) return;

  const nombreManga = obtenerNombreMangaDesdeURL();
  if (!nombreManga) return;

  try {
    const snapshot = await get(ref(db, `mangas/${nombreManga}`));
    if (snapshot.exists()) {
      const data = snapshot.val();

      const setText = (id, texto) => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto ?? "-";
      };

      portadaEl.src = data.portada || "";
      portadaEl.alt = decodeURIComponent(nombreManga).replaceAll("_", " ");

      // Cargar banner del manga si existe
      const bannerEl = document.getElementById("manga-banner");
      if (bannerEl && data.banner) {
        bannerEl.style.backgroundImage = `url('${data.banner}')`;
      }

      setText("manga-titulo", decodeURIComponent(nombreManga).replaceAll("_", " "));
      setText("manga-sinopsis", data.sinopsis || "Sin sinopsis.");
      setText("manga-autor", data.autor || "Desconocido");
      setText("manga-genero", Array.isArray(data.generos) ? data.generos.join(", ") : (data.generos || "Sin géneros"));
      setText("manga-estado", data.estado || "Desconocido");
      setText("manga-fecha", data.fechaLanzamiento || data.fecha_lanzamiento || "Desconocida");
      setText("manga-frecuencia", data.frecuencia || "Desconocida");

      const lista = document.getElementById("lista-capitulos");
      if (lista) {
        lista.innerHTML = "";
        if (typeof data.capitulos === "object" && data.capitulos !== null) {
          const clavesOrdenadas = Object.keys(data.capitulos).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
          );

          clavesOrdenadas.forEach(clave => {
            const cap = data.capitulos[clave];
            let fecha = "";

            if (cap && typeof cap === "object" && !Array.isArray(cap) && cap.fecha) {
              fecha = tiempoDesde(cap.fecha);
            }

            const li = document.createElement("li");
            li.className = "list-group-item p-0 rectangulo-item d-flex justify-content-between align-items-center";

            const enlace = document.createElement("a");
            enlace.href = `../html/vermangas.html?manga=${encodeURIComponent(nombreManga)}&cap=${encodeURIComponent(clave)}`;
            enlace.className = "enlace-cap py-2 px-3 flex-grow-1 text-decoration-none text-reset";
            enlace.textContent = `Capítulo ${clave}`;

            const spanFecha = document.createElement("span");
            spanFecha.className = "text-white small ms-2";
            spanFecha.textContent = fecha;

            li.appendChild(enlace);
            li.appendChild(spanFecha);

            lista.appendChild(li);
          });
        } else {
          lista.innerHTML = `<li class="list-group-item text-light">No hay capítulos disponibles.</li>`;
        }
      }
      await incrementarVisitas(nombreManga);

    } else {
      alert("Manga no encontrado.");
    }
  } catch (error) {
    console.error("Error cargando manga:", error);
  }
}

export { cargarInfoManga, obtenerNombreMangaDesdeURL, incrementarVisitas,agregarMangaALista};
