import { TaskApi } from "./domain/task/TaskApi";
import { register } from "./lib/provider";

register(TaskApi, new TaskApi());
