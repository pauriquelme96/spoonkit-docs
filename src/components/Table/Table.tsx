import { useMemo } from "react";
import { useCtrl } from "../../lib/useCtrl";
import type { TableCtrl } from "./TableCtrl";

export function Table({ ctrl }: { ctrl: TableCtrl<any> }) {
  const { self } = useCtrl(ctrl);

  const columns = self.columns.get();
  const gridTemplateColumns = useMemo(
    () => columns.map((column) => column.width || "auto").join(" "),
    [columns]
  );

  return (
    <table style={{ display: "grid", gridTemplateColumns }}>
      <thead style={{ display: "contents" }}>
        <tr style={{ display: "contents" }}>
          {columns.map((column) => (
            <th key={column.id}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody style={{ display: "contents" }}>
        {self.rows?.get().map((row, rowIndex) => (
          <tr key={row.key} style={{ display: "contents" }}>
            {columns.map((column) => {
              const CellCtrl = row.model[column.id]?.component;

              return (
                <td
                  key={column.id}
                  style={{
                    backgroundColor:
                      rowIndex % 2 === 1 ? "#161f27" : "transparent",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <CellCtrl ctrl={row.model[column.id]} />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
