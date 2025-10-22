# Arquitectura Spoon

## Introducción

La Arquitectura Spoon es un patrón arquitectónico para aplicaciones cliente que propone una separación clara de responsabilidades mediante tres capas bien definidas. Esta arquitectura busca resolver los problemas de acoplamiento que surgen cuando se desarrolla desde la UI hacia el dominio.

## Filosofía: De Dentro hacia Fuera

### El Problema: Desarrollo de Fuera hacia Dentro ❌

El desarrollo tradicional que comienza por la interfaz de usuario genera:

- **Acoplamiento fuerte** entre componentes visuales y lógica de negocio
- **Dependencias complejas** que dificultan el mantenimiento
- **Código difícil de reutilizar** en diferentes contextos

### La Solución: Desarrollo de Dentro hacia Fuera ✅

Spoon propone invertir el flujo de desarrollo:

1. Comenzar por el **modelo de datos** (Domain)
2. Continuar con los **controladores** (Ctrl)
3. Finalizar con la **presentación** (Presentation)

## Las Tres Capas

### 1. Capa DOMAIN 🗄️

**Responsabilidad**: "Define los modelos de información, el acceso a datos, y las acciones que se pueden realizar con ellos"

En la capa de dominio escuchamos los siguientes conceptos (Interfaz, Modelo, Api, Entidad y Validador)

- **INTERFAZ**: Define el modelo de información con el que voy a trabajar

```typescript
interface Usermodel {
  name: string;
  email: string;
  age: number;
}
```

- **MODELO**: Proporciona una forma de interactuar con un modelo.

```typescript
const user = state<UserModel>();

user.set({
  name: "John Doe",
  email: "john.doe@example.com",
  age: 30,
});

user.name.get(); // John Doe
```

- **API**: Proporciona acceso a los datos

```typescript
class UserApi {
  public getUsers(): Promise<UserModel[]> {
    return http.get("/users");
  }

  public async createUser(user: UserModel): Promise<void> {
    await http.post("/users", user);
  }

  public async updateUser(user: UserModel): Promise<void> {
    await http.put("/users", user);
  }

  public async deleteUser(userId: string): Promise<void> {
    await http.delete(`/users/${userId}`);
  }
}
```

- **VALIDADOR**: Determina si un modelo es válido o no

```typescript
const createUserValidator = (userModel) =>
  calc(() => {
    const { name, email, age } = userModel.get();

    return {
      name: name.length > 0 && name.length <= 100,
      email: email.length > 0 && email.length <= 100,
      age: typeof age === "number" && age > 0,
    };
  });
```

- **ENTIDAD**: Encapsula el acceso a todo lo anterior y define acciones que se pueden realizar.

```typescript
class UserEntity {
  private api = provide(UserApi); // API
  public model = state<UserModel>(); // INTERFAZ + MODELO
  public validator = createUserValidator(this.model); // VALIDADOR

  constructor(user: UserModel) {
    this.model.set(user);
  }

  public async save() {
    const data = this.model.get();
    return data.id
      ? await this.api.upsertUser(data)
      : await this.api.createUser(data);
  }

  public async delete() {
    const id = this.model.id.get();
    await this.api.deleteUser(id);
  }
}
```

### 2. Capa CTRL ⚙️

**Responsabilidad**: "Cómo interactúo con ello"

La capa de controladores contiene los **controladores** que:

- Orquestan la lógica de negocio
- Gestionan el estado de los componentes
- Conectan el dominio con la presentación
- Permiten composición, extensión y abstracción

#### Características de los Controladores

- **Son la parte lógica** de un controlador
- **Permiten herencia y composición** a diferencia de los componentes
- **Gestionan eventos** y comunicación entre elementos
- **No tienen responsabilidad visual**

#### Ejemplo: MyProfileController

```typescript
class MyProfileCtrl {
  private user: UserEntity;

  nameInput = new InputCtrl({
    label: "Name",
    onChange: (value) => {
      this.user.setValue({ name: value });
    },
  });

  saveButton = new ButtonCtrl({
    label: "Save",
    onClick: () => this.saveChanges(),
  });

  private saveChanges() {
    if (this.user.isValid) {
      this.user.save();
    }
  }
}
```

