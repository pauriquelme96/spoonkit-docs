# Guía de Signals: Todo lo que necesitas saber

> **💡 Nota importante:** Spoonkit Signals está construido sobre [`@preact/signals-core`](https://www.npmjs.com/package/@preact/signals-core), una librería de gestión de estado de alto rendimiento. Esta guía documenta la API de Spoonkit (`state()`, `calc()`, `monitor()`, `stateObject()`, `stateArray()`), que envuelve las primitivas de Preact en una API propia para evitar dependencias directas.

## 🎯 ¿Qué son los Signals?

Los **signals** son contenedores reactivos para valores que pueden cambiar con el tiempo. Son como variables inteligentes que automáticamente notifican y actualizan todo lo que depende de ellas cuando su valor cambia.

El sistema de signals de Spoonkit está diseñado para ser:

- ⚡ **Performante**: Optimiza automáticamente las actualizaciones para mantener tu app rápida
- 🎯 **Lazy por defecto**: Solo actualiza lo que realmente está siendo observado
- 🧠 **Inteligente**: Salta automáticamente signals que nadie está escuchando
- 🔄 **Reactivo**: Cuando cambias un valor, todas las dependencias se actualizan solas

**Piénsalo así:**

- **Variable normal**: Cambias el valor → tienes que actualizar todo manualmente 😓
- **Signal**: Cambias el valor → todo se actualiza solo ✨

### ¿Cómo funcionan?

Los signals funcionan mediante un **sistema de suscripciones automáticas**:

1. Cuando lees un signal dentro de un `calc()` o `monitor()`, automáticamente te suscribes a él
2. Cuando el signal cambia, notifica a todos sus suscriptores
3. Las actualizaciones se propagan de forma eficiente, ejecutando solo lo mínimo necesario
4. El sistema de reactividad es completamente transparente: no necesitas declarar dependencias manualmente

---

## 📦 Los 3 tipos de Signals básicos

### 1. `state()` - El Signal básico

Es el signal más simple y fundamental. Guarda un valor que puede cambiar con el tiempo y notifica automáticamente a sus suscriptores cuando lo modificas.

```typescript
import { state } from "./lib/signals/State";

// Crear un state
const nombre = state("Ana");

// Leer el valor (activa reactividad)
console.log(nombre.get()); // "Ana"

// Cambiar el valor (notifica a todos los suscriptores)
nombre.set("Luis");
console.log(nombre.get()); // "Luis"

// Leer sin activar reactividad (peek = "espiar")
console.log(nombre.peek()); // "Luis"

// También puedes crear un state vinculado a otro signal
// (se sincronizarán automáticamente, veremos esto más adelante)
const otroNombre = state(nombre);
```

**¿Cuándo usar `state()`?**

- Para valores simples que pueden cambiar: strings, números, booleanos, objetos, arrays
- Cuando necesitas guardar y actualizar datos reactivamente
- Para inputs de formularios, contadores, flags de carga, configuraciones
- Como fuente de verdad de la que derivan otros valores

**💡 Características clave:**

- **Escritura directa**: Usas `set()` para cambiar el valor de forma explícita
- **Actualizaciones síncronas**: Cuando haces `set()`, todos los dependientes se actualizan inmediatamente
- **Consistencia garantizada**: El estado de tu app siempre es consistente después de un `set()`
- **Trackeo automático**: No necesitas declarar manualmente qué depende de qué
- **Vinculable**: Puede sincronizarse automáticamente con otros signals (detallado más adelante)
- **Tipado fuerte**: TypeScript infiere automáticamente el tipo del valor

---

### 2. `calc()` - El Signal calculado

Es un signal derivado que combina valores de otros signals. Se recalcula automáticamente cuando cambian sus dependencias, pero solo si alguien lo está observando (es **lazy**).

```typescript
import { state } from "./lib/signals/State";
import { calc } from "./lib/signals/Calc";

const precio = state(100);
const descuento = state(0.2); // 20%

// El calc detecta automáticamente que depende de precio y descuento
const precioFinal = calc(() => {
  const p = precio.get();
  const d = descuento.get();
  return p * (1 - d);
});

console.log(precioFinal.get()); // 80

// Si cambias el precio, el calc se recalcula automáticamente
precio.set(200);
console.log(precioFinal.get()); // 160

// Si cambias el descuento, también se recalcula
descuento.set(0.5); // 50%
console.log(precioFinal.get()); // 100
```

**Ejemplo de dependencias dinámicas:**

```typescript
const modo = state<"simple" | "avanzado">("simple");
const valorA = state(10);
const valorB = state(20);
const valorC = state(30);

// Las dependencias cambian según el modo
const resultado = calc(() => {
  if (modo.get() === "simple") {
    return valorA.get(); // Solo depende de valorA
  } else {
    return valorB.get() + valorC.get(); // Depende de valorB y valorC
  }
});

console.log(resultado.get()); // 10

modo.set("avanzado");
console.log(resultado.get()); // 50 (20 + 30)

// Ahora valorA ya no afecta al resultado
valorA.set(100);
console.log(resultado.get()); // 50 (sin cambios)
```

**¿Cuándo usar `calc()`?**

- Para valores derivados de otros signals: cálculos, transformaciones, validaciones
- Cuando tienes una fórmula o cálculo que depende de otros valores reactivos
- Para transformar datos de forma reactiva manteniendo todo sincronizado
- Para valores de solo lectura que se mantienen actualizados automáticamente
- Para optimizar rendimiento con cache inteligente de resultados

**💡 Características clave:**

- **Solo lectura**: No puedes hacer `precioFinal.set(150)`, solo cambia cuando cambian sus dependencias
- **Lazy evaluation**: Solo se ejecuta cuando alguien lee su valor con `get()`, no antes
- **Cache inteligente**: Almacena el resultado y solo recalcula cuando alguna dependencia cambia
- **Detección automática**: Detecta sus dependencias sin que las declares manualmente
- **Dependencias dinámicas**: Las dependencias pueden cambiar según el flujo de ejecución (if/else, loops)
- **Optimización automática**: Si nadie lo observa, ni siquiera se actualiza
- **Encadenable**: Puedes crear calcs que dependan de otros calcs para cálculos complejos

---

### 3. `monitor()` - El Efecto reactivo

Es un efecto que se ejecuta automáticamente cada vez que cambian los signals que lee. **A diferencia de `calc()`**, no devuelve un valor derivado ni es lazy: se ejecuta **inmediatamente** al crearlo y luego cada vez que cambian sus dependencias. Su propósito es ejecutar **efectos secundarios** (side effects), no calcular valores.

```typescript
import { state } from "./lib/signals/State";
import { monitor } from "./lib/signals/Monitor";

const contador = state(0);

// Se ejecuta inmediatamente y cada vez que contador cambia
const dispose = monitor(() => {
  console.log(`El contador ahora vale: ${contador.get()}`);
});
// → Se ejecuta inmediatamente: "El contador ahora vale: 0"

contador.set(1);
// → Se ejecuta automáticamente: "El contador ahora vale: 1"

contador.set(5);
// → Se ejecuta automáticamente: "El contador ahora vale: 5"

// Cuando ya no lo necesites, limpia el efecto
dispose();
```

**¿Cuándo usar `monitor()`?**

- Para sincronizar con localStorage, sessionStorage, cookies
- Para hacer llamadas a APIs cuando algo cambia
- Para actualizar el DOM manualmente o integrar con librerías externas
- Para logging, debugging, analytics o métricas
- Para cualquier "efecto secundario" (side effect) que deba ocurrir al cambiar el estado
- Para conectar el mundo reactivo con el mundo exterior (APIs, almacenamiento, etc.)

**💡 Características clave:**

- **Ejecución inmediata**: Se ejecuta en cuanto lo creas, no espera a que lo lean (a diferencia de `calc()` que es lazy)
- **Para side effects**: Diseñado para efectos secundarios, no para calcular valores (usa `calc()` para eso)
- **Auto-tracking**: Detecta automáticamente qué signals lee dentro de la función
- **Limpieza manual**: Debes llamar a `dispose()` cuando termines para evitar fugas de memoria
- **Actualizaciones síncronas**: Cuando cambia una dependencia, se ejecuta inmediatamente
- **Sin valor de retorno**: No devuelve un valor reactivo (solo la función `dispose` para limpieza)

**🎯 Ejemplo con función de cleanup:**

```typescript
import { state } from "./lib/signals/State";
import { monitor } from "./lib/signals/Monitor";

const userId = state(1);

// Monitor con función de limpieza
const dispose = monitor(() => {
  const id = userId.get();
  console.log(`Cargando datos del usuario ${id}`);

  // Esta función de cleanup se ejecuta en DOS momentos:
  // 1. ANTES de que el monitor se vuelva a ejecutar (cuando cambia una dependencia)
  // 2. Cuando llamas a dispose() para detener el monitor completamente
  return () => {
    console.log(`Limpiando datos del usuario ${id}`);
  };
});

userId.set(2);
// → "Limpiando datos del usuario 1" (cleanup del monitor anterior)
// → "Cargando datos del usuario 2" (nueva ejecución del monitor)

userId.set(3);
// → "Limpiando datos del usuario 2" (cleanup del monitor anterior)
// → "Cargando datos del usuario 3" (nueva ejecución del monitor)

// Al terminar de usar el monitor
dispose();
// → "Limpiando datos del usuario 3" (cleanup final)
```

**⚠️ Importante sobre cleanup:**
La función de cleanup se ejecuta automáticamente **antes de cada re-ejecución** del monitor, no solo cuando haces `dispose()`. Esto es crucial para limpiar recursos (timers, subscripciones, event listeners) antes de crearlos de nuevo, evitando fugas de memoria.

---

## 🔑 Conceptos Clave de Reactividad

### Lazy por defecto

Los signals son **lazy** (perezosos): las actualizaciones de los `calc()` solo ocurren si alguien está escuchando. Un `calc()` no se ejecuta hasta que alguien lee su valor con `get()`. Si nadie observa un signal, las actualizaciones no se propagan.

```typescript
const a = state(1);
const b = state(2);

// Este calc NO se ejecuta todavía (nadie lo está leyendo)
const suma = calc(() => {
  console.log("Calculando suma");
  return a.get() + b.get();
});

// AHORA se ejecuta porque lo leímos
console.log(suma.get()); // → "Calculando suma", 3

a.set(10);
// NO se recalcula porque nadie está leyendo suma en este momento

console.log(suma.get()); // → "Calculando suma", 12
```

**Nota:** Los `monitor()` NO son lazy. Se ejecutan inmediatamente y cada vez que cambian sus dependencias, sin importar si alguien los observa.

### Actualizaciones síncronas

Cuando cambias un signal con `set()`, todas las actualizaciones ocurren **síncronamente** (inmediatamente). Tu app siempre está en un estado consistente.

```typescript
const nombre = state("Ana");
const apellido = state("García");
const nombreCompleto = calc(() => `${nombre.get()} ${apellido.get()}`);

monitor(() => {
  console.log(nombreCompleto.get());
});
// → "Ana García"

nombre.set("Luis");
// → Se ejecuta INMEDIATAMENTE: "Luis García"
```

### `get()` vs `peek()`

- **`get()`**: Lee el valor **Y se suscribe** a los cambios (activa la reactividad)
- **`peek()`**: Lee el valor **SIN suscribirse** (no activa la reactividad)

```typescript
const a = state(5);
const b = state(10);

// Este calc SOLO se suscribe a 'a', no a 'b'
const resultado = calc(() => {
  const valorA = a.get();   // ✅ Reactivo: se suscribe
  const valorB = b.peek();  // ❌ No reactivo: solo lee
  return valorA * valorB;
});

b.set(20); // resultado NO se recalcula
a.set(10); // resultado SÍ se recalcula
```

**¿Cuándo usar `peek()`?**

- Para logging o debugging sin crear dependencias
- Para evitar bucles infinitos en monitors
- Para leer un valor "auxiliar" que no debe disparar recálculos
- Para comparar valores sin suscribirse (ej: "¿cambió realmente?")

---

## 🧩 Signals Compuestos

### `stateObject()` - Objeto reactivo

Agrupa varios signals en un objeto reactivo donde cada propiedad mantiene su propia reactividad individual.

**Perfecto para:** Modelos de entidades, formularios complejos, estado estructurado con múltiples campos

```typescript
import { state } from "./lib/signals/State";
import { stateObject } from "./lib/signals/stateObject";

const usuario = stateObject({
  nombre: state("Ana"),
  edad: state(25),
  email: state("ana@example.com"),
});

// Obtener todo el objeto (devuelve una copia para evitar mutaciones)
console.log(usuario.get());
// { nombre: "Ana", edad: 25, email: "ana@example.com" }

// Acceder a un campo individual como signal
console.log(usuario.nombre.get()); // "Ana"

// Cambiar un campo individual
usuario.nombre.set("Carlos");

// Actualización parcial: solo cambiar algunos campos
usuario.set({
  nombre: "Luis",
  edad: 30,
  // email no cambia
});

console.log(usuario.get());
// { nombre: "Luis", edad: 30, email: "ana@example.com" }

// Peek para leer sin activar reactividad
console.log(usuario.peek());
```

**Ejemplo con objetos anidados:**

```typescript
import { state } from "./lib/signals/State";
import { stateObject } from "./lib/signals/stateObject";
import { stateArray } from "./lib/signals/stateArray";

// Modelo complejo con stateObject anidado y stateArray
const producto = stateObject({
  id: state("P123"),
  nombre: state("Laptop"),
  precio: state(999),
  tags: stateArray(() => state<string>()),
  // StateObject anidado para información del vendedor
  vendedor: stateObject({
    nombre: state("Tech Store"),
    rating: state(4.5),
  }),
});

// Inicializar con datos completos
producto.set({
  id: "P123",
  nombre: "Laptop",
  precio: 999,
  tags: ["electronics", "computers"],
  vendedor: { nombre: "Tech Store", rating: 4.5 },
});

// Acceder a propiedades anidadas
console.log(producto.vendedor.nombre.get()); // "Tech Store"
console.log(producto.vendedor.rating.get()); // 4.5

// Modificar solo una propiedad del objeto anidado
producto.vendedor.rating.set(4.8);

// Agregar un tag al array
producto.tags.push("featured");
console.log(producto.tags.get()); // ["electronics", "computers", "featured"]

// Actualización parcial del objeto anidado
producto.set({
  vendedor: { rating: 5.0 }, // Solo actualiza el rating del vendedor
});

console.log(producto.vendedor.get());
// { nombre: "Tech Store", rating: 5.0 }
```

**💡 Ventajas:**

- **Reactividad granular**: Cada campo es un signal independiente con su propia reactividad
- **Acceso directo**: Accede a cada propiedad como `obj.campo.get()` sin pasar por el objeto completo
- **Actualización parcial**: El método `set()` acepta objetos parciales, solo actualiza lo que le pasas
- **Inmutabilidad en get()**: Devuelve una copia del objeto para evitar mutaciones accidentales
- **Anidamiento**: Puedes anidar `stateObject` y `stateArray` para crear estructuras complejas
- **Combinable**: Se integra perfectamente con State y StateArray para crear modelos complejos
- **Tipado fuerte**: TypeScript mantiene los tipos de cada propiedad

---

### `stateArray()` - Array reactivo

Crea un array donde cada elemento es un signal independiente. La característica clave es que **reutiliza signals** inteligentemente: cuando actualizas el array con `set()`, mantiene los signals existentes y solo crea nuevos para elementos adicionales. Esto optimiza enormemente el rendimiento en listas grandes.

**Perfecto para:** Listas dinámicas, colecciones de datos, datos tabulares

```typescript
import { state } from "./lib/signals/State";
import { stateArray } from "./lib/signals/stateArray";

// Crear un array (necesita una función factory para crear nuevos signals)
const numeros = stateArray(() => state<number>(0));

// INICIALIZACIÓN
numeros.set([1, 2, 3]);
console.log(numeros.get()); // [1, 2, 3]

// AGREGAR ELEMENTOS
numeros.push(4);
numeros.push(5);
console.log(numeros.get()); // [1, 2, 3, 4, 5]

// QUITAR ELEMENTOS
const ultimo = numeros.pop();
console.log(ultimo); // 5
console.log(numeros.get()); // [1, 2, 3, 4]

// LIMPIAR TODO
numeros.clear();
console.log(numeros.get()); // []

// Volvemos a llenar para los siguientes ejemplos
numeros.set([10, 20, 30, 40]);

// LONGITUD (reactiva)
const longitud = numeros.length();
console.log(longitud.get()); // 4

// ACCEDER A UN ELEMENTO (devuelve el signal)
const primerNumero = numeros.at(0);
console.log(primerNumero?.get()); // 10

// Modificar ese elemento específico
primerNumero?.set(100);
console.log(numeros.get()); // [100, 20, 30, 40]

// BUSCAR UN ELEMENTO (devuelve el signal, no el valor)
const encontrado = numeros.find((valor) => valor > 25);
console.log(encontrado?.get()); // 30

// VERIFICAR CONDICIONES
// some: ¿Alguno cumple la condición? (devuelve Calc<boolean>)
const tieneGrandes = numeros.some((valor) => valor > 50);
console.log(tieneGrandes.get()); // true (porque 100 > 50)

// every: ¿Todos cumplen la condición? (devuelve Calc<boolean>)
const todosMayoresACero = numeros.every((valor) => valor > 0);
console.log(todosMayoresACero.get()); // true

// MAP: Transformar cada elemento (devuelve StateArray)
// La función recibe el VALOR y debe devolver un signal
const dobles = numeros.map((valor) => state(valor * 2));
console.log(dobles.get()); // [200, 40, 60, 80]

// FILTER: Filtrar elementos (devuelve StateArray)
const mayoresDe30 = numeros.filter((valor) => valor > 30);
console.log(mayoresDe30.get()); // [100, 40]

// REDUCE: Reducir a un valor (devuelve Calc)
const suma = numeros.reduce((total, valor) => total + valor, 0);
console.log(suma.get()); // 190 (100 + 20 + 30 + 40)

// JOIN: Unir en un string (devuelve Calc<string>)
const texto = numeros.map((n) => state(n.toString())).join(", ");
console.log(texto.get()); // "100, 20, 30, 40"

// OBTENER ARRAY DE SIGNALS (para uso avanzado)
const signals = numeros.toArray();
console.log(signals.length); // 4
console.log(signals[0].get()); // 100
```

**Ejemplo con objetos:**

```typescript
const usuarios = stateArray(() => 
  stateObject({
    nombre: state(""),
    edad: state(0),
  })
);

usuarios.set([
  { nombre: "Ana", edad: 25 },
  { nombre: "Luis", edad: 30 },
  { nombre: "María", edad: 22 },
]);

// Acceder y modificar un usuario específico (at devuelve el signal)
const primerUsuario = usuarios.at(0);
primerUsuario?.set({ nombre: "Ana María", edad: 26 });

// También puedes modificar solo un campo del stateObject
primerUsuario?.nombre.set("Ana María");
primerUsuario?.edad.set(26);

// Filtrar usuarios mayores de 25 (filter recibe el valor)
const mayores = usuarios.filter((usuario) => usuario.edad > 25);
console.log(mayores.get()); 
// [{ nombre: "Ana María", edad: 26 }, { nombre: "Luis", edad: 30 }]

// Map: transformar a un array de nombres (map recibe el valor, devuelve signal)
const nombres = usuarios.map((usuario) => state(usuario.nombre));
console.log(nombres.get()); // ["Ana María", "Luis", "María"]

// Buscar un usuario (find recibe el valor, devuelve signal)
const encontrado = usuarios.find((usuario) => usuario.edad > 25);
console.log(encontrado?.get()); // { nombre: "Ana María", edad: 26 }

// Transformar añadiendo más propiedades con stateObject
const usuariosConEstado = usuarios.map((usuario) =>
  stateObject({
    nombre: state(usuario.nombre),
    edad: state(usuario.edad),
    activo: state(true),
  })
);
```

**⚡ Reutilización eficiente de signals:**

```typescript
const items = stateArray(() => state(0));

// Primera carga: crea 3 signals internos
items.set([1, 2, 3]);
// Internamente: [signal(1), signal(2), signal(3)]

// Segunda carga: reutiliza los 3 signals existentes y crea 2 nuevos
items.set([10, 20, 30, 40, 50]);
// Internamente: [signal(10), signal(20), signal(30), signal(40), signal(50)]
// Los primeros 3 signals se reutilizaron (solo cambió su valor)
// Solo se crearon 2 signals nuevos para 40 y 50

// Esto es MUCHO más eficiente que recrear 5 signals desde cero
```

**⚠️ Importante sobre `map()`:**
La función de transformación que pasas a `map()` recibe el **valor** (no el signal) y **debe devolver un signal** (`state()`, `stateObject()`, o `stateArray()`). Esto mantiene la reactividad en el array transformado.

```typescript
// ✅ CORRECTO: map recibe el valor, devuelve state
const dobles = numeros.map((valor) => state(valor * 2));

// ✅ CORRECTO: map puede devolver stateObject
const conMetadata = usuarios.map((usuario) =>
  stateObject({
    datos: state(usuario),
    activo: state(true),
  })
);

// ❌ INCORRECTO: devuelve valor plano (no es reactivo)
const dobles = numeros.map((valor) => valor * 2);
```

**💡 Ventajas:**

- **Reutilización eficiente**: Al hacer `set()`, reutiliza signals existentes actualizando su valor, solo crea nuevos signals para elementos adicionales
- **Reactividad por elemento**: Cada elemento del array es un signal independiente con su propia reactividad
- **API familiar**: Métodos como `map`, `filter`, `push`, `pop`, `reduce`, `join` que ya conoces
- **Métodos reactivos**: `map`, `filter`, `reduce`, `join`, `some`, `every`, `length` devuelven valores reactivos (Calc o StateArray)
- **Acceso directo a signals**: Los métodos `at()` y `find()` devuelven el signal completo para modificarlo
- **Rendimiento optimizado**: Especialmente eficiente con listas grandes que cambian frecuentemente

---

## 🔗 Vinculación de Signals

Los signals de Spoonkit tienen una característica única: **se pueden vincular entre sí** para crear sincronización automática. Cuando vinculas signals, los cambios se propagan automáticamente sin necesidad de código manual.

**¿Cómo funciona?** Internamente crea `monitor()` (efectos reactivos) que observan cambios en un signal y actualizan el otro automáticamente.

### Vincular State a State (bidireccional)

Cuando vinculas un state a otro state con `state(otroState)`, se crea una **sincronización bidireccional**: los cambios fluyen en ambas direcciones.

```typescript
import { state } from "./lib/signals/State";

const inputValue = state("Hola");
const displayValue = state(inputValue); // Vinculación bidireccional

console.log(displayValue.get()); // "Hola"

// Si cambias inputValue, displayValue se actualiza automáticamente
inputValue.set("Mundo");
console.log(displayValue.get()); // "Mundo"

// Si cambias displayValue, inputValue también se actualiza
displayValue.set("Adiós");
console.log(inputValue.get()); // "Adiós"
console.log(displayValue.get()); // "Adiós"
```

### Vincular State a Calc (unidireccional)

Cuando vinculas un state a un calc con `state(unCalc)`, se crea una **sincronización unidireccional**: el state sigue automáticamente al calc.

```typescript
import { state } from "./lib/signals/State";
import { calc } from "./lib/signals/Calc";

const precio = state(100);
const descuento = state(0.2);
const precioFinal = calc(() => precio.get() * (1 - descuento.get()));

// displayPrice sigue automáticamente a precioFinal
const displayPrice = state(precioFinal);

console.log(displayPrice.get()); // 80

precio.set(200);
console.log(displayPrice.get()); // 160 (se actualizó solo!)
```

**⚠️ Advertencias importantes:**

1. **Nueva vinculación reemplaza la anterior**: Si vuelves a vincular un state con `set(otroSignal)`, la vinculación anterior se limpia automáticamente.
   
   ```typescript
   const a = state(1);
   const b = state(2);
   const c = state(a); // c vinculado a a
   
   c.set(b); // Ahora c está vinculado a b, la vinculación con a se eliminó
   ```

2. **Valor directo NO rompe la vinculación**: Si haces `set()` con un valor directo después de vincular, el valor se actualiza pero los monitors de vinculación siguen activos (pueden generar comportamiento inesperado).
   
   ```typescript
   const a = state(10);
   const b = state(a); // Vinculados
   
   b.set(20); // Cambia el valor, pero los monitors siguen activos
   // Si cambias 'a' después, 'b' volverá a sincronizarse con 'a'
   ```

3. **Vinculación bidireccional usa recursos**: Crea dos monitors (uno en cada dirección). Si tienes muchas vinculaciones, considera el impacto en rendimiento.

---

## 🎨 Ejemplos Prácticos Completos

TODO

## 🤔 Preguntas Frecuentes

### ¿Cuándo uso `get()` vs `peek()`?

- **`get()`**: Usa esto el 99% del tiempo. Lee el valor Y se suscribe a cambios (activa reactividad)
- **`peek()`**: Solo cuando NO quieres suscribirte. Lee el valor SIN activar reactividad

```typescript
const a = state(5);
const b = state(10);

// Este calc solo se reejecuta cuando 'a' cambia, no cuando 'b' cambia
const resultado = calc(() => {
  const valorA = a.get(); // ✅ Reactivo: se suscribe
  const valorB = b.peek(); // ❌ No reactivo: solo lee
  return valorA * valorB;
});

b.set(20); // resultado NO se recalcula
a.set(10); // resultado SÍ se recalcula
```

### ¿Puedo modificar un `calc()`?

**No.** Los `calc()` son de **solo lectura**. Solo cambian cuando cambian sus dependencias.

```typescript
const suma = calc(() => a.get() + b.get());
suma.set(100); // ❌ ERROR! No puedes hacer esto

// Solo puedes cambiar sus dependencias
a.set(50); // Esto SÍ actualiza suma
```

### ¿Cómo limpio un `monitor()`?

Guarda la función `dispose` que devuelve y llámala cuando termines. Esto es importante para evitar **fugas de memoria**.

```typescript
const cleanup = monitor(() => {
  console.log(contador.get());
});

// Cuando ya no lo necesites
cleanup();
```

### ¿Qué significa que los signals son "lazy"?

**Lazy** significa que las actualizaciones solo ocurren si alguien está observando. Un `calc()` no se ejecuta hasta que alguien lee su valor. Si nadie observa un signal, las actualizaciones no se propagan.

```typescript
const a = state(1);
const b = state(2);

// Este calc NO se ejecuta todavía
const suma = calc(() => a.get() + b.get());

a.set(10); // suma todavía NO se recalcula (nadie lo está leyendo)

// AHORA se ejecuta porque lo leímos
console.log(suma.get()); // 12
```

Esta optimización automática hace que tu app sea más rápida sin que tengas que pensar en ello.

### ¿Cómo evito actualizaciones innecesarias?

El sistema de signals optimiza automáticamente las actualizaciones para evitar ejecuciones innecesarias:

1. **Solo actualiza lo mínimo necesario**: No re-ejecuta calcs o monitors que no cambiaron
2. **Detección de cambios**: Si asignas el mismo valor, no notifica a los suscriptores
3. **Lazy evaluation**: Solo ejecuta lo que realmente se está usando

```typescript
const nombre = state("Ana");

monitor(() => {
  console.log(nombre.get());
});
// → "Ana"

nombre.set("Ana"); // ❌ No se ejecuta el monitor (mismo valor)
nombre.set("Luis"); // ✅ Se ejecuta el monitor (valor diferente)
```

---

## 📚 Resumen Rápido

| Tipo            | Para qué sirve                     | Se puede modificar | Ejemplo                                       |
| --------------- | ---------------------------------- | ------------------ | --------------------------------------------- |
| `state()`       | Valor simple reactivo              | ✅ Sí              | `const nombre = state("Ana")`                 |
| `calc()`        | Valor calculado automático         | ❌ No              | `const total = calc(() => a.get() + b.get())` |
| `monitor()`     | Ejecutar código cuando algo cambia | N/A                | `monitor(() => console.log(x.get()))`         |
| `stateObject()` | Objeto con múltiples signals       | ✅ Sí              | `stateObject({ x: state(1), y: state(2) })`   |
| `stateArray()`  | Array de signals                   | ✅ Sí              | `stateArray(() => state({ id: 0 }))`          |

---

## 💡 Tips y Mejores Prácticas

### 1. Empieza simple

Comienza con `state()` para todo. Cuando veas patrones repetitivos, considera usar `calc()` o estructuras compuestas.

```typescript
// ✅ Bien para empezar
const nombre = state("Ana");
const apellido = state("García");

// ✅ Mejor cuando veas el patrón
const nombreCompleto = calc(() => `${nombre.get()} ${apellido.get()}`);
```

### 2. Aprovecha la evaluación lazy

Recuerda que `calc()` es lazy. Solo se ejecuta cuando alguien lee su valor. Usa esto a tu favor para optimizar.

```typescript
// Este calc solo se ejecuta si alguien lo lee
const calculoComplejo = calc(() => {
  // Operación costosa
  return datos.get().reduce(...);
});

// Si nunca lo lees, nunca se ejecuta
```

### 3. Usa `monitor()` correctamente

Los `monitor()` son para **efectos secundarios** (side effects). No los uses para derivar estado, usa `calc()` para eso.

```typescript
// ❌ Mal: Derivar estado con monitor
const total = state(0);
monitor(() => {
  total.set(precio.get() * cantidad.get());
});

// ✅ Bien: Derivar estado con calc
const total = calc(() => precio.get() * cantidad.get());
```

### 4. Limpia tus monitors

Siempre limpia los `monitor()` cuando ya no los necesites para evitar fugas de memoria.

```typescript
useEffect(() => {
  const cleanup = monitor(() => {
    console.log(contador.get());
  });

  // Limpia cuando el componente se desmonte
  return cleanup;
}, []);
```

### 5. Confía en la detección automática

No necesitas declarar dependencias manualmente. Los signals detectan automáticamente qué observar.

```typescript
// ✅ Las dependencias se detectan automáticamente
const resultado = calc(() => {
  if (condicion.get()) {
    return a.get() + b.get();
  }
  return c.get();
});
// Se suscribe a: condicion, a, b, y c (según la rama que se ejecute)
```

### 6. Aprovecha la consistencia garantizada

Las actualizaciones son síncronas. Tu app siempre está en un estado consistente.

```typescript
const a = state(1);
const b = state(2);
const suma = calc(() => a.get() + b.get());

a.set(10);
// Inmediatamente después, suma ya está actualizada
console.log(suma.get()); // 12 (siempre consistente)
```

### 8. Usa `peek()` sabiamente

Solo usa `peek()` cuando realmente necesites leer sin suscribirte. Casos típicos: logging, debugging, o evitar bucles infinitos.

```typescript
// ✅ Buen uso de peek: evitar bucle infinito
monitor(() => {
  const newValue = input.get();
  const oldValue = output.peek(); // No queremos suscribirnos a output

  if (newValue !== oldValue) {
    output.set(newValue);
  }
});
```

---

## 🎓 Recursos Adicionales

- **[@preact/signals-core](https://www.npmjs.com/package/@preact/signals-core)**: La librería base sobre la que está construido los signals de Spoonkit
- **[Preact Signals Blog Post](https://preactjs.com/blog/introducing-signals/)**: Artículo que explica la filosofía y problemas que resuelven los signals
- **Código fuente**: Revisa los archivos `State.ts`, `Calc.ts`, `Monitor.ts`, `stateObject.ts` y `stateArray.ts` para entender cómo funciona internamente

---

## 🚀 ¡Siguiente paso!

¡Ahora ya sabes todo lo necesario para usar signals como un pro! La mejor forma de aprender es practicando:

1. Empieza con un formulario simple usando `stateObject()`
2. Agrega validaciones reactivas con `calc()`
3. Sincroniza con localStorage usando `monitor()`
4. Crea listas dinámicas con `stateArray()`

**Recuerda:** Los signals están optimizados automáticamente. Concéntrate en escribir código claro y deja que `@preact/signals-core` se encargue del rendimiento. ✨
