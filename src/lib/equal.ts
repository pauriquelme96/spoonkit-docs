export function equal(a: any, b: any): boolean {
    const seen = new WeakMap();
    return equalHelper(a, b, seen);
}

function equalHelper(a: any, b: any, seen: WeakMap<any, any>): boolean {
    if (a === b) return true;

    // Manejar objetos Date
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    // Verificar si ambos son objetos y no son null
    if (a == null || typeof a !== 'object' || b == null || typeof b !== 'object') {
        return false;
    }

    // Manejar referencias cíclicas
    if (seen.has(a)) {
        return seen.get(a) === b;
    }
    seen.set(a, b);

    // Obtener las claves de ambos objetos
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Comparar la cantidad de claves
    if (keysA.length !== keysB.length) return false;

    // Convertir keysB en un Set para búsquedas más rápidas
    const keysBSet = new Set(keysB);

    // Recorrer y comparar cada propiedad
    for (const key of keysA) {
        if (!keysBSet.has(key) || !equalHelper(a[key], b[key], seen)) {
            return false;
        }
    }

    return true;
}
