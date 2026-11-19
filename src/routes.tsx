import type { RouteObject } from "react-router";
import App from "./App";
import Home from "./pages/Home";
import Simulator from "./pages/Simulator";
import Staff from "./pages/Staff";

export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "/simulator", element: <Simulator /> },
      { path: "/staff", element: <Staff /> },
      { path: "*", element: <Home /> },
    ],
  },
];
