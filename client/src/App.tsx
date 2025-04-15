import "bulma/css/bulma.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./pages/Root";
import Simulation from "./pages/Simulation";
import ScenarioIntroduction from "./pages/ScenarioIntroduction";
import ScenarioFeedback from "./pages/ScenarioFeedback";
import ScenarioSelection from "./pages/ScenarioSelection";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
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
        path: "simulation",
        element: <Simulation />,
      },
      {
        path: "scenario-feedback",
        element: <ScenarioFeedback />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
