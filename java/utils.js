// Función para calcular tiempo relativo desde timestamp
function tiempoDesde(timestamp) {
  if (!timestamp) return "";
  let segundos = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (segundos < 0) return "justo ahora";

  const unidades = [
    { nombre: "año", valor: 31536000 },
    { nombre: "mes", valor: 2592000 },
    { nombre: "día", valor: 86400 },
    { nombre: "hora", valor: 3600 },
    { nombre: "minuto", valor: 60 },
    { nombre: "segundo", valor: 1 }
  ];

  const partes = [];

  for (let unidad of unidades) {
    const cantidad = Math.floor(segundos / unidad.valor);
    if (cantidad > 0) {
      partes.push(`${cantidad} ${unidad.nombre}${cantidad > 1 ? "s" : ""}`);
      segundos %= unidad.valor;
      if (partes.length === 2) break;
    }
  }

  return partes.length ? `hace ${partes.join(" y ")}` : "justo ahora";
}

export { tiempoDesde };
