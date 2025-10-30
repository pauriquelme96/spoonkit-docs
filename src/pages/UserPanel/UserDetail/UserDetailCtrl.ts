import { Ctrl } from "../../../lib/Ctrl";
import { emitter } from "../../../lib/signals/Emitter";
import { InputCtrl } from "../../../components/Input/InputCtrl";
import type { UserEntity } from "../../../domain/User/UserEntity";
import { ButtonCtrl } from "../../../components/Button/ButtonCtrl";
import { calc } from "../../../lib/signals/Calc";
import { state } from "../../../lib/signals/State";

export class UserDetailCtrl extends Ctrl {
  public onClose = emitter<void>();

  private saving = state<boolean>(false);

  public nameInput = new InputCtrl<string>().set({
    label: "Name",
    placeholder: "Enter user name",
    type: "text",
    disabled: this.saving,
    value: this.user.model.name,
    error: this.user.validation.name,
  });

  public ageInput = new InputCtrl<number>().set({
    label: "Age",
    placeholder: "Enter user age",
    type: "number",
    disabled: this.saving,
    value: this.user.model.age,
    error: this.user.validation.age,
  });

  public saveButton = new ButtonCtrl().set({
    label: "Save",
    variant: "primary",
    loading: this.saving,
    disabled: calc(() =>
      Object.values(this.user.validation).some((v) => !!v.get())
    ),
    onClick: async () => {
      this.saving.set(true);
      await this.user.save();
      this.saving.set(false);
      this.onClose.next();
    },
  });

  constructor(private user: UserEntity) {
    super();
  }
}
