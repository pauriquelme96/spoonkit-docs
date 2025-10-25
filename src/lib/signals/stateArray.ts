import { calc } from "./Calc";
import { state } from "./State";
import type { StateLike } from "./StateLike";

type ExtractSetType<T> = T extends { set(value: infer V): void } ? V : never;
type ExtractGetType<T> = T extends { get(): infer V } ? V : never;

export type StateArray<T extends StateLike> = ReturnType<typeof stateArray<T>>;
export function stateArray<T extends StateLike>(fn: () => T) {
  // Guardamos un array de signals, cada signal representa un elemento del array
  // Este es el estado interno que mantiene todos los signals individuales
  const _signals = state<T[]>([]);

  // Creamos un valor calculado que automáticamente se actualiza cuando cambia cualquier signal del array
  // Este calc() recorre todos los signals y obtiene sus valores actuales
  const _value = calc<ExtractGetType<T>[]>(() =>
    _signals.get().map((signal) => signal.get() as ExtractGetType<T>)
  );

  return {
    // Método para obtener el array completo de valores de forma reactiva
    // Si estamos dentro de un monitor o calc, este get() va a activar la reactividad
    get(): ExtractGetType<T>[] {
      return _value.get();
    },

    // Método para obtener el array completo sin activar la reactividad
    // Útil cuando solo queremos leer el valor sin que se disparen reacciones
    peek(): ExtractGetType<T>[] {
      return _value.peek();
    },

    // Método para reemplazar todo el array con nuevos valores
    set(newValues: ExtractSetType<T>[]) {
      // Validamos que lo que recibimos sea realmente un array
      if (!Array.isArray(newValues)) {
        throw new TypeError(
          `stateArray.set() expects an array, but received ${typeof newValues}. ` +
            `Value: ${JSON.stringify(newValues)}`
        );
      }

      // Obtenemos los signals que ya teníamos sin activar reactividad
      const existingSignals = _signals.peek();
      const newSignals: T[] = [];

      // Por cada valor nuevo que queremos setear
      newValues.forEach((value, i) => {
        // Reutilizamos el signal que ya existe en esa posición, o creamos uno nuevo si no hay
        // Esto es más eficiente que crear signals nuevos cada vez
        const signal = existingSignals[i] || fn();
        // Actualizamos el signal con el nuevo valor
        signal.set(value as any);
        // Guardamos el signal en el nuevo array
        newSignals.push(signal);
      });

      // Reemplazamos el array de signals con los nuevos
      _signals.set(newSignals);
    },

    // Método para transformar cada elemento del array (como el map de arrays normales)
    // A diferencia del map normal, este trabaja con los signals directamente
    map<R>(mapFn: (item: T, index: number) => R): R[] {
      // Validamos que nos pasen una función
      if (typeof mapFn !== "function") {
        throw new TypeError(
          `stateArray.map() expects a function, but received ${typeof mapFn}`
        );
      }
      // Aplicamos la función a cada signal del array
      return _signals.get().map(mapFn);
    },

    // Método para filtrar elementos del array (como el filter de arrays normales)
    // Devuelve solo los signals que cumplan la condición
    filter(filterFn: (item: T, index: number) => boolean): T[] {
      // Validamos que nos pasen una función
      if (typeof filterFn !== "function") {
        throw new TypeError(
          `stateArray.filter() expects a function, but received ${typeof filterFn}`
        );
      }
      // Filtramos los signals según la condición
      return _signals.get().filter(filterFn);
    },

    // Método para agregar un elemento al final del array
    push(value: ExtractSetType<T>) {
      // Obtenemos los signals actuales sin activar reactividad
      const existingSignals = _signals.peek();
      // Creamos un signal nuevo para el valor que queremos agregar
      const newSignal = fn();
      // Le asignamos el valor al signal nuevo
      newSignal.set(value as any);
      // Actualizamos el array de signals agregando el nuevo al final
      _signals.set([...existingSignals, newSignal]);
    },

    // Método para quitar el último elemento del array y devolverlo
    pop(): ExtractSetType<T> | undefined {
      // Obtenemos los signals actuales sin activar reactividad
      const existingSignals = _signals.peek();
      // Si el array está vacío, no hay nada que quitar
      if (existingSignals.length === 0) return undefined;

      // Obtenemos el último signal del array
      const lastSignal = existingSignals[existingSignals.length - 1];
      // Obtenemos su valor sin activar reactividad
      const lastValue = lastSignal.peek() as ExtractSetType<T>;

      // Actualizamos el array de signals quitando el último elemento
      _signals.set(existingSignals.slice(0, -1));
      // Devolvemos el valor que tenía el signal que quitamos
      return lastValue;
    },

    // Método para limpiar completamente el array
    dispose() {
      // Vaciamos el array de signals
      _signals.set([]);
    },
  };
}
