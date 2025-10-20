import { state } from "../../lib/signals";

export interface TaskModel {
  id: string;
  description: string;
  completed: boolean;
}

export const createTaskModel = () => state<TaskModel>();
