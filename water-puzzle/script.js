const COLORS = { R: '#ff4d6d', B: '#0077b6', G: '#2d6a4f', Y: '#ffb703', P: '#7209b7' };

const LEVELS = [
    { b: [[COLORS.R, COLORS.B, COLORS.R, COLORS.B], [COLORS.B, COLORS.R, COLORS.B, COLORS.R], []], cap: 4 },
    { b: [[COLORS.G, COLORS.Y, COLORS.G], [COLORS.Y, COLORS.G, COLORS.Y], [], []], cap: 4 },
    { b: [[COLORS.P, COLORS.R, COLORS.B], [COLORS.B, COLORS.P, COLORS.R], [COLORS.R, COLORS.B, COLORS.P], [], []], cap: 4 }
];

let currentLevel = 0;
let bottles = [];
let selectedIdx = null;
let bottleElements = [];

// 專業版 Render：區分「初始化」與「局部更新」
function render(isInitial = false) {
    const container = document.getElementById('game-container');
    
    if (isInitial) {
        container.innerHTML = '';
        bottleElements = [];
        bottles.forEach((content, idx) => {
            const bDiv = document.createElement('div');
            bDiv.className = 'bottle';
            
            // 新增水容器 (修正溢出問題)
            const wContent = document.createElement('div');
            wContent.className = 'water-content';
            bDiv.appendChild(wContent);

            bDiv.onclick = () => handleBottleClick(idx);
            container.appendChild(bDiv);
            bottleElements.push(bDiv);
        });
    }

    // 局部更新：只更新選取狀態和瓶內的水
    bottles.forEach((content, idx) => {
        const bDiv = bottleElements[idx];
        const wContent = bDiv.querySelector('.water-content');
        
        // 更新選取狀態 (修正：純垂直拿起)
        bDiv.className = `bottle ${selectedIdx === idx ? 'selected' : ''}`;

        // 比較 DOM 水塊數量與資料數量，決定要增加還是減少
        const currentLayers = wContent.querySelectorAll('.water-layer');
        
        // 如果是初始渲染，直接生成所有水塊
        if (isInitial) {
            wContent.innerHTML = '';
            content.forEach(color => createWaterLayer(wContent, color));
        }
        // 如果不是初始，則由 moveWater 函式處理局部增減，這裡不做全瓶更新
    });
}

// 輔助函式：建立一個水塊
function createWaterLayer(container, color, isPouring = false) {
    const w = document.createElement('div');
    w.className = 'water-layer';
    w.style.backgroundColor = color;
    w.style.height = `${100 / LEVELS[currentLevel].cap}%`; // 動態計算高度
    if (isPouring) w.classList.add('pouring');
    container.appendChild(w);
    return w;
}

// 專業版 moveWater：實作局部動畫與物理路徑
function moveWater(fromIdx, toIdx) {
    const fBottle = bottles[fromIdx];
    const tBottle = bottles[toIdx];
    const fromWContent = bottleElements[fromIdx].querySelector('.water-content');
    const toWContent = bottleElements[toIdx].querySelector('.water-content');

    const color = fBottle[fBottle.length - 1];
    const capacity = LEVELS[currentLevel].cap;

    if (tBottle.length < capacity && (tBottle.length === 0 || tBottle[tBottle.length - 1] === color)) {
        
        let movedCount = 0;
        // 1. 資料層：計算移動數量並更新
        while (fBottle.length > 0 && fBottle[fBottle.length - 1] === color && tBottle.length < capacity) {
            tBottle.push(fBottle.pop());
            movedCount++;
        }

        // 2. DOM 層與動畫：實作專業物理倒水動畫
        performPouringAnimation(fromIdx, toIdx, color, movedCount);

        // 3. 檢查勝利
        if (checkWin()) nextLevel();
    }
}

