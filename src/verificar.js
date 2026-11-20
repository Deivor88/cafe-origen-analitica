const { ventas } = require('./datos');
const analitica = require('./analitica')




function compararIndicador(etiqueta, resultado1, resultado2) {
  if (resultado1 === resultado2) {
    return `${etiqueta}: OK`;
  } else {
    return `${etiqueta}: DIFERENTE (ciclo: ${resultado1} | métodos: ${resultado2})`;
  }
}

console.log(compararIndicador("Total vendido", analitica.totalVentas(ventas), analitica.totalVendidoM(ventas)));
console.log(compararIndicador("Unidades vendidas", analitica.unidadesVendidas(ventas), analitica.unidadesVendidasM(ventas)));
console.log(compararIndicador("Ventas Medellín", analitica.ventasPorCiudad(ventas, "Medellín"), analitica.ventasPorCiudadM(ventas, "Medellín")));

// 1. Consolidación de ciudades con variaciones de texto ("Bogotá", "bogota", " BOGOTÁ ")
const ventasBogota = [
  { ciudad: 'Bogotá', cantidad: 1, precio: 100 },
  { ciudad: 'bogota', cantidad: 2, precio: 100 },
  { ciudad: ' BOGOTÁ ', cantidad: 1, precio: 100 },
];

const gruposNormalizados = analitica.totalPorCiudad(ventasBogota);
console.log('Grupos normalizados Bogotá:', gruposNormalizados);
console.log('Cantidad de claves:', Object.keys(gruposNormalizados).length);

// 2. Día sin ventas usando ventasDelDia y ticketPromedio
const ventasDiaVacio = analitica.ventasDelDia(ventas, '2026-08-01');
const arregloDiaVacio = Array.isArray(ventasDiaVacio) ? ventasDiaVacio : [];

console.log(ventasDiaVacio);
console.log('Ticket promedio día vacío:', analitica.ticketPromedio(arregloDiaVacio));
