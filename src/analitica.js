const { ventas } = require('./datos.js');
const analitica = require('./generador.js')


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

    } else {
        console.log("Ventas de la fecha: ", fecha);
        return nuevoArreglo
    }
}

//Total vendido instrumentado
function totalVendidoIntrumentado(ventas, contador = { visitas: 0, comparaciones: 0 }) {
    let total = 0
    for (const venta of ventas) {
        total += valorVenta(venta)
        contador.visitas += 1
    }
    return total
}

//Venta mayor instrumentado
function ventaMayorIntrumentado(ventas, contador = { visitas: 0, comparaciones: 0 }) {
    let mayor = null

    for (const venta of ventas) {
        contador.visitas += 1

        contador.comparaciones += 1
        if (mayor === null) {
            mayor = venta
            continue
        }

        contador.comparaciones += 1;
        if (valorVenta(venta) > valorVenta(mayor)) {
            mayor = venta
        }
    }

    return {id: mayor.id}
}

//Total por ciudad instrumentada
function totalPorCiudadInstrumentado(ventas, contador = { visitas: 0, comparaciones: 0 }) {
    const totales = {}

    for (const venta of ventas) {
        contador.visitas += 1

        const ciudad = normalizarTexto(venta.ciudad)
        const subtotal = valorVenta(venta)

        // Si totales[ciudad] es undefined (aún no existe), usa 0
        contador.comparaciones += 1
        totales[ciudad] = (totales[ciudad] ?? 0) + subtotal
    }

    return totales
}

//Primera venta O(1)
function primeraVentaInstrumentada (ventas, contador = {visitas: 0, comparaciones: 0}){
    contador.comparaciones += 1
    if (!Array.isArray(ventas) || ventas.length === 0) {
        return null;
    }

    contador.visitas += 1
    return ventas[0];
}

function clientesRecurrentes(ventas) {
  const recurrentes = [];

  for (let i = 0; i < ventas.length; i++) {
    for (let j = i + 1; j < ventas.length; j++) {
      // Verifica si el cliente se repite Y si aún NO está en la lista de recurrentes
      if (ventas[i].cliente === ventas[j].cliente && !recurrentes.includes(ventas[i].cliente)) {
        recurrentes.push(ventas[i].cliente);
      }
    }
  }

  return recurrentes;
}

function totalCiudadCadena (ventas, ciudad){
    const ciudadIngresada = normalizarTexto(ciudad)

    return ventas.map((venta) => ({
            ...venta,
            ciudadNormalizada: normalizarTexto(venta.ciudad),
        }))
        .filter((venta) => venta.ciudadNormalizada === ciudadIngresada)
        .map(valorVenta)
        .reduce((acumulado, subtotal) => acumulado + subtotal, 0);
}

function totalCiudadUnaPasada(ventas, ciudad) {
    const ciudadBuscada = normalizarTexto(ciudad);
    let total = 0;

    for (const venta of ventas) {
        if (normalizarTexto(venta.ciudad) === ciudadBuscada) {
            total += valorVenta(venta);
        }
    }

    return total;
}
//console.log(totalCiudadCadena(ventas,"medellin"))
function clientesRecurrentesSet(ventas){
    const recurrentes = new Set()
    const vistos = new Set()

    if (!Array.isArray(ventas)) {
        return null;
    }
    for (const venta of ventas){
        const cliente =venta.cliente
        if(!cliente) continue

        if(vistos.has(cliente)){
            recurrentes.add(cliente)
        }else{
            vistos.add(cliente)
        }
    } return [... recurrentes]
}
// console.log(clientesRecurrentesSet(ventas))
// console.log("Clientes recurrentes:", clientesRecurrentesSet(ventas))
function comprasPorCliente(ventas){
    const conteo = new Map()

    if(!Array.isArray(ventas)){
        return{
            comprasPorCliente: conteo,
            recurrentes: []
        }
    }
    //Contar cuántas compras hizo cada cliente usando el Map
    for(const venta of ventas){
        const cliente = venta.cliente
        if(!cliente) continue

        const actual = conteo.get(cliente) ?? 0
        conteo.set(cliente, actual + 1)
    }
    //
    const recurrentes = []
    for(const [cliente, cantidad] of conteo.entries()){
        if(cantidad > 1){
            recurrentes.push(cliente)
        }
    }
    return{
        comprasPorCliente: conteo,
        recurrentes
    }
}
// const resultado = comprasPorCliente(ventas);
//console.log(resultado);
// console.log("Compras por cliente (Map):", resultado.comprasPorCliente);
// console.log("Recurrentes:", resultado.recurrentes);




// const ventasPrueba = analitica.generarVentas(10)
// //const ventasPrueba = ventas

// const c1 = { visitas: 0, comparaciones: 0 };
// const total = totalVendidoIntrumentado(ventasPrueba, c1);
// console.log("totalVendido:", total, c1);

// const c2 = { visitas: 0, comparaciones: 0 };
// const mayor = ventaMayorIntrumentado(ventasPrueba, c2);
// console.log("ventaMayor:", mayor, c2);

// const c3 = { visitas: 0, comparaciones: 0 };
// const porCiudad = totalPorCiudadInstrumentado(ventasPrueba, c3);
// console.log("totalPorCiudad:", porCiudad, c3);








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
    totalVendidoIntrumentado,
    ventaMayorIntrumentado,
    totalPorCiudadInstrumentado,
    primeraVentaInstrumentada,
    clientesRecurrentes,
    clientesRecurrentesSet,
    comprasPorCliente
};




