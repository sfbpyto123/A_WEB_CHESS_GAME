const board = Chessboard('chessboard', {
    position: 'start',
    draggable: true,
    onDrop: handleMove,
});
const game = new Chess();
const stockfish = new Worker('stockfish.js');

let playerTimer = 300; // Default to 5 minutes
let aiTimer = 300; // Default to 5 minutes
let playerInterval, aiInterval;

document.getElementById('start-game').addEventListener('click', startGame);

function startGame() {
    const timerValue = parseInt(document.getElementById('timer').value) * 60;
    const difficulty = document.getElementById('difficulty').value;

    playerTimer = timerValue;
    aiTimer = timerValue;

    document.getElementById('player-timer').textContent = `Player: ${formatTime(playerTimer)}`;
    document.getElementById('ai-timer').textContent = `AI: ${formatTime(aiTimer)}`;

    clearInterval(playerInterval);
    clearInterval(aiInterval);

    playerInterval = setInterval(() => updateTimer('player'), 1000);
    stockfish.postMessage(`setoption name Skill Level value ${difficulty}`);
}

function handleMove(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    board.position(game.fen());
    clearInterval(playerInterval);

    setTimeout(() => {
        aiMove();
        aiInterval = setInterval(() => updateTimer('ai'), 1000);
    }, 1000);
}

function aiMove() {
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth 10');
    stockfish.onmessage = function (event) {
        if (event.data.includes('bestmove')) {
            const aiMove = event.data.split(' ')[1];
            game.move({ from: aiMove.slice(0, 2), to: aiMove.slice(2, 4), promotion: 'q' });
            board.position(game.fen());
            clearInterval(aiInterval);
            playerInterval = setInterval(() => updateTimer('player'), 1000);
        }
    };
}

function updateTimer(player) {
    if (player === 'player') {
        playerTimer--;
        document.getElementById('player-timer').textContent = `Player: ${formatTime(playerTimer)}`;
        if (playerTimer === 0) alert('AI Wins: Player ran out of time!');
    } else {
        aiTimer--;
        document.getElementById('ai-timer').textContent = `AI: ${formatTime(aiTimer)}`;
        if (aiTimer === 0) alert('Player Wins: AI ran out of time!');
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}