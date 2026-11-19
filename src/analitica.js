const {ventas} = require('./datos.js');

function valorVenta(venta) {
  return venta.cantidad * venta.precio;
}

function totalVentas(ventas) {
    let total = 0;
    for (const venta of ventas) {
        total += valorVenta(venta);
    }
    return total;
}

function unidadesVendidas(ventas) {
    let totalUnidades = 0;
    for (const venta of ventas) {
        totalUnidades += venta.cantidad;
    }
    return totalUnidades;
}   

function ventaMayor(ventas) {
    if (ventas.length === 0) {return null;}
    let mayorVenta = ventas[0];
    for (const venta of ventas) {
        if (valorVenta(venta) > valorVenta(mayorVenta)) {
            mayorVenta = venta;
        }
    }          
    return mayorVenta;
}

function ticketPromedio(ventas) {
    const total = totalVentas(ventas);
    let ventaValida = 0;
    for (const venta of ventas) {
        if (venta.cantidad > 0) {
            ventaValida++;
        }                           
    }

    if (ventaValida === 0) {return 0;}
    return total / ventaValida;
}

function estandarizarCiudad(texto, {comoSlug = false} = {}) {
    let ciudad = String(texto)
    .normalize('NFD') //Descompone acentos
    .trim() //Quita espacios al inicio y final
    .toLowerCase() //Pasa a minúsculas
    .replace(/[\u0300-\u036f]/g, "") // Elimina tildes (Medellín -> Medellin)
    .replace(/\s+/g, " "); // Colapsa espacios múltiples internos
    if (comoSlug) {
        ciudad = ciudad
            .replace(/[^a-z0-9\s-]/g, "") // Limpia caracteres raros
            .replace(/\s+/g, "-")        // Reemplaza espacios por guiones
            .replace(/-+/g, "-");        // Evita guiones múltiples
    }
    return ciudad;
}

function ventasPorCiudad(ventas, ciudad) {
    const ciudadEstandarizada = estandarizarCiudad(ciudad);
    let total = 0;
    for (const venta of ventas) {
        const ciudadVenta = estandarizarCiudad(venta.ciudad);
        if (ciudadVenta === ciudadEstandarizada) {
            total += valorVenta(venta);
        }
    }
    return total;
}

//Pruebas:

const casos = [
    { nombre: 'Completo (12)', datos: ventas }, // 12 ventas
    { nombre: 'Un elemento', datos: [ventas[0]] }, // 1 venta
    { nombre: 'Vacío', datos: [] }, // 0 ventas
];


console.log('=== Resultados por entrada ===');
const filas = [];
for (const caso of casos) {
    filas.push({
        entrada: caso.nombre,
        totalVendido: totalVentas(caso.datos),
        unidadesVendidas: unidadesVendidas(caso.datos),
        ventaMayor: ventaMayor(caso.datos),
        ticketPromedio: Number(ticketPromedio(caso.datos).toFixed(2)),
        'ventasPorCiudad(Medellín)': ventasPorCiudad(caso.datos, 'Medellín'),
    });
}
console.table(filas);


module.exports = {
    valorVenta,
    totalVentas,
    unidadesVendidas,
    ventaMayor,
    ticketPromedio,
    ventasPorCiudad,
};




