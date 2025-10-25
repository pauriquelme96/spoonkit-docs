import { signal, Signal } from "@preact/signals-core";
import { Calc } from "./Calc";
import { monitor } from "./Monitor";

/**
 * Crea un signal reactivo que puede guardar cualquier tipo de valor.
 *
 * Esta es la forma más sencilla de crear un valor reactivo en Spoonkit.
 * Cuando cambias el valor con `set()`, cualquier componente o cálculo que esté
 * escuchando se actualiza automáticamente.
 *
 * Lo interesante es que puedes vincular states entre sí: si le pasas otro state
 * o un calc, se quedan sincronizados automáticamente.
 *
 * @template T - El tipo de valor que va a guardar el state, se infiere automáticamente.
 * @param {T | State<T> | Calc<T>} [value] - El valor inicial. Puede ser:
 *   - Un valor directo: `state(42)`
 *   - Otro state: `state(otroState)` (se sincronizan bidireccionalmente)
 *   - Un calc: `state(miCalc)` (el state sigue al calc)
 *
 * @returns {State<T>} Una instancia de State con estos métodos:
 *   - `get()`: Lee el valor de forma reactiva
 *   - `peek()`: Lee el valor sin activar reactividad
 *   - `set(value)`: Cambia el valor o vincula a otro state/calc
 *
 * @example
 * ```typescript
 * // Crear un state simple
 * const contador = state(0);
 * contador.set(1); // Actualiza el valor
 * console.log(contador.get()); // 1
 *
 * // Vincular dos states (se sincronizan automáticamente)
 * const stateA = state(10);
 * const stateB = state(stateA);
 * stateA.set(20); // stateB también se actualiza a 20
 * stateB.set(30); // stateA también se actualiza a 30
 *
 * // Vincular a un calc (sigue los cambios del calc)
 * const nombre = state("Juan");
 * const apellido = state("Pérez");
 * const nombreCompleto = calc(() => `${nombre.get()} ${apellido.get()}`);
 * const display = state(nombreCompleto); // Siempre tiene el nombre completo actualizado
 * ```
 */
export function state<T>(value?: T | State<T> | Calc<T>): State<T> {
  return new State<T>().set(value);
}

/**
 * Clase base para crear valores reactivos en Spoonkit.
 *
 * Un State es un contenedor que guarda un valor y notifica automáticamente
 * a quien lo esté escuchando cuando ese valor cambia. Es el building block
 * fundamental del sistema de reactividad.
 *
 * Características principales:
 * - **Reactivo**: Cuando cambias el valor, todo lo que depende de él se actualiza solo
 * - **Vinculable**: Puedes conectar states entre sí o con calcs para que se sincronicen
 * - **Bidireccional**: Si vinculas dos states, los cambios fluyen en ambas direcciones
 * - **Limpio**: Gestiona automáticamente las suscripciones para evitar memory leaks
 *
 * Normalmente no vas a usar `new State()` directamente, sino la función helper `state()`,
 * que es más cómoda.
 *
 * @template T - El tipo de valor que guarda el state
 *
 * @example
 * ```typescript
 * // Crear un state (lo normal es usar la función state() en vez de new State())
 * const edad = new State<number>().set(25);
 *
 * // Leer el valor de forma reactiva
 * monitor(() => {
 *   console.log(`Edad: ${edad.get()}`); // Se ejecuta cada vez que edad cambia
 * });
 *
 * // Cambiar el valor
 * edad.set(26); // El monitor de arriba se dispara automáticamente
 *
 * // Leer sin activar reactividad
 * const edadActual = edad.peek(); // Solo lee, no se suscribe
 *
 * // Vincular a otro state
 * const edadMostrada = new State<number>().set(edad);
 * // Ahora ambos states están sincronizados
 * edad.set(30); // edadMostrada también pasa a 30
 * edadMostrada.set(35); // edad también pasa a 35
 * ```
 */
export class State<T> {
  // El signal interno que contiene el valor real
  // Este es el corazón reactivo del State
  private self: Signal<T> = signal<T>(null);

  // Array de funciones para limpiar suscripciones anteriores
  // Cuando vinculamos este State a otro State o Calc, guardamos aquí cómo deshacer esa vinculación
  private disposers: (() => void)[] = [];

  /**
   * Obtiene el valor actual del state de forma reactiva.
   *
   * Si llamas a `get()` dentro de un `monitor()` o un `calc()`, se crea
   * automáticamente una dependencia: cuando el valor cambie, el monitor o calc
   * se volverá a ejecutar.
   *
   * @returns {T} El valor actual del state
   *
   * @example
   * ```typescript
   * const nombre = state("Ana");
   *
   * // Lectura reactiva: se ejecuta cada vez que nombre cambia
   * monitor(() => {
   *   console.log(`Hola ${nombre.get()}`);
   * });
   *
   * nombre.set("Luis"); // El monitor se dispara y loguea "Hola Luis"
   * ```
   */
  public get() {
    return this.self.value;
  }

