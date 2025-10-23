import { observer } from "@legendapp/state/react";
import { UserListCtrl } from "./UserListCtrl";
import { useCtrl } from "../../lib/useCtrl";


export const UserList = observer(() => {
  const self = useCtrl(UserListCtrl);

  return (
    <div>
      <h1>{self.title.get()}</h1>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Edad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {self.users.get().map((user) => (
            <tr key={user.model.id.get()}>
              <td>{user.model.id.get()}</td>
              <td>{user.model.name.get()}</td>
              <td>{user.model.email.get()}</td>
              <td>{user.model.age.get()}</td>
              <td>
                <button onClick={() => self.openUserInfo(user)}>Info</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
