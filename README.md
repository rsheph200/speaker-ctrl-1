# Ru's speaker control app
First version of the web app to control 2 speakers. 
It gives general control. This will be expanded on further as the project develops. 

# 🎛️ Speaker Controller Web App

A Next.js web application that functions as the **control interface** for a modular, multi-room audio system powered by Snapcast, PulseAudio, and MQTT.

This app allows users to:

- ✅ Select active input sources (Bluetooth, Spotify, etc.)
- 🔈 Control volume per speaker zone
- 🔀 Route audio to one or more Snapclients
- 🧠 View real-time system status
- 🟣 Interact with the backend via MQTT or HTTP API

---

## 🧠 Project Context

This UI is part of a larger speaker system running on Raspberry Pi and/or similar devices. The system architecture includes:

- `snapserver` + `snapclient` for synchronized audio streaming
- `pulseaudio` for source routing and audio mixing
- `librespot` and Bluetooth for input sources
- MQTT broker (Mosquitto) for control/state messaging
- Web-based controller served to a dedicated kiosk device (CMF phone)

---

## 📁 Project Structure

```bash
.
├── components/         # UI components (volume sliders, toggles, etc.)
├── pages/              # Next.js route handlers
├── lib/                # MQTT client, state hooks
├── styles/             # Tailwind / CSS modules
├── public/             # Static assets
└── README.md
