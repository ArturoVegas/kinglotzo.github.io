import { ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { db } from "./firebaseInit.js";

let listaMangasCompleta = []; // Cambio: ahora guardamos objetos completos

async function cargarNombresMangas() {
  console.log("🔍 Iniciando carga de nombres de mangas...");
  try {
    const snapshot = await get(ref(db, 'mangas'));
    if (snapshot.exists()) {
      const mangasData = snapshot.val();
      listaMangasCompleta = Object.keys(mangasData).map(key => ({
        nombre: key,
        titulo: mangasData[key].titulo || key.replaceAll("_", " "),
        portada: mangasData[key].portada || '',
        estado: mangasData[key].estado || 'ongoing',
        generos: mangasData[key].generos || []
      }));
      console.log("✅ Lista de mangas cargada:", listaMangasCompleta.length, "mangas");
      console.log("📋 Primeros 3 mangas:", listaMangasCompleta.slice(0, 3));
    } else {
      listaMangasCompleta = [];
      console.log("⚠️ No existen mangas en la BD");
    }
  } catch (error) {
    console.error("❌ Error cargando nombres de mangas para autocompletado:", error);
    listaMangasCompleta = [];
  }
}

function getRutaInfoMangas() {
  const origin = window.location.origin;
  const pathParts = window.location.pathname.split('/');
  
  // Elimina el archivo actual (ej: index.html)
  pathParts.pop();

  // Si ya estamos en "html", no agregues de nuevo
  if (pathParts[pathParts.length - 1] === 'html') {
    return `${origin}${pathParts.join('/')}/infoMangas.html`;
  } else {
    return `${origin}${pathParts.join('/')}/html/infoMangas.html`;
  }
}


function inicializarBuscadorConAutocomplete() {
  console.log("🔍 Inicializando buscador con autocomplete...");
  const formBuscar = document.getElementById('form-buscar');
  const inputBuscar = document.getElementById('input-buscar');
  
  if (!formBuscar || !inputBuscar) {
    console.log("⚠️ No se encontraron elementos del buscador");
    return;
  }
  
  console.log("✅ Elementos del buscador encontrados");
  console.log("📊 Mangas cargados para autocompletado:", listaMangasCompleta.length);

  const contenedorSugerencias = document.createElement('ul');
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
    
    const filtrados = listaMangasCompleta.filter(manga =>
      manga.titulo.toLowerCase().includes(valor)
    ).slice(0, 10);
    
    if (filtrados.length === 0) {
      const noResultados = document.createElement('li');
      noResultados.classList.add('autocomplete-no-results');
      noResultados.textContent = 'No se encontraron resultados';
      contenedorSugerencias.appendChild(noResultados);
    } else {
      filtrados.forEach(manga => {
        const li = document.createElement('li');
        li.classList.add('autocomplete-item');
        
        // Imagen por defecto si no hay portada
        const imagenSrc = manga.portada || 'https://via.placeholder.com/50x70/333/fff?text=Manga';
        
        // Formatear estado para mostrar
        const estadoTexto = {
          'ongoing': 'En Emisión',
          'completed': 'Completado',
          'paused': 'Pausado',
          'dropped': 'Abandonado'
        }[manga.estado] || manga.estado;
        
        // Manejar géneros vacíos
        const generosTexto = manga.generos.length > 0 
          ? manga.generos.slice(0, 3).join(', ') 
          : 'Sin géneros';
        
        li.innerHTML = `
          <img src="${imagenSrc}" alt="${manga.titulo}" class="autocomplete-item-image" 
               onerror="this.src='https://via.placeholder.com/50x70/333/fff?text=Manga'" />
          <div class="autocomplete-item-content">
            <span class="autocomplete-item-title" title="${manga.titulo}">${manga.titulo}</span>
            <div class="autocomplete-item-details">
              <span class="autocomplete-item-status status-${manga.estado}">${estadoTexto}</span>
              <span title="${generosTexto}">${generosTexto}</span>
            </div>
          </div>
        `;
        
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          clickEnSugerencia = true;
          
          const rutaInfo = getRutaInfoMangas();
          window.location.href = `${rutaInfo}?manga=${encodeURIComponent(manga.nombre)}`;
        });
        
        contenedorSugerencias.appendChild(li);
      });
    }
    
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
      const rutaInfo = getRutaInfoMangas();
      window.location.href = `${rutaInfo}?manga=${encodeURIComponent(mangaBuscado)}`;
    }
  });
}

export { cargarNombresMangas, inicializarBuscadorConAutocomplete };
