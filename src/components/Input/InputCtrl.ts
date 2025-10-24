import { Ctrl } from "../../lib/Ctrl";
import { emitter } from "../../lib/signals/Emitter";
import { state } from "../../lib/signals/State";
import { Input } from "./Input";

export class InputCtrl<T> extends Ctrl {
  override component? = Input;

  public label = state<string>("");
  public value = state<T>();
  public placeholder = state<string>("");
  public type = state<string>("text");
  public disabled = state<boolean>(false);
  public error = state<string>("");

  public onChange = emitter<string>();
}
