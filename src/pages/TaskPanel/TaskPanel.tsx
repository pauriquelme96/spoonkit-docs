import { useCtrl } from "../../lib/useCtrl";
import { TaskPanelCtrl } from "./TaskPanelCtrl";

export function TaskPanel() {
  const self = useCtrl(TaskPanelCtrl);

  return <div>{self.title.get()}</div>;
}
