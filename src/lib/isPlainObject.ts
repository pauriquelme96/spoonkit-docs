export function isPlainObject(obj: any): boolean {
  if (obj === null || typeof obj !== "object") return false;

  try {
    // Verificar que el prototipo sea Object.prototype
    const isStandardPrototype = Object.getPrototypeOf(obj) === Object.prototype;

    // Verificar que el constructor sea Object y no esté sobreescrito
    const hasValidConstructor =
      obj.constructor === Object &&
      !Object.hasOwnProperty.call(obj, "constructor");

    // Verificar la representación interna del tipo
    const validRepresentation =
      Object.prototype.toString.call(obj) === "[object Object]";

    return isStandardPrototype && hasValidConstructor && validRepresentation;
  } catch (e) {
    return false;
  }
}
