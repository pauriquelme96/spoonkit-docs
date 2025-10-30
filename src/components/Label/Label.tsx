import { useCtrl } from "../../lib/useCtrl";
import type { LabelCtrl } from "./LabelCtrl";

export function Label({ ctrl }: { ctrl: LabelCtrl }) {
  const { self } = useCtrl(ctrl);

  return <span>{self.text.get()}</span>;
}
