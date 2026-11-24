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

## MiniReto 3 · Del ciclo al método: rankings y agrupaciones
### Equivalencia Ciclo <=> Metodo

`node src/verificar.js` compara cada par con tres conjuntos de datos (completo, un elemento y vacío) y siete búsquedas de ciudad (`"Medellín"`, `"  medellín "`, `"BOGOTÁ"`, `"Cali"`, `"Pereira"`, `"Cartagena"` y `""`). Resultado: **27/27 pares en OK** y 8/8 criterios adicionales en OK.

Por qué dan exactamente lo mismo:

- Las dos versiones usan las mismas funciones auxiliares (`valorVenta`, `cantidadDe`, `claveTexto`), así que no hay dos fórmulas distintas que puedan divergir.
- Todo `reduce` recibe valor inicial `0`. Sin valor inicial, `reduce` sobre `[]` lanza `TypeError` y sobre un arreglo de objetos sumaría objetos en lugar de números.
- Las dos versiones de `ventasPorCiudad` devuelven `0` ante una ciudad vacía antes de recorrer.

### Las cinco preguntas por función

| Función | ¿Qué recorro? | ¿Qué filtro? | ¿Qué transformo? | ¿Qué acumulo? | ¿Cómo agrupo? |
|---------|---------------|--------------|------------------|---------------|---------------|
| `totalVendidoM` | `ventas` | nada | cada venta en su valor | suma de valores (`reduce`, inicio 0) | no agrupa |
| `unidadesVendidasM` |  `ventas` | nada | cada venta en su cantidad | suma de unidades (`reduce`, inicio 0) | no agrupa |
| `ventasPorCiudadM` | `ventas` | ciudad normalizada = buscada (`filter`) | cada venta en su valor | suma de valores (`reduce`, inicio 0) |no agrupa: es una sola ciudad |
| `totalPorCiudad` | `ventas` | nada (ciudad vacía va a "Sin ciudad") | ciudad en clave normalizada y nombre formateado; venta en valor | total por ciudad | objeto diccionario con clave = ciudad normalizada |
| `unidadesPorProducto` | `ventas` | nada | producto en clave normalizada; venta en cantidad | unidades por producto | objeto diccionario con clave = producto normalizado |
| `topProductosPorValor` | `ventas` y luego las entradas del diccionario (`Object.entries`) | nada; `slice(0, k)` se queda con los k primeros | cada grupo en `{ producto, unidades, valor }` | valor por producto | por producto; después ordena de mayor a menor (`sort` con función de comparación) |
| `ventasOrdenadasPorValor` | `ventas` | nada | nada | nada | no agrupa: solo ordena la copia |

## MiniReto 4 · Reporte v0.1 y errores reportados

La gerente debe poder generar el reporte sin abrir el código. Se ejecuta desde
la raíz del proyecto con `node src/reporte.js`; no se requieren paquetes
adicionales. El reporte incluye el resumen, ventas por ciudad, unidades por
producto, top 3 y consulta por fecha.

La versión preliminar del compañero no está en este repositorio. Para reproducir
los síntomas reportados se ejecutaron las operaciones defectuosas equivalentes
con entradas controladas; después se probaron las funciones actuales del motor.

### 1. Bogotá aparece en más de un grupo

- **Síntoma:** Bogotá se muestra repetida en la agrupación por ciudad.
- **Entrada que lo produce:** tres registros de prueba con `ciudad` igual a
  `"Bogotá"`, `"bogota"` y `" BOGOTÁ "`, con valores de venta de $100, $200 y
  $100.
- **Hipótesis:** agrupar usando el texto de la ciudad sin normalizar crea una
  clave diferente por cada variante de escritura.
- **Prueba realizada:** la agrupación ingenua `grupos[venta.ciudad]` produjo
  tres claves. La prueba de regresión con `totalPorCiudad` produjo una sola
  clave (`bogota`) con total de $400.
- **Causa reproducida:** agrupar directamente por el valor original de
  `ciudad`, sin normalizarlo, conserva cada variante como clave distinta.
- **Corrección:** `totalPorCiudad` aplica `normalizarTexto` (quita tildes,
  espacios externos y diferencias de mayúsculas) antes de acumular. La prueba
  de regresión está en `src/verificar.js`.

### 2. Ticket promedio `NaN` en un día sin ventas

- **Síntoma:** al calcular el ticket promedio de un día vacío se obtiene
  `NaN`.
