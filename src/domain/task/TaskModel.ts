import { computed, type ObservableObject } from "@legendapp/state";
import { state } from "../../lib/signals";

export interface TaskModel {
  id: string;
  description: string;
  completed: boolean;
}

export const createTaskModel = () => state<TaskModel>();

const user = createTaskModel();

const taskValidator = (taskModel: ObservableObject<TaskModel>) =>
  computed(() => {
    const { description, completed } = taskModel.get();

    return {
      description: description.length > 0 && description.length <= 200,
      completed: typeof completed === "boolean",
    };
  });
