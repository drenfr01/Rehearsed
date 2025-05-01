import { useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Agent } from "../interfaces/AgentInterface";
import {
  useFetchAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
} from "../store";

const AgentManagement = () => {
  const { data: agents = [], isLoading, error } = useFetchAgentsQuery();

  console.log("Agents data:", agents);
  console.log("Loading state:", isLoading);
  console.log("Error state:", error);

  const [createAgent] = useCreateAgentMutation();
  const [updateAgent] = useUpdateAgentMutation();
  const [deleteAgent] = useDeleteAgentMutation();

  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAgent(id).unwrap();
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  const handleSave = async (agent: Agent) => {
    try {
      if (agent.id) {
        await updateAgent({ id: agent.id, agent }).unwrap();
      } else {
        await createAgent(agent).unwrap();
      }
      setOpen(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error("Error saving agent:", error);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Name", width: 130, editable: true },
    {
      field: "description",
      headerName: "Description",
      width: 200,
      editable: true,
    },
    { field: "role", headerName: "Role", width: 130, editable: true },
    { field: "created_at", headerName: "Created At", width: 180 },
    { field: "updated_at", headerName: "Updated At", width: 180 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params: { row: Agent }) => (
        <Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEdit(params.row)}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 400, width: "100%", p: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          setSelectedAgent({
            id: 0,
            name: "",
            description: "",
            role: "",
            created_at: "",
            updated_at: "",
          });
          setOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Add New Agent
      </Button>

      <DataGrid
        rows={agents}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5 },
          },
        }}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
        loading={isLoading}
      />

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {selectedAgent?.id ? "Edit Agent" : "Add New Agent"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={selectedAgent?.name || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSelectedAgent({ ...selectedAgent!, name: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={selectedAgent?.description || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSelectedAgent({
                ...selectedAgent!,
                description: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="Role"
            fullWidth
            value={selectedAgent?.role || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSelectedAgent({ ...selectedAgent!, role: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => handleSave(selectedAgent!)}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentManagement;
