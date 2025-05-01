import { useState, useCallback } from "react";
import { Agent } from "../interfaces/AgentInterface";
import {
  useFetchAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
} from "../store";

const AgentManagement = () => {
  const { data: agents = [], isLoading, error } = useFetchAgentsQuery();

  const [createAgent] = useCreateAgentMutation();
  const [updateAgent] = useUpdateAgentMutation();
  const [deleteAgent] = useDeleteAgentMutation();

  const [open, setOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const handleEdit = useCallback((agent: Agent) => {
    setEditingAgent({ ...agent });
    setOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteAgent(id).unwrap();
      } catch (error) {
        console.error("Error deleting agent:", error);
      }
    },
    [deleteAgent]
  );

  const handleSave = useCallback(async () => {
    if (!editingAgent) return;

    try {
      if (editingAgent.id) {
        await updateAgent({
          id: editingAgent.id,
          agent: editingAgent,
        }).unwrap();
      } else {
        await createAgent(editingAgent).unwrap();
      }
      setOpen(false);
      setEditingAgent(null);
    } catch (error) {
      console.error("Error saving agent:", error);
    }
  }, [createAgent, updateAgent, editingAgent]);

  const handleFieldChange = useCallback((field: keyof Agent, value: string) => {
    setEditingAgent((prev) => (prev ? { ...prev, [field]: value } : null));
  }, []);

  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <h1 className="title">Agent Management</h1>
          </div>
          <div className="level-right">
            <button
              className="button is-primary"
              onClick={() => {
                const newAgent = {
                  id: 0,
                  name: "",
                  description: "",
                  role: "",
                  created_at: "",
                  updated_at: "",
                };
                setEditingAgent(newAgent);
                setOpen(true);
              }}
            >
              Add New Agent
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
            Error loading agents: {error.toString()}
          </div>
        ) : (
          <div className="table-container">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>{agent.id}</td>
                    <td>{agent.name}</td>
                    <td>{agent.description}</td>
                    <td>{agent.role}</td>
                    <td>{agent.created_at}</td>
                    <td>{agent.updated_at}</td>
                    <td>
                      <div className="buttons">
                        <button
                          className="button is-small is-primary"
                          onClick={() => handleEdit(agent)}
                        >
                          Edit
                        </button>
                        <button
                          className="button is-small is-danger"
                          onClick={() => handleDelete(agent.id)}
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
              {editingAgent?.id ? "Edit Agent" : "Add New Agent"}
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
                  value={editingAgent?.name || ""}
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
                  value={editingAgent?.description || ""}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Role</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={editingAgent?.role || ""}
                  onChange={(e) => handleFieldChange("role", e.target.value)}
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

export default AgentManagement;
