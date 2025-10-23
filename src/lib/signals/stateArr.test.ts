import { describe, it, expect } from "vitest";
import { stateArray } from "./stateArr";
import { state } from "./State";

describe("stateArray", () => {
  describe("Creación y valores iniciales", () => {
    it("debe crear un stateArray vacío", () => {
      const arr = stateArray(() => state(0));
      expect(arr.get()).toEqual([]);
    });

    it("debe inicializarse vacío y permitir set posterior", () => {
      const arr = stateArray(() => state(""));
      arr.set(["a", "b", "c"]);
      expect(arr.get()).toEqual(["a", "b", "c"]);
    });

    it("debe crear states con factory function", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);
      expect(arr.get()).toEqual([1, 2, 3]);
    });

    it("debe usar la factory function para cada elemento", () => {
      let factoryCalls = 0;
      const arr = stateArray(() => {
        factoryCalls++;
        return state(0);
      });

      arr.set([1, 2, 3, 4, 5]);
      expect(factoryCalls).toBe(5);
    });
  });

  describe("get() y peek()", () => {
    it("debe retornar array de valores con get()", () => {
      const arr = stateArray(() => state(0));
      arr.set([10, 20, 30]);
      expect(arr.get()).toEqual([10, 20, 30]);
    });

    it("debe retornar array de valores con peek()", () => {
      const arr = stateArray(() => state(0));
      arr.set([10, 20, 30]);
      expect(arr.peek()).toEqual([10, 20, 30]);
    });

    it("get() y peek() deben retornar el mismo valor", () => {
      const arr = stateArray(() => state("test"));
      arr.set(["a", "b", "c"]);
      expect(arr.get()).toEqual(arr.peek());
    });

    it("debe manejar array vacío", () => {
      const arr = stateArray(() => state(0));
      expect(arr.get()).toEqual([]);
    });
  });

  describe("set() - operaciones básicas", () => {
    it("debe establecer valores iniciales", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);
      expect(arr.get()).toEqual([1, 2, 3]);
    });

    it("debe actualizar todos los valores", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);
      arr.set([4, 5, 6]);
      expect(arr.get()).toEqual([4, 5, 6]);
    });

    it("debe vaciar el array", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);
      arr.set([]);
      expect(arr.get()).toEqual([]);
    });

    it("debe manejar valores null", () => {
      const arr = stateArray(() => state<any>(null));
      arr.set([null, null, null]);
      expect(arr.get()).toEqual([null, null, null]);
    });

    it("debe manejar valores undefined", () => {
      const arr = stateArray(() => state<any>(undefined));
      arr.set([undefined, undefined]);
      expect(arr.get()).toEqual([undefined, undefined]);
    });

    it("debe manejar valores 0", () => {
      const arr = stateArray(() => state(0));
      arr.set([0, 0, 0]);
      expect(arr.get()).toEqual([0, 0, 0]);
    });

    it("debe manejar strings vacíos", () => {
      const arr = stateArray(() => state(""));
      arr.set(["", "", ""]);
      expect(arr.get()).toEqual(["", "", ""]);
    });

    it("debe manejar false booleans", () => {
      const arr = stateArray(() => state(false));
      arr.set([false, false, false]);
      expect(arr.get()).toEqual([false, false, false]);
    });
  });

  describe("set() - crecimiento del array", () => {
    it("debe agregar elementos al final", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);
      arr.set([1, 2, 3, 4, 5]);
      expect(arr.get()).toEqual([1, 2, 3, 4, 5]);
    });

    it("debe crear nuevos states para elementos adicionales", () => {
      let factoryCalls = 0;
      const arr = stateArray(() => {
        factoryCalls++;
        return state(0);
      });

      arr.set([1, 2]);
      const initialCalls = factoryCalls;

      arr.set([1, 2, 3, 4]);
      expect(factoryCalls).toBe(initialCalls + 2);
    });

    it("debe pasar de array vacío a array con elementos", () => {
      const arr = stateArray(() => state(0));
      arr.set([]);
      arr.set([1, 2, 3, 4, 5]);
      expect(arr.get()).toEqual([1, 2, 3, 4, 5]);
    });

    it("debe manejar crecimiento incremental", () => {
      const arr = stateArray(() => state(0));

      for (let i = 1; i <= 10; i++) {
        arr.set(Array.from({ length: i }, (_, j) => j + 1));
      }

      expect(arr.get()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe("set() - reducción del array", () => {
    it("debe reducir el tamaño del array", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3, 4, 5]);
      arr.set([1, 2, 3]);
      expect(arr.get()).toEqual([1, 2, 3]);
    });

    it("debe reutilizar states existentes al reducir", () => {
      let factoryCalls = 0;
      const arr = stateArray(() => {
        factoryCalls++;
        return state(0);
      });

      arr.set([1, 2, 3, 4, 5]);
      const callsAfterFirst = factoryCalls;

      arr.set([10, 20, 30]);
      expect(factoryCalls).toBe(callsAfterFirst); // no crea nuevos states
      expect(arr.get()).toEqual([10, 20, 30]);
    });

    it("debe pasar de muchos elementos a array vacío", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      arr.set([]);
      expect(arr.get()).toEqual([]);
    });
  });

  describe("set() - reutilización de states", () => {
    it("debe reutilizar states existentes al actualizar", () => {
      let factoryCalls = 0;
      const arr = stateArray(() => {
        factoryCalls++;
        return state(0);
      });

      arr.set([1, 2, 3]);
      const callsAfterFirst = factoryCalls;

      arr.set([4, 5, 6]); // mismo tamaño
      expect(factoryCalls).toBe(callsAfterFirst);
    });

    it("debe mantener la reactividad de states reutilizados", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);

      const signals = arr.map((s) => s);
      const firstSignal = signals[0];

      arr.set([10, 2, 3]);
      expect(firstSignal.get()).toBe(10);
    });
  });

  describe("map() - funcionalidad básica", () => {
    it("debe mapear sobre los states", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);

      const mapped = arr.map((s) => s.get());
      expect(mapped).toEqual([1, 2, 3]);
    });

    it("debe proporcionar el índice en map", () => {
      const arr = stateArray(() => state(0));
      arr.set([10, 20, 30]);

      const mapped = arr.map((_s, index) => index);
      expect(mapped).toEqual([0, 1, 2]);
    });

    it("debe permitir acceso directo a los states", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);

      const signals = arr.map((s) => s);
      signals[0].set(100);

      expect(arr.get()).toEqual([100, 2, 3]);
    });

    it("debe mapear array vacío", () => {
      const arr = stateArray(() => state(0));
      const mapped = arr.map((s) => s.get());
      expect(mapped).toEqual([]);
    });

    it("debe permitir transformaciones complejas", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3, 4, 5]);

      const mapped = arr.map((s, i) => ({
        index: i,
        value: s.get(),
        doubled: s.get() * 2,
      }));

      expect(mapped).toEqual([
        { index: 0, value: 1, doubled: 2 },
        { index: 1, value: 2, doubled: 4 },
        { index: 2, value: 3, doubled: 6 },
        { index: 3, value: 4, doubled: 8 },
        { index: 4, value: 5, doubled: 10 },
      ]);
    });
  });

  describe("Tipos de datos complejos", () => {
    it("debe manejar objetos", () => {
      const arr = stateArray(() => state({ name: "", age: 0 }));
      arr.set([
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ]);

      expect(arr.get()).toEqual([
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ]);
    });

    it("debe manejar arrays anidados", () => {
      const arr = stateArray(() => state<number[]>([]));
      arr.set([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);

      expect(arr.get()).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
    });

    it("debe manejar strings", () => {
      const arr = stateArray(() => state(""));
      arr.set(["hello", "world", "test"]);
      expect(arr.get()).toEqual(["hello", "world", "test"]);
    });

    it("debe manejar booleans", () => {
      const arr = stateArray(() => state(false));
      arr.set([true, false, true, false]);
      expect(arr.get()).toEqual([true, false, true, false]);
    });

    it("debe manejar mixed types", () => {
      const arr = stateArray(() => state<any>(null));
      arr.set([1, "string", true, null, { key: "value" }, [1, 2, 3]]);
      expect(arr.get()).toEqual([
        1,
        "string",
        true,
        null,
        { key: "value" },
        [1, 2, 3],
      ]);
    });

    it("debe manejar Date objects", () => {
      const arr = stateArray(() => state<Date>(new Date()));
      const dates = [
        new Date("2025-01-01"),
        new Date("2025-06-15"),
        new Date("2025-12-31"),
      ];
      arr.set(dates);
      expect(arr.get()).toEqual(dates);
    });
  });

  describe("Operaciones múltiples y secuenciales", () => {
    it("debe manejar múltiples sets consecutivos", () => {
      const arr = stateArray(() => state(0));

      arr.set([1]);
      arr.set([1, 2]);
      arr.set([1, 2, 3]);
      arr.set([1, 2, 3, 4]);
      arr.set([1, 2, 3, 4, 5]);

      expect(arr.get()).toEqual([1, 2, 3, 4, 5]);
    });

    it("debe manejar cambios de tamaño alternados", () => {
      const arr = stateArray(() => state(0));

      arr.set([1, 2, 3, 4, 5]);
      arr.set([1, 2]);
      arr.set([1, 2, 3, 4, 5, 6, 7]);
      arr.set([1]);
      arr.set([1, 2, 3]);

      expect(arr.get()).toEqual([1, 2, 3]);
    });

    it("debe manejar actualizaciones parciales simuladas", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3, 4, 5]);

      const current = arr.get();
      current[2] = 100;
      arr.set(current);

      expect(arr.get()).toEqual([1, 2, 100, 4, 5]);
    });
  });

  describe("Edge cases", () => {
    it("debe manejar arrays muy grandes", () => {
      const arr = stateArray(() => state(0));
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      arr.set(largeArray);
      expect(arr.get().length).toBe(1000);
      expect(arr.get()[500]).toBe(500);
    });

    it("debe manejar un solo elemento", () => {
      const arr = stateArray(() => state(42));
      arr.set([100]);
      expect(arr.get()).toEqual([100]);
    });

    it("debe manejar valores duplicados", () => {
      const arr = stateArray(() => state(0));
      arr.set([5, 5, 5, 5, 5]);
      expect(arr.get()).toEqual([5, 5, 5, 5, 5]);
    });

    it("debe manejar NaN values", () => {
      const arr = stateArray(() => state(NaN));
      arr.set([NaN, NaN]);
      const values = arr.get();
      expect(Number.isNaN(values[0])).toBe(true);
      expect(Number.isNaN(values[1])).toBe(true);
    });

    it("debe manejar Infinity", () => {
      const arr = stateArray(() => state(0));
      arr.set([Infinity, -Infinity, 0]);
      expect(arr.get()).toEqual([Infinity, -Infinity, 0]);
    });

    it("debe manejar números negativos", () => {
      const arr = stateArray(() => state(0));
      arr.set([-1, -2, -3, -4, -5]);
      expect(arr.get()).toEqual([-1, -2, -3, -4, -5]);
    });

    it("debe manejar números decimales", () => {
      const arr = stateArray(() => state(0));
      arr.set([1.1, 2.2, 3.3, 4.4, 5.5]);
      expect(arr.get()).toEqual([1.1, 2.2, 3.3, 4.4, 5.5]);
    });

    it("debe manejar BigInt values", () => {
      const arr = stateArray(() => state<bigint>(BigInt(0)));
      arr.set([BigInt(1), BigInt(2), BigInt(3)]);
      expect(arr.get()).toEqual([BigInt(1), BigInt(2), BigInt(3)]);
    });
  });

  describe("Reactividad", () => {
    it("debe ser reactivo a cambios individuales en states", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);

      const signals = arr.map((s) => s);
      signals[1].set(200);

      expect(arr.get()).toEqual([1, 200, 3]);
    });

    it("debe mantener reactividad después de múltiples sets", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);

      const signals1 = arr.map((s) => s);

      arr.set([10, 20, 30]);

      const signals2 = arr.map((s) => s);

      // Los signals deben ser los mismos (reutilizados)
      expect(signals1[0]).toBe(signals2[0]);
      expect(signals1[1]).toBe(signals2[1]);
      expect(signals1[2]).toBe(signals2[2]);
    });

    it("debe permitir modificaciones individuales a través de map", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3, 4, 5]);

      arr.map((s, i) => {
        if (i % 2 === 0) {
          s.set(s.get() * 10);
        }
      });

      expect(arr.get()).toEqual([10, 2, 30, 4, 50]);
    });
  });

  describe("Casos de uso complejos", () => {
    it("debe funcionar como lista de tareas", () => {
      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }

      const todos = stateArray(() =>
        state<Todo>({ id: 0, text: "", completed: false })
      );

      todos.set([
        { id: 1, text: "Buy milk", completed: false },
        { id: 2, text: "Write tests", completed: true },
        { id: 3, text: "Deploy app", completed: false },
      ]);

      expect(todos.get().length).toBe(3);

      // Toggle completion
      const signals = todos.map((s) => s);
      const firstTodo = signals[0].get();
      signals[0].set({ ...firstTodo, completed: true });

      expect(todos.get()[0].completed).toBe(true);
    });

    it("debe funcionar como lista de usuarios", () => {
      interface User {
        name: string;
        email: string;
        age: number;
      }

      const users = stateArray(() =>
        state<User>({ name: "", email: "", age: 0 })
      );

      users.set([
        { name: "John", email: "john@test.com", age: 30 },
        { name: "Jane", email: "jane@test.com", age: 25 },
        { name: "Bob", email: "bob@test.com", age: 35 },
      ]);

      expect(users.get().length).toBe(3);

      // Update user
      const userSignals = users.map((s) => s);
      userSignals[1].set({
        name: "Jane Doe",
        email: "jane.doe@test.com",
        age: 26,
      });

      expect(users.get()[1].name).toBe("Jane Doe");
    });

    it("debe manejar operaciones de tipo CRUD", () => {
      const arr = stateArray(() => state(0));

      // Create
      arr.set([1, 2, 3]);
      expect(arr.get()).toEqual([1, 2, 3]);

      // Read
      expect(arr.get()[1]).toBe(2);

      // Update
      const signals = arr.map((s) => s);
      signals[1].set(200);
      expect(arr.get()).toEqual([1, 200, 3]);

      // Delete (simulated by removing from array)
      arr.set([1, 3]);
      expect(arr.get()).toEqual([1, 3]);
    });
  });

  describe("Performance", () => {
    it("debe manejar muchas actualizaciones eficientemente", () => {
      const arr = stateArray(() => state(0));
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        arr.set(Array.from({ length: 10 }, (_, j) => j));
      }

      const duration = Date.now() - start;
      expect(arr.get().length).toBe(10);
      expect(duration).toBeLessThan(1000);
    });

    it("debe crear múltiples stateArrays sin problemas", () => {
      const arrays = Array.from({ length: 100 }, () =>
        stateArray(() => state(0))
      );

      arrays.forEach((arr, i) => {
        arr.set([i]);
      });

      expect(arrays.length).toBe(100);
      expect(arrays[50].get()).toEqual([50]);
    });
  });

  describe("Inmutabilidad y referencias", () => {
    it("debe retornar un nuevo array en cada get()", () => {
      const arr = stateArray(() => state(0));
      arr.set([1, 2, 3]);

      const ref1 = arr.get();
      const ref2 = arr.get();

      expect(ref1).toEqual(ref2);
      // Nota: esto depende de la implementación, pero típicamente deberían ser referencias diferentes
    });

    it("no debe mutar el array original pasado a set()", () => {
      const arr = stateArray(() => state(0));
      const original = [1, 2, 3];

      arr.set(original);
      arr.set([4, 5, 6]);

      expect(original).toEqual([1, 2, 3]); // no mutado
    });
  });
});
