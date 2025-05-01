import { useState } from "react";
import { useFetchScenariosQuery, useSetScenarioMutation } from "../store";
import { useNavigate } from "react-router-dom";

interface Scenario {
  name: string;
  description: string;
  overview: string;
  initial_prompt: string;
  system_instructions: string;
}

export default function ScenarioSelection() {
  const [selectedScenario, setSelectedScenario] = useState(-1);
  const [setScenario] = useSetScenarioMutation();
  const { data, error, isFetching } = useFetchScenariosQuery("");
  const navigate = useNavigate();

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scenarioId = parseInt(e.target.value);
    setSelectedScenario(scenarioId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScenario) {
      setScenario(selectedScenario.toString());
      navigate(`/scenario-introduction`);
    } else {
      console.error("No scenario selected");
    }
  };

  let content;
  if (isFetching) {
    content = <div>Loading...</div>;
  } else if (error) {
    content = <div>Error: {error.toString()}</div>;
  } else {
    const scenarios = (data as [Scenario]) || [];
    content = (
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Select a Scenario</label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                name="selectedScenario"
                value={selectedScenario}
                onChange={handleScenarioChange}
              >
                <option value="-1">Choose a scenario</option>
                {Object.entries(scenarios).map(([id, scenario]) => (
                  <option key={id} value={id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label">Description</label>
          <div className="control">
            <textarea
              className="textarea"
              name="description"
              value={scenarios[selectedScenario]?.description || ""}
              readOnly
              placeholder="Scenario description will appear here..."
            />
          </div>
        </div>

        <div className="field">
          <div className="control">
            <button
              type="submit"
              className="button is-primary"
              disabled={!selectedScenario}
            >
              Submit Scenario
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="container mt-5">
      <div className="box">
        <h2 className="title is-2">Scenario Selection</h2>
        {content}
      </div>
    </div>
  );
}
