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

## Conceptos Fundamentales

Antes de entrar en las capas de la arquitectura, es importante entender los conceptos básicos que hacen funcionar Spoon.

### Sistema de Signals

Spoon está construido sobre un sistema de **signals reactivos** que permite gestionar el estado de forma inteligente. Los signals son contenedores que notifican automáticamente cuando su valor cambia, actualizando solo lo necesario.

Los tres tipos básicos de signals son:

**`state()`** - El signal básico para valores que cambian:

```typescript
const nombre = state("Ana");
nombre.get(); // "Ana"
nombre.set("Luis"); // Notifica a todos los suscriptores
```

**`calc()`** - Signal derivado que se recalcula automáticamente:

```typescript
const precio = state(100);
const descuento = state(0.2);

const precioFinal = calc(() => {
  return precio.get() * (1 - descuento.get());
});

precio.set(200); // precioFinal se actualiza solo
```

**`monitor()`** - Efecto que se ejecuta cuando cambian sus dependencias:

```typescript
const contador = state(0);

monitor(() => {
  console.log(`Contador: ${contador.get()}`);
}); // Se ejecuta cada vez que contador cambia
```

Para estructuras más complejas existen `stateObject()` y `stateArray()` que permiten trabajar con objetos y arrays reactivos.

### Reactividad Automática

La reactividad en Spoon funciona mediante **suscripción automática**:

1. Cuando lees un signal dentro de un `calc()` o `monitor()`, te suscribes automáticamente
2. Cuando el signal cambia, notifica a todos sus suscriptores
3. Las actualizaciones se propagan de forma eficiente

**Características clave:**

- **Lazy por defecto**: Solo actualiza lo que está siendo observado
- **Sincrónico**: Los cambios se propagan inmediatamente
- **Optimizado**: Salta actualizaciones innecesarias automáticamente

### Dependency Injection

Spoon proporciona un sistema simple de inyección de dependencias para compartir servicios y contexto:

**`register()`** - Registra un servicio globalmente:

```typescript
class UserApi {
  async getUsers() {
    /* ... */
  }
}

register(UserApi, new UserApi());
```

**`provide()`** - Obtiene un servicio registrado:

```typescript
class UserEntity {
  private api = provide(UserApi); // Obtiene la instancia registrada
}
```

**`useRegister()`** - Registra servicios específicos de React:

```typescript
function App() {
  const navigate = useNavigate();
  useRegister(NavigationToken, navigate); // Disponible en toda la app
}
```

Este sistema permite desacoplar las capas y facilitar el testing al poder reemplazar implementaciones fácilmente.

## Las Tres Capas

### 1. Capa DOMAIN 🗄️

**Responsabilidad**: Define los modelos de información, el acceso a datos, y las acciones que se pueden realizar con estos.

**Conceptos**: Modelo, Api, Entidad y Validador.

**MODELO**: Define la estructura de datos y proporciona una forma reactiva de interactuar con ella.

- **¿Cuándo se utiliza?**: Cuando necesito definir la estructura de datos que voy a manejar en mi aplicación y crear instancias reactivas para trabajar con estos datos.

```typescript
import { state } from "../../lib/signals/State";
import type { Infer } from "../../lib/ModelTypes";
import { stateArray } from "../../lib/signals/stateArray";
import { stateObject } from "../../lib/signals/stateObject";

// La interfaz se infiere automáticamente del modelo
export type iUser = Infer<typeof createUserModel>;
export type UserModel = ReturnType<typeof createUserModel>;

export const createUserModel = () =>
  stateObject({
    id: state<string>(),
    name: state<string>(),
    email: stateArray(() => state<string>()), // Array de emails
    age: state<number>(),
    countryId: state<string>(),
    cityId: state<string>(),
  });
```

**Utilización**:

```typescript
const user = createUserModel();

user.set({
  id: "123",
  name: "John Doe",
  email: ["john.doe@example.com", "john@work.com"],
  age: 30,
  countryId: "ES",
  cityId: "MAD",
});

user.name.get(); // "John Doe"
user.email.get(); // ["john.doe@example.com", "john@work.com"]
user.name.set(true); // ERROR (Type safe)
```

**API**: Proporciona acceso a los datos

- **¿Cuándo se utiliza?**: Cuando necesito interactuar con una fuente de datos externa, como una API REST, para obtener o enviar datos.

