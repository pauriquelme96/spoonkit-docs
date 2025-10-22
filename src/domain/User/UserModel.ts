import { state } from "../../lib/signals";

export interface UserModel {
  id: string;
  name: string;
  email: string;
  age: number;
}

export const createUserModel = () => state<UserModel>();


