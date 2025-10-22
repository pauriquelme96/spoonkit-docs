import { provide } from "../../lib/provider";
import { monitor } from "../../lib/signals";
import { TaskApi } from "./TaskApi";
import { createTaskModel, type TaskModel } from "./TaskModel";

export class TaskEntity {
  private api = provide(TaskApi);
  public model = createTaskModel();

  constructor(task: TaskModel) {
    this.model.set(task);
  }

  public async save() {
    await this.api.upsertTask(this.model.get());
  }

  public async delete() {
    await this.api.deleteTask(this.model.id.get());
    this.model.delete();
  }
}

const taskEntityCache = new Map<string, TaskEntity>();
export function toTaskEntity(data: TaskModel): TaskEntity {
  const cached = taskEntityCache.get(data.id);
  if (cached) {
    cached.model.set(data);
    return cached;
  }

  const entity = new TaskEntity(data);
  taskEntityCache.set(data.id, entity);

  const dispose = monitor(() => {
    const modelExists = entity.model.get();

    if (!modelExists) {
      taskEntityCache.delete(data.id);
      dispose();
    }
  });

  return entity;
}
