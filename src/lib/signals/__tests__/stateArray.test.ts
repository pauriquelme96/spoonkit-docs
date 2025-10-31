import { describe, it, expect } from "vitest";
import { stateArray } from "../stateArray";
import type { StateLike } from "../StateLike";
import { state } from "../State";
import { calc } from "../Calc";
import { stateObject } from "../stateObject";

describe("stateArray", () => {
  describe("Basic functionality", () => {
    it("should create an empty array by default", () => {
      const arr = stateArray(() => state<number>());
      expect(arr.get()).toEqual([]);
      expect(arr.peek()).toEqual([]);
    });

    it("should set initial values", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);
      expect(arr.get()).toEqual([1, 2, 3]);
    });

    it("should replace all values with set", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);
      arr.set([4, 5]);
      expect(arr.get()).toEqual([4, 5]);
    });

    it("should support peek without tracking", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);
      const values = arr.peek();
      expect(values).toEqual([1, 2, 3]);
    });
  });

  describe("Type safety", () => {
    it("should maintain type constraints for primitives", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);

      // @ts-expect-error - should not accept string array
      arr.set(["a", "b", "c"]);

      const values: number[] = arr.get();
      expect(values).toEqual([1, 2, 3]);
    });

    it("should maintain type constraints for objects", () => {
      interface User {
        name: string;
        age: number;
      }

      const arr = stateArray(() => state<User>());
      arr.set([
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ]);

      // @ts-expect-error - should not accept incomplete objects
      arr.set([{ name: "Bob" }]);

      const users: User[] = arr.get();
      expect(users).toHaveLength(2);
    });

    it("should handle union types correctly", () => {
      const arr = stateArray(() => state<string | number>());
      arr.set([1, "two", 3, "four"]);

      // @ts-expect-error - should not accept boolean
      arr.set([true, false]);

      expect(arr.get()).toEqual([1, "two", 3, "four"]);
    });

    it("should handle nullable types correctly", () => {
      const arr = stateArray(() => state<string | null>());
      arr.set(["a", null, "c"]);

      expect(arr.get()).toEqual(["a", null, "c"]);
    });
  });

  describe("Array operations", () => {
    describe("push", () => {
      it("should add element to the end", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2, 3]);
        arr.push(4);
        expect(arr.get()).toEqual([1, 2, 3, 4]);
      });

      it("should add element to empty array", () => {
        const arr = stateArray(() => state<number>());
        arr.push(1);
        expect(arr.get()).toEqual([1]);
      });

      it("should support multiple consecutive pushes", () => {
        const arr = stateArray(() => state<number>());
        arr.push(1);
        arr.push(2);
        arr.push(3);
        expect(arr.get()).toEqual([1, 2, 3]);
      });

      it("should create new signal for pushed element", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2]);

        arr.push(3);
        const signals = arr.map((s) => s);

        expect(signals).toHaveLength(3);
        expect(signals[2].get()).toBe(3);
      });
    });

    describe("pop", () => {
      it("should remove and return last element", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2, 3]);

        const popped = arr.pop();
        expect(popped).toBe(3);
        expect(arr.get()).toEqual([1, 2]);
      });

      it("should return undefined for empty array", () => {
        const arr = stateArray(() => state<number>());
        const popped = arr.pop();
        expect(popped).toBeUndefined();
      });

      it("should handle popping until empty", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2]);

        expect(arr.pop()).toBe(2);
        expect(arr.pop()).toBe(1);
        expect(arr.pop()).toBeUndefined();
        expect(arr.get()).toEqual([]);
      });

      it("should remove signal from internal storage", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2, 3]);

        arr.pop();
        const signals = arr.map((s) => s);

        expect(signals).toHaveLength(2);
      });
    });
  });

  describe("Iteration methods", () => {
    describe("map", () => {
      it("should map over signals", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2, 3]);

        const signals = arr.map((signal) => signal);
        expect(signals).toHaveLength(3);
        expect(signals[0].get()).toBe(1);
        expect(signals[1].get()).toBe(2);
        expect(signals[2].get()).toBe(3);
      });

      it("should provide index to map function", () => {
        const arr = stateArray(() => state<string>());
        arr.set(["a", "b", "c"]);

        const indices = arr.map((_, index) => index);
        expect(indices).toEqual([0, 1, 2]);
      });

      it("should map to different type", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2, 3]);

        const values = arr.map((signal) => signal.get() * 2);
        expect(values).toEqual([2, 4, 6]);
      });

      it("should work with empty array", () => {
        const arr = stateArray(() => state<number>());
        const result = arr.map((signal) => signal.get());
        expect(result).toEqual([]);
      });
    });

    describe("filter", () => {
      it("should filter signals by predicate", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2, 3, 4, 5]);

        const filtered = arr.filter((signal) => signal.get() > 2);
        expect(filtered).toHaveLength(3);
        expect(filtered.map((s) => s.get())).toEqual([3, 4, 5]);
      });

      it("should provide index to filter function", () => {
        const arr = stateArray(() => state<string>());
        arr.set(["a", "b", "c", "d"]);

        const evenIndices = arr.filter((_, index) => index % 2 === 0);
        expect(evenIndices).toHaveLength(2);
        expect(evenIndices.map((s) => s.get())).toEqual(["a", "c"]);
      });

      it("should return empty array when no match", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2, 3]);

        const filtered = arr.filter((signal) => signal.get() > 10);
        expect(filtered).toEqual([]);
      });

      it("should return all signals when all match", () => {
        const arr = stateArray(() => state<number>());
        arr.set([1, 2, 3]);

        const filtered = arr.filter((signal) => signal.get() > 0);
        expect(filtered).toHaveLength(3);
      });
    });
  });

  describe("Signal reuse", () => {
    it("should reuse existing signals when setting new values", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);

      const signalsBefore = arr.map((s) => s);
      arr.set([10, 20, 30]);
      const signalsAfter = arr.map((s) => s);

      // Should reuse the same signal instances
      expect(signalsAfter[0]).toBe(signalsBefore[0]);
      expect(signalsAfter[1]).toBe(signalsBefore[1]);
      expect(signalsAfter[2]).toBe(signalsBefore[2]);

      // But with updated values
      expect(signalsAfter[0].get()).toBe(10);
      expect(signalsAfter[1].get()).toBe(20);
      expect(signalsAfter[2].get()).toBe(30);
    });

    it("should create new signals when array grows", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2]);

      const signalsBefore = arr.map((s) => s);
      arr.set([10, 20, 30, 40]);
      const signalsAfter = arr.map((s) => s);

      // First two should be reused
      expect(signalsAfter[0]).toBe(signalsBefore[0]);
      expect(signalsAfter[1]).toBe(signalsBefore[1]);

      // Last two should be new
      expect(signalsAfter[2]).not.toBe(signalsBefore[0]);
      expect(signalsAfter[3]).not.toBe(signalsBefore[1]);

      expect(signalsAfter.map((s) => s.get())).toEqual([10, 20, 30, 40]);
    });

    it("should discard excess signals when array shrinks", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3, 4, 5]);

      const signalsBefore = arr.map((s) => s);
      arr.set([10, 20]);
      const signalsAfter = arr.map((s) => s);

      expect(signalsAfter).toHaveLength(2);
      expect(signalsAfter[0]).toBe(signalsBefore[0]);
      expect(signalsAfter[1]).toBe(signalsBefore[1]);
    });
  });

  describe("Reactivity", () => {
    it("should trigger reactions when array changes", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);

      const computed = calc(() => arr.get().reduce((sum, val) => sum + val, 0));
      expect(computed.get()).toBe(6);

      arr.set([10, 20, 30]);
      expect(computed.get()).toBe(60);
    });

    it("should trigger reactions when pushing", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2]);

      const computed = calc(() => arr.get().length);
      expect(computed.get()).toBe(2);

      arr.push(3);
      expect(computed.get()).toBe(3);
    });

    it("should trigger reactions when popping", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);

      const computed = calc(() => arr.get().length);
      expect(computed.get()).toBe(3);

      arr.pop();
      expect(computed.get()).toBe(2);
    });

    it("should trigger reactions when individual signals change", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);

      const computed = calc(() => arr.get()[0]);
      expect(computed.get()).toBe(1);

      const signals = arr.map((s) => s);
      signals[0].set(100);

      expect(computed.get()).toBe(100);
    });

    it("should not trigger on peek", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);

      let computeCount = 0;
      const computed = calc(() => {
        arr.get();
        computeCount++;
        return computeCount;
      });

      computed.get(); // Initial
      const countBefore = computeCount;

      arr.peek(); // Should not trigger
      expect(computeCount).toBe(countBefore);
    });
  });

  describe("Complex state types", () => {
    it("should handle objects in array", () => {
      interface Item {
        id: number;
        name: string;
      }

      const arr = stateArray(() => state<Item>());
      arr.set([
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ]);

      expect(arr.get()).toHaveLength(2);
      expect(arr.get()[0].name).toBe("Item 1");
    });

    it("should handle nested arrays", () => {
      const arr = stateArray(() => state<number[]>());
      arr.set([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);

      expect(arr.get()).toHaveLength(3);
      expect(arr.get()[0]).toEqual([1, 2]);
    });

    it("should update nested objects correctly", () => {
      interface User {
        name: string;
        age: number;
      }

      const arr = stateArray(() => state<User>());
      arr.set([{ name: "John", age: 30 }]);

      const signals = arr.map((s) => s);
      signals[0].set({ name: "John", age: 31 });

      expect(arr.get()[0].age).toBe(31);
    });
  });

  describe("dispose", () => {
    it("should clear all signals", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3, 4, 5]);

      arr.dispose();

      expect(arr.get()).toEqual([]);
      expect(arr.peek()).toEqual([]);
    });

    it("should allow adding elements after dispose", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);
      arr.dispose();

      arr.push(10);
      expect(arr.get()).toEqual([10]);
    });

    it("should work with map after dispose", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);
      arr.dispose();

      const signals = arr.map((s) => s);
      expect(signals).toEqual([]);
    });

    it("should clear computed dependencies", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);

      const computed = calc(() => arr.get().length);
      expect(computed.get()).toBe(3);

      arr.dispose();
      expect(computed.get()).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty array operations", () => {
      const arr = stateArray(() => state<number>());

      expect(arr.get()).toEqual([]);
      expect(arr.pop()).toBeUndefined();
      expect(arr.map((s) => s)).toEqual([]);
      expect(arr.filter(() => true)).toEqual([]);
    });

    it("should handle setting empty array", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);
      arr.set([]);

      expect(arr.get()).toEqual([]);
    });

    it("should handle large arrays", () => {
      const arr = stateArray(() => state<number>());
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);

      arr.set(largeArray);
      expect(arr.get()).toHaveLength(1000);
      expect(arr.get()[999]).toBe(999);
    });

    it("should handle rapid consecutive operations", () => {
      const arr = stateArray(() => state<number>());

      for (let i = 0; i < 100; i++) {
        arr.push(i);
      }

      expect(arr.get()).toHaveLength(100);

      for (let i = 0; i < 50; i++) {
        arr.pop();
      }

      expect(arr.get()).toHaveLength(50);
    });

    it("should handle setting same values multiple times", () => {
      const arr = stateArray(() => state<number>());

      arr.set([1, 2, 3]);
      arr.set([1, 2, 3]);
      arr.set([1, 2, 3]);

      expect(arr.get()).toEqual([1, 2, 3]);
    });

    it("should maintain signal identity across identical sets", () => {
      const arr = stateArray(() => state<number>());
      arr.set([1, 2, 3]);

      const signals1 = arr.map((s) => s);
      arr.set([1, 2, 3]);
      const signals2 = arr.map((s) => s);

      // Signals should be reused
      expect(signals2[0]).toBe(signals1[0]);
      expect(signals2[1]).toBe(signals1[1]);
      expect(signals2[2]).toBe(signals1[2]);
    });
  });

  describe("Custom state factories", () => {
    it("should work with custom state factory", () => {
      const factory = () => {
        const s = state<number>(0);
        return s;
      };

      const arr = stateArray(factory);
      arr.set([1, 2, 3]);

      expect(arr.get()).toEqual([1, 2, 3]);
    });

    it("should work with state that has initial values", () => {
      const factory = () => state<number>(999);

      const arr = stateArray(factory);
      arr.push(1); // Should override initial value

      expect(arr.get()).toEqual([1]);
    });

    it("should work with complex StateLike objects", () => {
      interface CustomState extends StateLike<number> {
        double(): number;
      }

      const factory = (): CustomState => {
        const s = state<number>(0);
        return {
          get: () => s.get(),
          set: (v: number) => s.set(v),
          peek: () => s.peek(),
          double: () => s.get() * 2,
        };
      };

      const arr = stateArray(factory);
      arr.set([1, 2, 3]);

      const signals = arr.map((s) => s as CustomState);
      expect(signals[0].double()).toBe(2);
      expect(signals[1].double()).toBe(4);
      expect(signals[2].double()).toBe(6);
    });
  });

  describe("Performance", () => {
    it("should handle large arrays efficiently", () => {
      const arr = stateArray(() => state<number>());
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);

      const start = Date.now();
      arr.set(largeArray);
      const duration = Date.now() - start;

      expect(arr.get()).toHaveLength(10000);
      expect(duration).toBeLessThan(1000);
    });

    it("should handle many operations efficiently", () => {
      const arr = stateArray(() => state<number>());

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        arr.push(i);
      }
      const duration = Date.now() - start;

      expect(arr.get()).toHaveLength(1000);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Integration with stateObject", () => {
    it("should correctly type stateArray with stateObject", () => {
      const data = stateArray(() =>
        stateObject({
          id: state<number>(),
          name: state<string>(),
        })
      );

      data.set([
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ]);

      const result = data.get();

      // Type checking: result should be { id: number, name: string }[]
      const firstItem: { id: number; name: string } = result[0];
      expect(firstItem.id).toBe(1);
      expect(firstItem.name).toBe("John");

      expect(result).toEqual([
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ]);
    });

    it("should maintain type safety with stateObject operations", () => {
      interface User {
        id: number;
        name: string;
        age: number;
      }

      const users = stateArray(() =>
        stateObject({
          id: state<number>(),
          name: state<string>(),
          age: state<number>(),
        })
      );

      users.set([
        { id: 1, name: "Alice", age: 30 },
        { id: 2, name: "Bob", age: 25 },
      ]);

      const result: User[] = users.get();

      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe("Alice");
      expect(result[0].age).toBe(30);
      expect(result).toHaveLength(2);
    });

    it("should work with push and stateObject", () => {
      const data = stateArray(() =>
        stateObject({
          id: state<number>(),
          name: state<string>(),
        })
      );

      data.push({ id: 1, name: "First" });
      data.push({ id: 2, name: "Second" });

      const result = data.get();

      expect(result).toEqual([
        { id: 1, name: "First" },
        { id: 2, name: "Second" },
      ]);
      expect(result[0].id).toBe(1);
      expect(result[1].name).toBe("Second");
    });

    it("should reactively update with stateObject", () => {
      const data = stateArray(() =>
        stateObject({
          id: state<number>(),
          value: state<string>(),
        })
      );

      data.set([
        { id: 1, value: "a" },
        { id: 2, value: "b" },
      ]);

      const computed = calc(() => {
        const items = data.get();
        return items.map((item) => item.value).join(",");
      });

      expect(computed.get()).toBe("a,b");

      // Update individual item
      const signals = data.map((s) => s);
      signals[0].set({ id: 1, value: "updated" });

      expect(computed.get()).toBe("updated,b");
    });

    it("should handle nested optional properties with stateObject", () => {
      const data = stateArray(() =>
        stateObject({
          id: state<number>(),
          name: state<string>(),
          email: state<string | undefined>(),
        })
      );

      data.set([
        { id: 1, name: "User1", email: "user1@test.com" },
        { id: 2, name: "User2" },
      ]);

      const result = data.get();

      expect(result[0].email).toBe("user1@test.com");
      expect(result[1].email).toBeUndefined();
      expect(result).toHaveLength(2);
    });

    it("should correctly type peek with stateObject", () => {
      const data = stateArray(() =>
        stateObject({
          id: state<number>(),
          title: state<string>(),
        })
      );

      data.set([{ id: 100, title: "Test" }]);

      const peeked = data.peek();

      // Type check
      const item: { id: number; title: string } = peeked[0];
      expect(item.id).toBe(100);
      expect(item.title).toBe("Test");
    });
  });
});
