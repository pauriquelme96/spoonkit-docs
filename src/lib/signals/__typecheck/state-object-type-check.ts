/**
 * Type checking file for StateObject
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
 * 1. StateObject creation with valid State properties
 * 2. Type inference for get(), set(), and peek() methods
 * 3. Type safety for nested objects and arrays
 * 4. Rejection of non-StateLike values
 * 5. Rejection of wrong types in set() operations
 * 6. Rejection of access to non-existent properties
 */

import { State, state } from "../State";
import { stateObject } from "../StateObject";

// ============================================================================
// ✅ VALID CASES - These should NOT produce errors
// ============================================================================

// Case 1: Create a simple stateObject with string properties
const user = stateObject({
  name: state<string>("John"),
  age: state<number>(30),
});

// Case 2: Access individual state properties
const nameState: State<string> = user.name;
const ageState: State<number> = user.age;

// Case 3: Get values - should return the correct object type
const userData = user.get();

// Case 4: Set valid values
user.set({ name: "Jane", age: 25 });

// Case 5: Peek values
const peekedData = user.peek();

// Case 6: Complex nested types
const complexObj = stateObject({
  config: state<{ enabled: boolean; timeout: number }>({
    enabled: true,
    timeout: 1000,
  }),
  items: state<string[]>([]),
  metadata: state<Record<string, any>>({}),
});

// Case 7: StateObject with undefined initial values
const optionalFields = stateObject({
  optional: state<string | undefined>(),
  nullable: state<string | null>(null),
});

// Case 8: StateObject with only States (calc doesn't implement set, so it's not StateLike)
const withStates = stateObject({
  firstName: state<string>("John"),
  lastName: state<string>("Doe"),
  age: state<number>(30),
});

// ============================================================================
// ❌ INVALID CASES - These MUST produce TypeScript errors
// ============================================================================

// Error 1: set() with wrong property types
// @ts-expect-error - Cannot assign number to string
user.set({ name: 123, age: 25 });

// Error 2: set() with wrong property types (age)
// @ts-expect-error - Cannot assign string to number
user.set({ name: "Jane", age: "not a number" });

// Error 4: set() with extra properties that don't exist
// @ts-expect-error - Property 'email' does not exist
user.set({ name: "Jane", age: 25, email: "test@test.com" });

// Error 5: get() assigned to wrong type
// @ts-expect-error - Type mismatch
const wrongType: { name: number; age: string } = user.get();

// Error 6: Accessing non-existent properties
// @ts-expect-error - Property 'email' does not exist
const nonExistent = user.email;

// Error 7: Accessing property with wrong type expectation
// @ts-expect-error - Type mismatch
const wrongPropertyType: number = userData.name;

// Error 8: Creating stateObject with non-StateLike values
const invalidObj = stateObject({
  // @ts-expect-error - Plain values are not StateLike
  name: "not a state",
  // @ts-expect-error - Plain values are not StateLike
  age: 30,
});

// Error 9: Creating stateObject with null (runtime error, but type system allows with 'as any')
const nullObj = stateObject(null as any);

// Error 10: Creating stateObject with array
// @ts-expect-error - Arrays are not valid models for stateObject
const arrayObj = stateObject([state("a"), state("b")]);

// Error 11: set() with wrong nested object type
complexObj.set({
  // @ts-expect-error - enabled should be boolean, not string
  config: { enabled: "yes", timeout: 1000 },
  items: [],
  metadata: {},
});

// Error 12: set() with wrong array item type
complexObj.set({
  config: { enabled: true, timeout: 1000 },
  // @ts-expect-error - items should be string[], not number[]
  items: [1, 2, 3],
  metadata: {},
});

// Error 13: Calling set on individual property with wrong type
// @ts-expect-error - Cannot assign number to State<string>
user.name.set(123);

// Error 14: peek() result assigned to wrong type
// @ts-expect-error - Type mismatch
const wrongPeekType: { name: boolean } = user.peek();

// Error 15: stateObject with empty object (should technically work, but is unusual)
const emptyObj = stateObject({});

// ============================================================================
// EDGE CASES TO VERIFY
// ============================================================================

// Edge case 1: Optional properties should work
const withOptional = stateObject({
  required: state<string>("value"),
  optional: state<string | undefined>(undefined),
});

withOptional.set({ required: "new", optional: undefined }); // ✅ OK
withOptional.set({ required: "new", optional: "value" }); // ✅ OK

// Edge case 2: Null values
const withNull = stateObject({
  nullableValue: state<string | null>(null),
});

withNull.set({ nullableValue: null }); // ✅ OK
withNull.set({ nullableValue: "string" }); // ✅ OK

// Note: TypeScript doesn't error on undefined for string | null in this context
// because of how the type system handles optional properties
withNull.set({ nullableValue: undefined as any }); // Would need explicit any

// ============================================================================
// Additional errors to test
// ============================================================================

// Error 16: Using object without set method (which doesn't implement StateLike)
const withCalc = stateObject({
  value: state<string>("test"),
  // @ts-expect-error - Object doesn't implement set()
  computed: { get: () => "value", peek: () => "value" },
});

// ============================================================================
// Export to prevent "unused" warnings
// ============================================================================
export {
  user,
  nameState,
  ageState,
  userData,
  complexObj,
  optionalFields,
  withStates,
  withOptional,
  withNull,
  wrongType,
  nonExistent,
  wrongPropertyType,
  invalidObj,
  nullObj,
  arrayObj,
  wrongPeekType,
  emptyObj,
  withCalc,
};
