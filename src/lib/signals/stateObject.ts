import { calc } from "./Calc";
import type { StateLike } from "./StateLike";

type ExtractStateTypes<T extends Record<string, StateLike>> = {
  [K in keyof T]?: T extends { set(value: infer V): void } ? V : never;
};

type ExtractGetTypes<T extends Record<string, StateLike>> = {
  [K in keyof T]: T extends { get(): infer V } ? V : never;
};

export type StateObject<T extends Record<string, StateLike>> = ReturnType<
  typeof stateObject<T>
>;

// Función principal que convierte un objeto de estados individuales en un estado de objeto
// Por ejemplo: { nombre: state("Juan"), edad: state(25) } se convierte en un estado unificado
export function stateObject<T extends Record<string, StateLike>>(model: T) {
  // Validamos que lo que recibimos sea realmente un objeto y no null, undefined o array
  if (!model || typeof model !== "object" || Array.isArray(model)) {
    throw new TypeError(
      `stateObject() expects an object, but received ${
        Array.isArray(model) ? "array" : typeof model
      }. ` + `Value: ${JSON.stringify(model)}`
    );
  }

  // Creamos un valor calculado que automáticamente se actualiza cuando cambia cualquier estado interno
  // Este calc() se va a reevaluar cada vez que alguno de los estados del modelo cambie
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
          // Actualizamos el estado individual con el nuevo valor
          model[key].set(newValue[key]);
        }
      }
    },
  };
}
