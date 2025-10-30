import { calc } from "../../lib/signals/Calc";
import type { UserModel } from "./UserModel";

/*export function userValidator(user: iUser) {
  const { name, email, age } = user;

  return {
    name: name?.length > 0 || "Name cannot be empty",
    email: email?.every((e) => e.includes("@")) || "Emails must be valid",
    age: age > 0 || "Age must be a positive number",
  };
}*/

export function createUserValidator(user: UserModel) {
  // NAME
  const name = calc(() => {
    const value = user.name.get();

    if (value?.length === 0) return "Name cannot be empty";
  });

  // EMAIL
  const email = calc(() => {
    const emails = user.email.get();

    if (emails?.some((e) => !e.includes("@")))
      return "All emails must be valid";
  });

  // AGE
  const age = calc(() => {
    const value = user.age.get();
    if (value <= 0) return "Age must be a positive number";
  });

  return {
    name,
    email,
    age,
  };
}
