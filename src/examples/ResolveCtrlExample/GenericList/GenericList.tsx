import { ResolveCtrl } from "../../../lib/ResolveCtrl";
import { useCtrl } from "../../../lib/useCtrl";
import { GenericListCtrl } from "./GenericListCtrl";

export function GenericList({ ctrl }: { ctrl: GenericListCtrl<any> }) {
  const { self } = useCtrl(ctrl);

  return (
    <div>
      {self.items.get().map((itemCtrl, index) => (
        <div key={itemCtrl.key} className="flex gap-2 items-baseline">
          {/* DYNAMIC RESOLVE OF <Component /> FROM Ctrl*/}
          <ResolveCtrl ctrl={itemCtrl} />
          <button onClick={() => self.onRemoveItem(index)}>Remove</button>
        </div>
      ))}
      <button disabled={self.disableAdd.get()} onClick={() => self.onAddItem()}>
        Add Item
      </button>
    </div>
  );
}
