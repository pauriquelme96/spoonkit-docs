import { computed, type ObservableObject } from "@legendapp/state";
import type { UserModel } from "./UserModel";


export const createUserValidator = (user: ObservableObject<UserModel>) => computed(() => {
  const { name, email, age } = user.get();

  return {
    name: name.length > 0,
    email: email.includes("@"),
    age: age > 0,
  };
});