```typescript
import axios from "axios";
import type { iUser } from "./UserModel";

export class UserApi {
  public async getUsers(): Promise<(iUser & { id: string })[]> {
    return axios.get("/api/users");
  }

  public async getUserById(userId: string): Promise<iUser & { id: string }> {
    return axios.get(`/api/users/${userId}`);
  }

  public async searchUsers(query: string): Promise<(iUser & { id: string })[]> {
    return axios.get("/api/users/search", { params: { q: query } });
  }

  public async createUser(user: iUser): Promise<iUser & { id: string }> {
    return axios.post("/api/users", user);
  }

  public async updateUser(
    userId: string,
    user: iUser
  ): Promise<iUser & { id: string }> {
    return axios.put(`/api/users/${userId}`, user);
  }

  public async patchUser(
    userId: string,
    user: Partial<iUser>
  ): Promise<iUser & { id: string }> {
    return axios.patch(`/api/users/${userId}`, user);
  }

  public async deleteUser(userId: string): Promise<iUser & { id: string }> {
    return axios.delete(`/api/users/${userId}`);
  }
}
```

**VALIDADOR**: Determina si un modelo es válido o no

- **¿Cuándo se utiliza?**: Cuando necesito asegurarme de que los datos en un modelo cumplen con ciertas reglas antes de procesarlos o enviarlos a una API.

```typescript
import { calc } from "../../lib/signals/Calc";
import type { UserModel } from "./UserModel";

export function createUserValidator(user: UserModel) {
  // Cada campo tiene su propio calc que retorna un mensaje de error o undefined
  const name = calc(() => {
    const value = user.name.get();
    if (value?.length === 0) return "Name cannot be empty";
  });

  const email = calc(() => {
    const emails = user.email.get();
    if (emails?.some((e) => !e.includes("@")))
      return "All emails must be valid";
  });

  const age = calc(() => {
    const value = user.age.get();
    if (value <= 0) return "Age must be a positive number";
  });

  return {
    name,
    email,
    age,
  };
}
```

**ENTIDAD**: Encapsula el acceso a todo lo anterior y define acciones que se pueden realizar.

- **¿Cuándo se utiliza?**: Cuando necesito una representación completa de un modelo de datos que incluya su estructura, validación y las operaciones que se pueden realizar sobre él.

```typescript
import { provide } from "../../lib/provider";
import { UserApi } from "./UserApi";
import { createUserModel, type iUser } from "./UserModel";
import { createUserValidator } from "./UserValidator";

export class UserEntity {
  private api = provide(UserApi);
  public model = createUserModel(); // Crea una instancia reactiva del modelo
  public validation = createUserValidator(this.model); // Validaciones reactivas

  constructor(user: iUser) {
    this.model.set(user);
  }

  public async save() {
    // Verifica que no haya errores de validación
    const hasErrors = Object.values(this.validation).some((v) => !!v.get());
    if (hasErrors) throw new Error("Invalid user data");

    // Actualiza si existe id, crea si no
    this.model.id.get()
      ? await this.api.updateUser(this.model.id.get(), this.model.get())
      : await this.api.createUser(this.model.get());
  }

  public async delete() {
    await this.api.deleteUser(this.model.id.get());
  }
}
```

### 2. Capa CTRL (Controladores)

**Responsabilidad**:

- Orquestan la lógica de negocio
- Gestionan el estado de los componentes
- Conectan el DOMINIO con la PRESENTACIÓN
- Permiten composición, extensión y abstracción

#### Conceptos Clave

- Son la parte lógica de tus componentes
- Permiten herencia a diferencia de los componentes visuales
- Gestionan eventos y comunicación entre elementos
- No tienen responsabilidad visual
- Se pueden reutilizar con diferentes componentes

#### La Clase Base: Ctrl

Todos los controladores heredan de la clase `Ctrl`, que proporciona:

**`set()`** - Vincula props reactivamente:

```typescript
class UserFormCtrl extends Ctrl {
  nameInput = new InputCtrl();
  
  constructor() {
    super();
    // Vincula el valor del input con el modelo
    this.nameInput.set({
      label: "Nombre",
      value: userModel.name, // Signal que se sincroniza automáticamente
    });
  }
}
```

**`get()`** - Obtiene todos los valores actuales:

```typescript
const values = ctrl.get();
// { label: "Nombre", value: "Ana", ... }
```

