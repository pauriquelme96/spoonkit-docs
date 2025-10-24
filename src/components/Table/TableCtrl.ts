import { Ctrl } from "../../lib/Ctrl";
import { State } from "../../lib/signals/State";
import { Table } from "./Table";

interface Column {
  id: string;
  align?: 'center' | 'left' | 'right' | 'inherit';
  label: string;
  minWidth?: string | number;
  sortable?: boolean;
}

type RowModel = {
  [key: string]: Ctrl;
};

interface Row<T> {
  //key: string | number;
  model: RowModel;
  value: T;
}

export abstract class TableCtrl<T> extends Ctrl {
  override component? = Table;

  public abstract columns: State<Column[]>;
  public rows: State<Row<T>[]>;

  public abstract buildRow(item: T, index: number): Row<T>;

  public setData(data: T[]) {
    //this.indexedRows.clear();

    const rows = data?.map((item, i) => {
      //const key = this.rowKeyFn(item);

      const row = {
        value: item,
        model: this.buildRow(item, i),
      };

      //this.indexedRows.set(key, row);
      return row;
    });

    this.rows.set(rows);
  }

}