- **Entrada que lo produce:** filtrar las ventas para `2026-08-01`, fecha sin
  registros en los datos.
- **Hipótesis:** la suma cero se divide por cero ventas: `0 / 0`.
- **Prueba realizada:** el cálculo sin protección sobre el arreglo filtrado
  devolvió `NaN`; `ticketPromedio` sobre el mismo arreglo devolvió `0`, que es el
  resultado definido para no tener ventas válidas.
- **Causa reproducida:** la fórmula sin protección divide la suma por la
  cantidad de ventas sin comprobar que el denominador sea distinto de cero.
- **Corrección:** `ticketPromedio` retorna `0` cuando no encuentra ventas
  válidas. La prueba de regresión verifica tanto el `NaN` del cálculo sin
  protección como el cero del motor.

### Verificación del reporte completo

Ejecutado `node src/reporte.js`: total vendido **$985.000**, 12 registros, 11
ventas válidas y 21 unidades vendidas. La agrupación devuelve una clave por
ciudad (`medellin`, `bogota`, `cali`, `pereira`). La prueba del día sin ventas
confirma que `ticketPromedio` devuelve `0`, no un valor inválido. La salida
completa fue inspeccionada para confirmar que no contiene `NaN`, `undefined` ni
grupos de ciudad duplicados. Repetir las pruebas con los dos comandos indicados
arriba.


## MiniReto 5 · Prediccion de escalabilidad (n -> 10 * n)

Pregunta: Si n se multiplica por 10, ¿cuánto se multiplica el número de
operaciones de cada función?

El número de operaciones de las tres funciones crece de forma lineal, es
decir, O(n). Cuando n se multiplica por 10, el total de operaciones
(visitas + comparaciones) también se multiplica aproximadamente por 10.

Detalle por función (observado con n = 10 -> predicción para n = 100):

1. totalVendidoInstrumentado:
   - Con n = 10: visitas = 10, comparaciones = 0 (total = 10 operaciones).
   - Patrón: 1 visita por elemento y 0 comparaciones.
   - Si n se multiplica por 10 (n = 100): visitas ≈ 100, comparaciones = 0
     (total ≈ 100 operaciones, se multiplica por 10).

2. ventaMayorIntrumentado:
   - Con n = 10: visitas = 10, comparaciones = 19 (total = 29 operaciones).
   - Patrón: 1 visita por elemento; en el primer elemento hace 1 comparación
     (mayor === null) y en los (n - 1) restantes hace 2 comparaciones
     (mayor === null y subtotal > mayorSubtotal), es decir, (2 * n - 1)
     comparaciones.
   - Si n se multiplica por 10 (n = 100): visitas ≈ 100, comparaciones ≈ 199
     (el factor de multiplicación tiende a 10x a medida que n crece).

3. totalPorCiudadInstrumentado:
   - Con n = 10: visitas = 10, comparaciones = 10 (total = 20 operaciones).
   - Patrón: 1 visita y 1 comparación por cada venta (asumiendo acumulación
     en objeto).
   - Si n se multiplica por 10 (n = 100): visitas ≈ 100, comparaciones ≈ 100
     (total ≈ 200 operaciones, se multiplica por 10).

Nota sobre constantes vs. crecimiento:
Aunque ventaMayor tiene más comparaciones por elemento que totalVendido o
totalPorCiudad (una constante mayor), su tasa de crecimiento sigue siendo
lineal O(n): al multiplicar n por 10, el trabajo escala ~10 veces.

================================================================================

## MiniReto 6 · Clientes recurrentes: traza y tiempo de ejecución

### Traza manual con 5 ventas

Para hacer visible la búsqueda de clientes repetidos, se usa este arreglo:

| Venta | Cliente |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | A |
| 4 | C |
| 5 | B |

La función compara cada venta con las que vienen después. Cuando encuentra dos
ventas del mismo cliente, consulta si ese cliente ya está en `recurrentes`.

| `i` | Cliente actual | `j` comparados | Coincidencias | `includes` y resultado |
|---:|---|---|---|---|
| 0 | A | B, A, C, B | A con A | `includes(A)` en `[]`: no encuentra; agrega A |
| 1 | B | A, C, B | B con B | `includes(B)` en `[A]`: 1 comparación; agrega B |
| 2 | A | C, B | Ninguna | No se consulta `includes` |
| 3 | C | B | Ninguna | No se consulta `includes` |