**Eventos de ciclo de vida:**

```typescript
class MiCtrl extends Ctrl {
  ctrlStart() {
    // Se ejecuta cuando el controlador se monta en la UI
    console.log("Controlador iniciado");
  }
  
  ctrlDestroy() {
    // Se ejecuta cuando el controlador se desmonta
    console.log("Limpiando recursos");
  }
}
```

#### Tipos de Controladores

**1. Controladores Reutilizables**

Son controladores genéricos que funcionan en cualquier contexto. Ejemplos: `InputCtrl`, `ButtonCtrl`, `TableCtrl`.

```typescript
// Controlador genérico de input
class InputCtrl<T> extends Ctrl {
  component = Input; // Componente visual asociado (opcional)
  
  public label = state<string>("");
  public value = state<T>();
  public placeholder = state<string>("");
  public disabled = state<boolean>(false);
  public error = state<string>("");
  
  public onChange = emitter<string>();
}
```

**Uso:**

```typescript
// Se puede usar en cualquier formulario
const emailInput = new InputCtrl<string>().set({
  label: "Email",
  placeholder: "tu@email.com",
  type: "email",
});
```

**2. Controladores Específicos**

Son controladores ligados a una funcionalidad concreta de tu aplicación. Suelen componer múltiples controladores reutilizables y orquestar la lógica de negocio.

```typescript
class UserDetailCtrl extends Ctrl {
  private saving = state<boolean>(false);
  public onClose = emitter<void>();
  
  // Compone controladores reutilizables
  public nameInput = new InputCtrl<string>().set({
    label: "Nombre",
    value: this.user.model.name, // Vinculado al modelo
    error: this.user.validation.name, // Vinculado a validación
    disabled: this.saving, // Deshabilitado mientras guarda
  });
  
  public saveButton = new ButtonCtrl().set({
    label: "Guardar",
    loading: this.saving,
    disabled: calc(() => 
      Object.values(this.user.validation).some(v => !!v.get())
    ),
    onClick: async () => {
      this.saving.set(true);
      await this.user.save();
      this.saving.set(false);
      this.onClose.next();
    },
  });
  
  constructor(private user: UserEntity) {
    super();
  }
}
```

**Ejemplo de controlador que orquesta otros controladores:**

```typescript
class UserPanelCtrl extends Ctrl {
  // State que puede contener un controlador
  userDetailCtrl = state<UserDetailCtrl>(null);
  
  // Título dinámico basado en el estado de la tabla
  title = calc(() => 
    this.userTable.loading.get() 
      ? "Cargando usuarios..." 
      : "Gestión de Usuarios"
  );
  
  // Tabla de usuarios con evento de apertura de detalle
  userTable = new UserTableCtrl().set({
    onOpenDetail: (user: UserEntity) => {
      const detail = new UserDetailCtrl(user).set({
        onClose: () => this.userDetailCtrl.set(null),
      });
      
      this.userDetailCtrl.set(detail);
    },
  });
}
```

#### Comunicación entre Controladores

Los controladores se comunican mediante:

**1. Eventos (Emitters):**

```typescript
class ParentCtrl extends Ctrl {
  childCtrl = new ChildCtrl().set({
    onSave: (data) => {
      // Reacciona al evento del hijo
      console.log("Datos guardados:", data);
    },
  });
}

class ChildCtrl extends Ctrl {
  onSave = emitter<any>();
  
  save() {
    this.onSave.next(data); // Emite el evento
  }
}
```

**2. Contexto compartido (Provider):**

El sistema de providers permite compartir servicios o estado entre controladores sin necesidad de pasarlos por props. Existen dos tipos de contexto:

**Contexto Global** - Se registra al inicio de la aplicación y está disponible en toda la app:

```typescript
// dependencies.tsx - Se registra una vez al inicio
register(UserApi, new UserApi());
register(MasterDataApi, new MasterDataApi());

// Cualquier controlador puede acceder a estos servicios
class UserDetailCtrl extends Ctrl {
  private userApi = provide(UserApi); // Obtiene la instancia registrada
  
  async save() {
    await this.userApi.updateUser(this.user);
  }
}

class UserTableCtrl extends Ctrl {
  private userApi = provide(UserApi); // Misma instancia que UserDetailCtrl
  
  async loadUsers() {
    const users = await this.userApi.getUsers();
  }
}
```

