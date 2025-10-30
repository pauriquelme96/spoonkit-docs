import { Ctrl } from "../../lib/Ctrl";
import { state } from "../../lib/signals/State";
import { UserEntity } from "../../domain/User/UserEntity";
import { UserTableCtrl } from "./UserTableCtrl";
import { calc } from "../../lib/signals/Calc";
import { UserDetailCtrl } from "./UserDetail/UserDetailCtrl";

export class UserPanelCtrl extends Ctrl {
  userDetailCtrl = state<UserDetailCtrl>(null);
  title = calc(() =>
    this.userTable.loading.get() ? "Loading Users..." : "User Management"
  );

  userTable = new UserTableCtrl().set({
    onOpenDetail: (user: UserEntity) => {
      const detail = new UserDetailCtrl(user).set({
        onClose: () => this.userDetailCtrl.set(null),
      });

      this.userDetailCtrl.set(detail);
    },
  });
}
