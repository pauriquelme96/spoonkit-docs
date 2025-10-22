# SpoonKit Docs

## Capas

### 1. Capa de dominio

### 2. Capa de controladores

### 3. Capa de presentación

## Herramientas

### Modelo

#### Descripción

Un modelo representa un conjunto de datos (Un usuario, una tarea, x). Pertenece a la capa `1. Capa de dominio`

#### ¿Cuándo se utiliza un modelo?

Cuando necesitamos validar y/o escuchar un conjunto de datos. Ej: un formulario:

```typescript
export interface TaskModel {
  id: string;
  description: string;
  completed: boolean;
}

export const createTaskModel = () => state<TaskModel>();
```

### Entidad

Una entidad representa un conjunto de funciones encapsuladas en una clase ligada al dominio. En la arquitectura SpoonKit se utilizan para no duplicar la funcionalidad

#### Un

### Ctrl

### Provider
