import { Ctrl } from "../../lib/Ctrl";
import { state, State } from "../../lib/signals/State";
import { Table } from "./Table";

interface Column {
  id: string;
  label: string;
  width?: string | number;
}

export type RowModel = {
  [key: string]: Ctrl;
};

export interface Row<T> {
  key: string | number;
  model: RowModel;
  value: T;
}

export abstract class TableCtrl<T> extends Ctrl {
  override component = Table;

  public abstract columns: State<Column[]>;
  public rows = state<Row<T>[]>([]);

  public abstract buildRow(item: T, index: number): RowModel;
  public abstract rowKeyFn(item: T): string | number;

  public setData(data: T[]) {
    this.rows.set([]);

    // TODO: This is a hack to force re-render in case of update with same keys
    // Find a better way to do this
    setTimeout(() => {
      const rows = data?.map((item, i) => {
        const key = this.rowKeyFn(item);

        return {
          key,
          value: item,
          model: this.buildRow(item, i),
        };
      });

      this.rows.set(rows || []);
    }, 1);
  }
}
