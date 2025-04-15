import { useState } from "react";
import { useFetchScenariosQuery, useSetScenarioMutation } from "../store";

interface Scenario {
  name: string;
  description: string;
  overview: string;
  initial_prompt: string;
  system_instructions: string;
}

interface ScenariosResponse {
  scenarios: Record<string, Scenario>;
}

export default function ScenarioSelection() {
  const [selectedScenario, setSelectedScenario] = useState("");
  const [description, setDescription] = useState("");
  const [setScenario] = useSetScenarioMutation();
  const { data, error, isFetching } = useFetchScenariosQuery("");

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scenarioId = e.target.value;
    setSelectedScenario(scenarioId);
    if (scenarioId && data?.scenarios) {
      setDescription(data.scenarios[scenarioId].description);
    } else {
      setDescription("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScenario) {
      setScenario(selectedScenario);
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
    const scenarios = (data as ScenariosResponse)?.scenarios || {};
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
                <option value="">Choose a scenario</option>
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
              value={description}
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
