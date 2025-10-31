# Spoon Architecture - Development Instructions

## Overview

This project follows the **Spoon Architecture**, a layered architectural pattern for client applications that enforces clear separation of concerns through three well-defined layers: **Domain**, **Ctrl (Controllers)**, and **Presentation**.

The core philosophy is **"Inside-Out Development"**: Start with the domain model, then build controllers, and finally implement the presentation layer.

---

## 🏗️ Architecture Layers

### 1. DOMAIN Layer 🗄️

**Location**: `src/domain/`

**Responsibility**: Defines data models, data access, validation, and domain actions.

**Components**:

#### Model (`*Model.ts`)
Defines the data structure using reactive signals.

```typescript
import { state } from "../../lib/signals/State";
import { stateObject } from "../../lib/signals/stateObject";
import { stateArray } from "../../lib/signals/stateArray";
import type { Infer } from "../../lib/ModelTypes";

// Type inference from model
export type iUser = Infer<typeof createUserModel>;
export type UserModel = ReturnType<typeof createUserModel>;

export const createUserModel = () =>
  stateObject({
    id: state<string>(),
    name: state<string>(),
    email: stateArray(() => state<string>()),
    age: state<number>(),
    countryId: state<string>(),
    cityId: state<string>(),
  });
```

**Conventions**:
- Export factory function `create{Entity}Model()`
- Export type `i{Entity}` (interface) and `{Entity}Model` (return type)
- Use `state()` for primitive values
- Use `stateObject()` for nested objects
- Use `stateArray()` for arrays of signals

#### API (`*Api.ts`)
Provides data access to external sources (REST APIs, GraphQL, etc.)

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

  public async createUser(user: iUser): Promise<iUser & { id: string }> {
    return axios.post("/api/users", user);
  }

  public async updateUser(
    userId: string,
    user: iUser
  ): Promise<iUser & { id: string }> {
    return axios.put(`/api/users/${userId}`, user);
  }

  public async deleteUser(userId: string): Promise<void> {
    return axios.delete(`/api/users/${userId}`);
  }
}
```

**Conventions**:
- Class-based API services
- Async methods that return Promises
- Clear, semantic method names (getUsers, createUser, updateUser, etc.)

#### Validator (`*Validator.ts`)
Defines reactive validation rules for models.

```typescript
import { calc } from "../../lib/signals/Calc";
import type { UserModel } from "./UserModel";

