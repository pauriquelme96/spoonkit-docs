import { calc } from "./Calc";
import type { StateLike } from "./StateLike";

type ExtractStateTypes<T extends Record<string, StateLike>> = {
  [K in keyof T]?: T[K] extends { set(value: infer V): void } ? V : never;
};

type ExtractGetTypes<T extends Record<string, StateLike>> = {
  [K in keyof T]: T[K] extends { get(): infer V } ? V : never;
};

export type StateObject<T extends Record<string, StateLike>> = ReturnType<
  typeof stateObject<T>
>;

/**
 * Crea un objeto reactivo que agrupa varios signals y te permite trabajar con ellos como uno solo.
 *
 * Imagina que tienes varios signals separados (nombre, edad, email) y quieres tratarlos como
 * un único objeto "usuario". Esta función hace exactamente eso.
 *
 * Lo que te devuelve:
 * - Acceso directo a cada signal individual (por si necesitas cambiar solo uno)
 * - `get()`: Devuelve objeto con todos los valores actuales y activa la reactividad si se invoca dentro de un `calc` o `monitor`
 * - `peek()`: Devuelve los valores actuales pero sin activar la reactividad
 * - `set()`: Actualiza varios signals de golpe pasando un objeto
 *
 * Lo mejor de todo es que es reactivo: cuando cambias cualquier signal individual,
 * el objeto completo se actualiza solo.
 *
 * @template T - El tipo de objeto con signals que le pasas, se infiere automáticamente.
 * @param {T} model - Un objeto donde cada propiedad es un signal (state, stateObject o stateArray)
 *
 * @returns {Object} Un objeto que incluye:
 *   - Todos los signals originales (para que puedas usarlos individualmente)
 *   - `get()`: Devuelve un objeto fresco con todos los valores (reactivo)
 *   - `peek()`: Devuelve los valores sin activar reactividad
 *   - `set(newValue)`: Actualiza varios signals a la vez
 *
 * @throws {TypeError} Si no le pasas un objeto válido (null, array, etc.)
 *
 * @example
 * ```typescript
 * // Creamos un signal para un usuario
 * const userState = stateObject({
 *   name: state("John"),
 *   age: state(30),
 *   email: state("john@example.com")
 * });
 *
 * // Obtenemos todos los valores juntos
 * const user = userState.get(); // { name: "John", age: 30, email: "john@example.com" }
 *
 * // Actualizamos de forma parcial
 * userState.set({ name: "Jane", age: 25 });
 *
 * // O cambiamos solo uno accediendo de forma individual
 * userState.name.set("Bob");
 * ```
 */
export function stateObject<T extends Record<string, StateLike>>(model: T) {
  // Validamos que lo que recibimos sea realmente un objeto y no null, undefined o array
  if (!model || typeof model !== "object" || Array.isArray(model)) {
    throw new TypeError(
      `stateObject() expects an object, but received ${
        Array.isArray(model) ? "array" : typeof model
      }. ` + `Value: ${JSON.stringify(model)}`
    );
  }

  // Creamos un valor calculado que automáticamente se actualiza cuando cambia cualquier signal interno
  // Este calc() se va a reevaluar cada vez que alguno de los signals del modelo cambie
  const _value = calc<ExtractGetTypes<T>>(() => {
    // Creamos un objeto vacío donde vamos a juntar todos los valores
    const value: Record<string, any> = {};

    // Recorremos cada propiedad del modelo original
    for (const key in model) {
      // Para cada propiedad, obtenemos su valor actual llamando a get() para activar la reactividad
      value[key] = model[key].get();
    }

    // Devolvemos el objeto completo con todos los valores actualizados
    return value as ExtractGetTypes<T>;
  });

  // Retornamos un objeto que combina el modelo original con métodos adicionales
  return {
    // Mantenemos todas las propiedades originales del modelo (spread operator)
    ...model,

    // Método para obtener el valor actual del objeto completo de forma reactiva
    // Si estamos dentro de un `monitor` o un `calc` , este get() va a activar la reactividad
    get(): ExtractGetTypes<T> {
      // Devolvemos una copia del objeto para evitar que se modifique por referencia
      return { ..._value.get() };
    },

    // Método para obtener el valor actual sin activar la reactividad
    // Útil cuando solo queremos leer el valor sin que se disparen reacciones
    peek(): ExtractGetTypes<T> {
      // Devolvemos una copia del objeto para evitar que se modifique por referencia
      return { ..._value.peek() };
    },

    // Método para actualizar el objeto completo o algunas de sus propiedades
    set(newValue: ExtractStateTypes<T>) {
      // Validamos que el nuevo valor sea un objeto válido
      if (
        !newValue ||
        typeof newValue !== "object" ||
        Array.isArray(newValue)
      ) {
        throw new TypeError(
          `stateObject.set() expects an object, but received ${
            Array.isArray(newValue) ? "array" : typeof newValue
          }. ` + `Value: ${JSON.stringify(newValue)}`
        );
      }

      // Recorremos cada propiedad del modelo original
      for (const key in model) {
        // Si el nuevo valor incluye esta propiedad
        if (newValue.hasOwnProperty(key)) {
          // Actualizamos el signal individual con el nuevo valor
          model[key].set(newValue[key]);
        }
      }
    },
  };
}
