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
    return total / ventaValida;
}

//Preguntar a Jorge sobre la estandarizacion de texto
function limpiarTexto(texto) {
  if (typeof texto !== 'string') return '';
  return texto.normalize('NFC').trim().replace(/\s+/g, ' ');
}

function claveTexto(texto) {
  return limpiarTexto(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tieneTildes(texto) {
  return /[\u0300-\u036f]/.test(limpiarTexto(texto).normalize('NFD'));
}

//Preguntar a Jorge sobre la funcipn formatearNombreLugar, si es necesario que se haga la estandarizacion de texto en el nombre de la ciudad, ya que en el archivo datos.js hay ciudades con tildes y sin tildes, y esto puede afectar el resultado de la funcion.
function formatearNombreLugar(texto) {
  const conectores = ['de', 'del', 'la', 'las', 'los', 'y', 'e'];
  const limpio = limpiarTexto(texto).toLowerCase();
  if (limpio === '') return '';

  const palabras = [];
  let posicion = 0;
  for (const palabra of limpio.split(' ')) {
    const esConector = posicion > 0 && conectores.includes(palabra);
    palabras.push(esConector ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1));
    posicion++;
  }
  return palabras.join(' ');
}

//Preguntar a Jorge sobre la funion ventasPorCiudad, si es necesario que se haga la estandarizacion de texto en el nombre de la ciudad, ya que en el archivo datos.js hay ciudades con tildes y sin tildes, y esto puede afectar el resultado de la funcion.
function ventasPorCiudad(ventas, ciudad) {
  const resumen = {};
    for (const venta of ventas) {
        const ciudadVenta = formatearNombreLugar(venta.ciudad);
        if (!resumen[ciudadVenta]) {
            resumen[ciudadVenta] = {
                totalVentas: 0,
                totalUnidades: 0,
            };
        }
        resumen[ciudadVenta].totalVentas += valorVenta(venta);
        resumen[ciudadVenta].totalUnidades += venta.cantidad;
    }
    return resumen[formatearNombreLugar(ciudad)] || { totalVentas: 0, totalUnidades: 0 };
}


