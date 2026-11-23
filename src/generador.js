//const { ventas } = require('./datos.js');

const ciudades = ["Medellín", "Bogotá", "Cali", "Pereira"]
const productos = ["Origen Huila 500 g", "Origen Nariño 250 g", "Prensa francesa", "Origen Sierra 500 g", "Molino manual"]
const precios = [42000, 26000, 95000, 45000, 120000]

function fechaAleatoriaDelAnio(anio) {
  const inicio = Date.UTC(anio, 0, 1, 0, 0, 0, 0); // 1 de enero 00:00:00.000
  const fin = Date.UTC(anio + 1, 0, 1, 0, 0, 0, 0); // 1 de enero del siguiente año
  const timestampAleatorio = inicio + Math.random() * (fin - inicio);

  return new Date(timestampAleatorio);
}

function generarVentas(n) {
    if (n < 0)return "No valido"
    const ventas = []
    const maxClientes = Math.max(1, Math.floor(n/3))

    for (let numerador = 1; numerador <= n; numerador++) {

        const indiceProducto = Math.floor(Math.random() * productos.length)
        const numeroCliente = Math.floor(Math.random() * maxClientes) + 1
        const soloFecha = fechaAleatoriaDelAnio(2026).toISOString().split("T")[0];
        let venta = {
            id: numerador,
            fecha: soloFecha,
            cliente: "C" + numeroCliente,
            producto: productos[indiceProducto],
            ciudad: ciudades[Math.floor(Math.random() * ciudades.length)],
            cantidad: Math.floor(Math.random() * 5) + 1,
            precio: precios[indiceProducto]
        }
        ventas.push(venta)
    }
    return ventas
}
//console.log(generarVentas(3))

module.exports = {
    generarVentas
}