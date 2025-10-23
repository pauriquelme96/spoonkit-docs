import { Ctrl } from "../../lib/Ctrl";
import { emitter } from "../../lib/Emitter";
import { state } from "../../lib/signals";

export class InputCtrl extends Ctrl {
  public label = state<string>("");
  public value = state<string>("");
  public placeholder = state<string>("");
  public type = state<string>("text");
  public disabled = state<boolean>(false);
  public error = state<string>("");

  public onChange = emitter<string>();
}
