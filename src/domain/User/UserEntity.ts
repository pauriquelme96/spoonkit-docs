import { computed } from "@legendapp/state";
import { provide } from "../../lib/provider";
import { monitor } from "../../lib/signals";
import { UserApi } from "./UserApi";
import { createUserModel, type UserModel } from "./UserModel";
import { createUserValidator } from "./UserValidator";

export class UserEntity {
  private api = provide(UserApi);
  public model = createUserModel();
  public validator = createUserValidator(this.model);
  public isValid = computed(() => Object.values(this.validator.get()).every(v => v));

  constructor(user: UserModel) {
    this.model.set(user);
  }

  public async save() {
    if (!this.isValid.get()) throw new Error("Invalid user data");

    this.model.id.get()
      ? await this.api.updateUser(this.model.id.get(), this.model.get())
      : await this.api.createUser(this.model.get());
  }

  public async delete() {
    await this.api.deleteUser(this.model.id.get());
  }
}

const userEntityCache = new Map<string, UserEntity>();
export function toUserEntity(data: UserModel): UserEntity {
  const cached = userEntityCache.get(data.id);
  if (cached) {
    cached.model.set(data);
    return cached;
  }

  const entity = new UserEntity(data);
  userEntityCache.set(data.id, entity);

  const dispose = monitor(() => {
    const modelExists = entity.model.get();

    if (!modelExists) {
      userEntityCache.delete(data.id);
      dispose();
    }
  });

  return entity;
}
