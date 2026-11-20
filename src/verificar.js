const { ventas } = require('./datos');
const {
  totalVentas,
  unidadesVendidas,
  ventasPorCiudad,
  totalVendidoM,
  unidadesVendidasM,
  ventasPorCiudadM,
} = require('./analitica');



function compararIndicador(etiqueta, resultado1, resultado2) {
  if (resultado1 === resultado2) {
    return `${etiqueta}: OK`;
  } else {
    return `${etiqueta}: DIFERENTE (ciclo: ${resultado1} | métodos: ${resultado2})`;
  }
}

console.log(compararIndicador("Total vendido", totalVentas(ventas), totalVendidoM(ventas)));
console.log(compararIndicador("Unidades vendidas", unidadesVendidas(ventas), unidadesVendidasM(ventas)));
console.log(compararIndicador("Ventas Medellín", ventasPorCiudad(ventas, "Medellín"), ventasPorCiudadM(ventas, "Medellín")));
