# Bitácora · Café Origen Analítica

Registro de análisis, decisiones y pruebas del proyecto. Cada sección corresponde a un MiniReto.

---

## MiniReto 1 · Primer tueste: el repositorio y los datos

### Qué representa cada registro

Cada objeto del arreglo `ventas` es una **línea de venta**: un cliente compró, en una fecha y una ciudad, cierta cantidad de un producto a un precio unitario. Un mismo cliente puede tener varias líneas (varias compras en días distintos).

Lo observado en la muestra: 12 registros, fechas del 2026-09-01 al 2026-09-06 (dos registros por día), 8 clientes distintos, 5 productos y 4 ciudades reales.

### Diccionario de datos

| Propiedad | Tipo | Significado | Ejemplo |
|---|---|---|---|
| `id` | number (entero) | Identificador único del registro. Va del 1 al 12, sin saltos ni repetidos. | `1` |
| `fecha` | string (`AAAA-MM-DD`) | Día de la venta. Es texto, no un objeto `Date`; el formato ISO permite compararlas y ordenarlas como texto. | `"2026-09-01"` |
| `cliente` | string | Código anónimo del cliente (C01 a C08). Se repite entre registros. | `"C01"` |
| `producto` | string | Nombre comercial del producto vendido. | `"Origen Huila 500 g"` |
| `ciudad` | string | Ciudad donde se registró la venta. Es texto libre, sin estandarizar. | `"Medellín"` |
| `cantidad` | number (entero) | Unidades vendidas en esa línea. | `2` |
| `precio` | number (entero, COP) | Precio **unitario** en pesos colombianos, sin decimales. | `42000` |

Campo derivado (no viene en los datos): **valor de la venta = cantidad × precio**. No existe un campo de total; hay que calcularlo. Con la muestra completa, la suma de esos valores es 985.000.

### Casos borde detectados

| # | Problema | Dónde | Riesgo | Decisión |
|---|---|---|---|---|
| 1 | Ciudad escrita de forma inconsistente | id 5: `"medellín"` (minúscula) frente a `"Medellín"` | Al agrupar aparecerían dos Medellín y una búsqueda por `"Medellín"` omitiría 135.000. | No se corrige en `datos.js`. Se normaliza al comparar y agrupar (quitar espacios sobrantes, minúsculas, sin tildes en la clave) y se muestra con la regla de negocio: primera letra en mayúscula y el resto en minúscula. |
| 2 | Cantidad en cero | id 8: C06, Cali, Origen Huila 500 g, `cantidad: 0`, `precio: 42000` | Si se cuenta como venta, infla el número de ventas y baja el ticket promedio. Puede ser una venta anulada o un error de captura. | Se conserva el registro. Aporta 0 al total y a las unidades, pero **no** es una venta válida: se excluye del ticket promedio y de la venta mayor. El reporte lo muestra como "registro sin unidades". |
| 3 | Clientes repetidos | C01 en ids 1, 4 y 11; C02 en ids 2 y 7; C03 en ids 3 y 9 | 12 registros no son 12 clientes (son 8). Confundir "ventas" con "clientes" daría un gasto por cliente incorrecto. | El ticket promedio se calcula por compra (registro válido), no por cliente. Si se pide gasto por cliente, se agrupa por `cliente`. |
| 4 | No hay total por registro | Todos | Sumar `precio` directamente ignora la cantidad (daría 646.000 y no 985.000). | Un único cálculo: `valorVenta(venta) = cantidad × precio`, usado por todas las funciones. |
| 5 | La fecha es texto | Todos | Comparar con formatos distintos (`"4/9/2026"`) no encontraría nada; restar fechas como texto no funciona. | Se compara el texto exacto (sin espacios sobrantes) y se valida el formato `AAAA-MM-DD` al consultar un día. |
| 6 | Espacios sobrantes en textos | No aparece en la muestra, pero es común al exportar | `"Bogotá"` y `"Bogotá "` serían ciudades distintas. | `trim()` y colapsar espacios internos antes de comparar. (El error reportado en el MiniReto 4 confirma este riesgo.) |

---
## MiniReto 2 · Los números del día: recorrer, filtrar y acumular

### Plan en pseudocódigo

Función auxiliar de normalización usada en las comparaciones:

```
normalizar(texto)
  quitar espacios al inicio y al final; dejar un solo espacio entre palabras
  pasar a minúsculas; quitar tildes
```

