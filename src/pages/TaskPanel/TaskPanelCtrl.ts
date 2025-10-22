import { TaskApi } from "../../domain/task/TaskApi";
import { Ctrl } from "../../lib/Ctrl";
import { provide } from "../../lib/provider";
import { monitor, state } from "../../lib/signals";
import { TaskEntity, toTaskEntity } from "../../domain/task/TaskEntity";

export class TaskPanelCtrl extends Ctrl {
  private api = provide(TaskApi);
  public title = state("Task Panel");
  public tasks = state<TaskEntity[]>([]);

  ctrlStart() {
    this.fetchTasks();

    monitor(() => {
      this.tasks
        .filter((task) => !task.model.id.get())
        .forEach((task) => {
          task.delete();
        });
    });
  }

  public async deleteTask(task: TaskEntity) {
    await task.delete();
    //this.fetchTasks();
  }

  public async fetchTasks() {
    const tasks = await this.api.getTasks();
    this.tasks.set(tasks.map(toTaskEntity));
  }
}
