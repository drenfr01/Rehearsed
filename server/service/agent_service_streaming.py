import asyncio
import json

from google.genai.types import (
    Content,
    Part,
)

from server.service.agent_service import AgentService


class AgentServiceStreaming(AgentService):
    def __init__(self):
        super().__init__()

    @staticmethod
    async def agent_to_client_messaging(websocket, live_events):
        """Agent to client communication"""
        while True:
            async for event in live_events:
                # turn_complete
                if event.turn_complete:
                    await websocket.send_text(json.dumps({"turn_complete": True}))
                    print("[TURN COMPLETE]")

                if event.interrupted:
                    await websocket.send_text(json.dumps({"interrupted": True}))
                    print("[INTERRUPTED]")

                # Read the Content and its first Part
                part: Part = (
                    event.content and event.content.parts and event.content.parts[0]
                )
                if not part or not event.partial:
                    continue

                # Get the text
                text = (
                    event.content
                    and event.content.parts
                    and event.content.parts[0].text
                )
                if not text:
                    continue

                # Send the text to the client
                await websocket.send_text(json.dumps({"message": text}))
                print(f"[AGENT TO CLIENT]: {text}")
                await asyncio.sleep(0)

    @staticmethod
    async def client_to_agent_messaging(websocket, live_request_queue):
        """Client to agent communication"""
        while True:
            text = await websocket.receive_text()
            content = Content(role="user", parts=[Part.from_text(text=text)])
            live_request_queue.send_content(content=content)
            print(f"[CLIENT TO AGENT]: {text}")
            await asyncio.sleep(0)
