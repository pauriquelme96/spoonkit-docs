import type { ComponentType } from "react";
import { Ctrl } from "./Ctrl";

export function ResolveCtrl<T extends Ctrl>({ ctrl }: { ctrl: T }) {
  if (!(ctrl instanceof Ctrl)) {
    throw new Error("Ctrl instance expected");
  }

  if (!(ctrl.component instanceof Function)) {
    throw new Error("Ctrl must have a component assigned");
  }

  const Component = ctrl.component as ComponentType<{ ctrl: T }>;

  return <Component ctrl={ctrl} />;
}