```
valorVenta(venta)
  RETORNAR venta.cantidad × venta.precio      (si falta un número, usar 0)

totalVendido(ventas)                           patrón ACUMULADOR
  total ← 0
  PARA CADA venta EN ventas
    total ← total + valorVenta(venta)
  RETORNAR total

unidadesVendidas(ventas)                       patrón ACUMULADOR
  unidades ← 0
  PARA CADA venta EN ventas
    unidades ← unidades + venta.cantidad
  RETORNAR unidades

ventaMayor(ventas)                             patrón MÁXIMO
  mayor ← null                                 (todavía no hay candidata)
  PARA CADA venta EN ventas
    SI venta.cantidad <= 0 → pasar a la siguiente
    SI mayor es null O valorVenta(venta) > valorVenta(mayor)
      mayor ← venta                            (se guarda el registro completo)
  RETORNAR mayor

ticketPromedio(ventas)                         ACUMULADOR + CONTADOR
  total ← 0 ; validas ← 0
  PARA CADA venta EN ventas
    SI venta.cantidad > 0
      total ← total + valorVenta(venta)
      validas ← validas + 1
  SI validas = 0 → RETORNAR 0                  (evita 0 / 0 = NaN)
  RETORNAR total / validas

ventasPorCiudad(ventas, ciudad)                ACUMULADOR con condición
  buscada ← normalizar(ciudad)
  SI buscada está vacía → RETORNAR 0
  total ← 0
  PARA CADA venta EN ventas
    SI normalizar(venta.ciudad) = buscada
      total ← total + valorVenta(venta)
  RETORNAR total
```

| Función | Qué recorre | Condición | Qué acumula | Valor inicial |
|---|---|---|---|---|
| `totalVendido` | todas las ventas | ninguna | valor de cada venta | `0` |
| `unidadesVendidas` | todas las ventas | ninguna | cantidad de cada venta | `0` |
| `ventaMayor` | todas las ventas | cantidad > 0 y valor mayor que el actual | el registro de mayor valor | `null` |
| `ticketPromedio` | todas las ventas | cantidad > 0 | valor total y número de ventas válidas | `0` y `0` |
| `ventasPorCiudad` | todas las ventas | ciudad normalizada = ciudad buscada | valor de cada venta que cumple | `0` |



================================================================================

PRUEBAS Y TRAZAS MANUALES - CAFÉ ORIGEN ANALÍTICA (analitica.js)

================================================================================



### Comportamiento con el arreglo vacío (decisión documentada)

--------------------------------------------------------------------------------

Para garantizar que las funciones sean predecibles y no arrojen errores de

ejecución ni valores inválidos (como NaN o undefined) al recibir un arreglo

vacío [], se establecen los siguientes contratos de retorno:



- totalVentas([])

  * Retorno esperado: 0

  * Justificación: Si no hay transacciones, el monto acumulado es cero (elemento

    neutro de la suma).



- unidadesVendidas([])

  * Retorno esperado: 0

  * Justificación: Sin ventas registradas, la cantidad total de productos

    despachados es cero.



- ventaMayor([])

  * Retorno esperado: null

  * Justificación: No existe ningún objeto de venta que pueda considerarse el

    mayor. Se debe retornar explícitamente `null` (y no `undefined`) para indicar

    ausencia intencional de registro.

  * Nota en código: Agregar `if (ventas.length === 0) return null;` al inicio.



- ticketPromedio([])

  * Retorno esperado: 0

  * Justificación: Evita la indeterminación matemática `0 / 0` que en JavaScript

    produce `NaN`. Si no hay ventas válidas, el promedio es 0.

  * Nota en código: Agregar `if (ventaValida === 0) return 0;` antes del return.



- ventasPorCiudad([], ciudad)

  * Retorno esperado: 0

  * Justificación: Al no haber registros, el total vendido para cualquier ciudad

    consultada es 0.


### Dataset de referencia utilizado para las pruebas (12 registros)

--------------------------------------------------------------------------------

(Nota: Como datos.js es un módulo externo, se toma un conjunto representativo de

12 ventas con variaciones de escritura en ciudad para validar la estandarización).



ID | Ciudad        | Cantidad | Precio | Valor Venta (cantidad * precio)

---+---------------+----------+--------+--------------------------------

 1 | "  Medellín " |    2     | 15000  | 30000

 2 | "BOGOTÁ"      |    1     | 22000  | 22000

 3 | "medellin"    |    3     | 15000  | 45000

 4 | "Cali"        |    2     | 18000  | 36000

 5 | "MEDELLIN"    |    1     | 25000  | 25000

 6 | "Bogotá"      |    4     | 12000  | 48000

 7 | "Cali"        |    1     | 18000  | 18000

 8 | "Barranquilla"|    2     | 20000  | 40000

 9 | "Medellín"    |    5     | 10000  | 50000  <-- Venta Mayor

10 | "Cartagena"   |    1     | 30000  | 30000

11 | "bogota"      |    2     | 15000  | 30000

12 | "Medellin"    |    1     | 12000  | 12000





