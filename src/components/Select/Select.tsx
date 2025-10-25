import { useCtrl } from "../../lib/useCtrl";
import { SelectCtrl } from "./SelectCtrl";

export function Select({ ctrl }: { ctrl: SelectCtrl<any, any> }) {
  const { self } = useCtrl(ctrl);

  const getCurrentIndex = () => {
    const currentValue = self.value.get();
    const options = self.options.get();
    const valueKey = self.valueKey.get();
    const index = options?.findIndex((opt) => opt[valueKey] === currentValue);
    return index === -1 ? "" : String(index);
  };

  return (
    <div className="select-wrapper">
      {self.label.get() && (
        <label className="select-label">{self.label.get()}</label>
      )}
      <select
        className={`select ${self.error.get() ? "select-error" : ""}`}
        value={getCurrentIndex()}
        disabled={self.disabled.get()}
        onChange={(e) => {
          const index = parseInt(e.target.value, 10);
          const selectedOption = self.options.get()[index];
          const valueKey = self.valueKey.get();
          if (selectedOption) {
            self.value.set(selectedOption[valueKey]);
            self.onChange.next(selectedOption[valueKey]);
          }
        }}
      >
        <option value="" disabled>
          {self.placeholder.get()}
        </option>
        {self.options.get()?.map((option, index) => {
          const labelKey = self.labelKey.get();
          return (
            <option key={index} value={String(index)}>
              {option[labelKey]}
            </option>
          );
        })}
      </select>
      {self.error.get() && (
        <span className="select-error-message">{self.error.get()}</span>
      )}
    </div>
  );
}
