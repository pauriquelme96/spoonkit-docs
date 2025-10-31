import { state } from "../../lib/signals/State";
import type { Infer } from "../../lib/ModelTypes";
import { stateArray } from "../../lib/signals/stateArray";
import { stateObject } from "../../lib/signals/stateObject";

// La interfaz ahora se infiere automáticamente del modelo
export type iUser = Infer<typeof createUserModel>;
export type UserModel = ReturnType<typeof createUserModel>;

export const createUserModel = () =>
  stateObject({
    id: state<string>(),
    name: state<string>(),
    email: stateArray(() => state<string>()),
    age: state<number>(),
    countryId: state<string>(),
    cityId: state<string>(),
  });
