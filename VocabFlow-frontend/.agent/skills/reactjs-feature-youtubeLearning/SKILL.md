---
name: reactjs-feature-youtubeLearning
description: Domain structure for the YouTube Learning (Video Lessons & Playlists) feature module.
---

# Skill: reactjs-feature-youtubeLearning

## Architecture Overview
Follows the `@reactjs-feature-structure` skill boundary to encapsulate everything related to listing, displaying, and interacting with YouTube channels and parsed video lessons.

### Internal Layers

- `api/youtube.api.js`: Handles communication with backend endpoints (`/youtube-channels/find-all` and `/video-lessons/find-all/{channelId}`).
- `components/`:
  - `ChannelCard.jsx`: Reusable horizontal card to select a channel/playlist.
  - `VideoCard.jsx`: Standard grid card to display an active video lesson along with its tags, views, duration, and thumbnail.
- `pages/`: 
  - `YoutubeLearningPage.jsx`: The top-level feature route container doing state fetching algorithms and pagination setup.
  - `VideoStudyPage.jsx`: Sub-route displaying a working video player or placeholder for studying.
- `styles/`: Custom SCSS modules specific to standardizing layout sizes.

### Usage
This feature is injected inside the application via `index.js` which exports the Pages natively into the App's protected route structure `/videos`.
