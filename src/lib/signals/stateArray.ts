import { $batch } from "./$batch";
import { Calc, calc } from "./Calc";
import { State, state } from "./State";
import type { StateLike } from "./StateLike";

type ExtractValue<T extends StateLike> = T extends { get(): infer V }
  ? V
  : never;

/**
 * Crea un nuevo StateArray.
 *
 * Esta es la forma recomendada de crear StateArrays. Nunca uses `new StateArray()`
 * directamente, siempre usa esta función factory.
 *
 * @template T - El tipo de signal que contendrá cada elemento (se infiere automáticamente)
 * @param fn - Función factory para crear nuevos signals cuando se agregan elementos
 * @param initSignals - Array opcional de signals iniciales para poblar el StateArray
 * @returns Un nuevo StateArray inicializado
 *
 * @see {@link StateArray} - Documentación completa de la clase StateArray
 */
export function stateArray<T extends StateLike>(
  fn: () => T,
  initSignals: T[] = []
): StateArray<T> {
  return new StateArray<T>(fn, initSignals);
}

/**
 * Array reactivo donde cada elemento mantiene su propia reactividad individual.
 *
 * StateArray es un contenedor para arrays donde cada elemento es un signal independiente
 * (State, Calc, etc.). Esto te da reactividad a dos niveles: del array completo cuando
 * cambia su estructura (añadir/quitar elementos) y de cada elemento individual cuando
 * cambia su valor.
 *
 * StateArray extiende de State, por lo que puedes usarlo en cualquier lugar donde se espere
 * un State.
 *
 * La diferencia clave con un `state([1, 2, 3])` normal es la granularidad: con un state
 * normal solo puedes reemplazar el array completo, mientras que con StateArray puedes
 * editar cada posición del array como un signal independiente. Además, incluye métodos
 * cómodos para trabajar con arrays reactivos (map, filter, push, pop, etc.).
 *
 * **¿Cuándo usar StateArray?**
 * - Listas de datos donde cada elemento necesita reactividad individual (lista de usuarios, tareas, productos)
 * - Formularios con campos dinámicos donde cada campo es reactivo por separado
 * - Cuando necesitas transformar arrays manteniendo la reactividad (map, filter)
 * - Arrays donde agregas/quitas elementos frecuentemente y necesitas optimizar renders
 *
 * **Características principales:**
 * - **Reactividad granular**: Cada elemento del array es un signal independiente con su propia reactividad
 * - **Reactividad del conjunto**: También reacciona a cambios en la estructura del array (longitud, orden)
 * - **Métodos funcionales**: map, filter, reduce, etc. que mantienen la reactividad
 * - **Mutaciones eficientes**: push, pop, clear que actualizan el array de forma óptima
 * - **Acceso directo a signals**: Puedes acceder a los signals internos con toArray(), at(), find()
 *
 * @template T - El tipo de signal que contiene cada elemento (debe extender StateLike)
 *
 * @example
 * ```typescript
 * // Ejemplo básico: manipulación de array reactivo
 * const numeros = stateArray(() => state<number>());
 * numeros.set([1, 2, 3]);
 *
 * // Acceder y modificar una posición específica como signal
 * const primerNumero = numeros.at(0);
 * primerNumero?.set(10);
 * console.log(numeros.get()); // [10, 2, 3]
 *
 * // Agregar elementos y obtener referencia al signal creado
 * const nuevoSignal = numeros.push(4);
 * console.log(numeros.get()); // [10, 2, 3, 4]
 *
 * // Modificar el elemento agregado usando el signal retornado
 * nuevoSignal.set(40);
 * console.log(numeros.get()); // [10, 2, 3, 40]
 *
 * // Quitar el último elemento
 * const ultimo = numeros.pop();
 * console.log(ultimo); // 40
 * console.log(numeros.get()); // [10, 2, 3]
 *
 * // Eliminar elemento en posición específica
 * numeros.removeAt(1);
 * console.log(numeros.get()); // [10, 3]
 *
 * // Longitud reactiva
 * const longitud = numeros.length();
 * console.log(longitud.get()); // 2
 *
 * // Buscar elemento
 * const encontrado = numeros.find((num) => num > 5);
 * console.log(encontrado?.get()); // 10
 * ```
 *
 * @example
 * ```typescript
 * // Ejemplo: Verificaciones reactivas con some y every
 * const numeros = stateArray(() => state<number>());
 * numeros.set([1, 2, 3, 4, 5]);
 *
 * // Verificación reactiva: ¿hay algún número mayor a 10?
 * const tieneGrandes = numeros.some((num) => num > 10);
 * console.log(tieneGrandes.get()); // false
 *
 * // Al modificar un elemento, la verificación se actualiza automáticamente
 * numeros.at(2)?.set(15);
 * console.log(tieneGrandes.get()); // true
 *
 * // Verificación reactiva: ¿todos son positivos?
 * const todosMayoresACero = numeros.every((num) => num > 0);
 * console.log(todosMayoresACero.get()); // true
 *
 * // Al agregar un negativo, se actualiza automáticamente
 * numeros.push(-5);
 * console.log(todosMayoresACero.get()); // false
 * ```
 *
 * @example
 * ```typescript
 * // Ejemplo: Transformaciones reactivas con map y filter
 * const usuarios = stateArray(() => state<{ name: string; edad: number }>());
 * usuarios.set([
 *   { name: "Ana", edad: 25 },
 *   { name: "Luis", edad: 17 },
 *   { name: "María", edad: 30 }
 * ]);
 *
 * // Crear un array reactivo solo con los nombres
 * const nombres = usuarios.map((user) => calc(() => user.name));
 * console.log(nombres.get()); // ["Ana", "Luis", "María"]
 *
 * // Filtrar mayores de edad (retorna un nuevo StateArray)
 * const mayores = usuarios.filter((user) => user.edad >= 18);
 * console.log(mayores.get()); // [{ name: "Ana", edad: 25 }, { name: "María", edad: 30 }]
 *
 * // Reducir a suma de edades (reactivo)
 * const sumaEdades = usuarios.reduce(
 *   (total, user) => total + user.edad,
 *   0
 * );
 * console.log(sumaEdades.get()); // 72
 *
 * // Unir nombres en un string (reactivo)
 * const nombresUnidos = usuarios.map((u) => calc(() => u.name)).join(", ");
 * console.log(nombresUnidos.get()); // "Ana, Luis, María"
 *
 * // Limpiar el array
 * usuarios.clear();
 * console.log(usuarios.get()); // []
 * ```
 *
 * @example
 * ```typescript
 * // Ejemplo: Uso en un modelo (caso real del proyecto)
 * const createUserModel = () =>
 *   stateObject({
 *     id: state<string>(),
 *     name: state<string>(),
 *     email: stateArray(() => state<string>()), // Array reactivo de emails
 *     age: state<number>(),
 *   });
 *
 * const user = createUserModel();
 * user.set({
 *   id: "123",
 *   name: "Ana",
 *   email: ["ana@example.com", "ana.work@example.com"],
 *   age: 25
 * });
 *
 * // Agregar un email nuevo
 * user.email.push("ana.personal@example.com");
 *
 * // Reactividad granular: cambiar solo un email específico
 * const primerEmail = user.email.at(0);
 * primerEmail?.set("nueva.ana@example.com");
 *
 * // Calcular cuántos emails tiene
 * const cantidadEmails = user.email.length();
 * console.log(cantidadEmails.get()); // 3
 * ```
 *
 * @see {@link stateArray} - Función factory recomendada para crear StateArrays
 * @see {@link State} - Para entender los signals individuales que contiene
 * @see {@link stateObject} - Para crear objetos con StateArrays como propiedades
 */
