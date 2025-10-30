import type { iUser } from "./UserModel";

export function userValidator(user: iUser) {
  const { name, email, age } = user;

  return {
    name: name.length > 0 || "Name cannot be empty",
    email: email.every((e) => e.includes("@")) || "Emails must be valid",
    age: age > 0 || "Age must be a positive number",
  };
}
