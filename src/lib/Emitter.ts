export function emitter<T>(callback?: (value: T) => void) {
  return new Emitter<T>(callback);
}

export class Emitter<T> {
  private subscribers: Array<(value: T) => void> = [];

  constructor(callback?: (value: T) => void) {
    if (callback) this.subscribe(callback);
  }

  public next(value: T) {
    this.subscribers.forEach((callback) => callback(value));
  }

  public subscribe(callback: (value: T) => void): () => void {
    this.subscribers.push(callback);

    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }
}