**Contexto Local** - Se registra en un controlador específico y solo está disponible para ese controlador y sus descendientes:

```typescript
// Token para identificar el contexto
const UserListContextToken = Symbol("UserListContext");

class UserListContext {
  selectedUser = state<User>(null);
  users = state<User[]>([]);
}

class UserPanelCtrl extends Ctrl {
  private context = new UserListContext();
  
  ctrlStart() {
    // Registra el contexto cuando el controlador se monta
    register(UserListContextToken, this.context);
  }
  
  ctrlDestroy() {
    // IMPORTANTE: Limpia el contexto cuando se desmonta
    unregister(UserListContextToken);
  }
  
  // Controladores hijos
  userTable = new UserTableCtrl();
  userDetail = new UserDetailCtrl();
}

// Los controladores hijos acceden al contexto del padre
class UserTableCtrl extends Ctrl {
  private context = provide(UserListContextToken);
  
  selectUser(user: User) {
    this.context.selectedUser.set(user); // Actualiza el contexto compartido
  }
}

class UserDetailCtrl extends Ctrl {
  private context = provide(UserListContextToken);
  
  // Reacciona a cambios en el contexto
  selectedUserName = calc(() => {
    const user = this.context.selectedUser.get();
    return user?.name || "Ningún usuario seleccionado";
  });
}
```

La diferencia clave:
- **Global**: Se registra al inicio y nunca se desregistra
- **Local**: Se registra en `ctrlStart()` y se debe limpiar en `ctrlDestroy()` para evitar fugas de memoria

#### Binding Reactivo de Props

Una característica clave es la vinculación reactiva. Las props pueden ser de tres tipos:

**1. Valores no reactivos** - Se asignan una vez y no se actualizan:

```typescript
const input = new InputCtrl().set({
  label: "Nombre", // String estático
  placeholder: "Escribe tu nombre", // No cambia
});
```

**2. State** - Valores reactivos que se sincronizan bidireccionalmente:

```typescript
const userModel = stateObject({
  name: state("Ana"),
  age: state(25),
});

const nameInput = new InputCtrl().set({
  value: userModel.name, // State vinculado
});

// Cuando el usuario escribe en el input, userModel.name se actualiza
// Cuando userModel.name cambia por código, el input se actualiza
```

**3. Calc** - Valores derivados que se actualizan automáticamente pero son de solo lectura:

```typescript
const saving = state(false);

const saveButton = new ButtonCtrl().set({
  label: calc(() => saving.get() ? "Guardando..." : "Guardar"),
  disabled: saving, // También puede ser un State directamente
});

saving.set(true); // El label del botón cambia automáticamente
```

El método `set()` detecta automáticamente el tipo de prop:
- Si es un `State`, vincula el valor bidireccionalmente
- Si es un `Calc`, se suscribe a sus cambios (solo lectura)
- Si es un `Emitter`, suscribe el callback al evento
- Si es un valor normal, simplemente lo asigna

### 3. Capa PRESENTATION (Presentación)

**Responsabilidad**: Visualizar la información conforme a las indicaciones del controlador y enviar eventos de usuario de vuelta al controlador.

#### Conceptos Clave

- Solo se encargan de presentar información
- No contienen lógica de negocio ("no piensan, solo presentan")
- Son específicos del framework UI utilizado (React, Preact, Vue, etc.)
- Permiten composición pero no extensión (no se pueden heredar)

#### El Hook: useCtrl

El hook `useCtrl` es el puente entre los controladores y los componentes React. Se encarga de:

- Crear o recibir una instancia del controlador
- Gestionar su ciclo de vida
- Suscribirse a cambios reactivos y forzar re-renders cuando sea necesario

**Sintaxis:**

```typescript
function MyComponent({ ctrl }: { ctrl: MyCtrl }) {
  const { self } = useCtrl(ctrl);
  
  // self: La instancia del controlador (equivalente a ctrl)
}
```

#### Formas de Usar useCtrl

Existen dos formas de usar `useCtrl`, cada una con su propósito:

**1. Pasar un controlador existente:**

Se usa cuando trabajas con **controladores reutilizables** que se crean en un controlador padre.

