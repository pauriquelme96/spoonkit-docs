import { computed, type ReadonlySignal } from "@preact/signals-core";

/**
 * Crea un nuevo Calc con una función de cálculo.
 *
 * Esta es la forma recomendada de crear Calcs. Nunca uses `new Calc()` directamente,
 * siempre usa esta función factory.
 *
 * @template T - El tipo de valor que devuelve el cálculo, se infiere automáticamente
 * @param fn - Función que calcula el valor. Se re-ejecuta automáticamente cuando cambian sus dependencias
 * @returns Un nuevo Calc inicializado con la función de cálculo
 *
 * @see {@link Calc} - Documentación completa de la clase Calc
 */
export const calc = <T>(fn: () => T) => new Calc<T>(fn);

/**
 * Valor calculado que se actualiza automáticamente cuando cambian sus dependencias.
 *
 * Calc es como una fórmula de Excel en tu código: defines cómo se calcula un valor
 * basándote en otros signals, y cuando esos signals cambian, el Calc se recalcula
 * automáticamente. La magia está en que detecta por sí mismo de qué signals depende,
 * solo con que uses `get()` dentro de la función de cálculo.
 *
 * Los Calcs son de solo lectura: no puedes cambiar su valor directamente, solo cambia
 * cuando cambian los signals de los que depende. Esto garantiza que el valor calculado
 * siempre esté sincronizado con sus dependencias.
 *
 * **¿Cuándo usar Calc?**
 * - Para valores derivados de otros signals: validaciones, transformaciones, agregaciones
 * - Para lógica de interfaz que depende del estado: habilitar/deshabilitar botones, títulos dinámicos
 * - Para optimizar rendimiento: cachean el resultado y solo recalculan cuando es necesario
 * - Para mantener consistencia: el valor calculado siempre está actualizado automáticamente
 * - Como fuente de verdad derivada: otros Calcs y monitores pueden depender de este
 *
 * **Características principales:**
 * - **Solo lectura**: No se puede modificar directamente (no tiene `set()`), solo a través de sus dependencias
 * - **Lazy evaluation**: Solo se ejecuta cuando alguien lee su valor con `get()`, no antes
 * - **Auto-actualizable**: Se recalcula automáticamente cuando alguna de sus dependencias cambia
 * - **Caché eficiente**: Almacena el resultado y solo recalcula cuando es necesario
 * - **Detección automática**: No necesitas declarar las dependencias, las detecta solo
 * - **Encadenable**: Puedes crear Calcs que dependan de otros Calcs
 *
 * @template T - El tipo de valor que devuelve el cálculo. Puede ser cualquier cosa: number,
 *   string, boolean, objetos, arrays, etc.
 *
 * @example
 * ```typescript
 * // Título que cambia según el estado de carga
 * const loading = state(false);
 * const title = calc(() =>
 *   loading.get() ? "Cargando usuarios..." : "Gestión de Usuarios"
 * );
 *
 * console.log(title.get()); // "Gestión de Usuarios"
 *
 * loading.set(true);
 * console.log(title.get()); // "Cargando usuarios..." (se recalculó automáticamente)
 * ```
 *
 * @example
 * ```typescript
 * // Validaciones que se actualizan automáticamente con el input del usuario
 * const name = state("");
 * const age = state(0);
 *
 * // Cada validación es un Calc que devuelve un mensaje de error o undefined
 * const nameError = calc(() => {
 *   const value = name.get();
 *   if (value.length === 0) return "El nombre no puede estar vacío";
 * });
 *
 * const ageError = calc(() => {
 *   const value = age.get();
 *   if (value <= 0) return "La edad debe ser un número positivo";
 * });
 *
 * console.log(nameError.get()); // "El nombre no puede estar vacío"
 *
 * name.set("Ana");
 * console.log(nameError.get()); // undefined (válido ahora)
 *
 * age.set(25);
 * console.log(ageError.get()); // undefined (válido ahora)
 * ```
 *
 * @example
 * ```typescript
 * // Caso real: botón de guardar que se habilita solo si no hay errores
 * const user = stateObject({
 *   name: state(""),
 *   email: state(""),
 *   age: state(0)
 * });
 *
 * // Validaciones (Calcs que devuelven errores)
 * const validations = {
 *   name: calc(() => user.name.get().length === 0 ? "Nombre requerido" : undefined),
 *   email: calc(() => !user.email.get().includes("@") ? "Email inválido" : undefined),
 *   age: calc(() => user.age.get() <= 0 ? "Edad debe ser positiva" : undefined)
 * };
 *
 * // Calc que verifica si hay algún error
 * const hasErrors = calc(() =>
 *   Object.values(validations).some(validation => !!validation.get())
 * );
 *
 * // Configuración del botón (disabled depende de hasErrors)
 * const saveButton = new ButtonCtrl().set({
 *   label: "Guardar",
 *   disabled: hasErrors, // Se habilita/deshabilita automáticamente
 *   onClick: () => console.log("Usuario guardado")
 * });
 *
 * console.log(hasErrors.get()); // true (hay errores)
 *
 * // El usuario completa el formulario
 * user.name.set("Ana");
 * user.email.set("ana@example.com");
 * user.age.set(25);
 *
 * console.log(hasErrors.get()); // false (sin errores, botón habilitado)
 * ```
 *
 * @see {@link calc} - Función factory recomendada para crear Calcs
 * @see {@link State} - Para valores que puedes modificar directamente
 * @see {@link monitor} - Para ejecutar efectos secundarios cuando cambian los Calcs
 * @see {@link stateObject} - Para crear objetos reactivos con Calcs como propiedades
 */
export class Calc<T> {
  // El computed signal interno que contiene el valor calculado
  // Es ReadonlySignal porque los calcs son de solo lectura, no se pueden modificar directamente
  private self: ReadonlySignal<T>;

  /**
   * Lee el valor calculado actual de forma reactiva.
   *
   * Cuando llamas a `get()` dentro de un `calc()` o `monitor()`, automáticamente
   * te suscribes a este Calc. Cada vez que el valor se recalcule (porque cambió
   * alguna de sus dependencias), el calc o monitor que lo está leyendo también
   * se volverá a ejecutar.
   *
   * El Calc es lazy: la primera vez que llamas a `get()` ejecuta la función
   * de cálculo. Después cachea el resultado y solo lo recalcula cuando alguna
   * de sus dependencias cambia.
   *
   * @returns El valor calculado actual
   */
  public get() {
    return this.self.value;
  }

  /**
   * Lee el valor calculado actual sin activar reactividad.
   *
   * A diferencia de `get()`, `peek()` NO te suscribe al Calc. Úsalo cuando solo
   * necesites leer el valor sin que tu calc o monitor se vuelva a ejecutar cuando
   * este Calc cambie.
   *
   * Casos de uso típicos: logging, debugging, evitar dependencias circulares,
   * o leer valores opcionales que no deberían disparar recálculos.
   *
   * @returns El valor calculado actual
   */
  public peek() {
    return this.self.peek();
  }

  /**
   * Construye un nuevo Calc con la función de cálculo proporcionada.
   *
   * No uses este constructor directamente, utiliza la función factory `calc()` en su lugar.
   *
   * @param calcFn - La función que calcula el valor. Se ejecuta:
   *   - La primera vez que alguien lee el valor con `get()`
   *   - Cada vez que cambia algún signal del que depende (que haya leído con `get()`)
   */
  constructor(calcFn: () => T) {
    this.self = computed(calcFn);
  }
}
