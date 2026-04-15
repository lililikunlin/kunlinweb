const rows = 10;
const cols = 10;
const minesLimit = 10;
let boardData = []; // 儲存資料的二維陣列
let revealedCount = 0;
let isGameOver = false;

function initGame() {
    isGameOver = false;
    revealedCount = 0;
    boardData = [];
    document.getElementById('mine-count').innerText = minesLimit;
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    // 1. 初始化資料陣列
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push({ r, c, isMine: false, revealed: false, flagged: false, neighborCount: 0 });
        }
        boardData.push(row);
    }

    // 2. 隨機埋地雷
    let minesPlaced = 0;
    while (minesPlaced < minesLimit) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if (!boardData[r][c].isMine) {
            boardData[r][c].isMine = true;
            minesPlaced++;
        }
    }

    // 3. 計算周圍地雷數
    calculateNeighbors();

    // 4. 繪製 HTML
    renderBoard();
}

function calculateNeighbors() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (boardData[r][c].isMine) continue;
            let count = 0;
            // 檢查周圍 8 個格子
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (boardData[r + i]?.[c + j]?.isMine) count++;
                }
            }
            boardData[r][c].neighborCount = count;
        }
    }
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardData.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');
            cellEl.id = `cell-${r}-${c}`;
            
            // 左鍵點擊：翻開
            cellEl.addEventListener('click', () => revealCell(r, c));
            // 右鍵點擊：插旗
            cellEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                toggleFlag(r, c);
            });
            
            boardEl.appendChild(cellEl);
        });
    });
}

function revealCell(r, c) {
    const cell = boardData[r][c];
    if (isGameOver || cell.revealed || cell.flagged) return;

    cell.revealed = true;
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    cellEl.classList.add('revealed');

    if (cell.isMine) {
        cellEl.classList.add('mine');
        cellEl.innerText = '💣';
        gameOver(false);
        return;
    }

    revealedCount++;
    if (cell.neighborCount > 0) {
        cellEl.innerText = cell.neighborCount;
        cellEl.classList.add(`color-${cell.neighborCount}`);
    } else {
        // 如果是空白，遞迴翻開周圍
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (boardData[r + i]?.[c + j]) revealCell(r + i, c + j);
            }
        }
    }

    if (revealedCount === rows * cols - minesLimit) gameOver(true);
}

function toggleFlag(r, c) {
    const cell = boardData[r][c];
    if (isGameOver || cell.revealed) return;
    
    cell.flagged = !cell.flagged;
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    cellEl.classList.toggle('flag');
    cellEl.innerText = cell.flagged ? '🚩' : '';
}

function gameOver(isWin) {
    isGameOver = true;
    alert(isWin ? "恭喜你贏了！" : "踩到雷了，遊戲結束！");
}

// 啟動遊戲
initGame();