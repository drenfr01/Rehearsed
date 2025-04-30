import yaml

from server.models.scenario_data import ScenarioData, ScenarioDataList


# TODO: Move to ORM layer, eventually this will be DB call
def load_scenario_data(
    file_path: str = "orm/temp_scenario_data.yaml",
    scenario_id: str = "scenario_1",
) -> dict[str, ScenarioData]:
    """Temporary function that loads yaml files, eventually will be a DB call

    Args:
        scenario_name: The name of the scenario to load

    Returns:
        The specific scenario dict
    """
    with open(file_path, "r") as f:
        data = yaml.safe_load(f)
    return data


class ScenarioService:
    def __init__(self, default_scenario_id: str = "scenario_1"):
        self.data = load_scenario_data()
        self.current_scenario_data = ScenarioData(**self.data[default_scenario_id])
        self.scenario_id = default_scenario_id

    def get_all_scenario_data(self) -> ScenarioDataList:
        """
        Returns a list of all scenario ids
        """
        return ScenarioDataList(scenarios=self.data)

    def get_scenario_data(self) -> ScenarioData:
        """
        Returns the scenario data for the currently set scenario

        Returns:
            The scenario data for the current scenario
        """
        return self.current_scenario_data

    def set_scenario_data(self, scenario_id: str) -> None:
        """
        Sets the scenario data for the currently set scenario

        Args:
            scenario_id: The id of the scenario to set
        """
        print("Setting scenario data for", scenario_id)
        self.current_scenario_data = ScenarioData(**self.data[scenario_id])
        self.scenario_id = scenario_id
