import { Ctrl } from "../../lib/Ctrl";
import { emitter } from "../../lib/Emitter";
import { state } from "../../lib/signals";

export class DialogCtrl extends Ctrl {
  public title = state<string>("");
  public content = state<any>(null);
  public isOpen = state<boolean>(false);
  public showCloseButton = state<boolean>(true);

  public onClose = emitter<void>();
  public onConfirm = emitter<void>();

  public open() {
    this.isOpen.set(true);
  }

  public close() {
    this.isOpen.set(false);
    this.onClose.next();
  }
}
