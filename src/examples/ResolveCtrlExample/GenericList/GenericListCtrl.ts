import { Ctrl } from "../../../lib/Ctrl";
import { monitor } from "../../../lib/signals/Monitor";
import { state, type State } from "../../../lib/signals/State";
import { stateArray, StateArray } from "../../../lib/signals/stateArray";
import { GenericList } from "./GenericList";

export abstract class GenericListCtrl<T extends State> extends Ctrl {
  component = GenericList;

  public items = stateArray(() => state<Ctrl>());
  public disableAdd = state<boolean>(false);

  public abstract onAddItem(): void;
  public abstract onRemoveItem(index: number): void;
  public abstract buildItem(item: T): Ctrl;

  constructor(protected list: StateArray<T>) {
    super();
    const map = new Map<T, Ctrl>();

    monitor(() => {
      const items = this.list.toArray();

      const mappedItems = items.map((item) => {
        if (map.has(item)) return map.get(item);
        const ctrl = this.buildItem(item);
        map.set(item, ctrl);
        return ctrl;
      });

      this.items.set(mappedItems);
    });
  }
}
