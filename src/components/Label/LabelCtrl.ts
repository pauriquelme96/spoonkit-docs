import { Ctrl } from "../../lib/Ctrl";
import { state } from "../../lib/signals/State";
import { Label } from "./Label";

export class LabelCtrl extends Ctrl {
  override component = Label;

  text = state<string>("");
}
