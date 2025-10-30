import { calc } from "./Calc";
import { State } from "./State";
import type { StateLike } from "./StateLike";

type ExtractValue<T extends Record<string, StateLike>> = {
  [K in keyof T]: T[K] extends { get(): infer V } ? V : never;
};

export type StateObject<T extends Record<string, StateLike>> =
  StateObjectClass<T> & T;

/**
 * Crea un nuevo StateObject.
 *
 * Esta es la forma recomendada de crear StateObjects. Nunca uses `new StateObjectClass()`
 * directamente, siempre usa esta función factory.
 *
 * @template T - El tipo de objeto con signals que contendrá (se infiere automáticamente)
 * @param model - Objeto donde cada propiedad es un signal (State, StateArray, StateObject)
 * @returns Un nuevo StateObject inicializado
 *
 * @see {@link StateObjectClass} - Documentación completa de la clase StateObject
 */
export function stateObject<T extends Record<string, StateLike>>(
  model: T
): StateObject<T> {
  return new StateObjectClass<T>(model) as StateObject<T>;
}

/**
 * Objeto reactivo donde cada propiedad mantiene su propia reactividad individual.
 *
 * StateObject es un contenedor para objetos donde cada propiedad es un signal independiente
 * (State, StateArray, u otro StateObject). Esto te da reactividad a dos niveles: del objeto
 * completo cuando cambias varias propiedades a la vez, y de cada propiedad individual cuando
 * modificas solo una.
 *
 * StateObject extiende de State, por lo que puedes usarlo en cualquier lugar donde se espere
 * un State.
 *
 * La diferencia clave con un `state({ name: "Ana", age: 25 })` normal es la granularidad:
 * con un state normal solo puedes reemplazar el objeto completo, mientras que con StateObject
 * puedes editar cada propiedad como un signal independiente. Además, puedes acceder directamente
 * a las propiedades y hacer actualizaciones parciales de forma cómoda.
 *
 * **¿Cuándo usar StateObject?**
 * - Modelos de entidades de dominio donde cada campo necesita reactividad individual (User, Product, Order)
 * - Formularios complejos donde cada input es reactivo por separado
 * - Estado estructurado que combina diferentes tipos de signals (State, StateArray, StateObject anidados)
 * - Cuando necesitas actualizar solo algunas propiedades sin tocar las demás
 *
 * **Características principales:**
 * - **Reactividad granular**: Cada propiedad del objeto es un signal independiente con su propia reactividad
 * - **Acceso directo**: Puedes acceder a las propiedades como `obj.name.get()` sin pasar por el objeto completo
 * - **Actualizaciones parciales**: El método `set()` acepta objetos parciales, solo actualiza lo que le pasas
 * - **Combinable**: Se integra perfectamente con State y StateArray para crear modelos complejos
 * - **Inmutabilidad en get()**: Devuelve una copia del objeto para evitar mutaciones accidentales
 *
 * @template T - El tipo de objeto con signals. Cada propiedad debe ser State, StateArray o StateObject
 *
 * @example
 * ```typescript
 * // Ejemplo básico: modelo de usuario reactivo
 * const user = stateObject({
 *   name: state("Ana"),
 *   age: state(25),
 *   email: state("ana@example.com")
 * });
 *
 * // Leer el objeto completo
 * console.log(user.get()); // { name: "Ana", age: 25, email: "ana@example.com" }
 *
 * // Acceder a una propiedad específica
 * console.log(user.name.get()); // "Ana"
 *
 * // Modificar una propiedad individual
 * user.name.set("María");
 * console.log(user.get()); // { name: "María", age: 25, email: "ana@example.com" }
 *
 * // Actualizar varias propiedades a la vez (parcial)
 * user.set({ name: "Luis", age: 30 });
 * console.log(user.get()); // { name: "Luis", age: 30, email: "ana@example.com" }
 * ```
 *
 * @example
 * ```typescript
 * // Ejemplo: Modelo complejo con StateArray y StateObject anidado
 * const product = stateObject({
 *   id: state<string>("P123"),
 *   name: state<string>("Laptop"),
 *   price: state<number>(999),
 *   tags: stateArray(() => state<string>()),
 *   // StateObject anidado para información del vendedor
 *   seller: stateObject({
 *     name: state<string>("Tech Store"),
 *     rating: state<number>(4.5)
 *   })
 * });
 *
 * // Inicializar datos completos
 * product.set({
 *   id: "P123",
 *   name: "Laptop",
 *   price: 999,
 *   tags: ["electronics", "computers"],
 *   seller: { name: "Tech Store", rating: 4.5 }
 * });
 *
 * // Acceder a propiedades anidadas
 * console.log(product.seller.name.get()); // "Tech Store"
 *
 * // Modificar solo una propiedad del objeto anidado
 * product.seller.rating.set(4.8);
 *
 * // Agregar un tag nuevo
 * product.tags.push("featured");
 * console.log(product.tags.get()); // ["electronics", "computers", "featured"]
 * ```
 *
 * @example
 * ```typescript
 * // Ejemplo: Uso en un modelo de dominio (caso real del proyecto)
 * const createUserModel = () =>
 *   stateObject({
 *     id: state<string>(),
 *     name: state<string>(),
 *     email: stateArray(() => state<string>()),
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
 * // Reactividad granular: cambiar solo el nombre
 * user.name.set("Ana María");
 *
 * // Trabajar con el array de emails reactivamente
 * user.email.push("ana.personal@example.com");
 * console.log(user.email.length().get()); // 3
 *
 * // Actualización parcial: solo cambiar la edad
 * user.set({ age: 26 });
 * console.log(user.get());
 * // { id: "123", name: "Ana María", email: [...], age: 26 }
 * ```
 *
 * @see {@link stateObject} - Función factory recomendada para crear StateObjects
 * @see {@link State} - Para entender los signals individuales que contiene
 * @see {@link stateArray} - Para crear arrays reactivos dentro de StateObjects
 */
