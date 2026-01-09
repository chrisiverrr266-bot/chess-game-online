// Chess Game Logic
let chess = new Chess();
let selectedSquare = null;
let gameMode = null;
let playerColor = 'w';
let socket = null;
let roomId = null;
let whiteTime = 600; // 10 minutes in seconds
let blackTime = 600;
let timerInterval = null;

const pieceSymbols = {
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
};

// Initialize board
function initBoard() {
    const board = document.getElementById('chessBoard');
    board.innerHTML = '';
    
    const position = chess.board();
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            const squareId = String.fromCharCode(97 + col) + (8 - row);
            
            square.className = 'square ' + ((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.square = squareId;
            
            const piece = position[row][col];
            if (piece) {
                const symbol = piece.color + piece.type.toUpperCase();
                square.textContent = pieceSymbols[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
            }
            
            square.addEventListener('click', () => handleSquareClick(squareId));
            board.appendChild(square);
        }
    }
    
    updateGameStatus();
}

// Handle square click
function handleSquareClick(squareId) {
    // Check if it's player's turn in online mode
    if (gameMode === 'online' && chess.turn() !== playerColor) {
        return;
    }
    
    const piece = chess.get(squareId);
    
    if (selectedSquare) {
        // Try to make a move
        const move = chess.move({
            from: selectedSquare,
            to: squareId,
            promotion: 'q' // Always promote to queen for simplicity
        });
        
        if (move) {
            // Valid move
            if (gameMode === 'online' && socket) {
                socket.emit('move', { roomId, move: move });
            }
            
            selectedSquare = null;
            initBoard();
            
            // Bot's turn
            if (gameMode === 'bot' && !chess.game_over()) {
                setTimeout(makeBotMove, 500);
            }
        } else if (piece && piece.color === chess.turn()) {
            // Select new piece
            selectSquare(squareId);
        } else {
            // Invalid move, deselect
            clearSelection();
        }
    } else if (piece && piece.color === chess.turn()) {
        // Select piece
        selectSquare(squareId);
    }
}

// Select a square
function selectSquare(squareId) {
    clearSelection();
    selectedSquare = squareId;
    
    const square = document.querySelector(`[data-square="${squareId}"]`);
    square.classList.add('selected');
    
    // Show valid moves
    const moves = chess.moves({ square: squareId, verbose: true });
    moves.forEach(move => {
        const targetSquare = document.querySelector(`[data-square="${move.to}"]`);
        if (move.captured) {
            targetSquare.classList.add('capture');
        } else {
            targetSquare.classList.add('valid-move');
        }
    });
}

// Clear selection
function clearSelection() {
    selectedSquare = null;
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('selected', 'valid-move', 'capture');
    });
}

// Bot move using simple minimax
function makeBotMove() {
    const moves = chess.moves();
    if (moves.length === 0) return;
    
    // Simple random move for now (can be improved with minimax)
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    chess.move(randomMove);
    initBoard();
}

// Update game status
function updateGameStatus() {
    const statusDiv = document.getElementById('gameStatus');
    
    if (chess.in_checkmate()) {
        statusDiv.textContent = `Checkmate! ${chess.turn() === 'w' ? 'Black' : 'White'} wins!`;
        statusDiv.style.color = '#e74c3c';
        stopTimer();
    } else if (chess.in_draw()) {
        statusDiv.textContent = 'Draw!';
        statusDiv.style.color = '#f39c12';
        stopTimer();
    } else if (chess.in_stalemate()) {
        statusDiv.textContent = 'Stalemate!';
        statusDiv.style.color = '#f39c12';
        stopTimer();
    } else if (chess.in_check()) {
        statusDiv.textContent = 'Check!';
        statusDiv.style.color = '#e67e22';
    } else {
        statusDiv.textContent = `${chess.turn() === 'w' ? 'White' : 'Black'} to move`;
        statusDiv.style.color = '#2c3e50';
    }
    
    // Update player indicators
    document.querySelectorAll('.player-indicator').forEach(ind => ind.classList.remove('active'));
    if (chess.turn() === 'w') {
        document.querySelector('.white-indicator').classList.add('active');
    } else {
        document.querySelector('.black-indicator').classList.add('active');
    }
}

// Timer functions
function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        if (chess.turn() === 'w') {
            whiteTime--;
            if (whiteTime <= 0) {
                whiteTime = 0;
                stopTimer();
                document.getElementById('gameStatus').textContent = 'Black wins on time!';
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                blackTime = 0;
                stopTimer();
                document.getElementById('gameStatus').textContent = 'White wins on time!';
            }
        }
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    document.getElementById('whiteTimer').textContent = formatTime(whiteTime);
    document.getElementById('blackTimer').textContent = formatTime(blackTime);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Game controls
function startGame(mode) {
    gameMode = mode;
    chess.reset();
    whiteTime = 600;
    blackTime = 600;
    updateTimerDisplay();
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    initBoard();
    startTimer();
}

function resetGame() {
    chess.reset();
    whiteTime = 600;
    blackTime = 600;
    updateTimerDisplay();
    initBoard();
    startTimer();
}

function undoMove() {
    chess.undo();
    if (gameMode === 'bot') {
        chess.undo(); // Undo bot's move too
    }
    initBoard();
}

function backToMainMenu() {
    stopTimer();
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('multiplayerMenu').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
}

// Multiplayer functions
function showMultiplayerMenu() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('multiplayerMenu').style.display = 'flex';
}

function createRoom() {
    // For demo purposes, we'll simulate room creation
    // In production, connect to your WebSocket server
    roomId = Math.random().toString(36).substring(7).toUpperCase();
    playerColor = 'w';
    
    document.getElementById('currentRoomId').textContent = roomId;
    document.getElementById('roomInfo').style.display = 'block';
    
    // Simulate waiting for opponent (remove in production)
    setTimeout(() => {
        alert('Opponent joined! Starting game...');
        startGame('online');
    }, 3000);
}

function joinRoom() {
    const inputRoomId = document.getElementById('roomIdInput').value.trim();
    if (!inputRoomId) {
        alert('Please enter a room ID');
        return;
    }
    
    roomId = inputRoomId;
    playerColor = 'b';
    
    // In production, connect to WebSocket server and join room
    alert('Joining room...');
    startGame('online');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Socket.io setup (configure with your server URL)
    // Uncomment and configure when you have a backend server
    /*
    socket = io('YOUR_SERVER_URL');
    
    socket.on('move', (data) => {
        chess.move(data.move);
        initBoard();
    });
    
    socket.on('roomCreated', (data) => {
        roomId = data.roomId;
        playerColor = 'w';
        document.getElementById('currentRoomId').textContent = roomId;
        document.getElementById('roomInfo').style.display = 'block';
    });
    
    socket.on('opponentJoined', () => {
        startGame('online');
    });
    */
});