import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";

let listaNombresMangas = [];

async function cargarNombresMangas() {
  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (snapshot.exists()) {
      listaNombresMangas = Object.keys(snapshot.val());
    } else {
      listaNombresMangas = [];
    }
  } catch (error) {
    console.error("Error cargando nombres de mangas para autocompletado:", error);
    listaNombresMangas = [];
  }
}

function inicializarBuscadorConAutocomplete() {
  const formBuscar = document.getElementById('form-buscar');
  const inputBuscar = document.getElementById('input-buscar');
  if (!formBuscar || !inputBuscar) return;

  const contenedorSugerencias = document.createElement('ul');
  contenedorSugerencias.style.position = 'absolute';
  contenedorSugerencias.style.zIndex = '9999';
  contenedorSugerencias.style.backgroundColor = 'white';
  contenedorSugerencias.style.listStyle = 'none';
  contenedorSugerencias.style.margin = '0';
  contenedorSugerencias.style.padding = '0';
  contenedorSugerencias.style.width = inputBuscar.offsetWidth + 'px';
  contenedorSugerencias.style.border = '1px solid #ccc';
  contenedorSugerencias.style.maxHeight = '200px';
  contenedorSugerencias.style.overflowY = 'auto';
  contenedorSugerencias.style.cursor = 'pointer';

  contenedorSugerencias.classList.add('autocomplete-list');

  inputBuscar.parentNode.style.position = 'relative';
  inputBuscar.parentNode.appendChild(contenedorSugerencias);

  let clickEnSugerencia = false;

  inputBuscar.addEventListener('input', () => {
    const valor = inputBuscar.value.trim().toLowerCase();
    contenedorSugerencias.innerHTML = '';

    if (!valor) {
      contenedorSugerencias.classList.remove('show');
      return;
    }

    const filtrados = listaNombresMangas.filter(nombre =>
      nombre.toLowerCase().includes(valor)
    ).slice(0, 10);

    if (filtrados.length === 0) {
      contenedorSugerencias.classList.remove('show');
      return;
    }

    filtrados.forEach(nombre => {
      const li = document.createElement('li');
      li.textContent = nombre.replaceAll("_", " ");
      li.style.padding = '5px 10px';

      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        clickEnSugerencia = true;
        window.location.href = `/html/infoMangas.html?manga=${encodeURIComponent(nombre)}`;
      });

      contenedorSugerencias.appendChild(li);
    });

    contenedorSugerencias.classList.add('show');
  });

  inputBuscar.addEventListener('blur', () => {
    setTimeout(() => {
      if (!clickEnSugerencia) {
        contenedorSugerencias.innerHTML = '';
        contenedorSugerencias.classList.remove('show');
      }
      clickEnSugerencia = false;
    }, 150);
  });

  formBuscar.addEventListener('submit', e => {
    e.preventDefault();
    const mangaBuscado = inputBuscar.value.trim();
    if (mangaBuscado) {
      window.location.href = `/html/infoMangas.html?manga=${encodeURIComponent(mangaBuscado)}`;
    }
  });
}

export { cargarNombresMangas, inicializarBuscadorConAutocomplete };
