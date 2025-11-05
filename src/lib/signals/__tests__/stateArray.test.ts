import { describe, it, expect } from "vitest";
import { stateArray } from "../stateArray";
import { state } from "../State";
import { monitor } from "../Monitor";

describe("StateArray", () => {
  it("stateArray() - should create empty array and populate using factory", () => {
    const numbers = stateArray(() => state<number>());

    expect(numbers.get()).toEqual([]);

    numbers.set([1, 2, 3]);

    expect(numbers.get()).toEqual([1, 2, 3]);

    const firstSignal = numbers.at(0);
    expect(firstSignal).toBeDefined();
    firstSignal?.set(10);
    expect(numbers.get()).toEqual([10, 2, 3]);
  });

  it("get() - should return current values and create subscription", () => {
    const numbers = stateArray(() => state<number>());
    numbers.set([1, 2, 3]);

    expect(numbers.get()).toEqual([1, 2, 3]);

    numbers.at(0)?.set(10);
    expect(numbers.get()).toEqual([10, 2, 3]);

    // Verificar que get() crea suscripción reactiva
    let triggerCount = 0;
    monitor(() => {
      numbers.get();
      triggerCount++;
    });

    const countBefore = triggerCount;

    numbers.at(1)?.set(20); // Modificar un elemento

    expect(triggerCount).toBeGreaterThan(countBefore);
  });

  it("peek() - should return values without creating subscription", () => {
    const numbers = stateArray(() => state<number>());
    numbers.set([1, 2, 3]);

    expect(numbers.peek()).toEqual([1, 2, 3]);

    numbers.at(0)?.set(10);
    expect(numbers.peek()).toEqual([10, 2, 3]);

    // Verificar que peek() NO crea suscripción reactiva
    let triggerCount = 0;
    monitor(() => {
      numbers.peek();
      triggerCount++;
    });

    const countBefore = triggerCount;

    numbers.at(1)?.set(20); // Modificar un elemento

    expect(triggerCount).toBe(countBefore); // No debe cambiar
  });

  it("set() - should replace all values and reuse existing signals", () => {
    const numbers = stateArray(() => state<number>());

    numbers.set([1, 2, 3]);
    expect(numbers.get()).toEqual([1, 2, 3]);

    const firstSignal = numbers.at(0);

    numbers.set([10, 20, 30]);
    expect(numbers.get()).toEqual([10, 20, 30]);

    expect(numbers.at(0)).toBe(firstSignal);

    expect(() => numbers.set("invalid" as any)).toThrow(TypeError);
  });

  it("map() - should transform elements into new StateArray maintaining reactivity", () => {
    const numbers = stateArray(() => state<number>());
    numbers.set([1, 2, 3]);

    const doubled = numbers.map({
      newModel: () => state<number>(),
      mapFn: (value) => value * 2,
    });

    expect(doubled.get()).toEqual([2, 4, 6]);
    expect(doubled).not.toBe(numbers);
  });

  it("map() - should support push on mapped array", () => {
    const numbers = stateArray(() => state<number>());
    numbers.set([1, 2, 3]);

    const doubled = numbers.map({
      newModel: () => state<number>(),
      mapFn: (value) => value * 2,
    });

    doubled.push(8);

    expect(doubled.get()).toEqual([2, 4, 6, 8]);
  });

  it("map() - should work with empty array", () => {
    const numbers = stateArray(() => state<number>());

    const doubled = numbers.map({
      newModel: () => state<number>(),
      mapFn: (value) => value * 2,
    });

    expect(doubled.get()).toEqual([]);
  });

  it("map() - should allow modifying elements in mapped array", () => {
    const numbers = stateArray(() => state<number>());
    numbers.set([1, 2, 3]);

    const doubled = numbers.map({
      newModel: () => state<number>(),
      mapFn: (value) => value * 2,
    });

    doubled.at(0)?.set(100);

    expect(doubled.get()).toEqual([100, 4, 6]);
  });

  it("map() - should NOT apply transformation on set() of mapped array", () => {
    const numbers = stateArray(() => state<number>());
    numbers.set([1, 2, 3]);

    const doubled = numbers.map({
      newModel: () => state<number>(),
      mapFn: (value) => value * 2,
    });

    expect(doubled.get()).toEqual([2, 4, 6]);

    // El problema original: set() NO debe transformar los valores
    doubled.set([10, 20, 30, 40]);

    expect(doubled.get()).toEqual([10, 20, 30, 40]); // Sin transformar ✅
  });
});