```typescript
// El controlador padre crea la instancia
class UserFormCtrl extends Ctrl {
  nameInput = new InputCtrl<string>().set({
    label: "Nombre",
    placeholder: "Escribe tu nombre",
  });
}

// El componente padre pasa la instancia al hijo
function UserForm() {
  const { self } = useCtrl(UserFormCtrl);
  
  return (
    <div>
      <Input ctrl={self.nameInput} />  {/* Pasa la instancia creada */}
    </div>
  );
}

// El componente hijo recibe y usa la instancia
function Input({ ctrl }: { ctrl: InputCtrl<any> }) {
  const { self } = useCtrl(ctrl);
  
  return (
    <div className="input-wrapper">
      {self.label.get() && <label>{self.label.get()}</label>}
      <input
        type={self.type.get()}
        value={self.value.get()}
        placeholder={self.placeholder.get()}
        disabled={self.disabled.get()}
        onChange={(e) => {
          self.value.set(e.target.value);
          self.onChange.next(e.target.value);
        }}
      />
      {self.error.get() && (
        <span className="error">{self.error.get()}</span>
      )}
    </div>
  );
}
```

**2. Pasar la clase del controlador:**

Se usa cuando trabajas con **controladores específicos** y quieres que el componente cree su propia instancia.

```typescript
function UserPanel() {
  // useCtrl crea la instancia automáticamente
  const { self } = useCtrl(UserPanelCtrl);
  const userDetail = self.userDetailCtrl.get();
  
  return (
    <div>
      {!userDetail && (
        <div>
          <h1>{self.title.get()}</h1>
          <Table ctrl={self.userTable} />
        </div>
      )}
      {userDetail && <UserDetail ctrl={userDetail} />}
    </div>
  );
}
```

**¿Cuándo usar cada forma?**

- **Controlador existente**: Cuando el controlador es reutilizable y lo crea un padre (Input, Button, Table)
- **Clase del controlador**: Cuando el controlador es específico de ese componente (UserPanel, UserDetail)

**3. Inicializar el controlador con props:**

También puedes pasar props iniciales al crear el controlador:

```typescript
function Counter() {
  const { self } = useCtrl(CounterCtrl, {
    initialValue: 10,
    maxValue: 100,
  });
  
  return (
    <div>
      <span>{self.count.get()}</span>
      <button onClick={() => self.increment()}>+</button>
    </div>
  );
}
```

#### Reactividad Automática

Cuando los signals de un controlador se actualizan, el componente se re-renderiza automáticamente:

```typescript
function UserDetail({ ctrl }: { ctrl: UserDetailCtrl }) {
  const { self } = useCtrl(ctrl);
  
  // Cuando nameInput.value cambia, el componente Input se re-renderiza
  // Cuando ageInput.value cambia, el componente Input se re-renderiza
  return (
    <div>
      <h1>User Detail</h1>
      <Input ctrl={self.nameInput} />
      <Input ctrl={self.ageInput} />
      <Button ctrl={self.saveButton} />
    </div>
  );
}
```

#### Ciclo de Vida

El hook `useCtrl` gestiona automáticamente el ciclo de vida del controlador, ejecutando los métodos `ctrlStart()` y `ctrlDestroy()` cuando el componente se monta y desmonta:

```typescript
function MiComponente() {
  const { self } = useCtrl(MiCtrl);
  
  // ctrlStart() se ejecuta aquí (componente montado)
  
  return <div>...</div>;
  
  // ctrlDestroy() se ejecuta cuando el componente se desmonta
}
```

#### Compartir Servicios con useRegister

`useRegister` permite registrar servicios específicos de React (como hooks de enrutamiento) para que estén disponibles en los controladores:

```typescript
function App() {
  const navigate = useNavigate(); // Hook de react-router
  
  // Registra navigate para que los controladores puedan usarlo
  useRegister(NavigationToken, navigate);
  
  return <Router>...</Router>;
}

// En cualquier controlador
class MyCtrl extends Ctrl {
  private navigate = provide(NavigationToken);
  
  goToHome() {
    this.navigate("/home");
  }
}
```

#### Patrón: El Componente se Re-renderiza, el Controlador Persiste

Un aspecto importante de entender es que el componente puede re-renderizarse múltiples veces, pero **el controlador siempre es la misma instancia**:

```typescript
function UserForm() {
  const { self } = useCtrl(UserFormCtrl);
  
  // Cada vez que el componente se re-renderiza:
  // - Se ejecuta esta función de nuevo
  // - Pero 'self' sigue siendo la misma instancia
  // - El estado del controlador se mantiene intacto
  
  console.log(self.key); // Siempre imprime el mismo key
  
  return <div>...</div>;
}
```

