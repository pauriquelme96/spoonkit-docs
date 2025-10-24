import { Ctrl } from "../../lib/Ctrl";
import { state } from "../../lib/signals/State";
import { UserEntity } from "../../domain/User/UserEntity";
import { UserListCtrl } from "./UserListCtrl";
import { UserDetailCtrl } from "./UserDetailCtrl";

export class UserPanelCtrl extends Ctrl {
  public userDetailCtrl = state<UserDetailCtrl>(null);

  public userListCtrl = new UserListCtrl().set({
    onRowClick: (user: UserEntity) => {
      const detail = new UserDetailCtrl(user).set({
        onClose: () => this.userDetailCtrl.set(null),
      });

      this.userDetailCtrl.set(detail);
    },
  });
}
