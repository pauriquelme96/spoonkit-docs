# Changelog - SpoonKit Framework

## Simplificación de la API - Octubre 2025

Este cambio representa una simplificación significativa del framework, eliminando abstracciones innecesarias y manteniendo solo lo esencial para facilitar el aprendizaje y desarrollo.

### 🚫 Deprecated (No utilizar en nuevos desarrollos)

Las siguientes características están **deprecated** y no deben utilizarse en nuevos desarrollos. Se mantienen temporalmente por compatibilidad con código existente:

#### EntityStores
- **Estado**: Deprecated
- **Razón**: Abstracción innecesaria que complica el desarrollo
- **Alternativa**: Utilizar implementación según necesidad

#### Field Classes
- **Clases deprecated**: `Field`, `FieldModel`, `FieldObj`, `FieldArray`
- **Funcionalidad removida**: Lógica de `isValid`, `isDirty` y construcción de modelos
- **Razón**: Complejidad innecesaria en la gestión de formularios
- **Alternativa**: Utilizar `stateObject`, `stateArray` y `state` directamente

#### Entity Class
- **Clase deprecated**: `Entity`
- **Métodos removidos**: `commit()`, `sync()`, `drop()`
- **Razón**: Abstracción que añade complejidad sin beneficios claros
- **Alternativa**: Utilizar clases normales que no extiendan de Entity

#### useCtrl API Legacy
- **API deprecated**: `{ state, setState }`
- **Razón**: Patrón inconsistente con el resto del framework
- **Alternativa**: Utilizar siempre `{ self }` en useCtrl

### ✨ Mejoras y Nuevas Características

#### Construcción Simplificada de Modelos
Los modelos ahora se construyen directamente utilizando las funciones primitivas:
- `stateObject()` - Para objetos reactivos
- `stateArray()` - Para arrays reactivos  
- `state()` - Para valores primitivos reactivos

#### Propiedad `component` en Ctrl
- **Añadido**: Nueva prop `component` en la clase/función `Ctrl`
- **Beneficio**: Elimina la necesidad de usar `useRegister` para registrar componentes
- **Resultado**: Código más limpio y menos boilerplate

#### Centralización de Servicios
- **Cambio**: Los servicios principales (ej: `UserApi`, `MasterDataApi`) ahora se declaran en el punto de entrada de la aplicación
- **Ubicación recomendada**: `dependencies.ts` o similar
- **Beneficio**: Mejor organización, dependency injection más clara, y facilita testing

#### Validación de Modelos Paralela
- **Cambio**: La validación ahora se implementa de forma paralela al modelo en lugar de estar incrustada en él
- **Patrón**: Se utilizan funciones `calc()` que observan el estado del modelo y retornan mensajes de error cuando aplica
- **Ejemplo**: `createUserValidator(userModel)` que retorna validadores reactivos para cada campo
- **Beneficio**: 
  - Separación de responsabilidades (modelo vs validación)
  - Validación reactiva y automática
  - Reutilización y testing más sencillo
  - Modelos más limpios y enfocados solo en el estado

---

### 📚 Notas de Migración

Para migrar código existente, considera:
1. Reemplazar EntityStores por `stateObject`/`stateArray`
2. Convertir Field classes a state directo
3. Simplificar Entity classes a objetos simples con estado
4. Actualizar useCtrl para usar `{ self }` en lugar de `{ state, setState }`
5. Mover declaraciones de servicios a `dependencies.ts`

**Importante**: El código legacy seguirá funcionando, pero se recomienda migrar gradualmente para aprovechar la simplicidad de la nueva API.