Esto permite que:
- El estado persista entre re-renders
- Las suscripciones y listeners se mantengan
- La lógica de negocio no se reinicie innecesariamente

#### Ejemplo Completo: Formulario de Usuario

```typescript
// Controlador
class UserFormCtrl extends Ctrl {
  private user = new UserEntity();
  private saving = state(false);
  
  nameInput = new InputCtrl<string>().set({
    label: "Nombre",
    value: this.user.model.name,
    error: this.user.validation.name,
  });
  
  emailInput = new InputCtrl<string>().set({
    label: "Email",
    value: this.user.model.email,
    error: this.user.validation.email,
    type: "email",
  });
  
  saveButton = new ButtonCtrl().set({
    label: "Guardar",
    loading: this.saving,
    onClick: async () => {
      this.saving.set(true);
      await this.user.save();
      this.saving.set(false);
    },
  });
}

// Componente
function UserForm() {
  const { self } = useCtrl(UserFormCtrl);
  
  return (
    <div>
      <Input ctrl={self.nameInput} />
      <Input ctrl={self.emailInput} />
      <Button ctrl={self.saveButton} />
    </div>
  );
}
```

## Comunicación entre Capas

### Principios de Comunicación

1. **Las capas no deben saltarse**: Domain ↔ Ctrl ↔ Presentation
2. **Unidireccionalidad del flujo de datos**: Los datos fluyen desde el dominio hacia la presentación
3. **Los eventos fluyen en sentido contrario**: De la presentación hacia el controlador, y del controlador al dominio
4. **Los componentes visuales no se comunican directamente**: Usan el controlador como intermediario

### Flujo de Datos Completo

Un ejemplo típico de flujo completo en la arquitectura:

```typescript
// DOMAIN: Define la estructura y lógica de negocio
class UserEntity {
  private api = provide(UserApi);
  public model = stateObject({
    name: state(""),
    email: state(""),
  });
  
  async save() {
    await this.api.updateUser(this.model.get());
  }
}

// CTRL: Orquesta la interacción
class UserFormCtrl extends Ctrl {
  private user = new UserEntity();
  
  nameInput = new InputCtrl().set({
    value: this.user.model.name, // Vincula el modelo con el input
  });
  
  saveButton = new ButtonCtrl().set({
    onClick: () => this.user.save(), // Ejecuta la acción del dominio
  });
}

// PRESENTATION: Visualiza y captura eventos
function UserForm() {
  const { self } = useCtrl(UserFormCtrl);
  
  return (
    <div>
      <Input ctrl={self.nameInput} />  {/* Renderiza según el estado */}
      <Button ctrl={self.saveButton} /> {/* Captura eventos del usuario */}
    </div>
  );
}
```

**Flujo de actualización:**
1. Usuario escribe en el input (PRESENTATION)
2. `onChange` actualiza `nameInput.value` (CTRL)
3. `nameInput.value` está vinculado a `user.model.name` (DOMAIN)
4. El modelo se actualiza automáticamente
5. El componente se re-renderiza con el nuevo valor

**Flujo de acción:**
1. Usuario hace clic en guardar (PRESENTATION)
2. Se ejecuta `saveButton.onClick` (CTRL)
3. Se llama a `user.save()` (DOMAIN)
4. El dominio realiza la petición a la API

### Estrategias de Comunicación

Para comunicar elementos distantes en el árbol de componentes, usa estas estrategias según la distancia:

**Elementos cercanos (padre-hijo directo):**
```typescript
// Pasa el controlador como prop
<Input ctrl={self.nameInput} />
```

**Elementos lejanos (mismo árbol):**
```typescript
// Usa eventos a través del controlador
class ParentCtrl extends Ctrl {
  tableCtrl = new TableCtrl().set({
    onRowClick: (row) => {
      // El padre reacciona al evento del hijo
      this.detailCtrl.set({ data: row });
    },
  });
}
```

**Elementos muy lejanos (diferentes árboles):**
```typescript
// Usa estado compartido en el dominio o providers
class GlobalState {
  currentUser = state<User>(null);
}

register(GlobalState, new GlobalState());

// Cualquier controlador puede acceder
class HeaderCtrl extends Ctrl {
  private globalState = provide(GlobalState);
  userName = calc(() => this.globalState.currentUser.get()?.name);
}
```

