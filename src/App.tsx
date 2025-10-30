import "./App.css";
import "./dependencies";
import axios from "axios";
import { UserPanel } from "./pages/UserPanel/UserPanel";

axios.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
);

function App() {
  return <UserPanel />;
  //return <div>Hello World!</div>;
}

export default App;
