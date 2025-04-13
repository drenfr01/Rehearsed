from server.models.scenario_data import ScenarioData
import yaml


# TODO: Move to ORM layer
def load_scenario_data(
    file_path: str = "orm/temp_scenario_data.yaml",
    scenario_id: str = "scenario_1",
) -> ScenarioData:
    """Temporary function that loads yaml files, eventually will be a DB call

    Args:
        scenario_name: The name of the scenario to load

    Returns:
        The specific scenario dict
    """
    with open(file_path, "r") as f:
        data = yaml.safe_load(f)
    return ScenarioData(**data[scenario_id])


class ScenarioService:
    def __init__(self, default_scenario_id: str = "scenario_1"):
        self.scenario_data = load_scenario_data()
        self.scenario_id = default_scenario_id

    def list_scenarios(self) -> list[str]:
        """
        Returns a list of all scenario ids
        """
        return list(self.scenario_data.keys())

    def get_scenario_data(self) -> ScenarioData:
        """
        Returns the scenario data for the currently set scenario

        Returns:
            The scenario data for the current scenario
        """
        return self.scenario_data

    def set_scenario_data(self, scenario_id: str) -> None:
        """
        Sets the scenario data for the currently set scenario

        Args:
            scenario_id: The id of the scenario to set
        """
        self.scenario_data = self.scenario_data[scenario_id]
