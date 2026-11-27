const { ventas } = require('./datos');
const analitica = require('./analitica')
const generador = require('./generador')



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


console.log("\n");

const ordenar = (arr) => [...arr].sort((a, b) => String(a).localeCompare(String(b)));
//Prueba con el arreglo de 12 ventas (`ventas`)
const origDia1 = ordenar(analitica.clientesRecurrentes(ventas));
const setDia1 = ordenar(analitica.clientesRecurrentesSet(ventas));
const mapDia1 = ordenar(analitica.comprasPorCliente(ventas).recurrentes);

console.log("Ventas - Coinciden las 3:", JSON.stringify(origDia1) === JSON.stringify(setDia1) && JSON.stringify(setDia1) === JSON.stringify(mapDia1));
console.log("Ventas - Original:", origDia1);
console.log("Ventas - Set:", setDia1);
console.log("Ventas - Map:", mapDia1);

//Prueba con 5.000 ventas generadas
const ventas5000 = generador.generarVentas(5000);
const orig5000 = ordenar(analitica.clientesRecurrentes(ventas5000));
const set5000 = ordenar(analitica.clientesRecurrentesSet(ventas5000));
const map5000 = ordenar(analitica.comprasPorCliente(ventas5000).recurrentes);

console.log("5.000 ventas - Coinciden las 3:", JSON.stringify(orig5000) === JSON.stringify(set5000) && JSON.stringify(set5000) === JSON.stringify(map5000));
console.log("5.000 ventas - Total recurrentes:", set5000.length);
console.log("5.000 ventas - Original:", orig5000);
console.log("5.000 ventas - Set:", set5000);
console.log("5.000 ventas - Map:", map5000);



function medirVersion(fn, datos) {
    const inicio = performance.now();
    const resultado = fn(datos);
    const fin = performance.now();
    return {
        tiempoMs: Number((fin - inicio).toFixed(2)),
        totalRecurrentes: Array.isArray(resultado)
            ? resultado.length
            : resultado.recurrentes.length,
    };
}

const tamanos = [1_000, 10_000, 100_000];
const LIMITE_ORIGINAL = 10_000; // No ejecutar la original en 100.000 si tarda demasiado
const tablaResultados = [];

for (const n of tamanos) {
    const loteVentas = generador.generarVentas(n);

    const medOrig =
        n <= LIMITE_ORIGINAL
            ? medirVersion(analitica.clientesRecurrentes, loteVentas)
            : { tiempoMs: "Omitido (>10k)", totalRecurrentes: "-" };

    const medSet = medirVersion(analitica.clientesRecurrentesSet, loteVentas);
    const medMap = medirVersion(
        (ventas) => analitica.comprasPorCliente(ventas).recurrentes,
        loteVentas
    );

    tablaResultados.push({
        ventas: n,
        originalMs: medOrig.tiempoMs,
        setMs: medSet.tiempoMs,
        mapMs: medMap.tiempoMs,
        recurrentes: medSet.totalRecurrentes,
    });
}
console.log("\n");

console.table(tablaResultados);

const intercambio = [
    {
        version: "Original",
        tiempo: "O(n²), hasta O(n³)",
        memoria: "O(r), hasta O(n)",
        decision: "Usa menos memoria auxiliar explícita, pero repite comparaciones",
    },
    {
        version: "Set",
        tiempo: "O(n)",
        memoria: "O(c + r), hasta O(n)",
        decision: "Intercambia memoria por búsquedas y comparaciones constantes",
    },
    {
        version: "Map",
        tiempo: "O(n)",
        memoria: "O(c + r), hasta O(n)",
        decision: "Guarda todos los conteos y elimina el recorrido completo por pares",
    },
];

console.log("\nIntercambio entre tiempo y memoria:");
console.table(intercambio);