export class StateArray<T extends StateLike> extends State<any> {
  private signals = state<T[]>([]);
  private value = calc<ExtractValue<T>[]>(() =>
    this.signals.get().map((signal) => signal.get() as ExtractValue<T>)
  );

  constructor(
    private fn: (
      value: ExtractValue<T>,
      index: number,
      array: ExtractValue<T>[]
    ) => T,
    initSignals: T[] = []
  ) {
    super();
    this.signals.set(initSignals);
  }

  /**
   * Obtiene los valores actuales del array de forma reactiva.
   *
   * Al llamar a este método, el contexto que lo use se suscribirá automáticamente
   * a cambios en el array o en cualquiera de sus elementos.
   *
   * @returns Array con los valores actuales de todos los elementos
   */
  public override get(): ExtractValue<T>[] {
    return [...this.value.get()];
  }

  /**
   * Obtiene los valores actuales del array sin crear suscripción reactiva.
   *
   * Útil cuando solo necesitas leer el valor sin que se active la reactividad.
   *
   * @returns Array con los valores actuales de todos los elementos
   */
  public override peek(): ExtractValue<T>[] {
    return [...this.value.peek()];
  }

  /**
   * Reemplaza todos los valores del array.
   *
   * Reutiliza los signals existentes cuando es posible para mantener la identidad
   * reactiva de los elementos. Crea nuevos signals solo si el array crece.
   *
   * @param newValues - Array de nuevos valores a establecer
   * @returns La instancia actual para encadenar métodos
   * @throws {TypeError} Si el valor no es un array
   */
  public override set(newValues: ExtractValue<T>[]): this {
    if (!Array.isArray(newValues)) {
      throw new TypeError(
        `stateArray.set() expects an array, but received ${typeof newValues}. ` +
          `Value: ${JSON.stringify(newValues)}`
      );
    }

    const existingSignals = this.signals.peek();
    const newSignals: T[] = [];

    $batch(() => {
      newValues.forEach((value, i) => {
        const signal =
          existingSignals[i] || this.fn(value as any, i, newValues as any[]);
        signal.set(value as any);
        newSignals.push(signal);
      });
    });

    this.signals.set(newSignals);
    return this;
  }