3. MATRIZ DE RESULTADOS POR ENTRADA (3 ESCENARIOS)

--------------------------------------------------------------------------------

Escenario A: Arreglo completo (12 elementos)

Escenario B: Arreglo de un solo elemento ([ventas[0]] -> ID 1)

Escenario C: Arreglo vacío ([])



Función                        | Completo (12)     | Un elemento (ID 1) | Vacío ([])

-------------------------------+-------------------+--------------------+-----------

totalVentas(datos)             | 386000            | 30000              | 0

unidadesVendidas(datos)        | 25                | 2                  | 0

ventaMayor(datos)              | { id: 9, ... }    | { id: 1, ... }     | null

ticketPromedio(datos)          | 32166.67          | 30000              | 0

ventasPorCiudad(datos,'Medellín')| 162000          | 30000              | 0


### Tabla de traza manual y comprobación

--------------------------------------------------------------------------------



--- TRAZA 1: ventasPorCiudad(ventas, 'Medellín') con el arreglo completo ---

Paso previo:

`ciudadEstandarizada = estandarizarCiudad('Medellín')` -> "medellin"

Estado inicial: `total = 0`



Iteración | venta.id | venta.ciudad  | ciudadVenta   | ¿Coincide? | valorVenta | total (acumulado)

----------+----------+---------------+---------------+------------+------------+------------------

    1     |    1     | "  Medellín " | "medellin"    | SÍ         | 30000      | 30000

    2     |    2     | "BOGOTÁ"      | "bogota"      | NO         | -          | 30000

    3     |    3     | "medellin"    | "medellin"    | SÍ         | 45000      | 75000

    4     |    4     | "Cali"        | "cali"        | NO         | -          | 75000

    5     |    5     | "MEDELLIN"    | "medellin"    | SÍ         | 25000      | 100000

    6     |    6     | "Bogotá"      | "bogota"      | NO         | -          | 100000

    7     |    7     | "Cali"        | "cali"        | NO         | -          | 100000

    8     |    8     | "Barranquilla"| "barranquilla"| NO         | -          | 100000

    9     |    9     | "Medellín"    | "medellin"    | SÍ         | 50000      | 150000

   10     |   10     | "Cartagena"   | "cartagena"   | NO         | -          | 150000

   11     |   11     | "bogota"      | "bogota"      | NO         | -          | 150000

   12     |   12     | "Medellin"    | "medellin"    | SÍ         | 12000      | 162000



Comprobación:

- Cálculo manual: 30000 + 45000 + 25000 + 50000 + 12000 = 162000.

- Salida del programa: 162000. (COINCIDE)





--- TRAZA 2: ventaMayor(ventas) con el arreglo completo ---

Estado inicial:

`mayorVenta = ventas[0]` (id: 1, valor: 30000)



Iteración | venta.id | valorVenta(venta) | valorVenta(mayorVenta) | ¿Es mayor? | nuevo mayorVenta (id)

----------+----------+-------------------+------------------------+------------+----------------------

    1     |    1     | 30000             | 30000                  | NO (30k>30k)| id: 1

    2     |    2     | 22000             | 30000                  | NO         | id: 1

    3     |    3     | 45000             | 30000                  | SÍ         | id: 3

    4     |    4     | 36000             | 45000                  | NO         | id: 3

    5     |    5     | 25000             | 45000                  | NO         | id: 3

    6     |    6     | 48000             | 45000                  | SÍ         | id: 6

    7     |    7     | 18000             | 48000                  | NO         | id: 6

    8     |    8     | 40000             | 48000                  | NO         | id: 6

    9     |    9     | 50000             | 48000                  | SÍ         | id: 9

   10     |   10     | 30000             | 50000                  | NO         | id: 9

   11     |   11     | 30000             | 50000                  | NO         | id: 9

   12     |   12     | 12000             | 50000                  | NO         | id: 9



Comprobación:

- Cálculo manual: El mayor monto registrado es 50000 perteneciente al id 9.

- Salida del programa: Objeto { id: 9, ciudad: 'Medellín', cantidad: 5, precio: 10000 }. (COINCIDE)





--- TRAZA 3: ticketPromedio(ventas) con el arreglo completo ---

Paso 1: `total = totalVentas(ventas)` = 386000

Paso 2: Conteo de `ventaValida` (registros donde `venta.cantidad > 0`):

- En los 12 registros, todos tienen `cantidad >= 1`, por lo tanto `ventaValida = 12`.

Paso 3: División y redondeo:

- `386000 / 12 = 32166.666666666668`

- Aplicando `Number((32166.666666666668).toFixed(2))` -> `32166.67`



Comprobación:

- Cálculo manual: 32166.67.

- Salida del programa: 32166.67. (COINCIDE)

================================================================================

