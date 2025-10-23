import { UserApi } from "../../domain/User/UserApi";
import { UserEntity } from "../../domain/User/UserEntity";
import { Ctrl } from "../../lib/Ctrl";
import { provide } from "../../lib/provider";
import { state } from "../../lib/signals/State";

export class UserListCtrl extends Ctrl {
  private api = provide(UserApi);
  public title = state("User Panel");
  public users = state<UserEntity[]>([]);
  public searching = state(false);

  ctrlStart() {
    this.fetchTasks();
  }

  public async fetchTasks() {
    this.title.set("Loading...");
    const users = await this.api.getUsers();
    this.users.set(users.map((user) => new UserEntity(user)));
    this.title.set("User Panel");
  }

  public openUserInfo(user: UserEntity) {
    // TODO: Implement
  }
}
