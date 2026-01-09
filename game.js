// Chess Game with improved AI and functionality
let chess = new Chess();
let selectedSquare = null;
let gameMode = null;
let playerColor = 'w';
let roomId = null;
let whiteTime = 600;
let blackTime = 600;
let timerInterval = null;
let moveHistory = [];

// Beautiful Unicode chess pieces
const pieceSymbols = {
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔'
};

// Piece values for bot evaluation
const pieceValues = {
    'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
};

// Initialize the chess board
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
                const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
                square.textContent = pieceSymbols[symbol];
                square.style.color = piece.color === 'w' ? '#ffffff' : '#000000';
                square.style.textShadow = piece.color === 'w' 
                    ? '0 2px 4px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.3)' 
                    : '0 2px 4px rgba(255,255,255,0.3)';
            }
            
            square.addEventListener('click', () => handleSquareClick(squareId));
            board.appendChild(square);
        }
    }
    
    updateGameStatus();
}

// Handle square click events
function handleSquareClick(squareId) {
    if (gameMode === 'online' && chess.turn() !== playerColor) {
        return;
    }
    
    const piece = chess.get(squareId);
    
    if (selectedSquare) {
        const move = chess.move({
            from: selectedSquare,
            to: squareId,
            promotion: 'q'
        });
        
        if (move) {
            moveHistory.push(move);
            selectedSquare = null;
            initBoard();
            
            if (gameMode === 'bot' && !chess.game_over()) {
                setTimeout(makeBotMove, 400);
            }
        } else if (piece && piece.color === chess.turn()) {
            selectSquare(squareId);
        } else {
            clearSelection();
        }
    } else if (piece && piece.color === chess.turn()) {
        selectSquare(squareId);
    }
}

// Select a square and show valid moves
function selectSquare(squareId) {
    clearSelection();
    selectedSquare = squareId;
    
    const square = document.querySelector(`[data-square="${squareId}"]`);
    if (square) {
        square.classList.add('selected');
    }
    
    const moves = chess.moves({ square: squareId, verbose: true });
    moves.forEach(move => {
        const targetSquare = document.querySelector(`[data-square="${move.to}"]`);
        if (targetSquare) {
            if (move.captured) {
                targetSquare.classList.add('capture');
            } else {
                targetSquare.classList.add('valid-move');
            }
        }
    });
}

// Clear selection highlights
function clearSelection() {
    selectedSquare = null;
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('selected', 'valid-move', 'capture');
    });
}

// Improved bot AI with minimax algorithm
function makeBotMove() {
    const depth = 3; // Search depth
    const bestMove = findBestMove(depth);
    
    if (bestMove) {
        chess.move(bestMove);
        moveHistory.push(bestMove);
        initBoard();
    }
}

// Minimax algorithm with alpha-beta pruning
function findBestMove(depth) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    let bestMove = null;
    let bestValue = -Infinity;
    
    for (const move of moves) {
        chess.move(move);
        const value = -minimax(depth - 1, -Infinity, Infinity, false);
        chess.undo();
        
        if (value > bestValue) {
            bestValue = value;
            bestMove = move;
        }
    }
    
    return bestMove;
}

function minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0 || chess.game_over()) {
        return evaluateBoard();
    }
    
    const moves = chess.moves({ verbose: true });
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            chess.move(move);
            const evaluation = minimax(depth - 1, alpha, beta, false);
            chess.undo();
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            chess.move(move);
            const evaluation = minimax(depth - 1, alpha, beta, true);
            chess.undo();
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Evaluate board position
function evaluateBoard() {
    let score = 0;
    const board = chess.board();
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const value = pieceValues[piece.type];
                score += piece.color === 'b' ? value : -value;
            }
        }
    }
    
    // Add bonus for checkmate
    if (chess.in_checkmate()) {
        return chess.turn() === 'w' ? -50000 : 50000;
    }
    
    return score;
}

