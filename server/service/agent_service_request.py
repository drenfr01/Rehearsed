from server.service.agent_service import AgentService


from google.adk.runners import Runner


from server.agents.agent import call_agent_async


class AgentServiceRequest(AgentService):
    def __init__(self):
        super().__init__()

    async def request_agent_response(
        self, runner: Runner, user_id: str, session_id: str, message: str
    ):
        print(f"Requesting agent response for session {session_id}")
        return await call_agent_async(message, runner, user_id, session_id)