  /**
   * Crea un nuevo StateArray aplicando una función de transformación a cada elemento.
   *
   * Similar al `map()` de arrays normales, pero mantiene la reactividad. El nuevo
   * StateArray contiene signals transformados que se actualizan automáticamente.
   *
   * @template U - El tipo de signal resultante de la transformación
   * @param mapFn - Función que transforma cada valor en un nuevo signal
   * @returns Un nuevo StateArray con los elementos transformados
   * @throws {TypeError} Si mapFn no es una función
   */
  public map<U extends StateLike>(
    mapFn: (
      value: ExtractValue<T>,
      index: number,
      array: ExtractValue<T>[]
    ) => U
  ) {
    if (typeof mapFn !== "function") {
      throw new TypeError(
        `stateArray.map() expects a function, but received ${typeof mapFn}`
      );
    }

    const currentValues = this.get();

    const mappedStateArray = new StateArray(mapFn as any);

    mappedStateArray.set(currentValues);

    return mappedStateArray as StateArray<U>;
  }

  /**
   * Crea un nuevo StateArray con los elementos que cumplen una condición.
   *
   * Similar al `filter()` de arrays normales, pero devuelve un nuevo StateArray
   * manteniendo la reactividad de los elementos filtrados.
   *
   * @param filterFn - Función que determina si incluir cada elemento
   * @returns Un nuevo StateArray solo con los elementos que cumplen la condición
   * @throws {TypeError} Si filterFn no es una función
   */
  public filter(
    filterFn: (item: ExtractValue<T>, index: number) => boolean
  ): StateArray<T> {
    if (typeof filterFn !== "function") {
      throw new TypeError(
        `stateArray.filter() expects a function, but received ${typeof filterFn}`
      );
    }

    const filteredSignals = this.signals.get().filter((signal, index) => {
      return filterFn(signal.peek() as ExtractValue<T>, index);
    });

    return new StateArray<T>(this.fn, filteredSignals);
  }

  /**
   * Agrega un nuevo elemento al final del array y retorna el signal creado.
   *
   * Crea un nuevo signal usando la función factory, lo inicializa con el valor
   * proporcionado y lo añade al final del array. Retorna el signal creado para
   * que puedas mantener una referencia y modificarlo posteriormente.
   *
   * @param value - Valor a agregar al final del array
   * @returns El signal creado que contiene el nuevo elemento
   */
  public push(value: ExtractValue<T>): T {
    const existingSignals = this.signals.peek();
    const newSignal = this.fn(value, existingSignals.length, [
      ...existingSignals.map((s) => s.peek()),
      value,
    ] as any);
    newSignal.set(value as any);
    this.signals.set([...existingSignals, newSignal]);
    return newSignal;
  }

  /**
   * Elimina y retorna el último elemento del array.
   *
   * @returns El valor del último elemento, o undefined si el array está vacío
   */
  public pop(): ExtractValue<T> | undefined {
    const existingSignals = this.signals.peek();
    if (existingSignals.length === 0) return undefined;

    const lastSignal = existingSignals[existingSignals.length - 1];
    const lastValue = lastSignal.peek() as ExtractValue<T>;

    this.signals.set(existingSignals.slice(0, -1));
    return lastValue;
  }

  /**
   * Obtiene el array interno de signals.
   *
   * Útil cuando necesitas trabajar directamente con los signals en lugar
   * de con sus valores.
   *
   * @returns Array con todos los signals internos
   */
  public toArray(): T[] {
    return [...this.signals.get()];
  }

