class Game2048 {
  constructor(gridSize = 4) {
    this.gridSize = gridSize;
    this.grid = Array(this.gridSize)
      .fill()
      .map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.bestScore =
      parseInt(localStorage.getItem(`bestScore${gridSize}`)) || 0;
    this.gameContainer = document.getElementById("grid-container");
    this.setupGrid();
    this.initializeGame();
  }

  saveGame(slot) {
    const gameState = {
      grid: this.grid,
      score: this.score,
      gridSize: this.gridSize,
    };
    localStorage.setItem(`2048_game_slot_${slot}`, JSON.stringify(gameState));
    setupSaveLoadUI();
  }

  loadGame(slot) {
    const savedGame = localStorage.getItem(`2048_game_slot_${slot}`);
    if (savedGame) {
      const gameState = JSON.parse(savedGame);
      this.gridSize = gameState.gridSize;
      this.grid = gameState.grid;
      this.score = gameState.score;
      this.setupGrid();
      this.renderGrid();
    } else {
      alert(`No saved game in slot ${slot}`);
    }
  }

  setupGrid() {
    // Clear existing grid
    this.gameContainer.innerHTML = "";

    // Update grid size class and CSS variable
    this.gameContainer.className = "grid-container";
    document.documentElement.style.setProperty("--grid-size", this.gridSize);

    // Calculate container size based on viewport
    const padding = 30;
    const maxWidth = Math.min(500, window.innerWidth * 0.9) - padding;
    const maxHeight = Math.min(500, window.innerHeight * 0.7) - padding;

    // Use the smaller dimension to ensure square cells
    const size = Math.min(maxWidth, maxHeight);
    this.containerSize = size;

    // Calculate cell size accounting for gaps
    const gapSize = Math.min(
      15,
      Math.max(2, Math.floor(size / this.gridSize / 4))
    ); // Adaptive gap size
    const totalGapSpace = gapSize * (this.gridSize - 1);
    this.cellSize = (size - totalGapSpace) / this.gridSize;

    // Set container size and grid template
    this.gameContainer.style.width = `${size}px`;
    this.gameContainer.style.height = `${size}px`;
    this.gameContainer.style.gap = `${gapSize}px`;
    this.gameContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

    // Create empty grid cells
    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.style.width = `${this.cellSize}px`;
      cell.style.height = `${this.cellSize}px`;
      this.gameContainer.appendChild(cell);
    }

    // Add window resize handler
    if (!this.resizeHandler) {
      this.resizeHandler = () => {
        this.setupGrid();
        this.renderGrid();
      };
      window.addEventListener("resize", this.resizeHandler);
    }
  }

  initializeGame() {
    this.grid = Array(this.gridSize)
      .fill()
      .map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.updateScore();
    this.addNewTile();
    this.addNewTile();
    this.renderGrid();
  }

  addNewTile() {
    const emptyCells = [];
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === 0) {
          emptyCells.push({ x: i, y: j });
        }
      }
    }
    if (emptyCells.length > 0) {
      const { x, y } =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[x][y] = Math.random() < 0.9 ? 2 : 4;
      this.renderTile(x, y, this.grid[x][y], true);
    }
  }

  renderGrid() {
    // Clear existing tiles
    const tiles = document.querySelectorAll(".tile");
    tiles.forEach((tile) => tile.remove());

    // Render current grid
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] !== 0) {
          this.renderTile(i, j, this.grid[i][j], false);
        }
      }
    }
  }

  renderTile(row, col, value, isNew = false) {
    const tile = document.createElement("div");
    tile.className = `tile tile-${value}${isNew ? " tile-new" : ""}`;
    tile.textContent = value;

    // Calculate font size based on grid size
    const baseFontSize = 100; // Maximum font size for the smallest grid
    const fontSize = Math.max(baseFontSize / Math.sqrt(this.gridSize), 7); // Scale down font size with larger grid sizes
    tile.style.fontSize = `${fontSize}px`; // Set the calculated font size

    const gapSize = Math.min(
      15,
      Math.max(2, Math.floor(this.containerSize / this.gridSize / 4))
    ); // Adaptive gap size
    const position = {
      left: col * (this.cellSize + gapSize),
      top: row * (this.cellSize + gapSize),
    };

    tile.style.width = `${this.cellSize}px`;
    tile.style.height = `${this.cellSize}px`;
    tile.style.transform = `translate(${position.left}px, ${position.top}px)`;

    this.gameContainer.appendChild(tile);
  }

  move(direction) {
    let moved = false;
    const previousGrid = JSON.stringify(this.grid);

    // Transpose grid for up/down movements
    if (direction === "up" || direction === "down") {
      this.transpose();
    }

    // Reverse grid for right/down movements
    if (direction === "right" || direction === "down") {
      this.reverse();
    }

    // Move and merge tiles
    for (let i = 0; i < this.gridSize; i++) {
      const row = this.grid[i];
      const newRow = this.moveRow(row);
      this.grid[i] = newRow;
    }

    // Reverse back
    if (direction === "right" || direction === "down") {
      this.reverse();
    }

    // Transpose back
    if (direction === "up" || direction === "down") {
      this.transpose();
    }

    // Check if grid changed
    moved = previousGrid !== JSON.stringify(this.grid);

    if (moved) {
      this.addNewTile();
      this.renderGrid();
      this.updateScore();

      // Check for game over
      if (this.isGameOver()) {
        setTimeout(() => alert("Game Over!"), 300);
      }
    }
  }

  moveRow(row) {
    // Filter non-zero elements
    let elements = row.filter((x) => x !== 0);

    // Merge adjacent equal elements
    for (let i = 0; i < elements.length - 1; i++) {
      if (elements[i] === elements[i + 1]) {
        elements[i] *= 2;
        this.score += elements[i];
        elements.splice(i + 1, 1);
      }
    }

    // Pad with zeros
    while (elements.length < this.gridSize) {
      elements.push(0);
    }

    return elements;
  }

  transpose() {
    this.grid = this.grid[0].map((_, i) => this.grid.map((row) => row[i]));
  }

  reverse() {
    this.grid = this.grid.map((row) => row.reverse());
  }

  updateScore() {
    document.getElementById("score").textContent = this.score;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem(`bestScore${this.gridSize}`, this.bestScore);
      document.getElementById("best-score").textContent = this.bestScore;
    }
  }

  isGameOver() {
    // Check for empty cells
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === 0) return false;
      }
    }

    // Check for possible merges
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const current = this.grid[i][j];
        // Check right neighbor
        if (j < this.gridSize - 1 && current === this.grid[i][j + 1])
          return false;
        // Check bottom neighbor
        if (i < this.gridSize - 1 && current === this.grid[i + 1][j])
          return false;
      }
    }

    return true;
  }
}

