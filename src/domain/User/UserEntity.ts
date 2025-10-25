import { provide } from "../../lib/provider";
import { UserApi } from "./UserApi";
import { createUserModel, type UserModel } from "./UserModel";
import { userValidator } from "./UserValidator";
import { calc } from "../../lib/signals/Calc";

export class UserEntity {
  private api = provide(UserApi);
  public model = createUserModel();
  public validation = calc(() => userValidator(this.model.get()));

  constructor(user: UserModel) {
    this.model.set(user);
  }

  public async save() {
    const isValid = Object.values(this.validation.get()).every(
      (v) => v === true
    );
    if (!isValid) throw new Error("Invalid user data");

    this.model.id.get()
      ? await this.api.updateUser(this.model.id.get(), this.model.get())
      : await this.api.createUser(this.model.get());
  }

  public async delete() {
    await this.api.deleteUser(this.model.id.get());
  }
}
