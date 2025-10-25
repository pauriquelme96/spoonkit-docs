import { state } from "../../lib/signals/State";
import { stateArray } from "../../lib/signals/StateArray";
import { stateObject } from "../../lib/signals/StateObject";
import type { InferModel } from "../../lib/ModelTypes";

// La interfaz ahora se infiere automáticamente del modelo
export type UserModel = InferModel<typeof createUserModel>;

export const createUserModel = () =>
  stateObject({
    id: state<string>(),
    name: state<string>(),
    email: stateArray(() => state<string>()),
    age: state<number>(),
  });
