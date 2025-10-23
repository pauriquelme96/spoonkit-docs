import { Ctrl } from "../../lib/Ctrl";
import { UserEntity } from "../../domain/User/UserEntity";
import { InputCtrl } from "../../components/Input/InputCtrl";
import { ButtonCtrl } from "../../components/Button/ButtonCtrl";
import { emitter } from "../../lib/Emitter";

export class UserFormCtrl extends Ctrl {
  public nameInput = new InputCtrl().set({
    label: "Nombre",
    placeholder: "Ingrese el nombre",
  });

  public emailInput = new InputCtrl().set({
    label: "Email",
    type: "email",
    placeholder: "Ingrese el email",
  });

  public ageInput = new InputCtrl().set(() => ({
    label: "Edad",
    type: "number",
    placeholder: "Ingrese la edad",
    //value: this.user.model.age.get(),
  }));

  public saveButton = new ButtonCtrl().set({
    label: "Guardar",
    variant: "primary",
  });

  public cancelButton = new ButtonCtrl().set({
    label: "Cancelar",
    variant: "secondary",
  });

  public onSave = emitter<void>();
  public onCancel = emitter<void>();

  constructor(private user: UserEntity) {
    super();

    // Establecer valores iniciales desde el modelo
    this.nameInput.value.set(user.model.name.get());
    this.emailInput.value.set(user.model.email.get());
    this.ageInput.value.set(user.model.age.get().toString());

    // Configurar eventos de botones
    this.saveButton.onClick.subscribe(() => this.handleSave());
    this.cancelButton.onClick.subscribe(() => this.onCancel.next());

    // Sincronizar cambios en los inputs con el modelo
    this.nameInput.onChange.subscribe((value) => {
      this.user.model.name.set(value);
    });

    this.emailInput.onChange.subscribe((value) => {
      this.user.model.email.set(value);
    });

    this.ageInput.onChange.subscribe((value) => {
      const age = parseInt(value, 10);
      if (!isNaN(age)) {
        this.user.model.age.set(age);
      }
    });
  }

  private async handleSave() {
    try {
      this.saveButton.loading.set(true);
      await this.user.save();
      this.onSave.next();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      // Aquí podrías manejar el error mostrándolo en el formulario
    } finally {
      this.saveButton.loading.set(false);
    }
  }
}
