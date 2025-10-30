import { provide } from "../../lib/provider";
import { UserApi } from "./UserApi";
import { createUserModel, type iUser } from "./UserModel";
import { createUserValidator } from "./UserValidator";

export class UserEntity {
  private api = provide(UserApi);
  public model = createUserModel();
  public validation = createUserValidator(this.model);

  constructor(user: iUser) {
    this.model.set(user);
  }

  public async save() {
    const hasErrors = Object.values(this.validation).some((v) => !!v.get());
    if (hasErrors) throw new Error("Invalid user data");

    this.model.id.get()
      ? await this.api.updateUser(this.model.id.get(), this.model.get())
      : await this.api.createUser(this.model.get());
  }

  public async delete() {
    await this.api.deleteUser(this.model.id.get());
  }
}
