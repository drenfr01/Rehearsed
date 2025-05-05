import { useFetchCurrentScenarioQuery } from "../store";
import { useNavigate } from "react-router-dom";

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
      <div className="container">
        <div className="box">
          <h2 className="title is-2">Scenario Overview</h2>
          <div className="field">
            <label className="label">Scenario Overview</label>
            <div className="control">
              <textarea
                className="textarea is-medium has-fixed-size"
                readOnly
                value={data?.overview}
                rows={10}
                style={{ resize: "none" }}
              />
            </div>
          </div>
          <div className="field">
            <div className="control has-text-centered">
              <button
                className="button is-primary is-large"
                onClick={() => navigate("/agent-simulation")}
              >
                Start Simulation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="section">{content}</div>;
}