  /**
   * Verifica de forma reactiva si al menos un elemento cumple una condición.
   *
   * Similar al `some()` de arrays normales, pero retorna un Calc que se
   * recalcula automáticamente cuando cambia el array o cualquiera de sus elementos.
   * Esto permite crear validaciones y lógica condicional que se actualiza en tiempo real.
   *
   * @param fn - Función que determina si un elemento cumple la condición
   * @returns Calc reactivo que devuelve true si al menos un elemento cumple la condición
   */
  public some(
    fn: (item: ExtractValue<T>, index: number) => boolean
  ): Calc<boolean> {
    return calc(() =>
      this.signals
        .get()
        .some((signal, index) => fn(signal.get() as ExtractValue<T>, index))
    );
  }

  /**
   * Verifica de forma reactiva si todos los elementos cumplen una condición.
   *
   * Similar al `every()` de arrays normales, pero retorna un Calc que se
   * recalcula automáticamente cuando cambia el array o cualquiera de sus elementos.
   * Útil para validaciones que deben cumplirse en todos los elementos del array.
   *
   * @param fn - Función que determina si un elemento cumple la condición
   * @returns Calc reactivo que devuelve true si todos los elementos cumplen la condición
   */
  public every(
    fn: (item: ExtractValue<T>, index: number) => boolean
  ): Calc<boolean> {
    return calc(() =>
      this.signals
        .get()
        .every((signal, index) => fn(signal.get() as ExtractValue<T>, index))
    );
  }

  /**
   * Busca el primer signal que cumple una condición.
   *
   * Similar al `find()` de arrays normales, pero retorna el signal completo,
   * no solo su valor.
   *
   * @param fn - Función que determina si un elemento cumple la condición
   * @returns El primer signal que cumple la condición, o undefined si ninguno la cumple
   */
  public find(
    fn: (item: ExtractValue<T>, index: number) => boolean
  ): T | undefined {
    return this.signals
      .get()
      .find((signal, index) => fn(signal.peek() as ExtractValue<T>, index));
  }

  /**
   * Obtiene el signal en una posición específica del array.
   *
   * Retorna el signal completo, no solo su valor, permitiéndote modificarlo
   * de forma reactiva.
   *
   * @param index - Índice del elemento (puede ser negativo para contar desde el final)
   * @returns El signal en esa posición, o undefined si el índice no existe
   */
  public at(index: number): T | undefined {
    const signals = this.signals.get();
    return signals.at(index);
  }

  /**
   * Elimina el elemento en una posición específica del array.
   *
   * Remueve el signal en el índice especificado y actualiza el array.
   * Si el índice está fuera de rango, no hace nada.
   *
   * @param index - Índice del elemento a eliminar (debe ser >= 0 y < longitud del array)
   */
  public removeAt(index: number): void {
    const existingSignals = this.signals.peek();
    if (index < 0 || index >= existingSignals.length) return;

    const newSignals = existingSignals.filter((_, i) => i !== index);
    this.signals.set(newSignals);
  }

  /**
   * Reduce el array a un único valor de forma reactiva.
   *
   * Similar al `reduce()` de arrays normales, pero retorna un Calc que se
   * recalcula automáticamente cuando cambia el array o cualquiera de sus elementos.
   *
   * @template U - El tipo del valor acumulado
   * @param reducer - Función que acumula valores
   * @param initialValue - Valor inicial del acumulador
   * @returns Calc con el valor reducido que se actualiza automáticamente
   */
  public reduce<U>(
    reducer: (
      accumulator: U,
      currentValue: ExtractValue<T>,
      currentIndex: number,
      array: ExtractValue<T>[]
    ) => U,
    initialValue: U
  ): Calc<U> {
    return calc(() => this.get()?.reduce(reducer, initialValue));
  }

  /**
   * Une los valores del array en un string de forma reactiva.
   *
   * Similar al `join()` de arrays normales, pero retorna un Calc que se
   * actualiza automáticamente cuando cambia el array o cualquiera de sus elementos.
   *
   * @param separator - String separador entre elementos
   * @returns Calc con el string resultante que se actualiza automáticamente
   */
  public join(separator: string): Calc<string> {
    return calc(() => this.get()?.join(separator));
  }

  /**
   * Obtiene la longitud del array de forma reactiva.
   *
   * @returns Calc que devuelve la cantidad de elementos en el array
   */
  public length(): Calc<number> {
    return calc(() => this.signals.get().length);
  }

  /**
   * Elimina todos los elementos del array.
   *
   * Deja el array vacío, eliminando todos los signals internos.
   */
  public clear() {
    this.signals.set([]);
  }
}
