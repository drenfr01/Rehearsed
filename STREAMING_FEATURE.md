# Agent Simulation Streaming Feature

## Overview

The Agent Simulation Streaming feature provides real-time audio and text communication with AI agents using WebSocket connections. This enables more natural, conversational interactions compared to the traditional request-response model.

## Features

### Real-time Communication
- **WebSocket Connection**: Establishes persistent connection for real-time bidirectional communication
- **Audio Streaming**: Supports real-time audio input and output
- **Text Streaming**: Supports real-time text input with streaming responses
- **Session Management**: Maintains conversation context across the streaming session

### Audio Capabilities
- **Microphone Input**: Record and send audio messages to the agent
- **Audio Output**: Receive and play audio responses from the agent
- **Audio Queue**: Manages incoming audio chunks for smooth playback
- **Audio Context**: Uses Web Audio API for high-quality audio processing

### User Interface
- **Connection Status**: Visual indicator of WebSocket connection state
- **Recording Controls**: Start/stop audio recording with visual feedback
- **Text Input**: Alternative text-based communication method
- **Real-time Typing Indicator**: Shows when the agent is responding
- **Conversation History**: Displays all messages in chronological order

## Technical Implementation

### Backend (Python/FastAPI)
- **WebSocket Endpoint**: `/agent/ws/{user_id}/{session_id}?is_audio=true`
- **AgentServiceStreaming**: Manages streaming agent sessions
- **LiveRequestQueue**: Handles real-time message queuing
- **Audio Processing**: Supports PCM audio format for streaming

### Frontend (React/TypeScript)
- **WebSocket Client**: Manages connection and message handling
- **MediaRecorder API**: Captures microphone audio
- **Web Audio API**: Processes and plays incoming audio
- **Real-time UI Updates**: Updates interface based on streaming events

## Usage

### Starting a Streaming Session
1. Navigate to "Agent Simulation (Streaming)" from the main menu
2. The system will automatically create a new session or load an existing one
3. Wait for the WebSocket connection to establish (green "Connected" indicator)

### Audio Communication
1. Click "Start Recording" to begin audio capture
2. Speak your message clearly into the microphone
3. Click "Stop Recording" to send the audio to the agent
4. Listen to the agent's audio response

### Text Communication
1. Click "Send Text" to open a text input dialog
2. Type your message and press Enter
3. View the agent's streaming text response in real-time

### Session Management
- **New Session**: Click "New Session" in the side panel to start fresh
- **Load Session**: Select an existing session from the side panel
- **Conversation History**: All messages are saved and can be loaded later

## Configuration

### Audio Settings
- **Input Format**: WebM Opus (48kHz)
- **Output Format**: PCM (raw audio data)
- **Sample Rate**: 48kHz
- **Channels**: Mono

### WebSocket Settings
- **Protocol**: WS/WSS (auto-detected based on HTTP/HTTPS)
- **Reconnection**: Automatic on connection loss
- **Timeout**: 5-second connection timeout

## Troubleshooting

### Common Issues
1. **Microphone Access**: Ensure browser permissions are granted
2. **Connection Issues**: Check network connectivity and server status
3. **Audio Playback**: Verify system audio is working and not muted
4. **Session Loading**: Clear browser cache if sessions don't load properly

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Development Notes

### Audio Format Conversion
The current implementation includes a simplified audio format conversion. In production, you may want to implement proper audio codec conversion for better compatibility and quality.

### Error Handling
The system includes comprehensive error handling for:
- WebSocket connection failures
- Audio recording errors
- Agent service errors
- Network timeouts

### Performance Considerations
- Audio chunks are queued and processed sequentially
- WebSocket messages are processed asynchronously
- Conversation history is cached in localStorage for performance 