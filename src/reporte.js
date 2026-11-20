const { ventas } = require('./datos')
const analitica = require('./analitica')


function formatoPesos(precio) {
    return "$" + precio.toLocaleString("es-CO", {
        maximumFractionDigits: 2
    });
}

function ciudadFormateada(ventas) {
    const totales = analitica.totalPorCiudad(ventas,3)
    const formateados = {}

    for (const [ciudad, monto] of Object.entries(totales)) {
        formateados[ciudad] = formatoPesos(monto)
    }
    return formateados
}

function productoFormateado(ventas, k) {
    const top = analitica.topProductosPorValor(ventas, k);

    return top.map(([producto, total]) => [producto, formatoPesos(total)]);
}

console.log("=======================================");
//console.log("\n");
console.log("Café Origen - Reporte General - v0.1");
console.log("=======================================");
console.log("\n");
console.log("1.Resúmen General:");
console.log("=======================================");
console.log("Ventas: ", ventas.length);
console.log("Ventas Validas (cantidad > 0): ", analitica.ventaValida(ventas));
console.log("Registros sin Unidades: ", ventas.length - analitica.ventaValida(ventas),);
console.log("Unidades Vendidas: ", analitica.unidadesVendidas(ventas));
console.log("Total Vendido: ", formatoPesos(analitica.totalVentas(ventas)))
console.log("Ticket Promedio: ", formatoPesos(analitica.ticketPromedio(ventas)));
console.log("Venta más Grande: ", analitica.ventaMayor(ventas))
console.log("\n");
console.log("Sección 1: Ventas Por Ciudad");
console.log("=======================================");
console.log(ciudadFormateada(ventas))
console.log("\n");
console.log("Sección 2: Unidades por Producto");
console.log("=======================================");
console.log(analitica.unidadesPorProducto(ventas))
console.log("\n");
console.log("Sección 3: Top 3 Productos más Vendidos");
console.log("=======================================");
console.log(productoFormateado(ventas, 3));
console.log("Sección 4: Ventas Del Día");
console.log("=======================================");
console.log(analitica.ventasDelDia(ventas , "2026-09-01" ));
console.log(analitica.ventasDelDia(ventas , "2026-08-01" ));




