import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import Confirmed from "./pages/Confirmed";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import TableMenu from "./pages/TableMenu";
import QrTables from "./pages/QrTables";

function ProtectedRoute({
  children,
}) {
  const token =
    localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Menu />}
        />

        <Route
          path="/mesa/:numero"
          element={<TableMenu />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/payment"
          element={<Payment />}
        />

        <Route
          path="/confirmed"
          element={<Confirmed />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/qr"
          element={<QrTables />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
