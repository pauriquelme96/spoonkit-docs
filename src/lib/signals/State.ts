import { signal } from "@preact/signals-core";
import { Calc } from "./Calc";
import { monitor } from "./Monitor";

/**
 * Crea un nuevo State con un valor inicial opcional.
 *
 * Esta es la forma recomendada de crear States. Nunca uses `new State()` directamente,
 * siempre usa esta función factory.
 *
 * @template T - El tipo de valor que almacenará el State, se infiere automáticamente
 * @param initValue - Valor inicial opcional. Puede ser un valor directo, otro State o un Calc
 * @returns Un nuevo State inicializado con el valor proporcionado
 *
 * @see {@link State} - Documentación completa de la clase State
 */
export function state<T>(initValue?: T | State<T> | Calc<T>): State<T> {
  return new State<T>().set(initValue);
}

/**
 * Contenedor reactivo para valores que pueden cambiar con el tiempo.
 *
 * State es la pieza fundamental del sistema de señales de Spoonkit. Piensa en él como
 * una variable inteligente que automáticamente notifica a todo lo que depende de ella
 * cuando su valor cambia. Esto hace que tu interfaz y tu estado siempre estén sincronizados
 * sin que tengas que escribir código de actualización manual.
 *
 * **¿Cuándo usar State?**
 * - Para valores simples que cambian: strings, números, booleanos, objetos, etc.
 * - Para el estado de tu aplicación: datos de usuario, configuración, flags, etc.
 * - Para valores reactivos en interfaces: inputs de formularios, contadores, listas, etc.
 * - Como fuente de verdad de la que derivan otros valores
 *
 * **Características principales:**
 * - **Reactividad automática**: Cuando cambias el valor, todo lo que depende de él se actualiza solo
 * - **Actualizaciones síncronas**: Los cambios se propagan inmediatamente, tu app siempre está consistente
 * - **Lazy por defecto**: Solo notifica a quien realmente está escuchando, optimizando el rendimiento
 * - **Vinculación bidireccional**: Puedes sincronizar automáticamente dos States entre sí
 *
 * @template T - El tipo de valor que almacena el State. Puede ser cualquier cosa: number, string,
 *   boolean, objetos, arrays, etc.
 *
 * @example
 * ```typescript
 * // Ejemplo básico: contador reactivo
 * const contador = state(0);
 *
 * // Leer el valor (activa reactividad)
 * console.log(contador.get()); // 0
 *
 * // Cambiar el valor (notifica a todos los suscriptores)
 * contador.set(1);
 * contador.set(contador.get() + 1); // 2
 *
 * // Leer sin activar reactividad
 * console.log(contador.peek()); // 2
 * ```
 *
 * @example
 * ```typescript
 * // Ejemplo: Estado de usuario
 * const userName = state("Ana");
 * const userAge = state(25);
 *
 * userName.set("Luis");
 * console.log(userName.get()); // "Luis"
 *
 * userAge.set(30);
 * console.log(userAge.get()); // 30
 * ```
 *
 * @example
 * ```typescript
 * // Ejemplo: Flag de carga en un formulario
 * const saving = state(false);
 *
 * const saveButton = new ButtonCtrl().set({
 *   label: "Guardar",
 *   loading: saving, // El botón se actualiza automáticamente
 *   onClick: async () => {
 *     saving.set(true);
 *     await api.save();
 *     saving.set(false);
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Ejemplo: Vinculación bidireccional entre States
 * const inputValue = state("Hola");
 * const displayValue = state(inputValue); // Se vinculan automáticamente
 *
 * inputValue.set("Adiós");
 * console.log(displayValue.get()); // "Adiós" (se sincroniza automáticamente)
 *
 * displayValue.set("Mundo");
 * console.log(inputValue.get()); // "Mundo" (la sincronización es bidireccional)
 * ```
 *
 * @see {@link state} - Función factory para crear States (usa siempre esta en vez de `new State()`)
 * @see {@link monitor} - Para ejecutar efectos secundarios cuando cambian los States
 * @see {@link stateObject} - Para agrupar varios States en un objeto reactivo
 * @see {@link stateArray} - Para crear arrays reactivos de States
 */
export class State<T = unknown> {
  private self = signal<T>();

  private disposers: (() => void)[] = [];

  /**
   * Lee el valor actual del State de forma reactiva.
   *
   * Cuando llamas a `get()` dentro de un `calc()` o `monitor()`, automáticamente
   * te suscribes a este State. Cada vez que el valor cambie, el calc o monitor
   * se volverá a ejecutar.
   *
   * @returns El valor actual almacenado en el State
   */
  public get(): T {
    return this.self.value;
  }

  /**
   * Lee el valor actual del State sin activar reactividad.
   *
   * A diferencia de `get()`, `peek()` NO te suscribe al State. Úsalo cuando solo
   * necesites leer el valor sin que tu calc o monitor se vuelva a ejecutar cuando cambie.
   *
   * Casos de uso típicos: logging, debugging, o evitar bucles infinitos en monitors.
   *
   * @returns El valor actual almacenado en el State
   */
  public peek(): T {
    return this.self.peek();
  }

  private disposePrevious() {
    this.disposers.forEach((dispose) => dispose());
  }

  /**
   * Cambia el valor del State y notifica a todos los suscriptores.
   *
   * Puedes asignar un valor directo, o vincular este State con otro State o Calc.
   * Cuando vinculas States, se sincronizan automáticamente (bidireccional si es State,
   * unidireccional si es Calc).
   *
   * @param value - El nuevo valor. Puede ser:
   *   - Un valor directo del tipo T
   *   - Otro State (se vinculan bidireccionalmente)
   *   - Un Calc (se vincula unidireccionalmente, sigue al Calc)
   *
   * @returns Esta instancia de State (permite encadenar llamadas)
   *
   * @throws {TypeError} Si llamas a `set()` sin argumentos
   */
  public set(value: T | State<T> | Calc<T>): this {
    if (value === undefined && arguments.length === 0) {
      throw new TypeError("State.set() requires a value argument");
    }

    if (value instanceof State || value instanceof Calc) {
      this.disposePrevious();

      const disposeGetter = monitor(() => {
        const v = value.get();
        this.self.value = v;
        /*if (!this.self) this.self = signal<T>(v);
        else this.self.value = v;*/
      });

      this.disposers.push(disposeGetter);

      if (value instanceof State) {
        const disposeSetter = monitor(() => {
          const v = this.get();
          value.set(v);
        });

        this.disposers.push(disposeSetter);
      }
    } else {
      this.self.value = value;
      /*if (!this.self) this.self = signal<T>(value);
      else this.self.value = value;*/
    }

    return this;
  }
}
