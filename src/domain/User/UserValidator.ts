
import type { UserModel } from "./UserModel";


export function userValidator(user: UserModel) {
  const { name, email, age } = user;

  return {
    name: name.length > 0 || "Name cannot be empty",
    email: email.includes("@") || "Email must be valid",
    age: age > 0 || "Age must be a positive number",
  };
};