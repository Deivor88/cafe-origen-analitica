# Rendimiento del motor de analítica

## Alcance y método

El inventario cubre las funciones definidas en `src/analitica.js`: las funciones
base del motor, las instrumentadas, `clientesRecurrentes` y las dos versiones de
total por ciudad. Las funciones de presentación de `reporte.js` no forman parte
del motor.

Se generó un único conjunto de 10.000 ventas con `generarVentas(10000)`. Se midió
cada función sobre ese conjunto, después de una ejecución de calentamiento; el
valor informado es la mediana de cinco ejecuciones en Node.js v26.13.0. La
generación de datos quedó fuera del cronómetro. Para aislar las funciones que no
están exportadas se ejecutó el código fuente sin modificarlo y se expusieron solo
dentro de la prueba. Se suprimió la salida de consola de `ventasDelDia` durante
la medición. Los tiempos son orientativos y pueden variar según el equipo, la
entrada y la carga del proceso.

Para expresar espacio, `n` es la cantidad de ventas, `m` las coincidencias de
una búsqueda de ciudad/fecha, `u` las ciudades distintas, `p` los productos
distintos y `L` la longitud del texto que se normaliza. La memoria adicional
incluye las colecciones que la función devuelve o crea. Se asumen búsquedas
promedio O(1) en propiedades de objetos JavaScript y textos de longitud acotada
cuando se expresa la complejidad respecto de `n`.

## Funciones del motor

| Función | Qué hace | Complejidad temporal | Complejidad espacial | Justificación | Operaciones o tiempo medido con 10.000 ventas |
|---|---|---|---|---|---|
| `valorVenta` | Multiplica cantidad por precio de una venta. | O(1) | O(1) | Realiza una multiplicación y no recorre colecciones. | 0,001 ms por una venta; auxiliar, no procesa las 10.000. |
| `totalVentas` | Suma el valor de todas las ventas con un ciclo. | O(n) | O(1) | Visita cada registro una vez y conserva un acumulador. | 1,148 ms; 10.000 visitas. |
| `totalVendidoM` | Suma el valor de todas las ventas con `reduce`. | O(n) | O(1) | `reduce` recorre las ventas sin construir otro arreglo. | 1,495 ms; 10.000 llamadas al acumulador. |
| `unidadesVendidas` | Suma las unidades con un ciclo. | O(n) | O(1) | Una visita por venta y un acumulador. | 0,418 ms; 10.000 visitas. |
| `unidadesVendidasM` | Suma las unidades con `reduce`. | O(n) | O(1) | Recorre las ventas y mantiene un único acumulador. | 0,294 ms; 10.000 llamadas al acumulador. |
| `ventaMayor` | Busca la venta de mayor valor. | O(n) | O(1) | Compara los registros en un recorrido y conserva una candidata. | 1,926 ms; un recorrido. |
| `ticketPromedio` | Divide el total vendido entre las ventas válidas. | O(n) | O(1) | Llama a `totalVentas` y luego recorre las ventas válidas; son dos recorridos lineales. | 1,608 ms; aproximadamente 20.000 visitas entre ambos recorridos. |
| `ventaValida` | Cuenta los registros cuya cantidad es positiva. | O(n) | O(1) | Un recorrido y un contador. | 0,265 ms; 10.000 visitas. |
| `normalizarTexto` | Quita espacios sobrantes, tildes y diferencias de mayúsculas. | O(L) | O(L) | Reemplazos y transformaciones recorren y generan texto proporcional a su longitud. | 0,002 ms por una cadena; auxiliar, no procesa las 10.000 ventas por sí sola. |
| `ventasPorCiudad` | Suma los valores de ventas de una ciudad normalizada. | O(n) | O(1) respecto de `n` | Recorre las ventas y normaliza cada ciudad; mantiene solo el total. La normalización usa texto temporal O(L). | 6,918 ms; 10.000 visitas. |
| `ventasPorCiudadM` | Filtra ventas de una ciudad y suma sus valores. | O(n) | O(n) | Filtra las `n` ventas y crea un arreglo con hasta `m` coincidencias; luego las suma. | 10,028 ms; filtro de 10.000 y reducción de las coincidencias. |
| `totalPorCiudad` | Acumula el valor vendido por ciudad. | O(n) | O(u), hasta O(n) | Una visita por venta y una entrada por ciudad distinta. | 9,553 ms; 10.000 visitas, 4 ciudades en esta muestra. |
| `unidadesPorProducto` | Acumula unidades por producto. | O(n) | O(p), hasta O(n) | Una visita por venta y una entrada por producto distinto. | 10,447 ms; 10.000 visitas, 5 productos en esta muestra. |
| `topProductosPorValor` | Agrupa ingresos, ordena los productos y devuelve los primeros `k`. | O(n + p log p) | O(p) | Acumula `n` ventas y ordena las `p` entradas; los arreglos de entradas y resultado crecen con `p`. | 1,236 ms con `k = 3` y 5 productos. |
| `ventasDelDia` | Filtra ventas de una fecha. | O(n) | O(m), hasta O(n) | Revisa todas las ventas y conserva las coincidencias en un arreglo. | 0,228 ms; filtro de 10.000 ventas. |
| `totalVendidoIntrumentado` | Suma valores y cuenta las visitas. | O(n) | O(1) | Un recorrido, un acumulador y un contador de tamaño fijo. | 1,573 ms; 10.000 visitas. |
| `ventaMayorIntrumentado` | Busca la venta mayor y cuenta visitas/comparaciones. | O(n) | O(1) | Recorre `n` ventas; hace hasta `2n - 1` comparaciones instrumentadas. | 2,748 ms; 10.000 visitas y hasta 19.999 comparaciones. |
| `totalPorCiudadInstrumentado` | Agrupa valores por ciudad y cuenta visitas/comparaciones. | O(n) | O(u), hasta O(n) | Una visita por venta; el objeto de totales crece con las ciudades distintas. | 10,134 ms; 10.000 visitas y comparaciones. |
| `primeraVentaInstrumentada` | Valida el arreglo y devuelve su primer elemento. | O(1) | O(1) | No depende de recorrer el tamaño del arreglo; solo valida y accede al índice cero. | 0,001 ms; una validación y, con datos, una visita. |
| `clientesRecurrentes` | Encuentra clientes que aparecen en más de una venta. | O(n³) peor caso; O(n²) en el patrón medido | O(n) | Compara todos los pares y, cuando coinciden, `includes` puede recorrer la lista acumulada de recurrentes. | 581,144 ms; hasta 49.995.000 comparaciones de pares, más las búsquedas de `includes`. |
| `totalCiudadCadena` | Normaliza, filtra y suma ventas de una ciudad mediante métodos encadenados. | O(n) | O(n) | Hace cuatro recorridos de etapas lineales y crea tres arreglos; el primero también copia los objetos de venta. | 9,944 ms; 10.000 ventas y cuatro etapas de recorrido. |
| `totalCiudadUnaPasada` | Suma las ventas de una ciudad durante un único recorrido. | O(n) | O(1) respecto de `n` | Examina cada venta, compara su ciudad normalizada y actualiza un acumulador. | 7,731 ms; 10.000 visitas y ningún arreglo nuevo. |

