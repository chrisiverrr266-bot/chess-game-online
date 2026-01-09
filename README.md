# Chess Game Online

A beautiful, feature-rich chess game with bot play and online 1v1 multiplayer capabilities.

## Features

- 🎮 **Play vs Bot**: Challenge yourself against AI opponents
- 👥 **Online 1v1**: Play with friends online using room codes
- 🎨 **Beautiful Design**: Modern, smooth UI with professional chess piece graphics
- ⏱️ **Game Timer**: 10-minute timer for each player
- ♟️ **Full Chess Rules**: Complete implementation using chess.js
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Chess Engine**: chess.js
- **Multiplayer**: Socket.io (ready for backend integration)
- **Deployment**: Vercel-ready

## Live Demo

Deploy this project to Vercel in one click!

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/chrisiverrr266-bot/chess-game-online.git
cd chess-game-online
```

2. Open `index.html` in your browser or use a local server:
```bash
python -m http.server 8000
# or
npx serve
```

3. Visit `http://localhost:8000`

## Deploy to Vercel

1. Push this repository to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Deploy!

### Quick Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chrisiverrr266-bot/chess-game-online)

## Adding Online Multiplayer Backend

For full online multiplayer functionality, you'll need to set up a WebSocket server:

1. Create a Node.js server with Socket.io
2. Deploy it to a service like Heroku, Railway, or Vercel
3. Update the socket connection in `game.js` with your server URL

### Example Backend (server.js)

```javascript
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected');
  
  socket.on('createRoom', () => {
    const roomId = Math.random().toString(36).substring(7).toUpperCase();
    rooms.set(roomId, { players: [socket.id], moves: [] });
    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
  });
  
  socket.on('joinRoom', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.players.length < 2) {
      room.players.push(socket.id);
      socket.join(roomId);
      io.to(roomId).emit('opponentJoined');
    }
  });
  
  socket.on('move', ({ roomId, move }) => {
    socket.to(roomId).emit('move', { move });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Game Controls

- **Click** a piece to select it
- **Click** a highlighted square to move
- **Undo** button to take back moves (vs Bot only)
- **New Game** to restart
- **Menu** to return to main menu

## Credits

Made by Chris iver

## License

MIT License - Feel free to use and modify!
