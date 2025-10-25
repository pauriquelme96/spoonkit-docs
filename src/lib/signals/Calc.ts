import { computed, type ReadonlySignal } from "@preact/signals-core";

/**
 * Crea un valor calculado que se actualiza automáticamente cuando cambian sus dependencias.
 *
 * Un calc es como una fórmula de Excel: defines cómo se calcula un valor basándote en
 * otros signals, y cuando esos signals cambian, el calc se recalcula solo.
 *
 * Lo interesante es que el calc detecta automáticamente de qué signals depende.
 * Solo tienes que usar `get()` dentro de la función y el sistema se encarga del resto.
 *
 * Los calcs son de solo lectura: no puedes cambiar su valor directamente con `set()`,
 * solo cambia cuando cambian los signals de los que depende.
 *
 * @template T - El tipo de valor que devuelve el cálculo, se infiere automáticamente.
 * @param {() => T} fn - La función que calcula el valor. Cada vez que algún signal
 *   que leas dentro de esta función (usando `get()`) cambie, la función se volverá
 *   a ejecutar automáticamente.
 *
 * @returns {Calc<T>} Una instancia de Calc con estos métodos:
 *   - `get()`: Lee el valor calculado de forma reactiva
 *   - `peek()`: Lee el valor sin activar reactividad
 *
 * @example
 * ```typescript
 * // Ejemplo básico: suma reactiva
 * const a = state(5);
 * const b = state(10);
 * const suma = calc(() => a.get() + b.get());
 *
 * console.log(suma.get()); // 15
 * a.set(20);
 * console.log(suma.get()); // 30 (se recalculó automáticamente)
 *
 * // Ejemplo más complejo: nombre completo
 * const nombre = state("Juan");
 * const apellido = state("Pérez");
 * const nombreCompleto = calc(() => `${nombre.get()} ${apellido.get()}`);
 *
 * console.log(nombreCompleto.get()); // "Juan Pérez"
 * nombre.set("María");
 * console.log(nombreCompleto.get()); // "María Pérez"
 *
 * // Ejemplo con lógica condicional
 * const edad = state(15);
 * const esMayorDeEdad = calc(() => edad.get() >= 18);
 *
 * console.log(esMayorDeEdad.get()); // false
 * edad.set(20);
 * console.log(esMayorDeEdad.get()); // true
 *
 * // Los calcs se pueden encadenar
 * const precio = state(100);
 * const descuento = state(0.2);
 * const precioConDescuento = calc(() => precio.get() * (1 - descuento.get()));
 * const precioFinal = calc(() => precioConDescuento.get() * 1.21); // Con IVA
 *
 * console.log(precioFinal.get()); // 96.8
 * ```
 */
export const calc = <T>(fn: () => T) => new Calc<T>(fn);

/**
 * Clase base para crear valores calculados reactivos en Spoonkit.
 *
 * Un Calc representa un valor que se deriva de otros signals y se mantiene
 * automáticamente actualizado. Es la forma de crear valores computados que
 * reaccionan a cambios en sus dependencias.
 *
 * Características principales:
 * - **Solo lectura**: No puedes modificar un calc directamente, solo cambia cuando cambian sus dependencias
 * - **Auto-actualizable**: Se recalcula solo cuando alguna de sus dependencias cambia
 * - **Lazy**: Solo se ejecuta cuando alguien lee su valor (con `get()`)
 * - **Eficiente**: Cachea el resultado y solo recalcula cuando es necesario
 * - **Detección automática**: No necesitas declarar de qué signals depende, lo detecta solo
 *
 * Normalmente no usas `new Calc()` directamente, sino la función helper `calc()`,
 * que es más cómoda.
 *
 * @template T - El tipo del valor calculado
 *
 * @example
 * ```typescript
 * // Crear un calc (lo normal es usar la función calc() en vez de new Calc())
 * const nombre = state("Ana");
 * const apellido = state("García");
 * const nombreCompleto = new Calc(() => `${nombre.get()} ${apellido.get()}`);
 *
 * // Leer el valor de forma reactiva
 * monitor(() => {
 *   console.log(`Hola ${nombreCompleto.get()}`); // Se ejecuta cada vez que el calc cambia
 * });
 *
 * // Al cambiar alguna dependencia, el calc se recalcula
 * nombre.set("Luis"); // El monitor se dispara con el nuevo nombre completo
 *
 * // Leer sin activar reactividad
 * const valorActual = nombreCompleto.peek(); // Solo lee, no se suscribe
 *
 * // Los calcs se pueden usar como dependencias de otros calcs
 * const saludo = new Calc(() => `Buenos días, ${nombreCompleto.get()}`);
 * console.log(saludo.get()); // "Buenos días, Luis García"
 * ```
 */
