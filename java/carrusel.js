// carrusel.js
import { db } from "./firebaseInit.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

export async function cargarCarruselPrincipal() {
  try {
    const snapshot = await get(ref(db, "carrusel"));
    if (!snapshot.exists()) return;

    const carrusel = snapshot.val();
    if ("initialized" in carrusel) delete carrusel.initialized;

    const inner = document.querySelector("#carouselExampleCaptions .carousel-inner");
    const indicators = document.querySelector("#carouselExampleCaptions .carousel-indicators");

    if (!inner || !indicators) return;

    inner.innerHTML = "";
    indicators.innerHTML = "";

    let index = 0;
    for (const key in carrusel) {
      const item = carrusel[key];

      // Indicador
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-bs-target", "#carouselExampleCaptions");
      button.setAttribute("data-bs-slide-to", index);
      if (index === 0) button.classList.add("active");
      indicators.appendChild(button);

      // Slide
      const div = document.createElement("div");
      div.className = `carousel-item${index === 0 ? " active" : ""}`;

      const img = document.createElement("img");
      img.className = "d-block w-100";
      img.src = item.imagen;
      img.alt = item.titulo || "Imagen carrusel";

      const caption = document.createElement("div");
      caption.className = "carousel-caption d-block";
      if (item.titulo) caption.innerHTML += `<h5>${item.titulo}</h5>`;
      if (item.descripcion) caption.innerHTML += `<p>${item.descripcion}</p>`;

      div.appendChild(img);
      div.appendChild(caption);
      inner.appendChild(div);

      index++;
    }

  } catch (e) {
    console.error("Error al cargar carrusel:", e);
  }
}