  /**
   * Obtiene el valor actual sin activar la reactividad.
   *
   * A diferencia de `get()`, cuando llamas a `peek()` dentro de un monitor o calc,
   * NO se crea ninguna dependencia. Es útil cuando solo quieres leer el valor
   * sin que se disparen reacciones automáticas.
   *
   * @returns {T} El valor actual del state
   *
   * @example
   * ```typescript
   * const contador = state(0);
   * const multiplicador = state(2);
   *
   * // Este calc solo se reejecuta cuando contador cambia, no cuando multiplicador cambia
   * const resultado = calc(() => {
   *   const c = contador.get();        // Reactivo: crea dependencia
   *   const m = multiplicador.peek();  // No reactivo: solo lee
   *   return c * m;
   * });
   *
   * multiplicador.set(10); // El calc NO se reejecuta
   * contador.set(5);       // El calc SÍ se reejecuta
   * ```
   */
  public peek() {
    return this.self.peek();
  }

  /**
   * Limpia todas las suscripciones activas que tenga este state.
   *
   * Esto es importante para evitar memory leaks cuando cambiamos la vinculación.
   * Si este state estaba vinculado a otro state o calc, esta función rompe esas
   * conexiones antes de crear nuevas.
   *
   * @private
   */
  private disposePrevious() {
    this.disposers.forEach((dispose) => dispose());
  }

  /**
   * Actualiza el valor del state o lo vincula a otro state/calc.
   *
   * Este método tiene tres modos de uso diferentes dependiendo de lo que le pases:
   *
   * 1. **Valor directo**: Simplemente actualiza el valor
   * 2. **Otro State**: Crea sincronización bidireccional (los cambios fluyen en ambas direcciones)
   * 3. **Un Calc**: El state sigue al calc unidireccionalmente (solo el calc actualiza al state)
   *
   * Cuando vinculas a otro state o calc, el método se encarga automáticamente de
   * limpiar vinculaciones anteriores para evitar memory leaks.
   *
   * @param {T | State<T> | Calc<T>} value - El nuevo valor o la vinculación:
   *   - Valor directo: `state.set(42)`
   *   - State: `stateA.set(stateB)` → Se sincronizan bidireccionalmente
   *   - Calc: `state.set(miCalc)` → El state sigue al calc
   *
   * @returns {this} El mismo state (permite encadenar: `new State().set(valor)`)
   *
   * @throws {TypeError} Si llamas a `set()` sin pasarle ningún argumento
   *
   * @example
   * ```typescript
   * // Modo 1: Valor directo
   * const edad = state(25);
   * edad.set(26); // Simplemente actualiza
   *
   * // Modo 2: Vincular a otro state (bidireccional)
   * const stateA = state(10);
   * const stateB = state(0);
   * stateB.set(stateA); // Ahora están sincronizados
   * stateA.set(20);     // stateB también pasa a 20
   * stateB.set(30);     // stateA también pasa a 30
   *
   * // Modo 3: Vincular a un calc (unidireccional)
   * const nombre = state("Juan");
   * const apellido = state("Pérez");
   * const nombreCompleto = calc(() => `${nombre.get()} ${apellido.get()}`);
   * const display = state(nombreCompleto); // Sigue al calc automáticamente
   * nombre.set("Pedro"); // display se actualiza solo
   * ```
   */
  public set(value: T | State<T> | Calc<T>): this {
    // Validamos que se haya pasado algún argumento
    // Si llamas a set() sin nada, esto lanza un error
    if (value === undefined && arguments.length === 0) {
      throw new TypeError("State.set() requires a value argument");
    }

    // Si nos pasan otro State o un Calc, creamos una vinculación reactiva
    if (value instanceof State || value instanceof Calc) {
      // Primero limpiamos cualquier vinculación anterior que tuviéramos
      this.disposePrevious();

      // Creamos una suscripción que se ejecuta cada vez que `value` cambia
      // Esto hace que este State se sincronice automáticamente con el otro
      const disposeGetter = monitor(() => {
        const v = value.get();
        this.self.value = v;
      });

      // Guardamos la función de limpieza para poder desuscribirnos después
      this.disposers.push(disposeGetter);

      // Si es un State (no un Calc), creamos vinculación bidireccional
      // Esto significa que cambios en este State también actualizan el otro
      if (value instanceof State) {
        const disposeSetter = monitor(() => {
          const v = this.get();
          value.set(v);
        });

        // Guardamos también esta segunda suscripción para poder limpiarla después
        this.disposers.push(disposeSetter);
      }
    } else {
      // Si es un valor simple (no State ni Calc), simplemente lo asignamos directo
      this.self.value = value;
    }

    // Devolvemos `this` para permitir encadenamiento de métodos
    // Esto es lo que permite hacer: new State().set(valor)
    return this;
  }
}