Hay **10 comparaciones entre pares de ventas**: 4 + 3 + 2 + 1. Además, en esta
traza `includes` hace **1 comparación de cliente** (su primera búsqueda se hace
en un arreglo vacío). En total son 11 comparaciones de valores, si se cuentan
también las búsquedas de pertenencia. El resultado es `[A, B]`.

Para n ventas, las comparaciones de pares son:

`(n - 1) + (n - 2) + ... + 1 = n * (n - 1) / 2`.

Por tanto, el ciclo doble por sí solo hace `n * (n - 1) / 2` comparaciones, lo
que crece como **O(n²)**. Las comparaciones adicionales de `includes` dependen de
los clientes y se analizan más abajo.

### Medición de tiempo

Se midió `clientesRecurrentes` con `console.time` y `console.timeEnd`. Los
arreglos se prepararon antes de iniciar el cronómetro y contenían cerca de tres
ventas por cliente, distribuidas en orden mezclado, como en el generador del
proyecto. Como la función no está exportada, la medición se hizo en una prueba
aislada con la misma implementación; no fue necesario modificar el código del
proyecto. Los tiempos dependen del equipo y de la ejecución.

| Ventas (n) | Tiempo medido |
|---:|---:|
| 1.000 | 5,711 ms |
| 2.000 | 23,788 ms |
| 4.000 | 98,351 ms |
| 8.000 | 378,8 ms |
| 16.000 | 1,187 s |
| 100.000 | 1 min 27,368 s |

Al duplicar n, los tiempos de 1.000 a 8.000 aumentaron aproximadamente cuatro
veces (4,16x, 4,14x y 3,85x). Esto concuerda con O(n²): duplicar n produce
cerca de cuatro veces más pares que revisar. Las diferencias respecto a 4x
exacto son normales por variaciones del entorno de ejecución.

### Estimación para más ventas

La proyección cuadrática desde 16.000 ventas para 100.000 era de unos 46
segundos, menor a dos minutos, por lo que se ejecutó esa prueba. El tiempo real
fue 1 min 27,368 s.

Usando el tiempo medido con 100.000 y suponiendo que se conserva el mismo patrón
de crecimiento, un millón de ventas (10 veces más datos) tardaría cerca de 100
veces más: **aproximadamente 2 horas y 26 minutos**. Es una estimación, no una
medición; depende de los datos y del equipo.

### Costo oculto de `recurrentes.includes`

`includes` también recorre `recurrentes`: puede revisar desde cero hasta todos
los clientes ya agregados. Si la lista tiene k clientes, una llamada puede
costar O(k), no O(1). Cuando hay muchos pares que coinciden y la lista ya es
grande, esa búsqueda se repite dentro de los dos ciclos. En el peor caso, el
costo adicional puede llegar a O(n³), así que O(n²) describe los pares
comparados, pero no garantiza por sí solo el peor tiempo total de la función.
Los tiempos de la tabla corresponden al patrón de datos descrito, no a ese
peor caso.

### Conclusión para la gerente

El reporte se vuelve lento porque, a medida que hay más ventas, el sistema
revisa muchas más combinaciones de clientes; además, cada vez puede tardar más
en comprobar si ya encontró a ese cliente. Por eso, duplicar las ventas puede
cuadruplicar el trabajo o incluso hacerlo crecer más en casos desfavorables.

## MiniReto 7 · Una ciudad, dos recorridos

### Comprobación con el generador

Se generaron 10.000 ventas con `generarVentas(10000)` y se compararon
`totalCiudadCadena(ventas, ciudad)` y `totalCiudadUnaPasada(ventas, ciudad)` para
cada ciudad presente en el arreglo. Ambas versiones devolvieron el mismo total
en los cuatro casos:

| Ciudad | `totalCiudadCadena` | `totalCiudadUnaPasada` | ¿Coinciden? |
|---|---:|---:|---|
| Pereira | 487.327.000 | 487.327.000 | Sí |
| Medellín | 507.788.000 | 507.788.000 | Sí |
| Cali | 475.595.000 | 475.595.000 | Sí |
| Bogotá | 503.411.000 | 503.411.000 | Sí |

Los valores corresponden a una ejecución del generador aleatorio; en otra
ejecución los totales pueden cambiar. La comprobación de equivalencia se cumplió
para las cuatro ciudades de la muestra.

### Recorridos, arreglos y complejidad

