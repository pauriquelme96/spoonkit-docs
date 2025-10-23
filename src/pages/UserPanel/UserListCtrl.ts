import { UserApi } from "../../domain/User/UserApi";
import { UserEntity } from "../../domain/User/UserEntity";
import { Ctrl } from "../../lib/Ctrl";
import { provide } from "../../lib/provider";
import { state } from "../../lib/signals";
import { DialogCtrl } from "../../components/Dialog/DialogCtrl";
import { UserFormCtrl } from "./UserFormCtrl";

export class UserListCtrl extends Ctrl {
  private api = provide(UserApi);
  public title = state("User Panel");
  public users = state<UserEntity[]>([]);
  public searching = state(false);

  public dialog = new DialogCtrl();
  public currentUserForm: UserFormCtrl | null = null;

  ctrlStart() {
    this.fetchTasks();
  }

  public openUserInfo(user: UserEntity) {
    // Crear un nuevo formulario con el usuario seleccionado
    const userForm = new UserFormCtrl(user);

    // Suscribirse a los eventos del formulario
    userForm.onSave.subscribe(() => {
      this.dialog.close();
      this.fetchTasks(); // Recargar la lista después de guardar
    });

    userForm.onCancel.subscribe(() => {
      this.dialog.close();
    });

    // Configurar el diálogo
    this.dialog.title.set("Información del Usuario");
    this.currentUserForm = userForm;
    this.dialog.open();
  }

  public async fetchTasks() {
    this.title.set("Loading...");
    const users = await this.api.getUsers();
    this.users.set(users.map((user) => new UserEntity(user)));
    this.title.set("User Panel");
  }
}
