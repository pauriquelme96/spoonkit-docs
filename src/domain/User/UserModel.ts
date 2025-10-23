import { state } from "../../lib/signals/State";
import { stateArray } from "../../lib/signals/stateArr";
import { stateObj } from "../../lib/signals/stateObj";
import type { InferModel } from "../../lib/ModelTypes";

// La interfaz ahora se infiere automáticamente del modelo
export type UserModel = InferModel<ReturnType<typeof createUserModel>>;
export const createUserModel = () =>
  stateObj({
    id: state<string>(),
    name: state<string>(),
    email: stateArray(() => state<string>()),
    age: state<number>(),
  });

const user: UserModel = {};
