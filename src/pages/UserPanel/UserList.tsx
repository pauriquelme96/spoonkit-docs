import { UserListCtrl } from "./UserListCtrl";
import { useCtrl } from "../../lib/useCtrl";

interface UserListProps {
  ctrl: UserListCtrl;
}

export function UserList({ ctrl }: UserListProps) {
  const { self } = useCtrl(ctrl);

  return (
    <div className="grid grid-cols-[1fr_auto] gap-10">
      <div>
        <div className="flex items-center ">
          <h1>{self.title.get()}</h1>
          <button>Agregar Usuario</button>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: "40px" }}>ID</th>
              <th style={{ width: "150px" }}>Nombre</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {self.users.get().map((user) => (
              <tr
                key={user.model.id.get()}
                onClick={() => self.openUserDetail(user)}
                style={{ cursor: "pointer" }}
              >
                <td>{user.model.id.get()}</td>
                <td>{user.model.name.get()}</td>
                <td>{user.model.email.get()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
