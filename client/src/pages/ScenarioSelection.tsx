import { useState } from "react";
import { useFetchScenariosQuery, useSetScenarioMutation } from "../store";
import { useNavigate } from "react-router-dom";
import { Scenario } from "../interfaces/ScenarioInterface";

export default function ScenarioSelection() {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [setScenario] = useSetScenarioMutation();
  const { data, error, isFetching } = useFetchScenariosQuery("");
  const navigate = useNavigate();

  let scenarios: Scenario[] = [];

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scenarioId = parseInt(e.target.value);
    setSelectedScenario(scenarioId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScenario(scenarios[selectedScenario].id.toString());
    navigate(`/scenario-introduction`);
  };

  let content;
  if (isFetching) {
    content = <div>Loading...</div>;
  } else if (error) {
    content = <div>Error: {error.toString()}</div>;
  } else {
    scenarios = (data as [Scenario]) || [];
    content = (
      <div>
        <div className="has-text-centered mb-2">
          <button
            type="submit"
            className="button is-primary is-normal"
            onClick={handleSubmit}
          >
            Select Scenario
          </button>
        </div>
        <div className="container is-fluid">
          <div className="box">
            <div className="field">
              <label className="label">Select a Scenario</label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    name="selectedScenario"
                    value={selectedScenario}
                    onChange={handleScenarioChange}
                  >
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
                  className="textarea is-normal has-fixed-size hide-scrollbar"
                  name="description"
                  value={scenarios[selectedScenario]?.description || ""}
                  readOnly
                  placeholder="Scenario description will appear here..."
                  style={{ resize: "none" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="section">{content}</div>;
}
