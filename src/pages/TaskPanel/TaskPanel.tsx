import { observer } from "@legendapp/state/react";
import { TaskPanelCtrl } from "./TaskPanelCtrl";
import { useCtrl } from "../../lib/useCtrl";

export const TaskPanel = observer(() => {
  const self = useCtrl(TaskPanelCtrl);

  return (
    <div>
      <h2>{self.title.get()}</h2>
      <ul>
        {self.tasks.map((task) => (
          <div key={task.model.id.get()} className="flex items-center gap-2">
            <li>{task.model.description.get()}</li>
            <button onClick={() => self.deleteTask(task.get())}>
              Complete
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
});
