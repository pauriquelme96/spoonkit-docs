import { Ctrl } from "../../lib/Ctrl";
import { emitter } from "../../lib/signals/Emitter";
import { InputCtrl } from "../../components/Input/InputCtrl";
import type { UserEntity } from "../../domain/User/UserEntity";
import { ButtonCtrl } from "../../components/Button/ButtonCtrl";

export class UserDetailCtrl extends Ctrl {
  public onClose = emitter<void>();

  public nameInput = new InputCtrl<string>().set({
    label: "Name",
    placeholder: "Enter user name",
    type: "text",
    value: this.user.model.name,
  });

  public ageInput = new InputCtrl<number>().set({
    label: "Age",
    placeholder: "Enter user age",
    type: "number",
    value: this.user.model.age,
  });

  public saveButton = new ButtonCtrl().set({
    label: "Save",
    variant: "primary",
    onClick: async () => {
      await this.user.save();
      this.onClose.next();
    },
  });

  constructor(private user: UserEntity) {
    super();
  }
}
