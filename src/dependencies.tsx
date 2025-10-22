import { UserApi } from "./domain/User/UserApi";
import { register } from "./lib/provider";

register(UserApi, new UserApi());
