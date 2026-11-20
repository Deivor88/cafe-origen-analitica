const { ventas } = require('./datos.js');

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

function totalVendidoM(ventas) {
    return ventas.reduce((total, venta) => total + valorVenta(venta), 0);
}
//console.log("Ventas totales M: ",totalVendidoM(ventas))

function unidadesVendidas(ventas) {
    let totalUnidades = 0;
    for (const venta of ventas) {
        totalUnidades += venta.cantidad;
    }
    return totalUnidades;
}

//console.log(unidadesVendidas(ventas))

function unidadesVendidasM(ventas) {
    return ventas.reduce((totalVentas, venta) => totalVentas + venta.cantidad, 0);
}

function ventaMayor(ventas) {
    if (ventas.length === 0) { return null; }
    let mayorVenta = ventas[0];
    for (const venta of ventas) {
        if (valorVenta(venta) > valorVenta(mayorVenta)) {
            mayorVenta = venta;
        }
    }
    return {
        id: mayorVenta.id,
        producto: mayorVenta.producto,
        valor: valorVenta(mayorVenta)
    };
}

function ticketPromedio(ventas) {
    const total = totalVentas(ventas);
    let ventaValida = 0;
    for (const venta of ventas) {
        if (venta.cantidad > 0) {
            ventaValida++;
        }
    }

    if (ventaValida === 0) { return 0; }
    return total / ventaValida;
}

function ventaValida(ventas) {
    let validas = 0;
    for (const venta of ventas) {
        if (venta.cantidad > 0) {
            validas++;
        }
    } return validas;
}

function normalizarTexto(texto, { comoSlug = false } = {}) {
    let palabra = String(texto)
        .normalize('NFD') //Descompone acentos
        .trim() //Quita espacios al inicio y final
        .toLowerCase() //Pasa a minúsculas
        .replace(/[\u0300-\u036f]/g, "") // Elimina tildes (Medellín -> Medellin)
        .replace(/\s+/g, " "); // Colapsa espacios múltiples internos
    if (comoSlug) {
        palabra = palabra
            .replace(/[^a-z0-9\s-]/g, "") // Limpia caracteres raros
            .replace(/\s+/g, "-")        // Reemplaza espacios por guiones
            .replace(/-+/g, "-");        // Evita guiones múltiples
    }
    return palabra;
}

function ventasPorCiudad(ventas, ciudad) {
    const ciudadEstandarizada = normalizarTexto(ciudad);
    let total = 0;
    for (const venta of ventas) {
        const ciudadVenta = normalizarTexto(venta.ciudad);
        if (ciudadVenta === ciudadEstandarizada) {
            total += valorVenta(venta);
        }
    }
    return total;
}
//console.log(ventasPorCiudad(ventas));


function ventasPorCiudadM(ventas, ciudad) {
    const ciudadEstandarizada = normalizarTexto(ciudad)
    return ventas
        .filter((venta) => normalizarTexto(venta.ciudad) === ciudadEstandarizada)
        .reduce((total, venta) => total + valorVenta(venta), 0)
}

function totalPorCiudad(ventas) {
    const totales = {}

    for (const venta of ventas) {
        const ciudadClave = normalizarTexto(venta.ciudad)
        if (!ciudadClave) continue  //Evita llaves vacias si le falta la ciudad

        //ciudadClave dentro de totales. Si no existe, la inicializa en cero
        if (!totales[ciudadClave]) {
            totales[ciudadClave] = 0
        }
        totales[ciudadClave] += valorVenta(venta)
    }
    return totales
}
//console.log("Carlos::  ", totalPorCiudad(ventas));


function unidadesPorProducto(ventas) {
    const unidades = {}

    for (const venta of ventas) {
        const productoClave = normalizarTexto(venta.producto)

        // Omite el registro si el nombre del producto está vacío o no existe
        if (!productoClave) continue

        // Inicializa el contador en 0 la primera vez que aparece el producto
        if (!unidades[productoClave]) {
            unidades[productoClave] = 0
        }
        // Suma las unidades vendidas en esta iteración al total del producto
        unidades[productoClave] += venta.cantidad
    }
    return unidades
}
//console.log("Carlooooos", unidadesPorProducto(ventas));


function topProductosPorValor(ventas, k) {
    // Evita procesar si ventas no es arreglo, está vacío o k no es positivo
    if (!Array.isArray(ventas) || ventas.length === 0 || k <= 0) {
        return [];
    }
    // Acumulador del dinero total generado por cada producto
    const ingresosPorProducto = {};

    for (const venta of ventas) {
        // Limpia espacios externos; si no hay producto, usa cadena vacía
        const producto = venta.producto ? venta.producto.trim() : '';
        // Salta el registro si el nombre del producto quedó vacío
        if (!producto) continue;
        // Suma el valor de esta venta al acumulado del producto (iniciando en 0 si es nuevo)
        ingresosPorProducto[producto] = (ingresosPorProducto[producto] || 0) + valorVenta(venta);
    }
    // Convierte el objeto en pares [producto, total], ordena de mayor a menor y toma los k primeros
    return Object.entries(ingresosPorProducto)
        .sort(([, totalA], [, totalB]) => totalB - totalA)
        .slice(0, k);
}

function ventasDelDia(ventas, fecha) {    
    const nuevoArreglo = ventas.filter((venta) => venta.fecha === fecha);

    if (nuevoArreglo.length === 0) {
        return `No hubo ventas en la fecha ${fecha}`

    }else{
        console.log("Ventas de la fecha: ", fecha);
        return nuevoArreglo
    }
}


//console.log(totalPorCiudad(ventas))
//console.log(unidadesPorProducto(ventas))
//console.log(topProductosPorValor(ventas,ventas.length));




//PRUEBAS:

const casos = [
    { nombre: 'Completo (12)', datos: ventas }, // 12 ventas
    { nombre: 'Un elemento', datos: [ventas[0]] }, // 1 venta
    { nombre: 'Vacío', datos: [] }, // 0 ventas
];

// console.log('=== Resultados por entrada ===');
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
// console.table(filas);

module.exports = {
    valorVenta,
    totalVentas,
    unidadesVendidas,
    ventaMayor,
    ticketPromedio,
    normalizarTexto,
    ventasPorCiudad,
    totalPorCiudad,
    unidadesPorProducto,
    topProductosPorValor,
    ventaValida,
    ventasDelDia,
    totalVendidoM,
    unidadesVendidasM,
    ventasPorCiudadM,
};




