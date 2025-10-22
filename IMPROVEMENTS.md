# Propuestas de Mejora para el Sistema Ctrl/Component

## 1. Sistema de Re-renders Selectivos (CRÍTICO)

### Problema Actual

```typescript
// En useCtrl.ts - Esto causa re-render cuando CUALQUIER cosa cambia
const dispose = monitor(() => {
  ctrl.get(); // ❌ Observa TODO el ctrl
  refresh();
});
```

### Solución A: Auto-tracking con Legend-State (RECOMENDADO)

Legend-State ya tiene `observer()` que auto-detecta qué observables se usan:

```typescript
// useCtrl.ts - Versión mejorada
import { observer } from "@legendapp/state/react";

export function useCtrl<T extends Ctrl>(
  ctrlToken: Class<T> | T,
  initProps?: any
) {
  const [ctrl] = useState<T>(() => {
    const instance = ctrlToken instanceof Ctrl ? ctrlToken : new ctrlToken();
    return instance.set(initProps ?? {});
  });

  useEffect(() => {
    ctrl.onStart.next(ctrl);
    return () => ctrl.onDestroy.next();
  }, [ctrl]);

  return ctrl;
}

// TaskPanel.tsx - El componente se envuelve con observer
export const TaskPanel = observer(function TaskPanel() {
  const self = useCtrl(TaskPanelCtrl);

  // Solo re-renderiza cuando self.title cambia (auto-tracking)
  return <div>{self.title.get()}</div>;
});
```

### Solución B: Tracking Selectivo Manual

```typescript
// useCtrl.ts - Versión con selector
export function useCtrl<T extends Ctrl, R = T>(
  ctrlToken: Class<T> | T,
  selector?: (ctrl: T) => R,
  initProps?: any
) {
  const [ctrl] = useState<T>(() => {
    const instance = ctrlToken instanceof Ctrl ? ctrlToken : new ctrlToken();
    return instance.set(initProps ?? {});
  });

  const refresh = useRefresh();

  useEffect(() => {
    ctrl.onStart.next(ctrl);

    if (selector) {
      // Solo observa lo que devuelve el selector
      const dispose = monitor(() => {
        selector(ctrl);
        refresh();
      });
      return () => {
        ctrl.onDestroy.next();
        dispose();
      };
    }

    return () => ctrl.onDestroy.next();
  }, [ctrl]);

  return selector ? selector(ctrl) : ctrl;
}

// Uso
export function TaskPanel() {
  const title = useCtrl(TaskPanelCtrl, (ctrl) => ctrl.title);
  return <div>{title.get()}</div>;
}
```

---

## 2. Solución para React StrictMode

### Problema Actual

```typescript
const hasExecuted = useRef(false);

useEffect(() => {
  if (hasExecuted.current) return; // ❌ Workaround frágil
  hasExecuted.current = true;
  // ...
}, []);
```

### Solución: useEffectEvent (React 19) o Cleanup

```typescript
useEffect(() => {
  ctrl.onStart.next(ctrl);

  const dispose = monitor(() => {
    ctrl.get();
    refresh();
  });

  return () => {
    ctrl.onDestroy.next();
    dispose();
  };
}, [ctrl]); // ✅ Dependencia explícita, el cleanup maneja StrictMode
```

---

## 3. Sistema de Computed Values en Ctrl

### Propuesta

```typescript
// Ctrl.ts - Agregar soporte para computed
import { batch, computed as legendComputed } from "@legendapp/state";

export class Ctrl {
  // ... código existente ...

  protected computed<T>(fn: () => T) {
    return legendComputed(fn);
  }
}

// TaskPanelCtrl.ts - Uso
export class TaskPanelCtrl extends Ctrl {
  public title = state("Task Panel!");
  public count = state(0);

  // ✅ Se recalcula automáticamente cuando title o count cambian
  public displayText = this.computed(
    () => `${this.title.get()} - Count: ${this.count.get()}`
  );
}
```

---

## 4. Sistema de Acciones con Batch

### Propuesta

```typescript
// Ctrl.ts - Agregar método para acciones
export class Ctrl {
  // ... código existente ...

  protected action<Args extends any[], R>(
    fn: (...args: Args) => R
  ): (...args: Args) => R {
    return (...args: Args) => {
      return batch(() => fn.apply(this, args));
    };
  }
}

// TaskPanelCtrl.ts - Uso
export class TaskPanelCtrl extends Ctrl {
  public title = state("Task Panel!");
  public count = state(0);

  // ✅ Todos los cambios de estado se agrupan en un solo re-render
  public updateBoth = this.action((newTitle: string, newCount: number) => {
    this.title.set(newTitle);
    this.count.set(newCount);
  });
}
```

---

## 5. Tipado Fuerte para Props

### Problema Actual

```typescript
public set(props: PropModel<this>): this {
  // ... código sin validación de tipos en runtime
}
```

### Propuesta: Type-safe Builder Pattern