export function createUserValidator(user: UserModel) {
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

**Conventions**:
- Factory function `create{Entity}Validator()`
- Each validation returns a `calc()` that returns error message or `undefined`
- Return object with same keys as model fields

#### Entity (`*Entity.ts`)
Encapsulates model, validation, and domain actions.

```typescript
import { provide } from "../../lib/provider";
import { UserApi } from "./UserApi";
import { createUserModel, type iUser } from "./UserModel";
import { createUserValidator } from "./UserValidator";

export class UserEntity {
  private api = provide(UserApi);
  public model = createUserModel();
  public validation = createUserValidator(this.model);

  constructor(user: iUser) {
    this.model.set(user);
  }

  public async save() {
    const hasErrors = Object.values(this.validation).some((v) => !!v.get());
    if (hasErrors) throw new Error("Invalid user data");

    this.model.id.get()
      ? await this.api.updateUser(this.model.id.get(), this.model.get())
      : await this.api.createUser(this.model.get());
  }

  public async delete() {
    await this.api.deleteUser(this.model.id.get());
  }
}
```

**Conventions**:
- Class-based entities
- Public `model` and `validation` properties
- Private api accessed via `provide()`
- Constructor accepts initial data
- Domain-specific action methods

---

### 2. CTRL Layer (Controllers)

**Location**: 
- `src/components/` - Reusable controllers
- `src/pages/` - Page-specific controllers

**Responsibility**: Orchestrates business logic, manages component state, connects Domain with Presentation.

#### Base Class: `Ctrl`

All controllers extend from `Ctrl`:

```typescript
import { Ctrl } from "../../lib/Ctrl";
import { state } from "../../lib/signals/State";
import { emitter } from "../../lib/signals/Emitter";

export class ButtonCtrl extends Ctrl {
  component = Button; // Optional: Associate with component
  
  // States
  public label = state<string>("");
  public disabled = state<boolean>(false);
  public loading = state<boolean>(false);
  
  // Events
  public onClick = emitter<void>();
}
```

**Key Methods**:
- `set()` - Binds props reactively (bidirectional for State, readonly for Calc, subscriptions for Emitter)
- `get()` - Gets all current values
- `ctrlStart()` - Lifecycle hook when mounted
- `ctrlDestroy()` - Lifecycle hook when unmounted

#### Reusable Controllers

Generic controllers that work in any context (Input, Button, Select, Table, etc.)

**Location**: `src/components/{ComponentName}/{ComponentName}Ctrl.ts`

```typescript
// src/components/Input/InputCtrl.ts
export class InputCtrl<T> extends Ctrl {
  component = Input;
  
  public label = state<string>("");
  public value = state<T>();
  public placeholder = state<string>("");
  public disabled = state<boolean>(false);
  public error = state<string>("");
  public type = state<string>("text");
  
  public onChange = emitter<T>();
}
```

#### Page-Specific Controllers

Controllers tied to specific features or pages.

**Location**: `src/pages/{PageName}/{PageName}Ctrl.ts`

```typescript
export class UserDetailCtrl extends Ctrl {
  private masterData = provide(MasterDataApi);
  private saving = state<boolean>(false);
  
  public onClose = emitter<void>();
  
  // Compose reusable controllers
  public nameInput = new InputCtrl<string>().set({
    label: "Name",
    value: this.user.model.name,
    error: this.user.validation.name,
    disabled: this.saving,
  });
  
  public saveButton = new ButtonCtrl().set({
    label: "Save",
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

**Conventions**:
- Public properties for UI-bound state/events
- Private properties for internal logic
- Constructor receives domain entities or configuration
- Compose child controllers in property initializers
- Use `set()` for reactive binding

---

### 3. PRESENTATION Layer

**Location**: `src/components/` and `src/pages/`

**Responsibility**: Visualize information and capture user events. NO business logic.

#### Components

```tsx
import { useCtrl } from "../../lib/useCtrl";
import { ButtonCtrl } from "./ButtonCtrl";

export function Button({ ctrl }: { ctrl: ButtonCtrl }) {
  const { self } = useCtrl(ctrl);

  return (
    <button
      className={`button button-${self.variant.get()}`}
      disabled={self.disabled.get() || self.loading.get()}
      onClick={() => self.onClick.next()}
    >
      {self.loading.get() ? "Loading..." : self.label.get()}
    </button>
  );
}
```

**Conventions**:
- Always receive `{ ctrl }` as props
- Always use `useCtrl(ctrl)` hook
- Use `self` from destructured return
- Call `.get()` to read state values
- Call `.next()` to emit events
- Call `.set()` to update state values
- NO business logic, only presentation
- Components are function components

#### Using useCtrl

**Two patterns**:

1. **Pass existing controller instance** (for reusable components):
```tsx
function UserForm() {
  const { self } = useCtrl(UserFormCtrl);
  
  return <Input ctrl={self.nameInput} />;
}
```

2. **Pass controller class** (for page controllers):
```tsx
function UserPanel() {
  const { self } = useCtrl(UserPanelCtrl);
  
  return <div>...</div>;
}
```

---

## 🎯 Signals System

The reactive system is based on **signals** from `@preact/signals-core`.

### Basic Signals

#### `state()` - Mutable reactive value

```typescript
const count = state(0);
count.get(); // Read (reactive)
count.set(1); // Write (notifies subscribers)
count.peek(); // Read (non-reactive)
```

#### `calc()` - Derived computed value

```typescript
const price = state(100);
const discount = state(0.2);

const finalPrice = calc(() => {
  return price.get() * (1 - discount.get());
});

price.set(200); // finalPrice automatically recalculates
```

#### `monitor()` - Side effect

```typescript
const count = state(0);

monitor(() => {
  console.log(`Count: ${count.get()}`);
}); // Runs whenever count changes
```

#### `emitter()` - Event emitter

```typescript
const onClick = emitter<void>();

onClick.subscribe(() => console.log("Clicked!"));
onClick.next(); // Trigger event
```

### Structured Signals

#### `stateObject()` - Reactive object

```typescript
const user = stateObject({
  name: state("John"),
  age: state(30),
});

user.set({ name: "Jane" }); // Partial update
user.get(); // Get all values
```

#### `stateArray()` - Reactive array

```typescript
const items = stateArray(() => state(""));

items.push("Item 1");
items.at(0).set("Updated");
const length = items.length.get();
```

#### `asyncCalc()` - Async computed value

```typescript
const userId = state("123");

const userData = asyncCalc(async () => {
  const id = userId.get();
  return await api.getUser(id);
});

// Automatically refetches when userId changes
```

---

## 🔄 Communication Patterns

### Between Controllers

#### Parent-Child via Props
```typescript
class ParentCtrl extends Ctrl {
  childCtrl = new ChildCtrl().set({
    value: this.parentValue, // Bind state
    onSave: (data) => this.handleSave(data), // Subscribe to event
  });
}
```

#### Events (Emitters)
```typescript
class TableCtrl extends Ctrl {
  onRowClick = emitter<User>();
  
  handleClick(user: User) {
    this.onRowClick.next(user);
  }
}

class ParentCtrl extends Ctrl {
  table = new TableCtrl().set({
    onRowClick: (user) => console.log(user),
  });
}
```

### Dependency Injection

#### Global Services (`dependencies.tsx`)

```typescript
import { register } from "./lib/provider";
import { UserApi } from "./domain/User/UserApi";

// Register once at app startup
register(UserApi, new UserApi());
register(MasterDataApi, new MasterDataApi());
```

```typescript
// Use anywhere
class UserCtrl extends Ctrl {
  private api = provide(UserApi);
  
  async loadUsers() {
    const users = await this.api.getUsers();
  }
}
```

#### Local Context (Scoped to controller tree)

```typescript
const UserListContextToken = Symbol("UserListContext");

class UserPanelCtrl extends Ctrl {
  private context = new UserListContext();
  
  ctrlStart() {
    register(UserListContextToken, this.context);
  }
  
  ctrlDestroy() {
    unregister(UserListContextToken); // IMPORTANT: cleanup
  }
}

class ChildCtrl extends Ctrl {
  private context = provide(UserListContextToken);
}
```

---

## 📋 Common Patterns

### Dependent Selects (Country → City)

Use **declarative** approach with `asyncCalc` in dependent select:

```typescript
class UserDetailCtrl extends Ctrl {
  countrySelect = new SelectCtrl<Country, string>().set({
    label: "Country",
    options: asyncCalc(() => this.masterData.getCountries()),
    value: this.user.model.countryId,
  });
  
  // Declarative: options recalculate when country changes
  citySelect = new SelectCtrl<City, string>().set((_select) => ({
    label: "City",
    value: this.user.model.cityId,
    options: asyncCalc(async () => {
      _select.value.set(null); // Clear selection
      
      const countryId = this.countrySelect.value.get(); // Dependency
      if (!countryId) return [];
      
      _select.loading.set(true);
      const cities = await this.masterData.getCities(countryId);
      _select.loading.set(false);
      
      return cities;
    }),
  }));
}
```

### Form with Validation

```typescript
class UserFormCtrl extends Ctrl {
  private user = new UserEntity();
  private saving = state(false);
  
  nameInput = new InputCtrl<string>().set({
    label: "Name",
    value: this.user.model.name, // Bidirectional binding
    error: this.user.validation.name, // Readonly binding
    disabled: this.saving,
  });
  
  saveButton = new ButtonCtrl().set({
    label: "Save",
    loading: this.saving,
    disabled: calc(() => 
      Object.values(this.user.validation).some(v => !!v.get())
    ),
    onClick: async () => {
      this.saving.set(true);
      await this.user.save();
      this.saving.set(false);
    },
  });
}
```

### Table with Detail View

```typescript
class UserPanelCtrl extends Ctrl {
  userDetailCtrl = state<UserDetailCtrl>(null);
  
  userTable = new UserTableCtrl().set({
    onOpenDetail: (user: UserEntity) => {
      const detail = new UserDetailCtrl(user).set({
        onClose: () => this.userDetailCtrl.set(null),
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

### Loading Data on Mount

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

---

## ✅ Best Practices

### DO ✅

1. **Start with Domain**: Define models, validators, and entities first
2. **Use Signals**: Always use `state()`, `calc()`, `monitor()` for reactivity
3. **Factory Functions**: Use `state()`, not `new State()`
4. **Type Safety**: Let TypeScript infer types from models
5. **Declarative Logic**: Use `calc()` and `asyncCalc()` for derived values
6. **Clean Up**: Always clean up in `ctrlDestroy()` (intervals, subscriptions, local context)
7. **Compose Controllers**: Build complex controllers from simple ones
8. **Private APIs**: Keep API instances private in entities/controllers
9. **Public Props**: Expose states/events as public for binding
10. **Use `set()` for Binding**: Always use `ctrl.set()` for reactive prop binding

### DON'T ❌

1. **❌ NO Logic in Components**: Business logic belongs in controllers
```tsx
// ❌ BAD
function Button() {
  return <button onClick={async () => {
    if (value.length > 0) await api.save();
  }}>Save</button>;
}

// ✅ GOOD
class ButtonCtrl extends Ctrl {
  onClick = emitter<void>();
}
```

2. **❌ NO Direct State Creation**: Always use factory functions
```typescript
// ❌ BAD
const count = new State(0);

// ✅ GOOD
const count = state(0);
```

3. **❌ NO Imperative Updates**: Use declarative `calc()` instead
```typescript
// ❌ BAD (imperative)
countrySelect.set({
  onChange: (id) => {
    citySelect.loading.set(true);
    getCities(id).then(cities => {
      citySelect.options.set(cities);
      citySelect.loading.set(false);
    });
  }
});

// ✅ GOOD (declarative)
citySelect.set({
  options: asyncCalc(async () => {
    const id = countrySelect.value.get();
    return id ? await getCities(id) : [];
  }),
});
```

4. **❌ NO Computed Values in Render**: Move to controller
```tsx
// ❌ BAD
function Header() {
  const { self } = useCtrl(HeaderCtrl);
  const userName = self.user.get()?.name || "Guest"; // Computed in render
  return <span>{userName}</span>;
}

// ✅ GOOD
class HeaderCtrl extends Ctrl {
  userName = calc(() => this.user.get()?.name || "Guest");
}
```

5. **❌ NO Skip Layers**: Always follow Domain → Ctrl → Presentation
```tsx
// ❌ BAD
function UserForm() {
  const api = provide(UserApi); // Skipping Ctrl layer
  return <button onClick={() => api.save()}>Save</button>;
}

// ✅ GOOD
class UserFormCtrl extends Ctrl {
  private api = provide(UserApi);
  saveButton = new ButtonCtrl().set({
    onClick: () => this.save(),
  });
}
```

6. **❌ NO Forget Cleanup**: Always clean up resources
```typescript
// ❌ BAD
class MyCtrl extends Ctrl {
  ctrlStart() {
    setInterval(() => this.refresh(), 5000);
  }
}

// ✅ GOOD
class MyCtrl extends Ctrl {
  private intervalId: number;
  
  ctrlStart() {
    this.intervalId = setInterval(() => this.refresh(), 5000);
  }
  
  ctrlDestroy() {
    clearInterval(this.intervalId);
  }
}
```

7. **❌ NO Mix Concerns**: Keep layers separate
```typescript
// ❌ BAD - Domain depends on UI
class UserEntity {
  async save() {
    showNotification("Saving..."); // UI concern in domain
    await this.api.save();
  }
}

// ✅ GOOD - Controller handles UI concerns
class UserFormCtrl extends Ctrl {
  async save() {
    this.saving.set(true); // UI state
    await this.user.save(); // Domain action
    this.saving.set(false);
  }
}
```

---

## 📁 File Structure

```
src/
├── domain/
│   ├── User/
│   │   ├── UserEntity.ts
│   │   ├── UserModel.ts
│   │   ├── UserApi.ts
│   │   └── UserValidator.ts
│   └── MasterData/
│       └── ...
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── ButtonCtrl.ts
│   └── Input/
│       ├── Input.tsx
│       └── InputCtrl.ts
├── pages/
│   └── UserPanel/
│       ├── UserPanel.tsx
│       ├── UserPanelCtrl.ts
│       └── UserDetail/
│           ├── UserDetail.tsx
│           └── UserDetailCtrl.ts
├── lib/
│   ├── Ctrl.ts
│   ├── provider.ts
│   ├── useCtrl.ts
│   └── signals/
│       ├── State.ts
│       ├── Calc.ts
│       ├── Monitor.ts
│       ├── Emitter.ts
│       ├── stateObject.ts
│       ├── stateArray.ts
│       └── asyncCalc.ts
└── dependencies.tsx
```

---

## 🔤 Naming Conventions

### Files
- Controllers: `{ComponentName}Ctrl.ts` (e.g., `ButtonCtrl.ts`, `UserPanelCtrl.ts`)
- Components: `{ComponentName}.tsx` (e.g., `Button.tsx`, `UserPanel.tsx`)
- Models: `{EntityName}Model.ts` (e.g., `UserModel.ts`)
- Entities: `{EntityName}Entity.ts` (e.g., `UserEntity.ts`)
- APIs: `{EntityName}Api.ts` (e.g., `UserApi.ts`)
- Validators: `{EntityName}Validator.ts` (e.g., `UserValidator.ts`)

### Classes/Types
- Controllers: `{Name}Ctrl` (e.g., `ButtonCtrl`, `UserPanelCtrl`)
- Components: `{Name}` (e.g., `Button`, `UserPanel`)
- Entities: `{Name}Entity` (e.g., `UserEntity`)
- APIs: `{Name}Api` (e.g., `UserApi`)
- Interfaces: `i{Name}` (e.g., `iUser`)
- Type from model: `{Name}Model` (e.g., `UserModel`)

### Functions
- Model factories: `create{Entity}Model()` (e.g., `createUserModel()`)
- Validator factories: `create{Entity}Validator()` (e.g., `createUserValidator()`)
- Signal factories: lowercase (e.g., `state()`, `calc()`, `monitor()`)

---

## 🎓 Key Principles

1. **Inside-Out Development**: Domain → Ctrl → Presentation
2. **Single Responsibility**: Each layer has ONE clear purpose
3. **Reactive by Default**: Use signals for all state management
4. **Declarative over Imperative**: Use `calc()` for derived values
5. **Composition over Inheritance**: Build complex controllers from simple ones
6. **Explicit Dependencies**: Use `provide()` for dependency injection
7. **Lifecycle Awareness**: Clean up resources in `ctrlDestroy()`
8. **Type Safety**: Leverage TypeScript inference from models

---

## 🚀 Development Workflow

1. **Define the Model** (`*Model.ts`)
   - Identify data structure
   - Create reactive model with `stateObject()`
   
2. **Create the API** (`*Api.ts`)
   - Define data access methods
   - Use async/await pattern

3. **Add Validation** (`*Validator.ts`)
   - Create validation rules with `calc()`
   - Return error messages or undefined

4. **Build the Entity** (`*Entity.ts`)
   - Compose model, validation, and API
   - Add domain actions

5. **Create Controllers** (`*Ctrl.ts`)
   - Orchestrate domain logic
   - Compose reusable controllers
   - Define UI state and events

6. **Implement Components** (`*.tsx`)
   - Visualize state
   - Capture user events
   - NO business logic

---

## 📚 Additional Notes

- **Batching Updates**: Use `$batch()` to group multiple state changes
- **Untracked Reads**: Use `peek()` or `$untracked()` to read without subscribing
- **Testing**: Domain and Controllers can be tested without UI
- **Performance**: Signals are lazy by default, only update what's observed
- **React Integration**: `useCtrl()` handles lifecycle and re-renders automatically

---

## 🎯 When in Doubt

- **Does it deal with data structure?** → Domain
- **Does it orchestrate logic?** → Controller
- **Does it show things to users?** → Presentation
- **Is it reusable across contexts?** → Reusable Controller in `components/`
- **Is it specific to one feature?** → Page Controller in `pages/`

---

**Remember**: The goal is maintainable, testable, and scalable code through clear separation of concerns and reactive state management.
