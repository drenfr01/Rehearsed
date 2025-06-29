import { useFetchCurrentScenarioQuery } from "../store";
import { useNavigate } from "react-router-dom";
import "./ScenarioIntroduction.css";

export default function ScenarioIntroduction() {
  const navigate = useNavigate();
  const { data, error, isLoading } = useFetchCurrentScenarioQuery();

  let content;
  if (isLoading) {
    content = <div className="notification is-info">Loading...</div>;
  } else if (error) {
    content = (
      <div className="notification is-danger">Error loading scenario</div>
    );
  } else {
    content = (
      <div>
        <div className="has-text-centered mb-2">
          <button
            className="button is-primary is-normal"
            onClick={() => navigate("/agent-simulation")}
          >
            Start Simulation
          </button>
        </div>
        <div className="container is-fluid">
          <div className="box">
            <div className="field">
              <label className="label">Scenario Introduction</label>
              <div className="control">
                <textarea
                  className="textarea is-normal has-fixed-size hide-scrollbar"
                  readOnly
                  value={data?.overview}
                  rows={20}
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
