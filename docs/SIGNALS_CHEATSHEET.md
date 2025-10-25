# Guía de Signals: Todo lo que necesitas saber

> **💡 Nota importante:** Spoonkit Signals está construido sobre [`@preact/signals-core`](https://www.npmjs.com/package/@preact/signals-core), una librería de gestión de estado de alto rendimiento. Esta guía documenta la API de Spoonkit (`state()`, `calc()`, `monitor()`, `stateObject()`, `stateArray()`), que envuelve las primitivas de Preact (`signal()`, `computed()`, `effect()`) en una API propia para no generar una dependencia directa.

## 🎯 ¿Qué son los Signals?

Los **signals** son contenedores reactivos para valores que pueden cambiar con el tiempo. Son como variables inteligentes que automáticamente notifican y actualizan todo lo que depende de ellas cuando su valor cambia.

Diseñada para ser:

- ⚡ **Performante**: Optimiza automáticamente las actualizaciones para que tu app se mantenga rápida
- 🎯 **Lazy por defecto**: Solo actualiza lo que realmente está siendo observado
- 🧠 **Inteligente**: Salta automáticamente signals que nadie está escuchando
- 🔄 **Reactiva**: Cuando cambias un valor, todas las dependencias se actualizan solas

**Piénsalo así:**

- **Variable normal**: Cambias el valor → tienes que actualizar todo manualmente 😓
- **Signal**: Cambias el valor → todo se actualiza solo ✨

### ¿Cómo funcionan?

Los signals funcionan mediante un **sistema de suscripciones automáticas**:

1. Cuando lees un signal dentro de un `calc()` o `monitor()`, automáticamente te suscribes a él
2. Cuando el signal cambia, notifica a todos sus suscriptores
3. Las actualizaciones se propagan de forma eficiente, ejecutando solo lo mínimo necesario

---

## 📦 Los 3 tipos de Signals básicos

### 1. `state()` - El Signal básico

Es el signal más simple y fundamental. Guarda un valor que puede cambiar con el tiempo y notifica automáticamente a sus suscriptores.

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
```

**¿Cuándo usar `state()`?**

- Para valores simples que pueden cambiar
- Cuando necesitas guardar y actualizar datos
- Para inputs de formularios, contadores, flags, etc.
- Como fuente de verdad para tu estado

**💡 Características clave:**

- **Escritura síncrona**: Cuando haces `set()`, todos los dependientes se actualizan inmediatamente
- **Consistencia garantizada**: El estado de tu app siempre es consistente
- **Trackeo automático**: No necesitas declarar manualmente qué depende de qué

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

**¿Cuándo usar `calc()`?**

- Para valores derivados de otros signals
- Cuando tienes una fórmula o cálculo que depende de otros valores
- Para transformar datos de forma reactiva
- Para valores de solo lectura que se mantienen actualizados solos

**� Características clave:**

- **Solo lectura**: No puedes hacer `precioFinal.set(150)`, solo cambia cuando cambian sus dependencias
- **Lazy evaluation**: Solo se ejecuta cuando alguien lee su valor
- **Cache inteligente**: Cachea el resultado y solo recalcula cuando es necesario
- **Detección automática**: Detecta sus dependencias sin que las declares manualmente
- **Optimización automática**: Si nadie lo observa, ni siquiera se actualiza

---

### 3. `monitor()` - El Efecto reactivo

Es un efecto que se ejecuta automáticamente cada vez que cambian los signals que lee. A diferencia de `calc()`, no devuelve un valor, sino que ejecuta **efectos secundarios** (side effects).

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

- Para sincronizar con localStorage, sessionStorage, etc.
- Para hacer llamadas a APIs cuando algo cambia
- Para actualizar el DOM manualmente
- Para logging, debugging o analytics
- Para cualquier "efecto secundario" (side effect)
- Para conectar el mundo reactivo con el mundo exterior

**💡 Características clave:**

- **Ejecución inmediata**: Se ejecuta en cuanto lo creas (no es lazy como `calc`)
- **Auto-tracking**: Detecta automáticamente qué signals lee
- **Limpieza manual**: Llama a `dispose()` para evitar fugas de memoria
- **Actualizaciones sincrónicas**: Cuando cambia una dependencia, se ejecuta inmediatamente

**🎯 Ejemplo con cleanup:**

```typescript
import { state } from "./lib/signals/State";
import { monitor } from "./lib/signals/Monitor";

const userId = state(1);

// Monitor con función de limpieza
monitor(() => {
  const id = userId.get();
  console.log(`Cargando datos del usuario ${id}`);

  // Esta función de limpieza se ejecuta antes del siguiente monitor
  return () => {
    console.log(`Limpiando datos del usuario ${id}`);
  };
});

userId.set(2);
// → "Limpiando datos del usuario 1"
// → "Cargando datos del usuario 2"
```

---

## 🔑 Conceptos Clave de Reactividad

### Lazy por defecto

Los signals son **lazy** (perezosos): las actualizaciones solo ocurren si alguien está escuchando. Un `calc()` no se ejecuta hasta que alguien lee su valor. Si nadie observa un signal, las actualizaciones no se propagan.

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

- **`get()`**: Lee el valor Y se suscribe a los cambios (activa la reactividad)
- **`peek()`**: Lee el valor SIN suscribirse (no activa la reactividad)

```typescript
const a = state(5);
const b = state(10);

// Este calc SOLO se suscribe a 'a', no a 'b'
const resultado = calc(() => {
  const valorA = a.get(); // ✅ Reactivo: se suscribe
  const valorB = b.peek(); // ❌ No reactivo: solo lee
  return valorA * valorB;
});

b.set(20); // resultado NO se recalcula
a.set(10); // resultado SÍ se recalcula
```

---

## 🧩 Signals Compuestos

### `stateObject()` - Objeto reactivo

Agrupa varios signals en un objeto reactivo.

**Perfecto para:** Formularios, entidades con múltiples campos, estado complejo

```typescript
import { state } from "./lib/signals/State";
import { stateObject } from "./lib/signals/stateObject";

const usuario = stateObject({
  nombre: state("Ana"),
  edad: state(25),
  email: state("ana@example.com"),
});

// Obtener todo el objeto
console.log(usuario.get());
// { nombre: "Ana", edad: 25, email: "ana@example.com" }

// Cambiar varios campos a la vez
usuario.set({
  nombre: "Luis",
  edad: 30,
});

// O cambiar un campo individual
usuario.nombre.set("Carlos");

// Leer un campo individual
console.log(usuario.nombre.get()); // "Carlos"

// Peek para leer sin activar reactividad
console.log(usuario.peek());
```

**💡 Ventajas:**

- **Reactividad granular**: Cada campo es un signal independiente
- **Actualización parcial**: Puedes cambiar solo los campos que necesites
- **Acceso directo**: Puedes acceder a cada signal individual
- **Validación reactiva**: Perfecto para crear validaciones que se actualicen automáticamente

---

### `stateArray()` - Array reactivo

Crea un array donde cada elemento es un signal independiente. Reutiliza signals inteligentemente para máxima eficiencia.

**Perfecto para:** Listas dinámicas, colecciones, datos tabulares

```typescript
import { state } from "./lib/signals/State";
import { stateArray } from "./lib/signals/stateArray";

// Creamos un array de usuarios
const usuarios = stateArray(() => state({ nombre: "", edad: 0 }));

// Agregamos usuarios
usuarios.set([
  { nombre: "Ana", edad: 25 },
  { nombre: "Luis", edad: 30 },
]);

// Agregamos uno más al final
usuarios.push({ nombre: "Carlos", edad: 28 });

// Obtenemos todos los valores
console.log(usuarios.get());
// [{ nombre: "Ana", edad: 25 }, { nombre: "Luis", edad: 30 }, { nombre: "Carlos", edad: 28 }]

// Quitamos el último
const ultimo = usuarios.pop();
console.log(ultimo); // { nombre: "Carlos", edad: 28 }

// Mapeamos los signals (útil en React/Preact)
usuarios.map((userSignal, index) => {
  const user = userSignal.get();
  return <UserCard key={index} user={user} />;
});

// Filtramos signals
const mayoresDe26 = usuarios.filter((userSignal) => {
  return userSignal.get().edad > 26;
});
```

**💡 Ventajas:**

- **Reutilización eficiente**: Al hacer `set()`, reutiliza signals existentes en vez de recrearlos
- **Reactividad por elemento**: Cada elemento del array es reactivo independientemente
- **API familiar**: Métodos como `map`, `filter`, `push`, `pop` que ya conoces
- **Rendimiento optimizado**: Especialmente eficiente con listas grandes

**🎯 Diferencia clave con arrays normales:**

```typescript
// ❌ Array normal: Tienes que recrear todo
const [items, setItems] = useState([...]);
setItems([...items, newItem]); // Recrea todo el array

// ✅ stateArray: Solo agrega el nuevo signal
const items = stateArray(() => state({...}));
items.push(newItem); // Solo crea un signal nuevo, reutiliza los demás
```

---

## 🔗 Vinculación de Signals

Los signals de Spoonkit tienen una característica única: **se pueden vincular entre sí** para crear sincronización automática. Esto usa internamente `monitor()` (effect) para mantener los valores sincronizados.

### Vincular State a State (bidireccional)

Cuando vinculas un state a otro state, se crea una **sincronización bidireccional**: los cambios fluyen en ambas direcciones.

```typescript
import { state } from "./lib/signals/State";

const stateA = state(10);
const stateB = state(stateA); // Vinculación bidireccional

console.log(stateB.get()); // 10

// Si cambias A, B se actualiza automáticamente
stateA.set(20);
console.log(stateB.get()); // 20

// Si cambias B, A también se actualiza automáticamente
stateB.set(30);
console.log(stateA.get()); // 30
```

### Vincular State a Calc (unidireccional)

Cuando vinculas un state a un calc, se crea una **sincronización unidireccional**: el state sigue al calc, pero no al revés (porque los calcs son de solo lectura).

```typescript
import { state } from "./lib/signals/State";
import { calc } from "./lib/signals/Calc";

const nombre = state("Juan");
const apellido = state("Pérez");
const nombreCompleto = calc(() => `${nombre.get()} ${apellido.get()}`);

// El display sigue automáticamente al calc
const display = state(nombreCompleto);

console.log(display.get()); // "Juan Pérez"

nombre.set("María");
console.log(display.get()); // "María Pérez" (se actualizó solo!)
```

**🎯 Casos de uso:**

- **State ↔ State**: Sincronizar estado entre diferentes partes de tu app
- **Calc → State**: Mantener una copia del resultado de un cálculo para uso futuro
- **Formularios**: Vincular inputs con el modelo de datos

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

**No.** Los `calc()` (computed signals) son de **solo lectura**. Solo cambian cuando cambian sus dependencias. Esto es una característica de `@preact/signals-core`.

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

`@preact/signals-core` optimiza automáticamente las actualizaciones para evitar ejecuciones innecesarias:

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

| Tipo            | Basado en (Preact)    | Para qué sirve                     | Se puede modificar | Ejemplo                                       |
| --------------- | --------------------- | ---------------------------------- | ------------------ | --------------------------------------------- |
| `state()`       | `signal()`            | Valor simple reactivo              | ✅ Sí              | `const nombre = state("Ana")`                 |
| `calc()`        | `computed()`          | Valor calculado automático         | ❌ No              | `const total = calc(() => a.get() + b.get())` |
| `monitor()`     | `effect()`            | Ejecutar código cuando algo cambia | N/A                | `monitor(() => console.log(x.get()))`         |
| `stateObject()` | Custom (usa `calc()`) | Objeto con múltiples signals       | ✅ Sí              | `stateObject({ x: state(1), y: state(2) })`   |
| `stateArray()`  | Custom (usa `calc()`) | Array de signals                   | ✅ Sí              | `stateArray(() => state({ id: 0 }))`          |

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

### 3. Usa `monitor()` con moderación

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

### 6. Organiza tu estado en módulos

Los signals funcionan perfectamente fuera de componentes. Crea stores modulares.

```typescript
// stores/userStore.ts
export const currentUser = state<User | null>(null);
export const isAuthenticated = calc(() => currentUser.get() !== null);
export const userName = calc(() => currentUser.get()?.name ?? "Guest");

// stores/cartStore.ts
export const items = stateArray(() => state<CartItem>({ id: "", qty: 0 }));
export const total = calc(() =>
  items.get().reduce((sum, item) => sum + item.price * item.qty, 0)
);
```

### 7. Aprovecha la consistencia garantizada

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
