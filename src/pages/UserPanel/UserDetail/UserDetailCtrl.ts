import { Ctrl } from "../../../lib/Ctrl";
import { emitter } from "../../../lib/signals/Emitter";
import { InputCtrl } from "../../../components/Input/InputCtrl";
import type { UserEntity } from "../../../domain/User/UserEntity";
import { ButtonCtrl } from "../../../components/Button/ButtonCtrl";
import { calc } from "../../../lib/signals/Calc";
import { state } from "../../../lib/signals/State";
import { SelectCtrl } from "../../../components/Select/SelectCtrl";
import { MasterDataApi } from "../../../domain/MasterData/MasterDataApi";
import { provide } from "../../../lib/provider";
import { asyncCalc } from "../../../lib/signals/asyncCalc";
import type { Country } from "../../../domain/MasterData/MasterDataModel";

export class UserDetailCtrl extends Ctrl {
  private masterData = provide(MasterDataApi);
  public onClose = emitter<void>();

  private saving = state<boolean>(false);

  public nameInput = new InputCtrl<string>().set({
    label: "Name",
    placeholder: "Enter user name",
    type: "text",
    disabled: this.saving,
    value: this.user.model.name,
    error: this.user.validation.name,
  });

  public ageInput = new InputCtrl<number>().set({
    label: "Age",
    placeholder: "Enter user age",
    type: "number",
    disabled: this.saving,
    value: this.user.model.age,
    error: this.user.validation.age,
  });

  public saveButton = new ButtonCtrl().set({
    label: "Save",
    variant: "primary",
    loading: this.saving,
    disabled: calc(() =>
      Object.values(this.user.validation).some((v) => !!v.get())
    ),
    onClick: async () => {
      this.saving.set(true);
      await this.user.save();
      this.saving.set(false);
      this.onClose.next();
    },
  });

  public countrySelect = new SelectCtrl<Country, string>().set({
    label: "Country",
    placeholder: "Select country",
    labelKey: "name",
    valueKey: "id",
    disabled: this.saving,
    options: asyncCalc(() => this.masterData.getCountries()),
    value: this.user.model.countryId,
  });

  public citySelect = new SelectCtrl<Country, string>().set((_select) => ({
    label: "City",
    placeholder: "Select city",
    labelKey: "name",
    valueKey: "id",
    disabled: this.saving,
    value: this.user.model.cityId,
    options: asyncCalc(async () => {
      // Si cambia el país, limpiar la ciudad seleccionada
      _select.value.set(null);

      // Si no hay país seleccionado, no buscar ciudades
      const countryId = this.countrySelect.value.get();
      if (!countryId) return [];

      // Buscar ciudades para el país seleccionado
      this.citySelect.loading.set(true);
      const cities = await this.masterData.getCities(countryId);
      this.citySelect.loading.set(false);

      return cities;
    }),
  }));

  constructor(private user: UserEntity) {
    super();
  }
}