// 核心動畫邏輯：動態計算拋物線與縮放
function performPouringAnimation(fromIdx, toIdx, color, count) {
    const fromWContent = bottleElements[fromIdx].querySelector('.water-content');
    const toWContent = bottleElements[toIdx].querySelector('.water-content');
    const fLayers = fromWContent.querySelectorAll('.water-layer');
    
    // 計算動畫參數
    const b1 = bottleElements[fromIdx].getBoundingClientRect();
    const b2 = bottleElements[toIdx].getBoundingClientRect();
    const layerHeight = 100 / LEVELS[currentLevel].cap;

    // 1. 移除去來源瓶的水塊 (從最後一個開始)
    for (let i = 0; i < count; i++) {
        fromWContent.removeChild(fLayers[fLayers.length - 1 - i]);
    }

    // 2. 在目標瓶加入新水塊，並套用動態生成的專業動畫
    for (let i = 0; i < count; i++) {
        // 資料已經 push 進去了，所以目標瓶現在的長度就是倒完後的長度
        const currentToLength = bottles[toIdx].length;
        // 這個水塊倒完後應該在的位置 (從底往上算，第幾格)
        const finalPosition = currentToLength - count + i; 

        const water = createWaterLayer(toWContent, color, true); // true 開啟 pouring class
        
        // 專業物理動畫計算：動態產生 keyframes
        const animationName = `pour_${fromIdx}_${toIdx}_${Date.now()}_${i}`;
        
        // 計算起始點 (來源瓶口) 到 終點 (目標瓶對應水位) 的相對位移
        const startX = b1.left - b2.left; // 橫向位移
        const startY = (b1.top - b2.top) - 50; // 縱向位移 (從瓶口上方倒下)
        
        // 建立動態 Keyframes
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes ${animationName} {
                0% { 
                    transform: translate(${startX}px, ${startY}px) scaleY(2); /* 從來源瓶口拋出，且拉長 */
                    opacity: 0;
                }
                30% {
                    transform: translate(${startX}px, ${startY + 30}px) scaleY(1.5); /* 落下中 */
                    opacity: 1;
                }
                100% { 
                    transform: translate(0, 0) scaleY(1); /* 到達目標瓶對應水位 */
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // 套用動畫與延遲 (營造水流連續感)
        water.style.animationName = animationName;
        water.style.animationDuration = `${0.4 + (i * 0.1)}s`; // 後面的水塊倒得稍慢
        water.style.animationDelay = `${i * 0.05}s`; // 順序倒出
        
        // 動畫結束後清理快取與 style 標籤
        water.addEventListener('animationend', () => {
            water.classList.remove('pouring');
            water.style.animation = '';
            document.head.removeChild(style);
        });
    }
}

// 更新這兩個函式以適應新的渲染邏輯
function initLevel(idx) {
    const level = LEVELS[idx];
    bottles = JSON.parse(JSON.stringify(level.b));
    document.getElementById('level-display').innerText = `LEVEL ${idx + 1}`;
    document.getElementById('progress').style.width = `${((idx + 1) / LEVELS.length) * 100}%`;
    document.getElementById('msg').innerText = "";
    selectedIdx = null; // 重置選取
    render(true); // true 代表初始化
}

function handleBottleClick(idx) {
    if (selectedIdx === null) {
        if (bottles[idx].length > 0) {
            selectedIdx = idx;
            render(); // 更新選取樣式 (垂直拿起)
        }
    } else {
        if (selectedIdx !== idx) {
            // moveWater 會自己處理動畫和 render，這裡不用全瓶 render
            moveWater(selectedIdx, idx);
        }
        selectedIdx = null;
        render(); // 取消選取樣式
    }
}

// 重置函式也要改為 true
function resetLevel() { initLevel(currentLevel); }

// 啟動
initLevel(currentLevel);

// 檢查勝利條件
function checkWin() {
    return bottles.every(b => {
        // 1. 空瓶子算過關
        if (b.length === 0) return true;

        // 2. 檢查瓶內顏色是否全部相同
        const isAllSameColor = b.every(c => c === b[0]);
        if (!isAllSameColor) return false;

        // 3. 檢查這個顏色是否已經全部收集到這一瓶了
        // 我們去原來的 LEVELS 資料裡算一下這個顏色總共有幾個
        const targetColor = b[0];
        let totalCountInLevel = 0;
        LEVELS[currentLevel].b.forEach(bottleData => {
            bottleData.forEach(c => {
                if (c === targetColor) totalCountInLevel++;
            });
        });

        // 如果瓶子裡的數量等於該關卡的顏色總數，這瓶就算完成了
        return b.length === totalCountInLevel;
    });
}

//進入下一關邏輯
function nextLevel() {
    const msgDiv = document.getElementById('msg');
    msgDiv.innerText = "✨ 太棒了！本關已完成！即將前往下一關 ✨";
    
    // 延遲 1.5 秒，讓玩家先看清楚過關畫面，再跳下一關
    setTimeout(() => {
        currentLevel++;
        if (currentLevel < LEVELS.length) {
            initLevel(currentLevel);
        } else {
            msgDiv.innerText = "🎉 全數通關！ 🎉";
            // 如果想重新開始，可以加 currentLevel = 0; initLevel(0);
        }
    }, 1500);
}