import { MasterDataApi } from "./domain/MasterData/MasterDataApi";
import { UserApi } from "./domain/User/UserApi";
import { register } from "./lib/provider";

register(UserApi, new UserApi());
register(MasterDataApi, new MasterDataApi());
