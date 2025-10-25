/**
 * Crea un emisor de eventos simple que te permite notificar a múltiples suscriptores cuando algo pasa.
 *
 * Piensa en esto como un sistema de avisos: cuando algo importante ocurre, puedes disparar
 * un evento con `next()` y todos los que estén suscritos recibirán la notificación.
 *
 * Es útil para cosas como eventos de UI, comunicación entre componentes o cualquier situación
 * donde necesites que varias partes de tu código reaccionen a lo mismo.
 *
 * @template T - El tipo de valor que vas a emitir, se infiere automáticamente.
 * @param {function} [callback] - Opcional: una función que se suscribe automáticamente al crear el emisor
 *
 * @returns {Emitter<T>} Un emisor listo para usar
 *
 * @example
 * ```typescript
 * // Creamos un emisor para clicks en un botón
 * const clickEmitter = emitter<MouseEvent>();
 *
 * // Nos suscribimos para recibir los eventos
 * const unsub = clickEmitter.subscribe((event) => {
 *   console.log('Click en:', event.target);
 * });
 *
 * // Emitimos un evento
 * clickEmitter.next(mouseEvent);
 *
 * // Cuando ya no nos interese, cancelamos la suscripción
 * unsub();
 * ```
 *
 * @example
 * ```typescript
 * // También puedes pasar un callback directo al crear el emisor
 * const userEmitter = emitter<User>((user) => {
 *   console.log('Usuario actualizado:', user.name);
 * });
 *
 * userEmitter.next({ name: 'Ana', age: 28 });
 * ```
 */
export function emitter<T>(callback?: (value: T) => void) {
  return new Emitter<T>(callback);
}

/**
 * Un emisor de eventos que permite que múltiples funciones se suscriban y reciban notificaciones.
 *
 * Esta clase implementa el patrón observer/subscriber de forma sencilla. Cuando emites un valor
 * con `next()`, todos los que estén suscritos lo reciben al instante.
 *
 * Lo que puedes hacer:
 * - `next(value)`: Envía un valor a todos los suscriptores
 * - `subscribe(callback)`: Añade un nuevo suscriptor, devuelve función para cancelar
 *
 * Típicamente no creas instancias directamente, sino que usas la función `emitter()` que
 * es más cómoda.
 *
 * @template T - El tipo de valor que el emisor va a manejar
 *
 * @example
 * ```typescript
 * // Crear un emisor para notificaciones
 * const notifications = new Emitter<string>();
 *
 * // Primer suscriptor
 * const unsub1 = notifications.subscribe((msg) => {
 *   alert(msg);
 * });
 *
 * // Segundo suscriptor
 * const unsub2 = notifications.subscribe((msg) => {
 *   console.log('Notificación:', msg);
 * });
 *
 * // Emitimos a todos
 * notifications.next('Nuevo mensaje recibido');
 *
 * // Cancelamos solo el primero
 * unsub1();
 *
 * // Ahora solo el segundo recibirá notificaciones
 * notifications.next('Otro mensaje');
 * ```
 */
export class Emitter<T> {
  private subscribers: Array<(value: T) => void> = [];

  /**
   * Crea una nueva instancia del emisor.
   *
   * @param {function} [callback] - Opcional: una función que se suscribirá automáticamente
   */
  constructor(callback?: (value: T) => void) {
    if (callback) this.subscribe(callback);
  }

  /**
   * Emite un valor a todos los suscriptores actuales.
   *
   * Cuando llamas a este método, todos los callbacks que se hayan suscrito se ejecutan
   * inmediatamente en el orden en que se suscribieron.
   *
   * @param {T} value - El valor que quieres emitir a todos los suscriptores
   *
   * @example
   * ```typescript
   * const statusEmitter = emitter<string>();
   * statusEmitter.subscribe((status) => console.log('Estado:', status));
   *
   * statusEmitter.next('conectado');  // Imprime: Estado: conectado
   * statusEmitter.next('desconectado');  // Imprime: Estado: desconectado
   * ```
   */
  public next(value: T) {
    this.subscribers.forEach((callback) => callback(value));
  }

  /**
   * Suscribe un callback para que reciba las notificaciones del emisor.
   *
   * El callback se añade a la lista de suscriptores y empezará a recibir todos los valores
   * que se emitan a partir de ahora (no recibe valores anteriores).
   *
   * @param {function} callback - La función que se ejecutará cada vez que se emita un valor
   * @returns {function} Una función para cancelar la suscripción cuando ya no te interese
   *
   * @example
   * ```typescript
   * const dataEmitter = emitter<number>();
   *
   * // Nos suscribimos
   * const unsubscribe = dataEmitter.subscribe((num) => {
   *   console.log('Recibido:', num);
   * });
   *
   * dataEmitter.next(42);  // Imprime: Recibido: 42
   * dataEmitter.next(100); // Imprime: Recibido: 100
   *
   * // Ya no nos interesa más
   * unsubscribe();
   *
   * dataEmitter.next(200); // No imprime nada, ya no estamos suscritos
   * ```
   */
  public subscribe(callback: (value: T) => void): () => void {
    this.subscribers.push(callback);

    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }
}
