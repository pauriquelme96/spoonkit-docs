import type { TaskModel } from "./TaskModel";

export class TaskApi {
  public async getTasks(): Promise<TaskModel[]> {
    return [];
  }

  public async createTask(task: TaskModel): Promise<void> {}

  public async updateTask(
    taskId: string,
    task: Partial<TaskModel>
  ): Promise<void> {}
}
