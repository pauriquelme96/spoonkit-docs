import { useCtrl } from "../../lib/useCtrl";
import { UserDetailCtrl } from "./UserDetailCtrl";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";

interface UserDetailProps {
  ctrl: UserDetailCtrl;
}

export function UserDetail({ ctrl }: UserDetailProps) {
  const { self } = useCtrl(ctrl);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>User Detail</h1>
        <button
          onClick={() => self.onClose.next()}
          style={{ cursor: "pointer" }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <Input ctrl={self.nameInput} />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <Input ctrl={self.ageInput} />
        </div>

        <div style={{ marginTop: "20px" }}>
          <Button ctrl={self.saveButton} />
        </div>
      </div>
    </div>
  );
}
