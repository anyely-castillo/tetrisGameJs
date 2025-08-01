
/* Juego de Tetris implementado en JavaScript, este código incluye funcionalidades básicas como movimiento de piezas, colisiones, eliminación de filas y puntuación. */

// Tablero del Juego Tetris
const BLOCK_SIZE = 20;
const BOARD_WIDTH = 14;
const BOARD_HEIGHT = 30;

// El código también maneja eventos de teclado para controlar las piezas y tiene una interfaz de usuario
const EVENT_MOVEMENTS = {
  LEFT: 'ArrowLeft',
  DOWN: 'ArrowDown',
  RIGHT: 'ArrowRight',
  ROTATE: 'ArrowUp'
};

//Piezas del Tetris
const PIECES = [
  [[1, 1], [1, 1]],             //Cuadrado
  [[1, 1, 1, 1]],               // Línea
  [[0, 1, 0], [1, 1, 1]],       // T
  [[1, 1, 0], [0, 1, 1]],       // Z
  [[0, 1, 1], [1, 1, 0]],       // S
  [[1, 0], [1, 0], [1, 1]],     // L   
  [[0, 1], [0, 1], [1, 1]]      // J
];

//Elementos del DOM
const canvas = document.getElementById('tetris-canvas');
const context = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const audio = new Audio('https://video.aprendejs.dev/tetris.mp3');

//Variables de estado
let score = 0;
let dropCounter = 0;
let lastTime = 0;
let isPaused = false;
let isRunning = false;

// Tamaño del canvas
canvas.width = BLOCK_SIZE * BOARD_WIDTH;
canvas.height = BLOCK_SIZE * BOARD_HEIGHT;
context.scale(BLOCK_SIZE, BLOCK_SIZE);
let board = createBoard(BOARD_WIDTH, BOARD_HEIGHT);

// Inicializa la pieza actual
let piece = {
  position: { x: 5, y: 0 },
  shape: randomPiece()
};

// Inicializa el juego
function createBoard(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

// Dibuja el tablero y las piezas
function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(board, 0, 0, 'gray');
  drawMatrix(piece.shape, piece.position.x, piece.position.y, 'yellow');
  scoreEl.innerText = score;
}

function drawMatrix(matrix, offsetX, offsetY, color) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        context.fillStyle = color;
        context.fillRect(x + offsetX, y + offsetY, 1, 1);
      }
    });
  });
}

// Actualiza el estado del juego
function update(time = 0) {
  if (!isRunning) return;
  if (isPaused) {
    requestAnimationFrame(update);
    return;
  }

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > 400) { 
    piece.position.y++;
    if (checkCollision()) {
      piece.position.y--;
      solidifyPiece();
      removeRows();
    }
    dropCounter = 0;
  }

  draw();
  requestAnimationFrame(update);
}

// Verifica colisiones con el tablero
function checkCollision() {
  return piece.shape.some((row, y) =>
    row.some((value, x) => value &&
      (board[y + piece.position.y]?.[x + piece.position.x] ?? 1)
    )
  );
}

function solidifyPiece() {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[y + piece.position.y][x + piece.position.x] = 1;
      }
    });
  });

  resetPiece();
}

// Reinicio, game over y líneas
function resetPiece() {
  piece.shape = randomPiece();
  piece.position = { x: Math.floor(BOARD_WIDTH / 2 - 2), y: 0 };

  if (checkCollision()) {
    endGame();
  }
}

function endGame() {
  isRunning = false;
  finalScoreEl.textContent = score;
  gameOverScreen.style.display = 'flex';
}

function restartGame() {
  board = createBoard(BOARD_WIDTH, BOARD_HEIGHT);
  score = 0;
  piece.shape = randomPiece();
  piece.position = { x: 5, y: 0 };
  gameOverScreen.style.display = 'none';
  isPaused = false;
  pauseScreen.style.display = 'none';
  isRunning = true;
  update();
}

function removeRows() {
  let rowsRemoved = 0;

  board = board.filter(row => {
    if (row.every(cell => cell === 1)) {
      rowsRemoved++;
      return false;
    }
    return true;
  });

  while (rowsRemoved > 0) {
    board.unshift(Array(BOARD_WIDTH).fill(0));
    rowsRemoved--;
    score += 10;
  }
}

/* Rota la matriz de la pieza, esta función rota la matriz 90 grados en sentido horario, utiliza map para transponer la matriz y luego reverse para invertir las filas */
function rotateMatrix(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

// Genera una pieza aleatoria
function randomPiece() {
  return PIECES[Math.floor(Math.random() * PIECES.length)];
}

function togglePause() {
  if (!isRunning) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Restart' : 'Pause';
  pauseScreen.style.display = isPaused ? 'flex' : 'none';
}

// Maneja los eventos de teclado para controlar las piezas
document.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
    return;
  }

  if (!isRunning || isPaused) return;

  switch (event.key) {
    case EVENT_MOVEMENTS.LEFT:
      piece.position.x--;
      if (checkCollision()) piece.position.x++;
      break;
    case EVENT_MOVEMENTS.RIGHT:
      piece.position.x++;
      if (checkCollision()) piece.position.x--;
      break;
    case EVENT_MOVEMENTS.DOWN:
      piece.position.y++;
      if (checkCollision()) {
        piece.position.y--;
        solidifyPiece();
        removeRows();
      }
      break;
    case EVENT_MOVEMENTS.ROTATE:
      const rotated = rotateMatrix(piece.shape);
      const oldShape = piece.shape;
      piece.shape = rotated;
      if (checkCollision()) piece.shape = oldShape;
      break;
  }
});

//incluye un sistema de audio para mejorar la experiencia del usuario.
startScreen.addEventListener('click', () => {
  startScreen.remove();
  audio.volume = 0.009;
  audio.play();
  isRunning = true;
  update();
});

// Añade los eventos de pausa y reinicio
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', restartGame);