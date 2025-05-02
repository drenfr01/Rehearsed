import "bulma/css/bulma.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./pages/Root";
import AgentSimulation from "./pages/AgentSimulation";
import ScenarioIntroduction from "./pages/ScenarioIntroduction";
import ScenarioFeedback from "./pages/ScenarioFeedback";
import ScenarioSelection from "./pages/ScenarioSelection";
import Login from "./pages/Login";
import AgentManagement from "./pages/AgentManagement";
import ScenarioManagement from "./pages/ScenarioManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ScenarioSelection />,
      },
      {
        path: "scenario-introduction",
        element: <ScenarioIntroduction />,
      },
      {
        path: "agent-simulation",
        element: <AgentSimulation />,
      },
      {
        path: "scenario-feedback",
        element: <ScenarioFeedback />,
      },
      {
        path: "admin/agents",
        element: (
          <AdminRoute>
            <AgentManagement />
          </AdminRoute>
        ),
      },
      {
        path: "admin/scenarios",
        element: (
          <AdminRoute>
            <ScenarioManagement />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
