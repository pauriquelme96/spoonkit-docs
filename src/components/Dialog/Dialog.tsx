import { observer } from "@legendapp/state/react";
import { useCtrl } from "../../lib/useCtrl";
import { DialogCtrl } from "./DialogCtrl";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

interface DialogProps {
  ctrl: DialogCtrl;
  children?: ReactNode;
}

export const Dialog = observer(({ ctrl, children }: DialogProps) => {
  const self = useCtrl(ctrl);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (self.isOpen.get()) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [self.isOpen.get()]);

  const content = self.content.get();

  return (
    <dialog ref={dialogRef} className="dialog">
      <div className="dialog-header">
        <h2 className="dialog-title">{self.title.get()}</h2>
        {self.showCloseButton.get() && (
          <button
            className="dialog-close"
            onClick={() => {
              self.close();
            }}
          >
            ×
          </button>
        )}
      </div>
      <div className="dialog-content">
        {children || (typeof content === "string" ? content : content)}
      </div>
    </dialog>
  );
});