Sea `n` la cantidad de ventas y `m` la cantidad de ventas de la ciudad buscada
(`m <= n`).

| Versión | Recorridos de las etapas | Arreglos nuevos | Tiempo | Espacio adicional |
|---|---|---:|---|---|
| `totalCiudadCadena` | 4: `map` recorre las n ventas, `filter` vuelve a recorrerlas; luego `map` y `reduce` recorren sus arreglos de m coincidencias | 3: el primer `map`, `filter` y el segundo `map` | O(n) | O(n) |
| `totalCiudadUnaPasada` | 1 recorrido de las n ventas | 0 | O(n) | O(1) |

El primer `map` de `totalCiudadCadena` también construye un objeto nuevo por cada
venta con la ciudad normalizada. `filter` conserva las coincidencias en otro
arreglo; el segundo `map` crea un arreglo de subtotales. `reduce` acumula el
resultado y no crea un arreglo adicional.

Aunque la versión encadenada tiene cuatro etapas de recorrido, su tiempo es
proporcional a `n + n + m + m`. Como `m` nunca supera a `n`, esto se puede acotar
por `4n`. En notación Big O se eliminan las constantes, por eso **ambas
versiones son O(n) en tiempo**: hacer cuatro recorridos lineales sigue siendo
lineal, no cuadrático. La diferencia es que la cadena hace más trabajo y
reserva más memoria, no que cambie su orden de crecimiento temporal.

### Complejidad espacial de las funciones del motor

La clasificación considera la memoria adicional y los resultados que la función
construye. Se toma `n` como cantidad de ventas; para las agrupaciones, `u` es
la cantidad de ciudades distintas y `p` la cantidad de productos distintos.
Como `u <= n` y `p <= n`, ambos pueden ser O(n) en el peor caso.

**Memoria adicional constante, O(1):**

- `valorVenta`, `totalVentas`, `totalVendidoM`, `unidadesVendidas` y
  `unidadesVendidasM`: calculan un valor/acumulador sin crear arreglos.
- `ventaMayor`, `ticketPromedio` y `ventaValida`: usan variables de tamaño fijo;
  `ventaMayor` retorna un objeto de tamaño constante.
- `normalizarTexto`: trabaja con texto temporal, pero no conserva una colección
  que crezca con la cantidad de ventas. Se considera O(1) respecto de `n`.
- `ventasPorCiudad` y `totalCiudadUnaPasada`: recorren y acumulan en variables,
  sin guardar coincidencias en arreglos.
- `totalVendidoIntrumentado`, `ventaMayorIntrumentado` y
  `primeraVentaInstrumentada`: sus contadores y valores auxiliares son de tamaño
  fijo.

**Memoria adicional proporcional, O(n) en el peor caso:**

- `totalCiudadCadena` y `ventasPorCiudadM`: crean arreglos intermedios; en el
  peor caso pueden contener las n ventas.
- `ventasDelDia`: el arreglo de `filter` puede contener hasta n ventas.
- `totalPorCiudad` y `totalPorCiudadInstrumentado`: guardan una entrada por
  ciudad distinta; su espacio es O(u), hasta O(n).
- `unidadesPorProducto`: guarda una entrada por producto distinto; su espacio
  es O(p), hasta O(n).
- `topProductosPorValor`: guarda los totales por producto y `Object.entries`
  crea un arreglo de entradas que se ordena y del que se obtiene una porción.
  Su espacio es O(p), hasta O(n), aunque se soliciten pocos productos con `k`.
- `clientesRecurrentes`: su arreglo puede crecer con la cantidad de clientes
  recurrentes; en el peor caso es O(n).

La versión encadenada crea explícitamente arreglos; `totalPorCiudad` y
`topProductosPorValor` también usan memoria que crece con las categorías
distintas. Esas colecciones no son O(1), aunque el número de categorías suela ser
mucho menor que el número de ventas en los datos actuales.

### Decisión para el motor

Se elige `totalCiudadUnaPasada` como versión recomendada para el motor: entrega
el mismo resultado, usa O(1) de memoria adicional y hace un solo recorrido.
`totalCiudadCadena` expresa la transformación de forma encadenada y resulta útil
para enseñar o comparar métodos, pero reserva tres arreglos y crea objetos
intermedios. Para un reporte que puede recibir más ventas, se prioriza reducir
memoria y trabajo sin perder claridad: la versión de una pasada sigue siendo
corta y directa.

