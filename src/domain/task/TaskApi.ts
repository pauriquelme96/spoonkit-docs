import type { TaskModel } from "./TaskModel";

const taskDb: TaskModel[] = [
  {
    id: "1",
    description: "Complete project documentation",
    completed: false,
  },
  {
    id: "2",
    description: "Review code changes",
    completed: true,
  },
  {
    id: "3",
    description: "Fix bug in authentication",
    completed: false,
  },
];

export class TaskApi {
  public async getTasks(): Promise<TaskModel[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return [...taskDb];
  }

  public async upsertTask(task: TaskModel): Promise<void> {
    const existingIndex = taskDb.findIndex((t) => t.id === task.id);
    if (existingIndex !== -1) {
      return this.updateTask(task.id, task);
    } else {
      return this.createTask(task);
    }
  }

  public async createTask(task: TaskModel): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    taskDb.push(task);
  }

  public async updateTask(
    taskId: string,
    task: Partial<TaskModel>
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = taskDb.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      taskDb[index] = { ...taskDb[index], ...task };
    }
  }

  public async deleteTask(taskId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = taskDb.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      taskDb.splice(index, 1);
    }
  }
}
