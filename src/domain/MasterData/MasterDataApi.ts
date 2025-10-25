import axios from "axios";
import type { City, Country } from "./MasterDataModel";

export class MasterDataApi {
  public getCities(country: string): Promise<City[]> {
    return axios.get("/api/master-data/cities", {
      params: { country },
    });
  }

  public getCountries(): Promise<Country[]> {
    return axios.get("/api/master-data/countries");
  }
}
