import { useState, useCallback } from "react";
import { Scenario } from "../interfaces/ScenarioInterface";
import {
  useFetchScenariosQuery,
  useCreateScenarioMutation,
  useUpdateScenarioMutation,
  useDeleteScenarioMutation,
} from "../store/apis/scenariosCrudAPI";

const ScenarioManagement = () => {
  const { data: scenarios = [], isLoading, error } = useFetchScenariosQuery();

  const [createScenario] = useCreateScenarioMutation();
  const [updateScenario] = useUpdateScenarioMutation();
  const [deleteScenario] = useDeleteScenarioMutation();

  const [open, setOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

  const handleEdit = useCallback((scenario: Scenario) => {
    setEditingScenario({ ...scenario });
    setOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteScenario(id).unwrap();
      } catch (error) {
        console.error("Error deleting scenario:", error);
      }
    },
    [deleteScenario]
  );

  const handleSave = useCallback(async () => {
    if (!editingScenario) return;

    try {
      if (editingScenario.id) {
        await updateScenario({
          id: editingScenario.id,
          scenario: editingScenario,
        }).unwrap();
      } else {
        await createScenario(editingScenario).unwrap();
      }
      setOpen(false);
      setEditingScenario(null);
    } catch (error) {
      console.error("Error saving scenario:", error);
    }
  }, [createScenario, updateScenario, editingScenario]);

  const handleFieldChange = useCallback(
    (field: keyof Scenario, value: string) => {
      setEditingScenario((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    []
  );

  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <h1 className="title">Scenario Management</h1>
          </div>
          <div className="level-right">
            <button
              className="button is-primary"
              onClick={() => {
                const newScenario = {
                  name: "",
                  description: "",
                  overview: "",
                  initial_prompt: "",
                  system_instructions: "",
                };
                setEditingScenario(newScenario);
                setOpen(true);
              }}
            >
              Add New Scenario
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="has-text-centered">
            <span className="icon is-large">
              <i className="fas fa-spinner fa-pulse fa-2x"></i>
            </span>
          </div>
        ) : error ? (
          <div className="notification is-danger">
            Error loading scenarios: {error.toString()}
          </div>
        ) : (
          <div className="table-container">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Overview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => (
                  <tr key={scenario.id}>
                    <td>{scenario.name}</td>
                    <td>{scenario.description}</td>
                    <td>{scenario.overview}</td>
                    <td>
                      <div className="buttons">
                        <button
                          className="button is-small is-primary"
                          onClick={() => handleEdit(scenario)}
                        >
                          Edit
                        </button>
                        <button
                          className="button is-small is-danger"
                          onClick={() => handleDelete(scenario.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`modal ${open ? "is-active" : ""}`}>
        <div className="modal-background" onClick={() => setOpen(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">
              {editingScenario?.id ? "Edit Scenario" : "Add New Scenario"}
            </p>
            <button
              className="delete"
              aria-label="close"
              onClick={() => setOpen(false)}
            ></button>
          </header>
          <section className="modal-card-body">
            <div className="field">
              <label className="label">Name</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={editingScenario?.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Description</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={editingScenario?.description || ""}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Overview</label>
              <div className="control">
                <textarea
                  className="textarea"
                  value={editingScenario?.overview || ""}
                  onChange={(e) =>
                    handleFieldChange("overview", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Initial Prompt</label>
              <div className="control">
                <textarea
                  className="textarea"
                  value={editingScenario?.initial_prompt || ""}
                  onChange={(e) =>
                    handleFieldChange("initial_prompt", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="field">
              <label className="label">System Instructions</label>
              <div className="control">
                <textarea
                  className="textarea"
                  value={editingScenario?.system_instructions || ""}
                  onChange={(e) =>
                    handleFieldChange("system_instructions", e.target.value)
                  }
                />
              </div>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button className="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="button is-primary" onClick={handleSave}>
              Save
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ScenarioManagement;
