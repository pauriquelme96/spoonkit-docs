import { signal, Signal } from "@preact/signals-core";
import { Calc } from "./Calc";
import { monitor } from "./Monitor";

// Función helper para crear un nuevo State de forma más cómoda
// En vez de hacer `new State().set(valor)`, simplemente haces `state(valor)`
export function state<T>(value?: T | State<T> | Calc<T>): State<T> {
  return new State<T>().set(value);
}

export class State<T> {
  // El signal interno que contiene el valor real
  // Este es el corazón reactivo del State
  private self: Signal<T> = signal<T>(null);

  // Array de funciones para limpiar suscripciones anteriores
  // Cuando vinculamos este State a otro State o Calc, guardamos aquí cómo deshacer esa vinculación
  private disposers: (() => void)[] = [];

  // Obtiene el valor actual de forma reactiva
  // Si estamos dentro de un monitor() o calc(), este get() va a crear una dependencia
  public get() {
    return this.self.value;
  }

  // Obtiene el valor actual sin activar la reactividad
  // Útil cuando solo queremos leer sin que se disparen reacciones
  public peek() {
    return this.self.peek();
  }

  // Limpia todas las suscripciones activas que tengamos
  // Esto es importante para evitar memory leaks cuando cambiamos la vinculación de este State
  private disposePrevious() {
    this.disposers.forEach((dispose) => dispose());
  }

  // Método principal para actualizar el valor del State
  // Puede recibir un valor directo, otro State, o un Calc
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
