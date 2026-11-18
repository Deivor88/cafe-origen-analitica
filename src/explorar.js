const {ventas} = require('./datos.js');

console.log("Cantidad de registros:",ventas.length);
console.log("\nPrimer registro:",ventas[0]);
console.log("\nÚltimo registro:",ventas[ventas.length - 1]);
console.log("\nProducto de la cuarta venta:",ventas[3].producto);
console.table(ventas);