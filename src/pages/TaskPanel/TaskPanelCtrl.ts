import { Ctrl } from "../../lib/Ctrl";
import { state } from "../../lib/signals";

export class TaskPanelCtrl extends Ctrl {
  public title = state("Task Panel!");
}
