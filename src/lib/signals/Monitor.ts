import { effect } from "@preact/signals-core";

/**
 * Crea un efecto reactivo que se ejecuta automáticamente cada vez que cambian los signals que usa.
 *
 * Esta función es tu herramienta para conectar el mundo reactivo con el mundo exterior.
 * Por ejemplo, cuando quieres que algo pase cada vez que cambia un signal (actualizar el DOM,
 * hacer una llamada a una API, guardar en localStorage, etc.).
 *
 * La función que le pasas se ejecuta inmediatamente y luego se vuelve a ejecutar cada vez
 * que cualquiera de los signals que lee dentro cambia de valor.
 *
 * @param {() => void} fn - La función que quieres que se ejecute de forma reactiva.
 *   Cualquier signal que leas dentro de esta función quedará "vigilado" y cuando cambie,
 *   la función se volverá a ejecutar.
 *
 * @returns {() => void} Una función para limpiar y detener el monitor.
 *   Llámala cuando ya no necesites el efecto para evitar fugas de memoria.
 *
 * @example
 * ```typescript
 * const counter = state(0);
 *
 * // Este monitor se ejecuta cada vez que counter cambia
 * const stopMonitor = monitor(() => {
 *   console.log(`El contador vale: ${counter.get()}`);
 * });
 *
 * counter.set(1); // Se ejecuta automáticamente el monitor
 * counter.set(2); // Se ejecuta otra vez
 *
 * // Cuando ya no lo necesites, limpia
 * stopMonitor();
 * ```
 *
 * @example
 * ```typescript
 * // Sincronizar con localStorage
 * const username = state("guest");
 *
 * const cleanup = monitor(() => {
 *   localStorage.setItem("username", username.get());
 * });
 * ```
 */
export const monitor = (fn: () => void) => {
  return new Monitor(fn).dispose;
};

/**
 * Clase que encapsula un efecto reactivo y te da control sobre su ciclo de vida.
 *
 * Normalmente no la usarás directamente, sino que usarás la función `monitor()` que es más
 * práctica. Pero está aquí por si necesitas más control o quieres extenderla.
 *
 * Esta clase se encarga de crear el efecto reactivo cuando la instancias y te da
 * un método `dispose` para limpiarlo cuando termines.
 *
 * @example
 * ```typescript
 * const count = state(0);
 *
 * const myMonitor = new Monitor(() => {
 *   console.log(`Valor actual: ${count.get()}`);
 * });
 *
 * // Cuando termines
 * myMonitor.dispose();
 * ```
 */
export class Monitor {
  /**
   * Función para detener y limpiar el efecto reactivo.
   * Llámala cuando ya no necesites el monitor para liberar recursos.
   */
  public dispose: () => void;

  /**
   * Crea una nueva instancia del monitor y arranca el efecto reactivo.
   *
   * @param {() => void} monitorFn - La función que se ejecutará de forma reactiva.
   *   Se ejecuta inmediatamente y luego cada vez que cambien los signals que lee.
   */
  constructor(private monitorFn: () => void) {
    this.dispose = effect(this.monitorFn);
  }
}
