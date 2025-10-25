import { UserApi } from "../../domain/User/UserApi";
import { UserEntity } from "../../domain/User/UserEntity";
import { provide } from "../../lib/provider";
import { state } from "../../lib/signals/State";
import { emitter } from "../../lib/signals/Emitter";
import { TableCtrl } from "../../components/Table/TableCtrl";
export class UserListCtrl extends TableCtrl<UserEntity> {
  public columns = state([
    { id: "name", label: "Name", minWidth: 170 },
    { id: "email", label: "Email", minWidth: 100 },
    { id: "role", label: "Role", minWidth: 100 },
  ]);

  public buildRow(item: UserEntity, index: number): any {
    throw new Error("Method not implemented.");
  }

  private api = provide(UserApi);
  public title = state("User Panel");
  public users = state<UserEntity[]>([]);
  public searching = state(false);
  public onRowClick = emitter<UserEntity>();

  ctrlStart() {
    this.fetchTasks();
  }

  public async fetchTasks() {
    this.title.set("Loading...");
    const users = await this.api.getUsers();
    this.users.set(users.map((user) => new UserEntity(user)));
    this.title.set("User Panel");
  }

  public openUserDetail(user: UserEntity) {
    this.onRowClick.next(user);
  }
}