export class StateObjectClass<
  T extends Record<string, StateLike>
> extends State<any> {
  private value = calc<ExtractValue<T>>(() => {
    const value: Record<string, any> = {};

    for (const key in this.model) {
      value[key] = this.model[key].get();
    }

    return value as ExtractValue<T>;
  });

  constructor(private model: T) {
    super();
    if (!model || typeof model !== "object" || Array.isArray(model)) {
      throw new TypeError(
        `stateObject() expects an object, but received ${
          Array.isArray(model) ? "array" : typeof model
        }. ` + `Value: ${JSON.stringify(model)}`
      );
    }

    // Asignamos cada propiedad del modelo al primer nivel
    for (const key in model) {
      (this as any)[key] = model[key];
    }
  }

  /**
   * Obtiene los valores actuales del objeto de forma reactiva.
   *
   * Al llamar a este método, el contexto que lo use se suscribirá automáticamente
   * a cambios en cualquiera de las propiedades del objeto.
   *
   * @returns Objeto con los valores actuales de todas las propiedades
   */
  public override get(): ExtractValue<T> {
    return { ...this.value.get() };
  }

  /**
   * Actualiza una o más propiedades del objeto.
   *
   * Acepta un objeto parcial, solo actualiza las propiedades que le pasas.
   * Las propiedades no incluidas mantienen su valor actual.
   *
   * @param newValue - Objeto con las propiedades a actualizar (puede ser parcial)
   * @returns La instancia actual para encadenar métodos
   * @throws {TypeError} Si el valor no es un objeto
   */
  public override set(newValue: Partial<ExtractValue<T>>): this {
    if (!newValue || typeof newValue !== "object" || Array.isArray(newValue)) {
      throw new TypeError(
        `stateObject.set() expects an object, but received ${
          Array.isArray(newValue) ? "array" : typeof newValue
        }. ` + `Value: ${JSON.stringify(newValue)}`
      );
    }

    for (const key in this.model) {
      if (newValue.hasOwnProperty(key)) {
        this.model[key].set(newValue[key]);
      }
    }

    return this;
  }

  /**
   * Obtiene los valores actuales del objeto sin crear suscripción reactiva.
   *
   * Útil cuando solo necesitas leer el valor sin que se active la reactividad.
   *
   * @returns Objeto con los valores actuales de todas las propiedades
   */
  public override peek(): ExtractValue<T> {
    return { ...this.value.peek() };
  }
}
