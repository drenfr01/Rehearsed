# WebSocket Agent Simulation

## Overview

The WebSocket Agent Simulation page provides real-time communication with AI agents using WebSocket connections, offering a more interactive and responsive experience compared to the traditional request-response model used in the regular Agent Simulation.

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
- **Audio Mode Toggle**: Switch between text and audio communication modes
- **Real-time Typing Indicator**: Shows when the agent is responding
- **Conversation History**: Displays all messages in chronological order
- **Session Management**: Side panel for managing different conversation sessions

## Technical Implementation

### WebSocket Communication
- **Endpoint**: `/agent/ws/{user_id}/{session_id}?is_audio={boolean}`
- **Message Format**: JSON with mime_type and data fields
- **Reconnection**: Automatic reconnection on connection loss
- **Error Handling**: Comprehensive error handling for connection issues

### Audio Processing
- **Input Format**: PCM audio data via Web Audio API
- **Output Format**: PCM audio data from agent responses
- **Buffering**: 200ms audio buffering for smooth transmission
- **Worklet Processing**: Uses AudioWorklet for real-time audio processing

### State Management
- **Message State**: Tracks conversation messages with completion status
- **Connection State**: Monitors WebSocket connection status
- **Audio State**: Manages audio mode and recording state
- **Session State**: Handles session creation and switching

## Usage

### Starting a Session
1. Navigate to "Agent Simulation (Streaming)" from the main menu
2. The system will automatically create a new session or load an existing one
3. Wait for the WebSocket connection to establish (green "Connected" indicator)

### Text Communication
1. Type your message in the text input field
2. Click "Send" or press Enter to send the message
3. View the agent's streaming text response in real-time

### Audio Communication
1. Click "Start Audio" to enable audio mode
2. Speak your message clearly into the microphone
3. The audio will be automatically buffered and sent to the agent
4. Listen to the agent's audio response

### Session Management
- **New Session**: Click "New Session" in the side panel to start fresh
- **Load Session**: Select an existing session from the side panel
- **Conversation History**: All messages are saved and can be loaded later

## Differences from Regular Agent Simulation

### Communication Model
- **WebSocket**: Real-time bidirectional communication vs HTTP request-response
- **Streaming**: Continuous data flow vs discrete message exchanges
- **Stateful**: Maintains connection state vs stateless requests

### Audio Support
- **Real-time Audio**: Direct audio streaming vs file upload/download
- **Audio Worklets**: Advanced audio processing vs basic MediaRecorder
- **Low Latency**: Minimal audio delay vs full message processing

### User Experience
- **Immediate Feedback**: Instant connection status and message delivery
- **Progressive Display**: Text appears as it's generated vs complete messages
- **Audio Integration**: Seamless audio/text switching vs separate audio handling

## Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support

## Troubleshooting

### Common Issues
1. **Microphone Access**: Ensure browser permissions are granted
2. **Connection Issues**: Check network connectivity and server status
3. **Audio Playback**: Verify system audio is working and not muted
4. **Session Loading**: Clear browser cache if sessions don't load properly

### Error Handling
- **Connection Loss**: Automatic reconnection after 5 seconds
- **Audio Errors**: Graceful fallback to text mode
- **Message Errors**: Error logging and user notification
- **Session Errors**: Fallback to local session management 