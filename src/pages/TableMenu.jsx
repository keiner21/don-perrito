import { useParams } from "react-router-dom";
import Menu from "./Menu";

export default function TableMenu() {
  const { numero } = useParams();
  localStorage.setItem("mesa", numero);
  return <Menu />;
}
