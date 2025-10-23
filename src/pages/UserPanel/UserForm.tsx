import { observer } from "@legendapp/state/react";
import type { UserFormCtrl } from "./UserFormCtrl";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";

interface UserFormProps {
  ctrl: UserFormCtrl;
}

export const UserForm = observer(({ ctrl }: UserFormProps) => {
  return (
    <div className="user-form">
      <Input ctrl={ctrl.nameInput} />
      <Input ctrl={ctrl.emailInput} />
      <Input ctrl={ctrl.ageInput} />

      <div className="user-form-actions">
        <Button ctrl={ctrl.cancelButton} />
        <Button ctrl={ctrl.saveButton} />
      </div>
    </div>
  );
});
