// noticias.js
import { db } from "./firebaseInit.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

export async function cargarNoticias() {
  try {
    const snapshot = await get(ref(db, "noticias"));
    if (!snapshot.exists()) return;

    const noticias = snapshot.val();
    if ("initialized" in noticias) delete noticias.initialized;

    const inner = document.querySelector("#carouselNoticias .carousel-inner");
    const indicators = document.querySelector("#carouselNoticias .carousel-indicators");

    if (!inner) return;

    inner.innerHTML = "";
    if (indicators) indicators.innerHTML = "";

    let index = 0;
    for (const key in noticias) {
      const noticia = noticias[key];

      const item = document.createElement("div");
      item.className = `carousel-item${index === 0 ? " active" : ""}`;

      const img = document.createElement("img");
      img.src = noticia.imagen || "./Recursos/imagenes/placeholder.jpg";
      img.alt = noticia.texto || "Noticia";
      img.className = "d-block w-100 rounded";

      const caption = document.createElement("div");
      caption.className = "carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded";
      caption.innerHTML = `<p>${noticia.texto || ""}</p>`;

      item.appendChild(img);
      item.appendChild(caption);
      inner.appendChild(item);

      if (indicators) {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-bs-target", "#carouselNoticias");
        button.setAttribute("data-bs-slide-to", index);
        if (index === 0) button.classList.add("active");
        indicators.appendChild(button);
      }

      index++;
    }
  } catch (e) {
    console.error("Error al cargar noticias:", e);
  }
}