**Regla de oro**: Usa la estrategia más simple que funcione. Solo recurre a estado global cuando sea realmente necesario.

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
│   ├── User/
│   │   ├── UserEntity.ts
│   │   ├── UserModel.ts
│   │   ├── UserApi.ts
│   │   ├── UserValidator.ts
│   │   └── ...
│   └── Task/
│       └── ...
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

## Patrones y Mejores Prácticas

### Patrón: Formulario con Validación

Un caso común es un formulario que valida en tiempo real y guarda datos:

```typescript
// DOMAIN
class UserEntity {
  private api = provide(UserApi);
  
  // Si el modelo crece mucho, muévelo a un archivo separado: UserModel.ts
  model = stateObject({
    name: state(""),
    email: state(""),
    age: state(0),
  });
  
  // Si las validaciones crecen mucho, muévelas a un archivo separado: UserValidator.ts
  validation = {
    name: calc(() => {
      const name = this.model.name.get();
      return name.length === 0 ? "El nombre es requerido" : "";
    }),
    email: calc(() => {
      const email = this.model.email.get();
      return !email.includes("@") ? "Email inválido" : "";
    }),
    age: calc(() => {
      const age = this.model.age.get();
      return age < 18 ? "Debe ser mayor de edad" : "";
    }),
  };
  
  isValid = calc(() => {
    return Object.values(this.validation).every(v => !v.get());
  });
  
  async save() {
    if (!this.isValid.get()) return;
    await this.api.updateUser(this.model.get());
  }
}

// CTRL
class UserFormCtrl extends Ctrl {
  private user = new UserEntity();
  private saving = state(false);
  
  nameInput = new InputCtrl<string>().set({
    label: "Nombre",
    value: this.user.model.name,
    error: this.user.validation.name,
    disabled: this.saving,
  });
  
  emailInput = new InputCtrl<string>().set({
    label: "Email",
    value: this.user.model.email,
    error: this.user.validation.email,
    type: "email",
    disabled: this.saving,
  });
  
  saveButton = new ButtonCtrl().set({
    label: "Guardar",
    loading: this.saving,
    disabled: calc(() => !this.user.isValid.get()),
    onClick: async () => {
      this.saving.set(true);
      await this.user.save();
      this.saving.set(false);
    },
  });
}

// PRESENTATION
function UserForm() {
  const { self } = useCtrl(UserFormCtrl);
  
  return (
    <div>
      <Input ctrl={self.nameInput} />
      <Input ctrl={self.emailInput} />
      <Button ctrl={self.saveButton} />
    </div>
  );
}
```

### Patrón: Selects Dependientes

Cuando un select depende del valor de otro (por ejemplo: País → Ciudad).

Lo importante de este patrón es que la lógica de dependencia se declara de forma **declarativa** en el propio select dependiente, no de forma imperativa en el select padre. Esto hace que el código sea más claro y mantenible.

```typescript
// CTRL
class UserDetailCtrl extends Ctrl {
  private masterData = provide(MasterDataApi);
  
  // Select de países (independiente)
  countrySelect = new SelectCtrl<Country, string>().set({
    label: "País",
    placeholder: "Selecciona un país",
    labelKey: 'name',
    valueKey: "id",
    options: asyncCalc(() => this.masterData.getCountries()),
    value: this.user.model.countryId,
  });
  
  // Select de ciudades (dependiente del país)
  // La clave está en usar asyncCalc que se recalcula cuando cambian sus dependencias
  citySelect = new SelectCtrl<City, string>().set((_select) => ({
    label: "Ciudad",
    placeholder: "Selecciona una ciudad",
    labelKey: 'name',
    valueKey: "id",
    value: this.user.model.cityId,
    
    // asyncCalc se ejecuta automáticamente cuando countrySelect.value cambia
    options: asyncCalc(async () => {
      // Limpia la ciudad seleccionada cuando cambia el país
      _select.value.set(null);
      
      // Si no hay país seleccionado, no buscar ciudades
      const countryId = this.countrySelect.value.get(); // ← Dependencia
      if (!countryId) return [];
      
      // Buscar ciudades para el país seleccionado
      _select.loading.set(true);
      const cities = await this.masterData.getCities(countryId);
      _select.loading.set(false);
      
      return cities;
    }),
  }));
  
  constructor(private user: UserEntity) {
    super();
  }
}
```

