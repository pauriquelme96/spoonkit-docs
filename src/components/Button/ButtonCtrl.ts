import { Ctrl } from "../../lib/Ctrl";
import { emitter } from "../../lib/signals/Emitter";
import { state } from "../../lib/signals/State";
import { Button } from "./Button";

export class ButtonCtrl extends Ctrl {
  component = Button;
  public label = state<string>("");
  public disabled = state<boolean>(false);
  public variant = state<"primary" | "secondary" | "danger">("primary");
  public loading = state<boolean>(false);
  public onClick = emitter<void>();
}
