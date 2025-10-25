import { Ctrl } from "../../lib/Ctrl";
import { emitter } from "../../lib/signals/Emitter";
import { state } from "../../lib/signals/State";

export class SelectCtrl<T, V> extends Ctrl {
  public label = state<string>("");
  public value = state<V>();
  public options = state<T[]>([]);
  public labelKey = state<keyof T>(null);
  public valueKey = state<keyof T>(null);
  public placeholder = state<string>("Selecciona una opción");
  public disabled = state<boolean>(false);
  public error = state<string>("");
  public onChange = emitter<V>();
}
