import { describe, it, expect } from "vitest";
import { state } from "./State";
import { calc } from "./Calc";

describe("State", () => {
  describe("Creación y valores básicos", () => {
    it("debe crear un state sin valor inicial", () => {
      const s = state();
      // Sin valor inicial, se crea con undefined según la implementación
      expect(s.get()).toBeUndefined();
    });

    it("debe crear un state con valor primitivo", () => {
      const s = state(42);
      expect(s.get()).toBe(42);
    });

    it("debe crear un state con string", () => {
      const s = state("hello");
      expect(s.get()).toBe("hello");
    });

    it("debe crear un state con boolean", () => {
      const s = state(true);
      expect(s.get()).toBe(true);
    });

    it("debe crear un state con objeto", () => {
      const obj = { name: "John", age: 30 };
      const s = state(obj);
      expect(s.get()).toEqual(obj);
    });

    it("debe crear un state con array", () => {
      const arr = [1, 2, 3, 4, 5];
      const s = state(arr);
      expect(s.get()).toEqual(arr);
    });

    it("debe crear un state con null explícito", () => {
      const s = state(null);
      expect(s.get()).toBeNull();
    });

    it("debe crear un state con undefined", () => {
      const s = state(undefined);
      expect(s.get()).toBeUndefined();
    });

    it("debe crear un state con valor 0", () => {
      const s = state(0);
      expect(s.get()).toBe(0);
    });

    it("debe crear un state con string vacío", () => {
      const s = state("");
      expect(s.get()).toBe("");
    });
  });

  describe("get() y peek()", () => {
    it("debe retornar el valor actual con get()", () => {
      const s = state(100);
      expect(s.get()).toBe(100);
    });

    it("debe retornar el valor actual con peek()", () => {
      const s = state(100);
      expect(s.peek()).toBe(100);
    });

    it("get() y peek() deben retornar el mismo valor", () => {
      const s = state("test");
      expect(s.get()).toBe(s.peek());
    });

    it("peek() permite leer sin suscribirse", () => {
      const s = state(10);

      // peek() permite leer el valor sin crear una dependencia reactiva
      expect(s.peek()).toBe(10);
      s.set(20);
      expect(s.peek()).toBe(20);
    });
  });

  describe("set() con valores primitivos", () => {
    it("debe actualizar el valor con set()", () => {
      const s = state(10);
      s.set(20);
      expect(s.get()).toBe(20);
    });

    it("debe actualizar múltiples veces", () => {
      const s = state(1);
      s.set(2);
      s.set(3);
      s.set(4);
      expect(s.get()).toBe(4);
    });

    it("debe manejar cambios de tipo", () => {
      const s = state<any>(10);
      s.set("string");
      expect(s.get()).toBe("string");
      s.set(true);
      expect(s.get()).toBe(true);
      s.set(null);
      expect(s.get()).toBeNull();
    });

    it("debe permitir set con el mismo valor", () => {
      const s = state(42);
      s.set(42);
      expect(s.get()).toBe(42);
    });

    it("debe manejar valores NaN", () => {
      const s = state(NaN);
      expect(Number.isNaN(s.get())).toBe(true);
    });

    it("debe manejar Infinity", () => {
      const s = state(Infinity);
      expect(s.get()).toBe(Infinity);
    });

    it("debe manejar -Infinity", () => {
      const s = state(-Infinity);
      expect(s.get()).toBe(-Infinity);
    });
  });

  describe("set() con objetos y arrays", () => {
    it("debe actualizar objetos", () => {
      const s = state({ a: 1 });
      s.set({ a: 2 });
      expect(s.get()).toEqual({ a: 2 });
    });

    it("debe manejar objetos profundamente anidados", () => {
      const s = state({
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      });
      expect(s.get().level1.level2.level3.value).toBe("deep");
    });

    it("debe actualizar arrays", () => {
      const s = state([1, 2, 3]);
      s.set([4, 5, 6]);
      expect(s.get()).toEqual([4, 5, 6]);
    });

    it("debe manejar arrays vacíos", () => {
      const s = state([1, 2, 3]);
      s.set([]);
      expect(s.get()).toEqual([]);
    });

    it("debe manejar objetos con propiedades undefined", () => {
      const s = state({ a: 1, b: undefined });
      expect(s.get().b).toBeUndefined();
    });

    it("debe manejar Map", () => {
      const map = new Map([["key", "value"]]);
      const s = state(map);
      expect(s.get()).toBe(map);
      expect(s.get().get("key")).toBe("value");
    });

    it("debe manejar Set", () => {
      const set = new Set([1, 2, 3]);
      const s = state(set);
      expect(s.get()).toBe(set);
      expect(s.get().has(2)).toBe(true);
    });

    it("debe manejar Date", () => {
      const date = new Date("2025-10-23");
      const s = state(date);
      expect(s.get()).toBe(date);
    });
  });

  describe("Encadenamiento de states (binding)", () => {
    it("debe sincronizar un state con otro state", () => {
      const source = state(10);
      const target = state(0);

      target.set(source);

      expect(target.get()).toBe(10);
    });

    it("debe mantener la sincronización cuando el source cambia", () => {
      const source = state(10);
      const target = state(0);

      target.set(source);
      source.set(20);

      expect(target.get()).toBe(20);
    });

    it("debe sincronizar bidireccionalmente", () => {
      const source = state(10);
      const target = state(0);

      target.set(source);
      target.set(30);

      expect(source.get()).toBe(30);
      expect(target.get()).toBe(30);
    });

    it("debe manejar cadenas de states", () => {
      const s1 = state(1);
      const s2 = state(0);
      const s3 = state(0);

      s2.set(s1);
      s3.set(s2);

      expect(s3.get()).toBe(1);

      s1.set(10);
      expect(s2.get()).toBe(10);
      expect(s3.get()).toBe(10);
    });

    it("debe disponer correctamente las suscripciones previas", () => {
      const s1 = state(1);
      const s2 = state(2);
      const target = state(0);

      target.set(s1);
      expect(target.get()).toBe(1);

      // Cambiar la fuente
      target.set(s2);
      expect(target.get()).toBe(2);

      // Cambiar s1 no debería afectar target
      s1.set(100);
      expect(target.get()).toBe(2);

      // Cambiar s2 sí debería afectar target
      s2.set(200);
      expect(target.get()).toBe(200);
    });
  });

  describe("Integración con Calc", () => {
    it("debe sincronizar con un Calc", () => {
      const source = state(10);
      const calculated = calc(() => source.get() * 2);
      const target = state(0);

      target.set(calculated);

      expect(target.get()).toBe(20);
    });

    it("debe actualizar cuando el Calc cambia", () => {
      const source = state(10);
      const calculated = calc(() => source.get() * 2);
      const target = state(0);

      target.set(calculated);
      source.set(5);

      expect(target.get()).toBe(10);
    });

    it("NO debe permitir set en Calc (solo lectura)", () => {
      const source = state(10);
      const calculated = calc(() => source.get() * 2);
      const target = state(0);

      target.set(calculated);

      // Intentar cambiar target no debería afectar calculated
      target.set(100);
      expect(calculated.get()).toBe(20); // sigue siendo source * 2
    });

    it("debe manejar múltiples dependencias en Calc", () => {
      const a = state(2);
      const b = state(3);
      const sum = calc(() => a.get() + b.get());
      const target = state(0);

      target.set(sum);
      expect(target.get()).toBe(5);

      a.set(10);
      expect(target.get()).toBe(13);

      b.set(7);
      expect(target.get()).toBe(17);
    });
  });

  describe("Edge cases y comportamiento límite", () => {
    it("debe manejar ciclos simples (state -> state -> state)", () => {
      const s1 = state(1);
      const s2 = state(0);

      s2.set(s1);
      s1.set(s2);

      // Debería estabilizarse sin loop infinito
      expect(s1.get()).toBe(s2.get());
    });

    it("debe manejar cambios rápidos consecutivos", () => {
      const s = state(0);
      for (let i = 0; i < 1000; i++) {
        s.set(i);
      }
      expect(s.get()).toBe(999);
    });

    it("debe manejar objetos grandes", () => {
      const largeObj = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      }));
      const s = state(largeObj);
      expect(s.get().length).toBe(1000);
    });

    it("debe manejar funciones como valores", () => {
      const fn = () => "hello";
      const s = state(fn);
      expect(s.get()).toBe(fn);
      expect(s.get()()).toBe("hello");
    });

    it("debe manejar Symbols", () => {
      const sym = Symbol("test");
      const s = state(sym);
      expect(s.get()).toBe(sym);
    });

    it("debe manejar BigInt", () => {
      const bigInt = BigInt(9007199254740991);
      const s = state(bigInt);
      expect(s.get()).toBe(bigInt);
    });

    it("debe mantener la referencia del objeto si es la misma", () => {
      const obj = { a: 1 };
      const s = state(obj);
      const retrieved = s.get();
      expect(retrieved).toBe(obj);
    });

    it("debe permitir múltiples states vinculados al mismo source", () => {
      const source = state(42);
      const target1 = state(0);
      const target2 = state(0);
      const target3 = state(0);

      target1.set(source);
      target2.set(source);
      target3.set(source);

      source.set(100);

      expect(target1.get()).toBe(100);
      expect(target2.get()).toBe(100);
      expect(target3.get()).toBe(100);
    });
  });

  describe("Manejo de memoria y disposers", () => {
    it("debe mantener binding bidireccional", () => {
      const s1 = state(1);
      const s2 = state(2);
      const target = state(0);

      target.set(s1);
      target.set(s2);

      // La implementación mantiene bindings bidireccionales
      // por lo que cambiar s2 afecta target
      s2.set(200);
      expect(target.get()).toBe(200);

      // Y cambiar target afecta s2
      target.set(300);
      expect(s2.get()).toBe(300);
      expect(target.get()).toBe(300);
    });

    it("debe manejar cambios de binding múltiples veces", () => {
      const sources = Array.from({ length: 10 }, (_, i) => state(i));
      const target = state(0);

      sources.forEach((source, i) => {
        target.set(source);
        expect(target.get()).toBe(i);
      });

      // Solo el último source debería estar activo
      sources[9].set(999);
      expect(target.get()).toBe(999);

      sources[0].set(111);
      expect(target.get()).toBe(999); // no cambia
    });
  });

  describe("Casos de uso complejos", () => {
    it("debe funcionar en un sistema de estado complejo", () => {
      const firstName = state("John");
      const lastName = state("Doe");
      const fullName = calc(() => `${firstName.get()} ${lastName.get()}`);
      const displayName = state("");

      displayName.set(fullName);
      expect(displayName.get()).toBe("John Doe");

      firstName.set("Jane");
      expect(displayName.get()).toBe("Jane Doe");

      lastName.set("Smith");
      expect(displayName.get()).toBe("Jane Smith");
    });

    it("debe manejar formularios reactivos", () => {
      const username = state("");
      const email = state("");
      const password = state("");

      const isValid = calc(() => {
        return (
          username.get().length > 3 &&
          email.get().includes("@") &&
          password.get().length >= 8
        );
      });

      expect(isValid.get()).toBe(false);

      username.set("john");
      email.set("john@example.com");
      password.set("password123");

      expect(isValid.get()).toBe(true);
    });

    it("debe manejar contadores con múltiples operaciones", () => {
      const counter = state(0);

      const increment = () => counter.set(counter.get() + 1);
      const decrement = () => counter.set(counter.get() - 1);
      const reset = () => counter.set(0);
      const multiply = (n: number) => counter.set(counter.get() * n);

      increment();
      increment();
      increment();
      expect(counter.get()).toBe(3);

      decrement();
      expect(counter.get()).toBe(2);

      multiply(5);
      expect(counter.get()).toBe(10);

      reset();
      expect(counter.get()).toBe(0);
    });

    it("debe permitir crear un store con múltiples states", () => {
      const createStore = () => ({
        count: state(0),
        user: state({ name: "", email: "" }),
        isLoading: state(false),
        error: state<string | null>(null),
      });

      const store = createStore();

      store.count.set(10);
      store.user.set({ name: "John", email: "john@test.com" });
      store.isLoading.set(true);

      expect(store.count.get()).toBe(10);
      expect(store.user.get().name).toBe("John");
      expect(store.isLoading.get()).toBe(true);
      expect(store.error.get()).toBeNull();
    });
  });

  describe("Reactividad y efectos", () => {
    it("debe ser observable por múltiples computeds", () => {
      const source = state(0);

      const computed1 = calc(() => source.get() * 2);
      const computed2 = calc(() => source.get() + 10);

      expect(computed1.get()).toBe(0);
      expect(computed2.get()).toBe(10);

      source.set(5);

      expect(computed1.get()).toBe(10);
      expect(computed2.get()).toBe(15);
    });
  });

  describe("Performance y optimización", () => {
    it("debe manejar miles de actualizaciones eficientemente", () => {
      const s = state(0);
      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        s.set(i);
      }

      const duration = Date.now() - start;
      expect(s.get()).toBe(9999);
      expect(duration).toBeLessThan(1000); // debería ser mucho más rápido
    });

    it("debe crear muchos states sin problemas", () => {
      const states = Array.from({ length: 1000 }, (_, i) => state(i));
      expect(states.length).toBe(1000);
      expect(states[500].get()).toBe(500);
    });
  });
});
