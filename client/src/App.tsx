import "bulma/css/bulma.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./pages/Root";
import AgentSimulation from "./pages/AgentSimulation";
import ScenarioIntroduction from "./pages/ScenarioIntroduction";
import ScenarioFeedback from "./pages/ScenarioFeedback";
import ScenarioSelection from "./pages/ScenarioSelection";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

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
