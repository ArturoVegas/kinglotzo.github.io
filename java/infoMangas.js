import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { set, remove, ref, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
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

// Funciones para manejar la lista visual
async function obtenerListaDelManga(usuarioUID, nombreManga) {
  const listas = ['favoritos', 'leyendo', 'pendientes', 'terminados'];
  for (const lista of listas) {
    const snap = await get(ref(db, `usuarios/${usuarioUID}/listas/${lista}/${nombreManga}`));
    if (snap.exists()) return lista;
  }
  return null;
}

async function eliminarDeLista(usuarioUID, nombreManga, lista) {
  await remove(ref(db, `usuarios/${usuarioUID}/listas/${lista}/${nombreManga}`));
  alert(`Manga eliminado de la lista "${lista}".`);
}

function mostrarDropdownAgregar() {
  const dropdown = document.getElementById("dropdown-listas");

  if (!dropdown) return;

  dropdown.innerHTML = `
    <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown" style="width: 100%;">
      <i class="bi bi-plus-circle me-1"></i> Agregar a mi lista
    </button>
    <ul class="dropdown-menu">
      <li><a class="dropdown-item" href="#" data-lista="favoritos"><i class="bi bi-heart me-2 text-danger"></i>Favoritos</a></li>
      <li><a class="dropdown-item" href="#" data-lista="leyendo"><i class="bi bi-book me-2 text-success"></i>Leyendo</a></li>
      <li><a class="dropdown-item" href="#" data-lista="pendientes"><i class="bi bi-bookmark me-2 text-warning"></i>Pendiente</a></li>
      <li><a class="dropdown-item" href="#" data-lista="terminados"><i class="bi bi-check-circle me-2 text-info"></i>Terminado</a></li>
    </ul>
  `;

  const items = dropdown.querySelectorAll(".dropdown-item");
  items.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const lista = item.getAttribute("data-lista");
      if (lista) {
        agregarMangaALista(lista);
        setTimeout(() => controlarListaVisual(), 500);
      }
    });
  });
}

function mostrarListaActual(nombreLista, userUID, nombreManga) {
  const dropdown = document.getElementById("dropdown-listas");

  if (!dropdown) return;

  const nombreFormateado = nombreLista.charAt(0).toUpperCase() + nombreLista.slice(1);

  dropdown.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; background-color: #343a40; color: white; border-radius: 5px; padding: 8px 12px; width: 100%;">
      <span style="font-size: 0.9rem;">En lista: <strong>${nombreFormateado}</strong></span>
      <button id="btn-eliminar-lista" class="btn btn-sm btn-danger">Eliminar</button>
    </div>
  `;

  const btnEliminar = document.getElementById("btn-eliminar-lista");
  btnEliminar.addEventListener("click", async () => {
    if (confirm(`¿Eliminar de la lista "${nombreFormateado}"?`)) {
      await eliminarDeLista(userUID, nombreManga, nombreLista);
      mostrarDropdownAgregar();
    }
  });
}

function controlarListaVisual() {
  const auth = getAuth();
  const nombreManga = obtenerNombreMangaDesdeURL();
  if (!nombreManga) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      mostrarDropdownAgregar();
      return;
    }

    const lista = await obtenerListaDelManga(user.uid, nombreManga);
    if (lista) {
      mostrarListaActual(lista, user.uid, nombreManga);
    } else {
      mostrarDropdownAgregar();
    }
  });
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
      // Obtener datos actuales del manga desde /mangas
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

      // Guardar dentro de listas, incluso si es 'favoritos'
      const ruta = `usuarios/${user.uid}/listas/${lista}/${nombreManga}`;
      await set(ref(db, ruta), mangaData);

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

async function alternarCapituloVisto(uid, nombreManga, capitulo, yaVisto) {
  const capRef = ref(db, `usuarios/${uid}/visto/${nombreManga}/${capitulo}`);
  if (yaVisto) {
    await remove(capRef); // si ya estaba visto, lo quitamos
  } else {
    await set(capRef, true); // si no estaba visto, lo marcamos
  }
}

async function cargarInfoManga() {
  const portadaEl = document.getElementById("manga-portada");
  if (!portadaEl) return;

  const nombreManga = obtenerNombreMangaDesdeURL();
  if (!nombreManga) return;

  try {
    const snapshot = await get(ref(db, `mangas/${nombreManga}`));
    if (!snapshot.exists()) {
      alert("Manga no encontrado.");
      return;
    }

    const data = snapshot.val();
    const auth = getAuth();
    const user = auth.currentUser;
    let capsVistos = {};

    if (user) {
      const vistoSnap = await get(ref(db, `usuarios/${user.uid}/visto/${nombreManga}`));
      if (vistoSnap.exists()) {
        capsVistos = vistoSnap.val();
      }
    }

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
          if (cap && cap.fecha) {
            fecha = tiempoDesde(cap.fecha);
          }

          const li = document.createElement("li");
          li.className = "list-group-item p-0 rectangulo-item d-flex justify-content-between align-items-center";

          const enlace = document.createElement("a");
          enlace.href = `../html/vermangas.html?manga=${encodeURIComponent(nombreManga)}&cap=${encodeURIComponent(clave)}`;
          enlace.className = "enlace-cap py-2 px-3 flex-grow-1 text-decoration-none text-reset";
          enlace.textContent = `Capítulo ${clave}`;

          const spanDerecha = document.createElement("span");
          spanDerecha.className = "d-flex align-items-center me-2";

          const spanFecha = document.createElement("span");
          spanFecha.className = "text-white small me-2";
          spanFecha.textContent = fecha;

          const icono = document.createElement("i");
let visto = false;

if (user) {
  visto = !!capsVistos[clave];

  icono.className = visto ? "bi bi-eye text-white" : "bi bi-eye-slash text-white";
  icono.title = visto ? "Marcar como no leído" : "Marcar como leído";
  icono.style.cursor = "pointer";

  icono.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await alternarCapituloVisto(user.uid, nombreManga, clave, visto);
      visto = !visto;
      icono.className = visto ? "bi bi-eye text-white" : "bi bi-eye-slash text-white";
      icono.title = visto ? "Marcar como no leído" : "Marcar como leído";
    } catch (err) {
      console.error("Error actualizando visto:", err);
    }
  });
          }

          spanDerecha.appendChild(spanFecha);
          if (user) spanDerecha.appendChild(icono);

          li.appendChild(enlace);
          li.appendChild(spanDerecha);
          lista.appendChild(li);
        });
      } else {
        lista.innerHTML = `<li class="list-group-item text-light">No hay capítulos disponibles.</li>`;
      }
    }

    await incrementarVisitas(nombreManga);
    controlarListaVisual();

  } catch (error) {
    console.error("Error cargando manga:", error);
  }
}

export { cargarInfoManga, obtenerNombreMangaDesdeURL, incrementarVisitas, agregarMangaALista };
