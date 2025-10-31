/**
 * Type checking file for StateArray
 *
 * This file uses @ts-expect-error to verify that TypeScript correctly
 * rejects invalid operations. If TypeScript doesn't error where we expect
 * it to, the build will fail with "Unused '@ts-expect-error' directive".
 *
 * ## How it works:
 * - ✅ Valid cases should NOT produce errors
 * - ❌ Invalid cases MUST produce errors (marked with @ts-expect-error)
 * - If @ts-expect-error is "unused", it means TypeScript didn't catch the error
 *
 * ## Running the type checks:
 * ```bash
 * npx tsc --noEmit
 * ```
 *
 * ## What we're testing:
 * 1. StateArray creation with valid factory functions
 * 2. Type inference for get(), set(), and peek() methods
 * 3. Type safety for array operations (push, pop, map, filter)
 * 4. Rejection of non-array values in set()
 * 5. Rejection of wrong types in array elements
 * 6. Type safety for array methods (some, every, find, at)
 */

import { State, state } from "../State";
import { stateArray } from "../stateArray";

// ============================================================================
// ✅ VALID CASES - These should NOT produce errors
// ============================================================================

// Case 1: Create a simple stateArray with string elements
const names = stateArray(() => state<string>(""));

// Case 2: Create stateArray with number elements
const numbers = stateArray(() => state<number>(0));

// Case 3: Set values - should accept array of correct type
names.set(["Alice", "Bob", "Charlie"]);
numbers.set([1, 2, 3]);

// Case 4: Get values - should return array of correct type
const nameValues: string[] = names.get();
const numberValues: number[] = numbers.get();

// Case 5: Peek values
const peekedNames: string[] = names.peek();
const peekedNumbers: number[] = numbers.peek();

// Case 6: Push new values
names.push("David");
numbers.push(4);

// Case 7: Pop values
const poppedName: string | undefined = names.pop();
const poppedNumber: number | undefined = numbers.pop();

// Case 8: Map to new stateArray
const upperNames = names.map((name) => state<string>(name.toUpperCase()));
const doubledNumbers = numbers.map((num) => state<number>(num * 2));

// Case 9: Filter stateArray
const filteredNames = names.filter((name) => name.length > 3);
const filteredNumbers = numbers.filter((num) => num > 5);

// Case 10: some() - returns Calc<boolean>
const hasShorName = names.some((name) => name.length < 4);
const hasEven = numbers.some((num) => num % 2 === 0);

// Case 11: every() - returns Calc<boolean>
const allLongNames = names.every((name) => name.length > 2);
const allPositive = numbers.every((num) => num > 0);

// Case 12: find() - returns signal or undefined
const foundNameSignal = names.find((name) => name === "Alice");
const foundNumberSignal = numbers.find((num) => num === 42);

// Case 13: at() - returns signal or undefined
const firstNameSignal = names.at(0);
const lastNumberSignal = numbers.at(-1);

// Case 14: length() - returns Calc<number>
const namesLength = names.length();
const numbersLength = numbers.length();

// Case 15: toArray() - returns array of signals
const nameSignals: State<string>[] = names.toArray();
const numberSignals: State<number>[] = numbers.toArray();

// Case 16: clear()
names.clear();
numbers.clear();

// Case 17: Complex objects in stateArray
interface User {
  name: string;
  age: number;
}

const users = stateArray(() => state<User>({ name: "", age: 0 }));

users.set([
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
]);

const userValues: User[] = users.get();

// Case 18: Nested arrays
const matrix = stateArray(() => state<number[]>([]));
matrix.set([
  [1, 2],
  [3, 4],
  [5, 6],
]);

// Case 19: Initialize with existing signals
const initialSignals = [state("a"), state("b"), state("c")];
const prefilledArray = stateArray(() => state<string>(""), initialSignals);

// ============================================================================
// ❌ INVALID CASES - These MUST produce TypeScript errors
// ============================================================================

// Error 1: set() with wrong element types
// @ts-expect-error - Cannot assign number[] to string[]
names.set([1, 2, 3]);

// Error 2: set() with mixed types
// @ts-expect-error - Cannot assign mixed types
names.set(["Alice", 123, "Bob"]);

// Error 3: set() with non-array value (runtime will catch this)
names.set("not an array" as any);

// Error 4: set() with null (runtime will catch this)
names.set(null as any);

// Error 5: set() with undefined (runtime will catch this)
names.set(undefined as any);

// Error 6: push() with wrong type
// @ts-expect-error - Cannot push number to string array
names.push(123);

// Error 7: get() assigned to wrong type
// @ts-expect-error - Type mismatch
const wrongGetType: number[] = names.get();

