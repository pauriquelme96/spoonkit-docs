export interface Country {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
}