```typescript
// Ctrl.ts - Versión mejorada
export abstract class Ctrl {
  // ... código existente ...

  public set<K extends keyof this>(
    key: K,
    value: this[K] extends { set: (v: infer V) => any } ? V : never
  ): this {
    if (this[key] && "set" in this[key]) {
      (this[key] as any).set(value);
    }
    return this;
  }

  public setBulk(props: Partial<PropModel<this>>): this {
    batch(() => {
      for (const key in props) {
        if (this[key]?.set instanceof Function) {
          this[key].set(props[key]);
        } else if (this[key] instanceof Emitter) {
          this[key].subscribe(props[key]);
        }
      }
    });
    return this;
  }
}

// Uso con autocompletado
ctrl
  .set("title", "New Title") // ✅ TypeScript infiere el tipo
  .set("count", 42);
```

---

## 6. Gestión de Dependencias entre Ctrls

### Propuesta: Sistema de Inyección

```typescript
// CtrlContainer.ts
export class CtrlContainer {
  private instances = new Map<any, Ctrl>();

  public get<T extends Ctrl>(token: Class<T>): T {
    if (!this.instances.has(token)) {
      this.instances.set(token, new token());
    }
    return this.instances.get(token) as T;
  }

  public dispose() {
    this.instances.forEach((ctrl) => ctrl.onDestroy.next());
    this.instances.clear();
  }
}

// Uso
export class TaskPanelCtrl extends Ctrl {
  constructor(private container: CtrlContainer) {
    super();
  }

  private userService = this.container.get(UserServiceCtrl);

  public title = state("Task Panel!");
}
```

---

## 7. DevTools y Debugging

### Propuesta: Sistema de Logging

```typescript
// Ctrl.ts
export abstract class Ctrl {
  public readonly __name = this.constructor.name;

  constructor() {
    if (import.meta.env.DEV) {
      console.log(`[Ctrl] ${this.__name} created`);
    }
    // ... resto del código
  }

  protected debug(...args: any[]) {
    if (import.meta.env.DEV) {
      console.log(`[${this.__name}]`, ...args);
    }
  }
}
```

---

## Comparación de Arquitecturas Alternativas

### Opción 1: Mantener el sistema actual + Mejoras incrementales

**Pros:**

- Menor refactor
- Familiar para el equipo
- Evolutivo

**Contras:**

- Mantiene algunos problemas de diseño

### Opción 2: Migrar a Zustand + Custom Hooks

```typescript
// store/taskPanelStore.ts
import create from "zustand";

export const useTaskPanelStore = create((set) => ({
  title: "Task Panel!",
  setTitle: (title: string) => set({ title }),
}));

// TaskPanel.tsx
export function TaskPanel() {
  const title = useTaskPanelStore((state) => state.title);
  return <div>{title}</div>;
}
```

**Pros:**

- Menos código custom
- Comunidad grande
- Selector automático

**Contras:**

- Pierdes los lifecycle hooks del Ctrl
- Menos OOP

### Opción 3: Mantener Ctrl + Legend-State Observer (RECOMENDADO)

```typescript
// Combina lo mejor de ambos mundos
export const TaskPanel = observer(function TaskPanel() {
  const self = useCtrl(TaskPanelCtrl);
  return <div>{self.title.get()}</div>;
});
```

**Pros:**

- Auto-tracking eficiente
- Mantiene arquitectura Ctrl
- Mejor rendimiento

---

## Roadmap de Implementación

### Fase 1: Críticas (1-2 días)

1. ✅ Implementar `observer()` de Legend-State
2. ✅ Eliminar el `ctrl.get()` global en `monitor()`
3. ✅ Remover el hack de `hasExecuted`

### Fase 2: Mejoras (3-5 días)

4. ✅ Agregar `computed()` helper
5. ✅ Agregar `action()` helper para batch
6. ✅ Mejorar tipado de `set()`

### Fase 3: Avanzadas (1 semana)

7. ✅ Sistema de DI para Ctrls
8. ✅ DevTools y logging
9. ✅ Tests unitarios

---

## Ejemplo Completo: TaskPanel Mejorado

### TaskPanelCtrl.ts

```typescript
import { Ctrl } from "../../lib/Ctrl";
import { state } from "../../lib/signals";

export class TaskPanelCtrl extends Ctrl {
  public title = state("Task Panel!");
  public count = state(0);

  // Computed value
  public displayText = this.computed(
    () => `${this.title.get()} (${this.count.get()})`
  );

  // Action con batch automático
  public increment = this.action(() => {
    this.count.set(this.count.get() + 1);
    this.debug("Incremented to", this.count.get());
  });

  ctrlStart() {
    this.debug("TaskPanel started");
  }

  ctrlDestroy() {
    this.debug("TaskPanel destroyed");
  }
}
```

### TaskPanel.tsx

```typescript
import { observer } from "@legendapp/state/react";
import { useCtrl } from "../../lib/useCtrl";
import { TaskPanelCtrl } from "./TaskPanelCtrl";

export const TaskPanel = observer(function TaskPanel() {
  const self = useCtrl(TaskPanelCtrl);

  return (
    <div>
      <h1>{self.displayText.get()}</h1>
      <button onClick={self.increment}>+1</button>
    </div>
  );
});
```

---

## Conclusión

La **Opción 3** (Ctrl + Legend-State Observer) es la recomendada porque:

- ✅ Soluciona el problema crítico de re-renders
- ✅ Mantiene tu arquitectura actual
- ✅ Aprovecha Legend-State al máximo
- ✅ Código más limpio y mantenible
- ✅ Mejor performance

¿Quieres que implemente alguna de estas mejoras específicamente?