### 3. Capa PRESENTATION 🎨

**Responsabilidad**: "Qué apariencia tiene"

La capa de presentación contiene los **componentes visuales** que:

- Solo se encargan de presentar información
- No contienen lógica de negocio ("no piensan, solo presentan")
- Son específicos del framework UI utilizado (React, Angular, Vue)
- Permiten composición pero no extensión

#### Ejemplo: Input Component

```jsx
function Input({ from }) {
  const ctrl = useCtrl(from);

  return (
    <input
      className={!ctrl.isValid ? "error" : ""}
      value={ctrl.value}
      type={ctrl.type}
      placeholder={ctrl.placeholder}
      onChange={(e) => ctrl.setValue(e)}
    />
  );
}
```

## Comunicación entre Capas

### Principios de Comunicación

1. **Las capas no deben saltarse**: Domain ↔ Ctrl ↔ Presentation
2. **Unidireccionalidad del flujo**: Los datos fluyen desde el dominio hacia la presentación
3. **Los componentes visuales no se comunican directamente**: Usan el controlador como intermediario

### Estrategias de Comunicación

Para comunicar elementos distantes en el árbol de componentes:

- **Cerca**: Props de componentes
- **Lejos**: Eventos a través del controlador
- **Muy lejos**: Estado global en el dominio (último recurso)

## Ventajas de la Arquitectura Spoon

### Separación de Responsabilidades

- Cada capa tiene un propósito único y bien definido
- Facilita el mantenimiento y la evolución del código

### Reutilización

- Las entidades del dominio son independientes de la UI
- Los controladores pueden reutilizarse con diferentes componentes
- Los componentes pueden cambiar sin afectar la lógica

### Testing

- El dominio se puede probar sin UI
- Los controladores se pueden probar sin renderizado
- Los componentes se pueden probar de forma aislada

### Escalabilidad

- Nuevos controladores se añaden sin modificar código existente
- Los equipos pueden trabajar en paralelo en diferentes capas
- La arquitectura crece de forma organizada

## Implementación Práctica

### Estructura de Carpetas Recomendada

```
src/
├── domain/
│   ├── entities/
│   │   ├── UserEntity.ts
│   │   ├── ProductEntity.ts
│   │   └── ...
│   └── interfaces/
├── ctrl/
│   ├── controllers/
│   │   ├── InputCtrl.ts
│   │   ├── ButtonCtrl.ts
│   │   ├── LoginCtrl.ts
│   │   └── ...
│   └── compositions/
└── presentation/
    ├── components/
    │   ├── Input.tsx
    │   ├── Button.tsx
    │   └── ...
    └── views/
        ├── MyProfile.tsx
        └── ...
```

### Flujo de Desarrollo

1. **Definir el modelo de datos** (Domain)

   - Identificar entidades
   - Establecer relaciones
   - Implementar validaciones

2. **Crear los controladores** (Feature)

   - Definir la lógica de interacción
   - Gestionar el estado
   - Orquestar operaciones

3. **Implementar los componentes** (Presentation)
   - Diseñar la interfaz
   - Conectar con controladores
   - Aplicar estilos

## Conclusiones

La Arquitectura Spoon ofrece una aproximación estructurada al desarrollo de aplicaciones cliente que:

- **Reduce el acoplamiento** entre capas
- **Mejora la mantenibilidad** del código
- **Facilita el testing** y la reutilización
- **Permite escalar** de forma organizada

Al desarrollar "de dentro hacia fuera", se construye una base sólida en el dominio que soporta naturalmente las capas superiores, resultando en aplicaciones más robustas y flexibles.

## Principio Fundamental

> **CONTROLADOR ≠ COMPONENTE**
>
> Un controlador vincula (1,1) con 0 o N componentes, manteniendo la lógica separada de la presentación.