function setupSaveLoadUI() {
  const saveButtonsContainer = document.getElementById("save-buttons");
  const loadButtonsContainer = document.getElementById("load-buttons");
  saveButtonsContainer.innerHTML = "";
  loadButtonsContainer.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const savedGame = JSON.parse(localStorage.getItem(`2048_game_slot_${i}`));
    const saveButton = document.createElement("button");
    saveButton.textContent = `Save Slot ${i}`;
    saveButton.onclick = () => game.saveGame(i);
    saveButtonsContainer.appendChild(saveButton);

    if (savedGame) {
      const loadButton = document.createElement("button");
      loadButton.textContent = `Slot ${i} Score:${savedGame.score} Grid:${savedGame.gridSize}x${savedGame.gridSize}`;
      loadButton.onclick = () => game.loadGame(i);
      loadButtonsContainer.appendChild(loadButton);

      // Create delete button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = `Delete Slot ${i}`;
      deleteButton.onclick = () => {
        localStorage.removeItem(`2048_game_slot_${i}`);
        setupSaveLoadUI();
      };
      loadButtonsContainer.appendChild(deleteButton);
    }
  }
}

// Update size display while sliding
function updateSizeDisplay(size) {
  document.getElementById("size-display").textContent = `${size}x${size}`;
}

// Handle grid size change
function changeGridSize(size) {
  size = parseInt(size);
  // Update best score display for new grid size
  document.getElementById("best-score").textContent =
    localStorage.getItem(`bestScore${size}`) || "0";
  game = new Game2048(size);
}

// Initialize game
let game;
document.addEventListener("DOMContentLoaded", () => {
  game = new Game2048(4); // Default to 4x4 grid
  setupSaveLoadUI();
  // Update best score display for initial grid size
  document.getElementById("best-score").textContent =
    localStorage.getItem("bestScore4") || "0";

  // Set initial size display
  updateSizeDisplay(4);
});

// Handle keyboard input
document.addEventListener("keydown", (event) => {
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "w",
      "a",
      "s",
      "d",
    ].includes(event.key)
  ) {
    event.preventDefault();
    switch (event.key) {
      case "ArrowUp":
      case "w":
        game.move("up");
        break;
      case "ArrowDown":
      case "s":
        game.move("down");
        break;
      case "ArrowLeft":
      case "a":
        game.move("left");
        break;
      case "ArrowRight":
      case "d":
        game.move("right");
        break;
    }
  }
});

// Implement touch controls for mobile devices
function handleTouchStart(event) {
  const touchStartX = event.touches[0].clientX;
  const touchStartY = event.touches[0].clientY;
  return { touchStartX, touchStartY };
}

function handleTouchEnd(event, touchStart) {
  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;
  const deltaX = touchEndX - touchStart.touchStartX;
  const deltaY = touchEndY - touchStart.touchStartY;
  const threshold = 30; // Minimum distance to trigger a swipe

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
    if (deltaX > 0) {
      game.move("right");
    } else {
      game.move("left");
    }
  } else if (Math.abs(deltaY) > threshold) {
    if (deltaY > 0) {
      game.move("down");
    } else {
      game.move("up");
    }
  }
}

let touchStart;

document
  .getElementById("gameContainer")
  .addEventListener("touchstart", (event) => {
    touchStart = handleTouchStart(event);
  });

document
  .getElementById("gameContainer")
  .addEventListener("touchend", (event) => handleTouchEnd(event, touchStart));

// Reset game
function resetGame() {
  game.initializeGame();
}