// Update game status display
function updateGameStatus() {
    const statusDiv = document.getElementById('gameStatus');
    
    if (chess.in_checkmate()) {
        const winner = chess.turn() === 'w' ? 'Black' : 'White';
        statusDiv.textContent = `Checkmate! ${winner} wins! 👑`;
        statusDiv.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a)';
        statusDiv.style.color = '#92400e';
        stopTimer();
    } else if (chess.in_draw()) {
        statusDiv.textContent = 'Draw! 🤝';
        statusDiv.style.background = 'linear-gradient(135deg, #e5e7eb, #d1d5db)';
        statusDiv.style.color = '#374151';
        stopTimer();
    } else if (chess.in_stalemate()) {
        statusDiv.textContent = 'Stalemate! 🔄';
        statusDiv.style.background = 'linear-gradient(135deg, #e5e7eb, #d1d5db)';
        statusDiv.style.color = '#374151';
        stopTimer();
    } else if (chess.in_check()) {
        statusDiv.textContent = `Check! ${chess.turn() === 'w' ? '♔' : '♚'}`;
        statusDiv.style.background = 'linear-gradient(135deg, #fee2e2, #fecaca)';
        statusDiv.style.color = '#991b1b';
    } else {
        const turn = chess.turn() === 'w' ? 'White' : 'Black';
        const icon = chess.turn() === 'w' ? '♔' : '♚';
        statusDiv.textContent = `${turn} to move ${icon}`;
        statusDiv.style.background = 'linear-gradient(135deg, #f9fafb, #f3f4f6)';
        statusDiv.style.color = '#1f2937';
    }
    
    // Update active player indicator
    document.querySelectorAll('.player-card').forEach(card => card.classList.remove('active'));
    if (chess.turn() === 'w') {
        document.querySelector('.white-player')?.classList.add('active');
    } else {
        document.querySelector('.black-player')?.classList.add('active');
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
                document.getElementById('gameStatus').textContent = 'Black wins on time! ⏱️';
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                blackTime = 0;
                stopTimer();
                document.getElementById('gameStatus').textContent = 'White wins on time! ⏱️';
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

// Game control functions
function startGame(mode) {
    gameMode = mode;
    chess.reset();
    moveHistory = [];
    whiteTime = 600;
    blackTime = 600;
    updateTimerDisplay();
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('multiplayerMenu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    initBoard();
    startTimer();
}

function resetGame() {
    chess.reset();
    moveHistory = [];
    whiteTime = 600;
    blackTime = 600;
    updateTimerDisplay();
    clearSelection();
    initBoard();
    startTimer();
}

function undoMove() {
    if (moveHistory.length === 0) return;
    
    chess.undo();
    moveHistory.pop();
    
    if (gameMode === 'bot' && moveHistory.length > 0) {
        chess.undo();
        moveHistory.pop();
    }
    
    clearSelection();
    initBoard();
}

function backToMainMenu() {
    stopTimer();
    clearSelection();
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('multiplayerMenu').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
}

// Multiplayer menu functions
function showMultiplayerMenu() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('multiplayerMenu').style.display = 'flex';
}

function createRoom() {
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    playerColor = 'w';
    
    document.getElementById('currentRoomId').textContent = roomId;
    document.getElementById('roomInfo').style.display = 'block';
    
    // Simulate opponent joining (for demo)
    setTimeout(() => {
        if (confirm(`Room ${roomId} created! Share this code with your friend.\n\nStart demo game?`)) {
            startGame('online');
        }
    }, 1500);
}

function joinRoom() {
    const inputRoomId = document.getElementById('roomIdInput').value.trim().toUpperCase();
    if (!inputRoomId) {
        alert('⚠️ Please enter a room ID');
        return;
    }
    
    if (inputRoomId.length < 4) {
        alert('⚠️ Room ID must be at least 4 characters');
        return;
    }
    
    roomId = inputRoomId;
    playerColor = 'b';
    
    alert(`Joining room ${roomId}...\n\n(In production, this would connect to the server)`);
    startGame('online');
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Chess Game loaded successfully! 🎮');
});