// ./java/mangasPopulares.js

import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

export async function cargarMangasPopulares() {
  const contenedor = document.getElementById("carrusel-populares");
  if (!contenedor) return;

  const db = getDatabase();

  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (!snapshot.exists()) {
      contenedor.innerHTML = "<p class='text-light'>No hay mangas disponibles.</p>";
      return;
    }

    const mangas = snapshot.val();

    const mangasOrdenados = Object.entries(mangas)
      .map(([nombre, data]) => ({
        nombre,
        portada: data.portada || "",
        vistas: data.vistas || 0
      }))
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 10); // Solo los 10 más vistos

    contenedor.innerHTML = "";

    mangasOrdenados.forEach(({ nombre, portada }) => {
      const envoltorio = document.createElement("div");
      envoltorio.style.flex = "0 0 calc(16.66% - 1rem)";
      envoltorio.style.maxWidth = "calc(16.66% - 1rem)";
      envoltorio.style.display = "flex";
      envoltorio.style.flexDirection = "column";

      const tarjeta = document.createElement("div");
      tarjeta.className = "card h-100";

      tarjeta.innerHTML = `
        <a href="./html/infoMangas.html?manga=${encodeURIComponent(nombre)}" class="text-decoration-none text-reset">
          <img src="${portada}" class="card-img-top" alt="${nombre.replaceAll("_", " ")}" />
          <div class="card-body text-center">
            <h5 class="card-title">${nombre.replaceAll("_", " ")}</h5>
          </div>
        </a>
      `;

      envoltorio.appendChild(tarjeta);
      contenedor.appendChild(envoltorio);
    });

  } catch (error) {
    console.error("Error al cargar mangas populares:", error);
    contenedor.innerHTML = "<p class='text-danger'>Error al cargar los mangas populares.</p>";
  }
}