**¿Por qué es declarativo y no imperativo?**

Lo normal sería gestionar esta lógica en el select de country con un `onChange`:

```typescript
// ❌ Enfoque imperativo (menos recomendado)
countrySelect = new SelectCtrl().set({
  onChange: (countryId) => {
    // Lógica imperativa: "cuando esto pase, haz esto"
    this.citySelect.loading.set(true);
    this.masterData.getCities(countryId).then(cities => {
      this.citySelect.options.set(cities);
      this.citySelect.loading.set(false);
    });
  }
});

// ✅ Enfoque declarativo (recomendado)
citySelect = new SelectCtrl().set({
  // Declarativo: "las opciones siempre son el resultado de esto"
  options: asyncCalc(async () => {
    const countryId = this.countrySelect.value.get();
    return countryId ? await this.masterData.getCities(countryId) : [];
  }),
});
```

El enfoque declarativo es más limpio porque:
- La lógica está donde corresponde (en el select que depende)
- Se recalcula automáticamente cuando cambian las dependencias
- Es más fácil de entender y mantener

### Patrón: Tabla con Detalle

Mostrar una tabla que al hacer clic en una fila abre un detalle:

```typescript
class UserPanelCtrl extends Ctrl {
  userDetailCtrl = state<UserDetailCtrl>(null);
  
  userTable = new UserTableCtrl().set({
    onOpenDetail: (user: UserEntity) => {
      const detail = new UserDetailCtrl(user).set({
        onClose: () => this.userDetailCtrl.set(null),
        onSave: () => {
          this.userTable.reload(); // Recarga la tabla
          this.userDetailCtrl.set(null);
        },
      });
      
      this.userDetailCtrl.set(detail);
    },
  });
}

function UserPanel() {
  const { self } = useCtrl(UserPanelCtrl);
  const userDetail = self.userDetailCtrl.get();
  
  return (
    <div>
      {!userDetail && <Table ctrl={self.userTable} />}
      {userDetail && <UserDetail ctrl={userDetail} />}
    </div>
  );
}
```

### Patrón: Carga de Datos Inicial

Cargar datos cuando el controlador se monta:

```typescript
class UserListCtrl extends Ctrl {
  private api = provide(UserApi);
  users = state<User[]>([]);
  loading = state(true);
  
  ctrlStart() {
    this.loadUsers();
  }
  
  async loadUsers() {
    this.loading.set(true);
    const users = await this.api.getUsers();
    this.users.set(users);
    this.loading.set(false);
  }
}
```

### Mejores Prácticas

**1. No pongas lógica de negocio en los componentes:**

```typescript
// ❌ MAL
function UserForm() {
  const { self } = useCtrl(UserFormCtrl);
  
  return (
    <button onClick={async () => {
      // Lógica de negocio en el componente
      if (self.name.get().length > 0) {
        await api.save({ name: self.name.get() });
      }
    }}>Guardar</button>
  );
}

// ✅ BIEN
class UserFormCtrl extends Ctrl {
  saveButton = new ButtonCtrl().set({
    onClick: () => this.save(), // Lógica en el controlador
  });
  
  private async save() {
    if (this.name.get().length > 0) {
      await this.api.save({ name: this.name.get() });
    }
  }
}
```

**2. Usa Calc para valores derivados:**

```typescript
// ❌ MAL - Calcular en cada render
function Header() {
  const { self } = useCtrl(HeaderCtrl);
  const userName = self.user.get()?.name || "Invitado"; // Se ejecuta en cada render
  
  return <span>{userName}</span>;
}

// ✅ BIEN - Usar calc en el controlador
class HeaderCtrl extends Ctrl {
  userName = calc(() => {
    return this.user.get()?.name || "Invitado";
  });
}
```

**3. Limpia recursos en ctrlDestroy:**

```typescript
class MyCtrl extends Ctrl {
  private intervalId: number;
  
  ctrlStart() {
    // Inicia un intervalo
    this.intervalId = setInterval(() => {
      this.refresh();
    }, 5000);
  }
  
  ctrlDestroy() {
    // IMPORTANTE: Limpia el intervalo
    clearInterval(this.intervalId);
  }
}
```

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
