import axios from "axios";
import type { City, Country } from "./MasterDataModel";

export class MasterDataApi {
  public getCities(countryId: string): Promise<City[]> {
    return axios.get("/api/master-data/cities", {
      params: { countryId },
    });
  }

  public getCountries(): Promise<Country[]> {
    return axios.get("/api/master-data/countries");
  }
}
