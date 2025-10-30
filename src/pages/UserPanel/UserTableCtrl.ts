import { UserApi } from "../../domain/User/UserApi";
import { UserEntity } from "../../domain/User/UserEntity";
import { provide } from "../../lib/provider";
import { state } from "../../lib/signals/State";
import { TableCtrl, type RowModel } from "../../components/Table/TableCtrl";
import { LabelCtrl } from "../../components/Label/LabelCtrl";
import { emitter } from "../../lib/signals/Emitter";
import { ButtonCtrl } from "../../components/Button/ButtonCtrl";

export class UserTableCtrl extends TableCtrl<UserEntity> {
  private api = provide(UserApi);
  public onOpenDetail = emitter<UserEntity>();
  public loading = state<boolean>(false);

  public columns = state([
    { id: "id", label: "ID", width: "auto" },
    { id: "name", label: "Name", width: "auto" },
    { id: "email", label: "Email", width: "1fr" },
    { id: "actions", label: "Actions", width: "auto" },
  ]);

  ctrlStart() {
    this.fetchTasks();
  }

  public buildRow(user: UserEntity): RowModel {
    const { id, name, email } = user.model;

    return {
      id: new LabelCtrl().set({
        text: id.get(),
      }),
      name: new LabelCtrl().set({
        text: name,
      }),
      email: new LabelCtrl().set({
        text: email.join(", "),
      }),
      actions: new ButtonCtrl().set({
        label: "Details",
        variant: "secondary",
        onClick: () => this.onOpenDetail.next(user),
      }),
    };
  }

  public rowKeyFn(item: UserEntity): string | number {
    return item.model.id.get();
  }

  public async fetchTasks() {
    this.loading.set(true);
    const users = await this.api.getUsers();
    this.setData(users.map((user) => new UserEntity(user)));
    this.loading.set(false);
  }
}