Los tiempos de `valorVenta`, `normalizarTexto` y `primeraVentaInstrumentada`
corresponden a una llamada auxiliar; no significan que esas funciones por sí
solas procesen las 10.000 ventas. Las mediciones de todas las filas son una
muestra de ejecución, no garantías de rendimiento.

## Proyección

Las siguientes cifras estiman una llamada aislada con un millón de ventas, no
incluyen el tiempo de generar el millón de objetos ni de imprimir sus resultados.
Para funciones O(n) se escala el tiempo medido por 100 (1.000.000 / 10.000).
Para `topProductosPorValor` se distingue el generador actual, que usa cinco
productos, del peor caso de alta cardinalidad. Las proyecciones de
`clientesRecurrentes` suponen el patrón de clientes repetidos observado; su peor
caso puede ser mucho más lento.

| Función o reporte | Base medida | Proyección para 1.000.000 de ventas | Supuesto |
|---|---:|---:|---|
| `valorVenta` | 0,001 ms por venta | Aproximadamente 1 s si se llama una vez por venta. | Un millón de multiplicaciones escala linealmente; cifra muy sensible a la resolución del cronómetro. |
| `totalVentas` | 1,148 ms | 0,115 s | O(n), 100 veces el tamaño. |
| `totalVendidoM` | 1,495 ms | 0,150 s | O(n), 100 veces el tamaño. |
| `unidadesVendidas` | 0,418 ms | 0,042 s | O(n), 100 veces el tamaño. |
| `unidadesVendidasM` | 0,294 ms | 0,029 s | O(n), 100 veces el tamaño. |
| `ventaMayor` | 1,926 ms | 0,193 s | O(n), 100 veces el tamaño. |
| `ticketPromedio` | 1,608 ms | 0,161 s | Dos recorridos lineales; constante de trabajo incluida en la medición. |
| `ventaValida` | 0,265 ms | 0,027 s | O(n), 100 veces el tamaño. |
| `normalizarTexto` | 0,002 ms por cadena | Aproximadamente 2 s si se normaliza una cadena por venta. | Longitud de texto similar a la muestra; no es una llamada que procese el arreglo por sí sola. |
| `ventasPorCiudad` | 6,918 ms | 0,692 s | O(n), longitud de ciudad acotada. |
| `ventasPorCiudadM` | 10,028 ms | 1,003 s | O(n) y arreglo filtrado de coincidencias. |
| `totalPorCiudad` | 9,553 ms | 0,955 s | O(n); el generador mantiene cuatro ciudades. |
| `unidadesPorProducto` | 10,447 ms | 1,045 s | O(n); el generador mantiene cinco productos. |
| `topProductosPorValor` | 1,236 ms | 0,124 s con 5 productos; cerca de 0,185 s si `p` creciera hasta `n`. | O(n + p log p); el segundo cálculo escala también por el ordenamiento. |
| `ventasDelDia` | 0,228 ms | 0,023 s | O(n); excluye imprimir las ventas encontradas. |
| `totalVendidoIntrumentado` | 1,573 ms | 0,157 s | O(n), 100 veces el tamaño. |
| `ventaMayorIntrumentado` | 2,748 ms | 0,275 s | O(n), 100 veces el tamaño. |
| `totalPorCiudadInstrumentado` | 10,134 ms | 1,013 s | O(n); el generador mantiene cuatro ciudades. |
| `primeraVentaInstrumentada` | 0,001 ms | Aproximadamente 0,001 ms. | O(1), el tamaño no cambia su trabajo. |
| `clientesRecurrentes` | 581,144 ms con 10.000; 1 min 27,368 s con 100.000 en la medición del MiniReto 6 | Aproximadamente 1 h 37 min–2 h 26 min si se mantiene el crecimiento cuadrático observado. Una extrapolación cúbica desde 10.000 daría cerca de 6,7 días. | No hay una cota práctica segura con `includes`; el peor caso es O(n³). Las cifras son ilustrativas y dependen mucho del patrón de clientes. |
| `totalCiudadCadena` | 9,944 ms | 0,994 s | O(n), escala lineal; conserva arreglos intermedios O(n). |
| `totalCiudadUnaPasada` | 7,731 ms | 0,773 s | O(n), escala lineal y espacio adicional O(1). |
| Reporte general de `reporte.js` (cálculos, sin imprimir) | 26,391 ms | Aproximadamente 2,64 s | Se midió la secuencia de indicadores del reporte con la misma muestra; escala aproximadamente lineal con las cuatro ciudades y cinco productos del generador. |

