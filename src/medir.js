const analitica = require("./analitica.js");
const generador = require('./generador.js')

const tamanos = [100, 1000, 10000, 100000];
const filas = [];

for (const n of tamanos) {
    const ventas = generador.generarVentas(n);

    const cPrimera = { visitas: 0, comparaciones: 0 }
    analitica.primeraVentaInstrumentada(ventas, cPrimera)

    const cTotal = { visitas: 0, comparaciones: 0 }
    analitica.totalVendidoIntrumentado(ventas, cTotal)
    
    const cMayor = { visitas: 0, comparaciones: 0 }
    analitica.ventaMayorIntrumentado(ventas, cMayor)

    const cCiudad = { visitas: 0, comparaciones: 0 }
    analitica.totalPorCiudadInstrumentado(ventas, cCiudad)

    filas.push({
        n,
        "primeraVenta O(1)": cPrimera.visitas + cPrimera.comparaciones,
        "totalVendido O(n)": cTotal.visitas + cTotal.comparaciones,
        "ventaMayor O(n)": cMayor.visitas + cMayor.comparaciones,
        "totalPorCiudad O(n)": cCiudad.visitas + cCiudad.comparaciones,
    })
}


console.table(filas);