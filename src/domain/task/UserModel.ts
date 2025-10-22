import { state } from "../../lib/signals";

interface UserModel {
  name: string;
  email: string;
  age: number;
}

export const createUserModel = () => state<UserModel>();

const user = createUserModel();

user.set({
  name: "John Doe",
  email: "john.doe@example.com",
  age: 30,
});

class UserApi {
  private client: any;

  public getUsers(): Promise<UserModel[]> {
    return http.get("/users");
  }

  public async createUser(user: UserModel): Promise<void> {
    await http.post("/users", user);
  }

  public async deleteUser(userId: string): Promise<void> {
    await http.delete(`/users/${userId}`);
  }
}

class UserEntity {
  private api = provide(UserApi);
  public model = createUserModel();

  constructor(user: UserModel) {
    this.model.set(user);
  }

  public async save() {
    return this.model.get().id
      ? await this.api.upsertUser(this.model.get())
      : await this.api.createUser(this.model.get());
  }

  public async delete() {
    await this.api.deleteUser(this.model.get().id);
    this.model.delete();
  }
}

const userValidator = (userModel) =>
  computed(() => {
    const { name, email, age } = userModel.get();

    return {
      name: name.length > 0 && name.length <= 100,
      email: email.length > 0 && email.length <= 100,
      age: typeof age === "number" && age > 0,
    };
  });