Para el reporte general, la prueba incluyó resumen, ticket, venta mayor,
agrupaciones, top 3 y dos consultas de fecha. La estimación no incluye el coste
de `console.log`, el formato completo de la salida ni la generación de un millón
de ventas. El tiempo real de una ejecución completa dependerá también de la
memoria disponible y del volumen que se imprima.

## Riesgos

Ordenados de mayor a menor riesgo al aumentar los datos:

1. **`clientesRecurrentes` — riesgo muy alto.** El doble ciclo compara O(n²)
   pares y cada `includes` puede revisar hasta O(n) clientes. El peor caso es
   O(n³), además de guardar una lista O(n). Es el crecimiento más peligroso.
2. **`topProductosPorValor` — alto si aumenta la variedad de productos.** Debe
   ordenar `p` productos distintos, O(n + p log p), y guardar sus acumulados y
   entradas, O(p). El generador actual solo produce cinco productos, pero el
   coste cambia si la fuente de datos tiene muchos productos distintos.
3. **`totalCiudadCadena`, `ventasPorCiudadM` y `ventasDelDia` — riesgo medio.**
   Su tiempo es lineal, pero crean arreglos y retienen resultados que pueden
   crecer hasta O(n). La versión encadenada también copia cada venta al inicio.
4. **`totalPorCiudad`, `totalPorCiudadInstrumentado` y
   `unidadesPorProducto` — riesgo medio-bajo.** Recorren en O(n), pero guardan
   una entrada por categoría distinta. Su espacio crece si aumentan las
   ciudades o los productos.
5. **Recorridos lineales sin colecciones crecientes**, como `totalVentas`,
   `ticketPromedio`, `ventasPorCiudad` y `totalCiudadUnaPasada`. Su trabajo
   aumenta proporcionalmente a las ventas y usan espacio O(1) respecto de n.
6. **Ayudantes de trabajo constante por registro**, como `valorVenta` y
   `primeraVentaInstrumentada`. Su coste aislado no crece con el arreglo.

El criterio combina el orden de crecimiento temporal, el almacenamiento
adicional y el comportamiento medido. Un tiempo corto con 10.000 registros no
quita riesgo a una función cuyo peor caso crece cúbicamente.

## Plan de optimización

La prioridad es `clientesRecurrentes`. Hoy repite dos trabajos: vuelve a comparar
los mismos pares de ventas en los ciclos anidados y, cuando encuentra clientes
iguales, busca con `includes` en la lista de recurrentes, que puede ser cada vez
más larga.

La mejora propuesta, todavía **sin implementar**, es guardar en un `Map` cuántas
veces aparece cada identificador de cliente durante un único recorrido.
Después se seleccionan los identificadores con conteo mayor que uno. El mapa
conserva la información ya calculada y evita volver a comparar pares y buscar
repetidamente en un arreglo. El tiempo esperado pasaría a O(n) y el espacio
sería O(c), donde `c` es la cantidad de clientes distintos.

## Revisión por un compañero

Solicitud sugerida para enviar junto con este informe:

> ¿Puedes revisar `RENDIMIENTO.md`? En particular, valida que estén incluidas
> todas las funciones del motor, que las proyecciones distingan los supuestos
> del generador y que el riesgo de `clientesRecurrentes` esté bien explicado.
> Compárteme una observación concreta para responderla en la bitácora.

La revisión debe confirmarse antes de registrar una observación o su respuesta;
no se atribuye una revisión a un compañero que todavía no haya ocurrido.
