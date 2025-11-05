import { Ctrl } from "../../lib/Ctrl";
import { monitor } from "../../lib/signals/Monitor";
import { state } from "../../lib/signals/State";
import { stateArray } from "../../lib/signals/stateArray";
import { stateObject } from "../../lib/signals/stateObject";
import { UserCityList } from "./UserCityList";

export class ResolveCtrlExampleCtrl extends Ctrl {
  private useModel = stateObject({
    name: state<string>(),
    emails: stateArray(() => state<string>()),
    cities: stateArray(() => state<string>()),
  });

  public userCityList = new UserCityList(this.useModel.cities);

  ctrlStart() {
    // DEFAULT CITY
    this.useModel.cities.set(["Barcelona"]);

    const dispose = monitor(() => {
      // LISTEN FOR CITY CHANGES
      console.log("Cities ", this.useModel.cities.get());
    });

    // UNSUBSCRIBE MONITOR ON DESTROY
    this.onDestroy.subscribe(dispose);
  }
}
