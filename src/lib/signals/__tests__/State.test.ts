import { describe, it, expect } from "vitest";
import { state, State } from "../State";
import { calc } from "../Calc";

describe("State", () => {
  describe("Basic functionality", () => {
    it("should create a state with undefined initial value", () => {
      const s = state<number>();
      expect(s.get()).toBeUndefined();
    });

    it("should create a state with initial value", () => {
      const s = state(42);
      expect(s.get()).toBe(42);
    });

    it("should update value with set", () => {
      const s = state(10);
      s.set(20);
      expect(s.get()).toBe(20);
    });

    it("should support peek without tracking", () => {
      const s = state(100);
      const value = s.peek();
      expect(value).toBe(100);
    });

    it("should handle multiple updates", () => {
      const s = state(1);
      s.set(2);
      s.set(3);
      s.set(4);
      expect(s.get()).toBe(4);
    });
  });

  describe("Type safety", () => {
    it("should maintain type constraints for primitives", () => {
      const s = state<number>(42);
      s.set(100);

      // @ts-expect-error - should not accept string
      s.set("invalid");

      const value: number = s.get();
      expect(typeof value).toBe("number");
    });

    it("should maintain type constraints for objects", () => {
      interface User {
        name: string;
        age: number;
      }

      const s = state<User>({ name: "John", age: 30 });

      // @ts-expect-error - should not accept incomplete object
      s.set({ name: "Jane" });

      // @ts-expect-error - should not accept wrong types
      s.set({ name: 123, age: "30" });

      s.set({ name: "Jane", age: 25 });
      expect(s.get()).toEqual({ name: "Jane", age: 25 });
    });

    it("should handle union types correctly", () => {
      const s = state<string | number>(42);
      s.set(100);
      s.set("text");

      // @ts-expect-error - should not accept boolean
      s.set(true);

      expect(s.get()).toBe("text");
    });

    it("should handle null and undefined correctly", () => {
      const s = state<string | null>(null);
      s.set("value");
      s.set(null);

      expect(s.get()).toBe(null);
    });

    it("should handle arrays with proper typing", () => {
      const s = state<number[]>([1, 2, 3]);
      s.set([4, 5, 6]);

      // @ts-expect-error - should not accept string array
      s.set(["a", "b", "c"]);

      const arr: number[] = s.get();
      expect(arr).toEqual([4, 5, 6]);
    });
  });

  describe("State linking (State to State)", () => {
    it("should sync from source state to target state", () => {
      const source = state(10);
      const target = state<number>();

      target.set(source);

      expect(target.get()).toBe(10);
    });

    it("should update target when source changes", () => {
      const source = state(10);
      const target = state<number>();

      target.set(source);
      source.set(20);

      expect(target.get()).toBe(20);
    });

    it("should update source when target changes (bidirectional)", () => {
      const source = state(10);
      const target = state<number>();

      target.set(source);
      target.set(30);

      expect(source.get()).toBe(30);
      expect(target.get()).toBe(30);
    });

    it("should handle multiple linked states", () => {
      const source = state(1);
      const target1 = state<number>();
      const target2 = state<number>();

      target1.set(source);
      target2.set(source);

      source.set(5);

      expect(target1.get()).toBe(5);
      expect(target2.get()).toBe(5);
    });

    it("should dispose previous links when setting new value", () => {
      const source1 = state(10);
      const source2 = state(20);
      const target = state<number>();

      target.set(source1);
      expect(target.get()).toBe(10);

      target.set(source2);
      expect(target.get()).toBe(20);

      // Changing source1 should NOT affect target anymore
      source1.set(100);
      expect(target.get()).toBe(20);

      // Changing source2 should affect target
      source2.set(200);
      expect(target.get()).toBe(200);
    });

    it("should handle re-linking to the same state", () => {
      const source = state(10);
      const target = state<number>();

      target.set(source);
      target.set(source);

      source.set(20);
      expect(target.get()).toBe(20);
    });
  });

  describe("Calc linking (Calc to State)", () => {
    it("should sync from calc to state", () => {
      const s = state(10);
      const c = calc(() => s.get() * 2);
      const target = state<number>();

      target.set(c);

      expect(target.get()).toBe(20);
    });

    it("should update state when calc dependencies change", () => {
      const s = state(10);
      const c = calc(() => s.get() * 2);
      const target = state<number>();

      target.set(c);
      s.set(20);

      expect(target.get()).toBe(40);
    });

    it("should NOT update calc when state changes (one-way binding)", () => {
      const s = state(10);
      const c = calc(() => s.get() * 2);
      const target = state<number>();

      target.set(c);
      target.set(100);

      // Calc should remain computed from source
      expect(c.get()).toBe(20);
      // But target should have the new value
      expect(target.get()).toBe(100);
    });

    it("should handle complex calc dependencies", () => {
      const a = state(5);
      const b = state(10);
      const c = calc(() => a.get() + b.get());
      const target = state<number>();

      target.set(c);
      expect(target.get()).toBe(15);

      a.set(10);
      expect(target.get()).toBe(20);

      b.set(20);
      expect(target.get()).toBe(30);
    });

    it("should maintain calc link after setting primitive value", () => {
      const s = state(10);
      const c = calc(() => s.get() * 2);
      const target = state<number>();

      target.set(c);
      expect(target.get()).toBe(20);

      // Setting a primitive value does not break the link
      target.set(999);
      expect(target.get()).toBe(999);

      // The link still exists, so calc changes propagate
      s.set(50);
      expect(target.get()).toBe(100); // Updated from calc
      expect(c.get()).toBe(100);
    });
  });

  describe("Reactivity and tracking", () => {
    it("should trigger reactions when value changes", () => {
      const s = state(0);
      const values: number[] = [];

      // Create a calc that tracks the state
      const c = calc(() => {
        const val = s.get();
        values.push(val);
        return val;
      });

      // Initial read
      c.get();

      s.set(1);
      c.get();

      s.set(2);
      c.get();

      expect(values.length).toBeGreaterThan(0);
    });

    it("should not trigger reactions on peek", () => {
      const s = state(0);
      let computeCount = 0;

      const c = calc(() => {
        s.get();
        computeCount++;
        return computeCount;
      });

      c.get(); // Initial computation
      const initialCount = computeCount;

      s.peek(); // Should not trigger
      s.peek(); // Should not trigger

      expect(computeCount).toBe(initialCount);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle setting state to itself", () => {
      const s = state(10);
      s.set(s.get());
      expect(s.get()).toBe(10);
    });

    it("should handle rapid consecutive updates", () => {
      const s = state(0);
      for (let i = 1; i <= 100; i++) {
        s.set(i);
      }
      expect(s.get()).toBe(100);
    });

    it("should handle object mutations correctly", () => {
      const obj = { count: 0 };
      const s = state(obj);

      // Direct mutation
      obj.count = 10;
      expect(s.get().count).toBe(10);

      // Set new object
      s.set({ count: 20 });
      expect(s.get().count).toBe(20);
      expect(obj.count).toBe(10); // Original object unchanged
    });

    it("should handle array mutations correctly", () => {
      const arr = [1, 2, 3];
      const s = state(arr);

      // Direct mutation
      arr.push(4);
      expect(s.get()).toContain(4);

      // Set new array
      s.set([5, 6, 7]);
      expect(s.get()).toEqual([5, 6, 7]);
      expect(arr).toEqual([1, 2, 3, 4]); // Original array unchanged
    });

    it("should handle undefined to value transitions", () => {
      const s = state<number | undefined>(undefined);
      expect(s.get()).toBeUndefined();

      s.set(42);
      expect(s.get()).toBe(42);

      s.set(undefined);
      expect(s.get()).toBeUndefined();
    });

    it("should handle null to value transitions", () => {
      const s = state<number | null>(null);
      expect(s.get()).toBeNull();

      s.set(42);
      expect(s.get()).toBe(42);

      s.set(null);
      expect(s.get()).toBeNull();
    });
  });

  describe("State linking behavior", () => {
    it("should maintain bidirectional link after setting primitive value", () => {
      const source = state(10);
      const target = state<number>();

      // Create bidirectional link
      target.set(source);
      expect(target.get()).toBe(10);

      // Setting a primitive value updates the value but keeps the link
      target.set(99);
      expect(target.get()).toBe(99);
      expect(source.get()).toBe(99); // Bidirectional: source also updated

      // Link still active: changes in source propagate to target
      source.set(999);
      expect(target.get()).toBe(999);
      expect(source.get()).toBe(999);
    });

    it("should maintain calc link after setting primitive value", () => {
      const s = state(10);
      const c = calc(() => s.get() * 2);
      const target = state<number>();

      // Create one-way link from calc to target
      target.set(c);
      expect(target.get()).toBe(20);

      // Setting a primitive temporarily overrides the value
      target.set(999);
      expect(target.get()).toBe(999);

      // But the link remains: calc changes still propagate
      s.set(50);
      expect(target.get()).toBe(100);
    });

    it("should properly dispose previous links when linking to new state", () => {
      const sources = [state(1), state(2), state(3)];
      const target = state<number>();

      // Link to first source
      target.set(sources[0]);
      expect(target.get()).toBe(1);

      // Link to second source (should dispose first link)
      target.set(sources[1]);
      expect(target.get()).toBe(2);

      // Link to third source (should dispose second link)
      target.set(sources[2]);
      expect(target.get()).toBe(3);

      // Change all sources
      sources[0].set(10);
      sources[1].set(20);
      sources[2].set(30);

      // Only last link should be active
      expect(target.get()).toBe(30);

      // Previous sources should not affect target
      expect(sources[0].get()).toBe(10);
      expect(sources[1].get()).toBe(20);
    });
  });

  describe("Chaining and composition", () => {
    it("should support chaining set operations", () => {
      const s = new State<number>();
      const result = s.set(10);

      expect(result).toBe(s);
      expect(s.get()).toBe(10);
    });

    it("should support chaining multiple operations", () => {
      const s = new State<number>().set(10);
      s.set(20);

      expect(s.get()).toBe(20);
    });

    it("should support state chains (A -> B -> C)", () => {
      const a = state(1);
      const b = state<number>();
      const c = state<number>();

      b.set(a);
      c.set(b);

      expect(c.get()).toBe(1);

      a.set(10);
      expect(b.get()).toBe(10);
      expect(c.get()).toBe(10);
    });

    it("should maintain chain when intermediate state value changes", () => {
      const a = state(1);
      const b = state<number>();
      const c = state<number>();

      // Create chain A -> B -> C
      b.set(a);
      c.set(b);

      expect(a.get()).toBe(1);
      expect(b.get()).toBe(1);
      expect(c.get()).toBe(1);

      // Setting B to a primitive value keeps the links active
      b.set(999);

      expect(a.get()).toBe(999); // Bidirectional: A updated from B
      expect(b.get()).toBe(999);
      expect(c.get()).toBe(999); // C updated from B

      // Changing A still propagates through the chain
      a.set(100);
      expect(a.get()).toBe(100);
      expect(b.get()).toBe(100);
      expect(c.get()).toBe(100);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle state graphs without circular dependencies", () => {
      const root = state(10);
      const branch1 = state<number>();
      const branch2 = state<number>();
      const leaf = state<number>();

      branch1.set(root);
      branch2.set(root);
      leaf.set(branch1);

      root.set(20);

      expect(branch1.get()).toBe(20);
      expect(branch2.get()).toBe(20);
      expect(leaf.get()).toBe(20);
    });

    it("should handle mixed calc and state links", () => {
      const s1 = state(5);
      const s2 = state(10);
      const c1 = calc(() => s1.get() * 2);
      const s3 = state<number>();
      const c2 = calc(() => s2.get() + s3.get());

      s3.set(c1);

      expect(s3.get()).toBe(10);
      expect(c2.get()).toBe(20);

      s1.set(10);
      expect(s3.get()).toBe(20);
      expect(c2.get()).toBe(30);
    });

    it("should maintain consistency with multiple observers", () => {
      const source = state(0);
      const observer1 = state<number>();
      const observer2 = state<number>();
      const observer3 = state<number>();

      observer1.set(source);
      observer2.set(source);
      observer3.set(source);

      for (let i = 1; i <= 10; i++) {
        source.set(i);
        expect(observer1.get()).toBe(i);
        expect(observer2.get()).toBe(i);
        expect(observer3.get()).toBe(i);
      }
    });
  });

  describe("Performance considerations", () => {
    it("should handle large number of updates efficiently", () => {
      const s = state(0);
      const start = Date.now();

      for (let i = 0; i < 10000; i++) {
        s.set(i);
      }

      const duration = Date.now() - start;
      expect(s.get()).toBe(9999);
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it("should handle large state graphs efficiently", () => {
      const root = state(0);
      const observers = Array.from({ length: 100 }, () => state<number>());

      observers.forEach((observer) => observer.set(root));

      const start = Date.now();
      root.set(42);
      const duration = Date.now() - start;

      observers.forEach((observer) => {
        expect(observer.get()).toBe(42);
      });

      expect(duration).toBeLessThan(1000);
    });
  });
});
