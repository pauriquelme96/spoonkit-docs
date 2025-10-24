import { useCtrl } from "../../lib/useCtrl";
import { UserPanelCtrl } from "./UserPanelCtrl";
import { UserList } from "./UserList";
import { UserDetail } from "./UserDetail";

export function UserPanel() {
  const { self } = useCtrl(UserPanelCtrl);
  const userDetail = self.userDetailCtrl.get();

  return (
    <div>
      {!userDetail && <UserList ctrl={self.userListCtrl} />}
      {userDetail && <UserDetail ctrl={userDetail} />}
    </div>
  );
}
