import { useCtrl } from "../../lib/useCtrl";
import { UserPanelCtrl } from "./UserPanelCtrl";
import { UserDetail } from "./UserDetail/UserDetail";
import { Table } from "../../components/Table/Table";

export function UserPanel() {
  const { self } = useCtrl(UserPanelCtrl);
  const userDetail = self.userDetailCtrl.get();

  return (
    <div>
      {!userDetail && (
        <div>
          <h1>{self.title.get()}</h1>
          <Table ctrl={self.userTable} />
        </div>
      )}
      {userDetail && <UserDetail ctrl={userDetail} />}
    </div>
  );
}
