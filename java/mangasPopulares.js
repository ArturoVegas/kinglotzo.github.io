// ./java/mangasPopulares.js

import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

export async function cargarMangasPopulares() {
  const contenedor = document.getElementById("carrusel-populares");
  if (!contenedor) return;

  const db = getDatabase();

  try {
    // Cargar tanto mangas como novelas
    const [mangasSnapshot, novelasSnapshot] = await Promise.all([
      get(ref(db, 'mangas')),
      get(ref(db, 'novelas'))
    ]);

    const contenidoCompleto = [];

    // Procesar mangas
    if (mangasSnapshot.exists()) {
      const mangas = mangasSnapshot.val();
      Object.entries(mangas).forEach(([nombre, data]) => {
        contenidoCompleto.push({
          nombre,
          portada: data.portada || "",
          vistas: data.vistas || 0,
          tipo: 'manga'
        });
      });
    }

    // Procesar novelas
    if (novelasSnapshot.exists()) {
      const novelas = novelasSnapshot.val();
      Object.entries(novelas).forEach(([nombre, data]) => {
        contenidoCompleto.push({
          nombre,
          portada: data.portada || "",
          vistas: data.vistas || 0,
          tipo: 'novela'
        });
      });
    }

    if (contenidoCompleto.length === 0) {
      contenedor.innerHTML = "<p class='text-light'>No hay contenido disponible.</p>";
      return;
    }

    // Ordenar por vistas descendentes y tomar los 10 primeros
    const contenidoOrdenado = contenidoCompleto
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 10);

    // Limpiar contenedor antes de insertar
    contenedor.innerHTML = "";

    contenidoOrdenado.forEach(({ nombre, portada, tipo }) => {
      // Crear contenedor de cada tarjeta con clase para estilos responsive
      const envoltorio = document.createElement("div");
      envoltorio.classList.add("popular-card-wrapper");
      
      // Aplicar estado inicial INMEDIATAMENTE para evitar parpadeos
      envoltorio.setAttribute('style', 'opacity: 0 !important; transform: translateY(30px) !important; display: flex !important; flex-shrink: 0 !important;');

      // Crear la tarjeta con clases Bootstrap
      const tarjeta = document.createElement("div");
      tarjeta.className = "card h-100";

      // Construir la URL correcta según el tipo
      const urlParam = tipo === 'novela' ? `id=${encodeURIComponent(nombre)}&tipo=novela` : `id=${encodeURIComponent(nombre)}`;
      
      tarjeta.innerHTML = `
        <a href="./html/infoMangas.html?${urlParam}" class="text-decoration-none text-reset">
          <div class="position-relative">
            <img src="${portada}" class="card-img-top" alt="${nombre.replaceAll("_", " ")}" />
            <span class="badge tipo-badge badge-${tipo}">${tipo === 'novela' ? 'Novela' : 'Manga'}</span>
          </div>
          <div class="card-body text-center">
            <h5 class="card-title">${nombre.replaceAll("_", " ")}</h5>
          </div>
        </a>
      `;

      envoltorio.appendChild(tarjeta);
      contenedor.appendChild(envoltorio);
    });

  } catch (error) {
    console.error("Error al cargar contenido popular:", error);
    contenedor.innerHTML = "<p class='text-danger'>Error al cargar el contenido popular.</p>";
  }
}
