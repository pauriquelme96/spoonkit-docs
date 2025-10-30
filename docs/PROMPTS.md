PROMPTS

# ANOTA EL CÓDIGO

Anota cada linea de código relevante con comentarios explicativos de lo que está haciendo este código. Hazlo en español y utiliza un lenguaje cercano y poco formal, no utilices emojis. Las explicaciones deben ser muy claras y sencillas. Accesibles. No anotes imports ni tipos a no ser que se especifique explícitamente. Aquí tienes un ejemplo de código anotado:

```typescript
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
```

# GENERA DOCUMENTACIÓN

Genera la documentación en formato TSDoc para la clase o función que te indique. Sigue estas pautas:

**Estilo de escritura:**

- Español con lenguaje cercano y poco formal
- No utilices emojis
- Explicaciones muy claras, sencillas y accesibles
- Ejemplos prácticos basados en casos de uso reales del proyecto

**Estructura de la documentación:**

1. **Documentación de clase/función principal:**

   - Explicación del concepto y propósito
   - Sección "¿Cuándo usar?" con casos de uso concretos
   - Lista de características principales
   - 3-4 ejemplos de código progresivos (de simple a complejo)
   - Referencias cruzadas con `@see` a elementos relacionados

2. **Funciones factory:**

   - Descripción breve y directa
   - Indica que es el método recomendado
   - Referencia a la clase principal con `@see`
   - Sin ejemplos (los ejemplos van en la clase)

3. **Métodos y propiedades:**
   - Descripción clara y concisa
   - Sin extenderse demasiado
   - Sin ejemplos adicionales
   - Incluir siempre los tipos de retorno explícitos
   - Documentar `@param` y `@returns` cuando aplique
   - Usar `@throws` si el método puede lanzar errores

**Proceso de trabajo:**

- Ve paso a paso, mostrándome cada sección para aprobar antes de continuar
- Pregunta todo lo necesario para entender el contexto y casos de uso
- Revisa archivos relacionados del proyecto para ejemplos realistas
- Una vez aprobada toda la documentación, aplícala al archivo automáticamente

**Pregunta primero:**

1. El propósito principal de la clase/función
2. Casos de uso típicos en el proyecto
3. Diferencias con elementos similares
4. Características importantes que destacar
5. Ejemplos reales de uso en el código base
