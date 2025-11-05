import { SelectCtrl } from "../../components/Select/SelectCtrl";
import { MasterDataApi } from "../../domain/MasterData/MasterDataApi";
import type { City } from "../../domain/MasterData/MasterDataModel";
import type { Ctrl } from "../../lib/Ctrl";
import { provide } from "../../lib/provider";
import { asyncCalc } from "../../lib/signals/asyncCalc";
import { calc } from "../../lib/signals/Calc";
import type { State } from "../../lib/signals/State";
import type { StateArray } from "../../lib/signals/stateArray";
import { GenericListCtrl } from "./GenericList/GenericListCtrl";

export class UserCityList extends GenericListCtrl<State<string>> {
  private masterDataApi = provide(MasterDataApi);
  private citiesReq = this.masterDataApi.getCities("1");

  constructor(cities: StateArray<State<string>>) {
    super(cities);
    this.disableAdd.set(calc(() => cities.get().length >= 5));
  }

  public buildItem(city: State<string>): Ctrl {
    return new SelectCtrl<City, string>().set({
      value: city,
      labelKey: "name",
      valueKey: "name",
      options: asyncCalc(async () => {
        const currentCities = this.list.get();
        const selectedCity = city.get();

        const cities = await this.citiesReq;

        return cities.filter(
          (c) => selectedCity === c.name || !currentCities.includes(c.name)
        );
      }),
    });
  }

  public onAddItem(): void {
    this.list.push(null);
  }

  public onRemoveItem(index: number): void {
    this.list.removeAt(index);
  }
}
