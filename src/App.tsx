import "./App.css";
import "./dependencies";
import { UserPanel } from "./pages/UserPanel/UserPanel";
import axios from "axios";

axios.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
);

function App() {
  return <UserPanel />;
}

export default App;