export class Calc<T> {
  // El computed signal interno que contiene el valor calculado
  // Es ReadonlySignal porque los calcs son de solo lectura, no se pueden modificar directamente
  private self: ReadonlySignal<T>;

  /**
   * Obtiene el valor calculado actual de forma reactiva.
   *
   * Si llamas a `get()` dentro de un `monitor()` o de otro `calc()`, se crea
   * automáticamente una dependencia: cuando este calc se recalcule (porque cambió
   * alguna de sus dependencias), el monitor o calc que lo está leyendo también
   * se volverá a ejecutar.
   *
   * El calc es "lazy": la primera vez que llamas a `get()` ejecuta la función
   * de cálculo. Después cachea el resultado y solo lo recalcula cuando alguna
   * de sus dependencias cambia.
   *
   * @returns {T} El valor calculado actual
   *
   * @example
   * ```typescript
   * const precio = state(100);
   * const iva = state(0.21);
   * const precioConIva = calc(() => precio.get() * (1 + iva.get()));
   *
   * // Lectura reactiva: se ejecuta cada vez que el calc cambia
   * monitor(() => {
   *   console.log(`Precio final: ${precioConIva.get()}`);
   * });
   *
   * precio.set(200); // El monitor se dispara porque el calc cambió
   * ```
   */
  public get() {
    return this.self.value;
  }

  /**
   * Obtiene el valor calculado actual sin activar la reactividad.
   *
   * A diferencia de `get()`, cuando llamas a `peek()` dentro de un monitor o calc,
   * NO se crea ninguna dependencia. Es útil cuando solo quieres leer el valor
   * calculado sin que se disparen reacciones automáticas.
   *
   * @returns {T} El valor calculado actual
   *
   * @example
   * ```typescript
   * const a = state(5);
   * const b = state(10);
   * const suma = calc(() => a.get() + b.get());
   * const multiplicador = calc(() => suma.get() * 2);
   *
   * // Este calc solo se reejecuta cuando a cambia, no cuando suma cambia
   * const resultado = calc(() => {
   *   const valorA = a.get();           // Reactivo: crea dependencia
   *   const valorSuma = suma.peek();    // No reactivo: solo lee
   *   return valorA * valorSuma;
   * });
   *
   * b.set(20);  // suma cambia, pero resultado NO se recalcula
   * a.set(10);  // resultado SÍ se recalcula
   * ```
   */
  public peek() {
    return this.self.peek();
  }

  /**
   * Construye un nuevo Calc con la función de cálculo proporcionada.
   *
   * El constructor crea un computed signal de Preact que se encarga automáticamente
   * de toda la magia reactiva: detectar dependencias, suscribirse a ellas, y
   * recalcular cuando sea necesario.
   *
   * @param {() => T} calcFn - La función que calcula el valor. Esta función se ejecuta:
   *   - La primera vez que alguien lee el valor con `get()`
   *   - Cada vez que cambia algún signal del que depende (que haya leído con `get()`)
   *
   * @example
   * ```typescript
   * const precio = state(100);
   * const descuento = state(0.15);
   *
   * // El constructor recibe la función de cálculo
   * const precioFinal = new Calc(() => {
   *   // Dentro de esta función, cada get() que uses crea una dependencia automática
   *   const p = precio.get();
   *   const d = descuento.get();
   *   return p * (1 - d);
   * });
   *
   * // Ahora el calc está listo para usarse
   * console.log(precioFinal.get()); // 85
   * ```
   */
  constructor(calcFn: () => T) {
    // Creamos un computed signal de Preact con la función que nos pasan
    // Este computed se encarga automáticamente de:
    // 1. Ejecutar la función y detectar qué signals lee
    // 2. Suscribirse a esos signals
    // 3. Recalcular el valor cuando alguno de esos signals cambie
    this.self = computed(calcFn);
  }
}
