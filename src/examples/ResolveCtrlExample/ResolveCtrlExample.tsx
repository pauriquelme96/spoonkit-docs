import { useCtrl } from "../../lib/useCtrl";
import { GenericList } from "./GenericList/GenericList";
import { ResolveCtrlExampleCtrl } from "./ResolveCtrlExampleCtrl";

export function ResolveCtrlExample() {
  const { self } = useCtrl(ResolveCtrlExampleCtrl);

  return (
    <div>
      User Cities:
      <GenericList ctrl={self.userCityList} />
    </div>
  );
}