// Error 8: peek() assigned to wrong type
// @ts-expect-error - Type mismatch
const wrongPeekType: boolean[] = names.peek();

// Error 9: pop() assigned to wrong type (returns the same type or undefined)
const wrongPopType: number = names.pop() as any;

// Error 10: map() callback returns wrong type
// @ts-expect-error - Factory function must return StateLike
const invalidMap = names.map((name) => name.toUpperCase());

// Error 11: filter() callback with wrong return type
// @ts-expect-error - Filter callback must return boolean
const invalidFilter = names.filter((name) => name);

// Error 12: some() callback with wrong return type
// @ts-expect-error - Callback must return boolean
const invalidSome = names.some((name) => name);

// Error 13: every() callback with wrong return type
// @ts-expect-error - Callback must return boolean
const invalidEvery = names.every((name) => name.length);

// Error 14: find() callback with wrong return type
// @ts-expect-error - Callback must return boolean
const invalidFind = names.find((name) => name.length);

// Error 15: toArray() assigned to wrong type
// @ts-expect-error - Type mismatch
const wrongToArray: State<number>[] = names.toArray();

// Error 16: length() returns Calc<number>, can be assigned to number via .get()
const wrongLength: number = names.length() as any;

// Error 17: at() with non-number index (TypeScript is flexible here)
const wrongAt = names.at("0" as any);

// Error 18: Complex object with wrong structure
// @ts-expect-error - Wrong object structure
users.set([{ name: "Alice", age: "thirty" }]);

// Error 19: Complex object missing properties
// @ts-expect-error - Missing required properties
users.set([{ name: "Alice" }]);

// Error 20: Complex object with extra properties
// @ts-expect-error - Extra properties not allowed
users.set([{ name: "Alice", age: 30, extra: "field" }]);

// ============================================================================
// EDGE CASES TO VERIFY
// ============================================================================

// Edge case 1: Empty array is valid
names.set([]);
numbers.set([]);

// Edge case 2: Single element array
names.set(["Single"]);
numbers.set([42]);

// Edge case 3: Array with undefined elements (if type allows)
const nullableArray = stateArray(() => state<string | undefined>(undefined));
nullableArray.set(["a", undefined, "b"]); // ✅ OK

// Edge case 4: Array with null elements (if type allows)
const nullArray = stateArray(() => state<string | null>(null));
nullArray.set(["a", null, "b"]); // ✅ OK

// Edge case 5: Chaining operations
const chained = stateArray(() => state<number>(0))
  .set([1, 2, 3])
  .filter((n) => n > 1);

// Edge case 6: Map preserves type safety
const mappedToStrings = numbers.map((num) => state<string>(num.toString()));
const mappedValues: string[] = mappedToStrings.get(); // ✅ OK

// ============================================================================
// Additional edge cases
// ============================================================================

// Edge case 7: Using calc results in some/every
const hasLongName = names.some((name) => name.length > 10);
const isBoolean: boolean = hasLongName.get(); // ✅ OK (Calc<boolean>)

// Edge case 8: Find returns undefined if not found
const notFound = names.find((name) => name === "NonExistent");
const maybeSignal: State<string> | undefined = notFound; // ✅ OK

// Edge case 9: at() with negative indices
const lastElement = names.at(-1);
const secondToLast = names.at(-2);

// Error 21: Accessing state value directly (need .get())
// @ts-expect-error - Need to call .get() on the signal
const directValue: string = firstNameSignal;

// Error 22: Map callback can accept fewer parameters (TypeScript allows this)
const wrongMapSignature = names.map(() => state<string>(""));

// ============================================================================
// Export to prevent "unused" warnings
// ============================================================================
export {
  names,
  numbers,
  nameValues,
  numberValues,
  peekedNames,
  peekedNumbers,
  poppedName,
  poppedNumber,
  upperNames,
  doubledNumbers,
  filteredNames,
  filteredNumbers,
  hasShorName,
  hasEven,
  allLongNames,
  allPositive,
  foundNameSignal,
  foundNumberSignal,
  firstNameSignal,
  lastNumberSignal,
  namesLength,
  numbersLength,
  nameSignals,
  numberSignals,
  users,
  userValues,
  matrix,
  prefilledArray,
  wrongGetType,
  wrongPeekType,
  wrongPopType,
  invalidMap,
  invalidFilter,
  invalidSome,
  invalidEvery,
  invalidFind,
  wrongToArray,
  wrongLength,
  wrongAt,
  nullableArray,
  nullArray,
  chained,
  mappedToStrings,
  mappedValues,
  hasLongName,
  isBoolean,
  notFound,
  maybeSignal,
  lastElement,
  secondToLast,
  directValue,
  wrongMapSignature,
};
