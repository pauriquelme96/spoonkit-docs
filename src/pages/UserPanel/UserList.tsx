import { observer } from "@legendapp/state/react";
import { UserListCtrl } from "./UserListCtrl";
import { useCtrl } from "../../lib/useCtrl";

export const UserList = observer(() => {
  const self = useCtrl(UserListCtrl);

  return (
    <div>
      <h2>{self.title.get()}</h2>
      <ul>
        {self.users.map((user) => (
          <div key={user.model.id.get()} className="flex items-center gap-2">
            <li>{user.model.name.get()}</li>
            <button onClick={() => self.deleteUser(user.get())}>
              Delete
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
});
