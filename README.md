# engageEJS
Ritvik Budhiraja - Indraprashta Institute of Information Technology, Delhi
Live Demo: https://youtu.be/qTQDGbfwcs8

> NOTE: Use Google Chrome for teh best experience, functionality might be limited/broken on other browsers

Implemented a video calling web application using Express and Node.js as backend, and EJS as a view engine for the frontend (using HTML, CSS, Bootstrap, Vanilla JavaScript and JS Libraries).

The App supports multiple peers to join a chatroom. The chatroom chats are synchronised using MongoDB Atlas and mongoose, so everyone in that chatroom sees the same chat, even after refreshing or joining later. The chats that are done in the video call are in sync with the chatroom chats since they have the same roomID, and hence the same database retrieved data.

### FEATURES IMPLEMENTED:
- Synced, Persistent Chatrooms - MongoDB Atlas, Mongoose
- Live Captions | Conference mode (to broadcast their live captions) - WebSpeech API supported by google chrome
- Live Translations (Enabled when someone is broadcasting their captions) - Azure Translator
- Gesture Support | Hand Raise - Using handtrack.js and vanilla javascript
- Screen Sharing - Using in-built navigator methods
- Responsive UI - Bootstrap
- Assistance and better UX - Using Tippy, ohSnap, IntroJS, etc. libraries

### Agile Methodology
Divided workflow into 4 sprints of 1 week each:
1. Sprint 1 - Learn
2. Sprint 2, 3 - Design and Build
4. Sprint 4 - Adapt and Finalize

run "npm install" to get all dependencies
