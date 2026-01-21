// DOM Elements
const quizContainer = document.getElementById('quiz-container');
const modeSelection = document.getElementById('mode-selection');

// State
let allQuestions = []; // Store all data
let questions = [];    // Filtered for current mode
let currentQuestionIndex = 0;
let currentStepIndex = 0; // For step-trace mode

// Fetch questions based on mode
async function fetchQuestions(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        quizContainer.style.display = 'block';
        quizContainer.innerHTML = `<div class="error">問題データの読み込みに失敗しました。<br>${error.message}</div>`;
        return null;
    }
}

// Start specific mode
window.startMode = async function (modeType) {
    let jsonFile = '';

    if (modeType === 'result') {
        jsonFile = './data/questions_qa.json';
    } else if (modeType === 'step-trace') {
        jsonFile = './data/questions_trace.json';
    } else if (modeType === 'trace-table') {
        jsonFile = './data/questions_trace_table.json';
    }

    if (!jsonFile) return;

    // Show loading or similar if needed? For now just fetch.
    const fetchedData = await fetchQuestions(jsonFile);
    if (!fetchedData) return;

    questions = fetchedData;
    // Note: No need to filter by type if files are strictly separated,
    // but keeping a check might be safe. For now assuming files are correct.

    if (questions.length === 0) {
        alert('このモードの問題データがまだありません。');
        return;
    }

    // Switch UI
    modeSelection.style.display = 'none';
    quizContainer.style.display = 'block';
    // Toggle Header Back Links
    const backToTop = document.getElementById('back-to-top-link');
    const backToMode = document.getElementById('back-to-mode-link');
    if (backToTop) backToTop.style.display = 'none';
    if (backToMode) backToMode.style.display = 'block';

    // Reset and Render
    currentQuestionIndex = 0;
    renderQuestion();
}

// Render current question
function renderQuestion() {
    if (questions.length === 0) {
        quizContainer.innerHTML = `
            <div class="quiz-card" style="text-align: center;">
                <h2>問題がありません</h2>
                <button class="next-btn" onclick="location.reload()">モード選択に戻る</button>
            </div>`;
        return;
    }

    const question = questions[currentQuestionIndex];
    currentStepIndex = 0; // Reset step on new question

    // Check type
    if (question.type === 'step-trace') {
        renderStepTrace(question);
    } else if (question.type === 'trace-table') {
        renderTraceTablePuzzle(question);
    } else {
        renderResultQuiz(question);
    }
}

// Exit Mode (Back to Selection)
window.exitMode = function () {
    quizContainer.style.display = 'none';
    modeSelection.style.display = 'block';
    // Toggle Header Back Links
    const backToTop = document.getElementById('back-to-top-link');
    const backToMode = document.getElementById('back-to-mode-link');
    if (backToTop) backToTop.style.display = 'inline'; // or block/flex
    if (backToMode) backToMode.style.display = 'none';
}

// Render Standard Result Quiz
function renderResultQuiz(question) {
    quizContainer.innerHTML = `
        <div class="quiz-card">
            <div class="code-section">
                <div class="code-header">
                    <span>Pseudo Code</span>
                    ${renderControls()}
                </div>
                <div class="code-content" id="code-content">${escapeHtml(question.code)}</div>
            </div>

            <div class="question-section">
                <h2 class="question-title">Q${currentQuestionIndex + 1}. ${question.title}</h2>
                <div class="badge-type">結果予測</div>
                <p class="question-text">${question.question}</p>
                
                <div class="options-grid" id="options-grid">
                    ${question.options.map((opt, index) => `
                        <button class="option-btn" onclick="checkAnswer(this, ${opt.isCorrect})">
                            <span class="opt-label">${String.fromCharCode(97 + index)}.</span> ${opt.text}
                        </button>
                    `).join('')}
                </div>

                <div id="feedback-area"></div>
            </div>
        </div>
    `;
}

// Render Step Trace Quiz
function renderStepTrace(question) {
    // Split code into lines for highlighting
    const lines = question.code.split('\n');
    const codeHtml = lines.map((line, idx) =>
        `<div class="code-line" data-line="${idx + 1}" data-line-num="${idx + 1}">${escapeHtml(line) || '&nbsp;'}</div>`
    ).join('');

    quizContainer.innerHTML = `
        <div class="quiz-card">
            <div class="code-section">
                <div class="code-header">
                    <span>Step Trace</span>
                    ${renderControls()}
                </div>
                <div class="code-content" id="code-content">${codeHtml}</div>
            </div>

            <div class="question-section" id="step-question-section">
                <!-- Content will be injected by updateStepUI -->
            </div>
        </div>
    `;
    updateStepUI();
}

// Update Step UI
function updateStepUI() {
    const question = questions[currentQuestionIndex];
    const step = question.steps[currentStepIndex];
    const section = document.getElementById('step-question-section');

    // Highlight Line
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active-line'));
    const activeLine = document.querySelector(`.code-line[data-line="${step.line}"]`);
    if (activeLine) {
        activeLine.classList.add('active-line');
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Render Question
    section.innerHTML = `
        <h2 class="question-title">Q${currentQuestionIndex + 1}. ${question.title} (Step ${currentStepIndex + 1}/${question.steps.length})</h2>
        <div class="badge-type step">トレース実行中</div>
        <p class="question-text">${step.question}</p>
        
        <div class="options-grid" id="options-grid">
            ${step.options.map((opt, index) => `
                <button class="option-btn" onclick="checkStepAnswer(this, ${opt.isCorrect})">
                    <span class="opt-label">${String.fromCharCode(97 + index)}.</span> ${opt.text}
                </button>
            `).join('')}
        </div>

        <div id="feedback-area"></div>
    `;
}

// Helper: Render Controls
function renderControls() {
    return `
        <div class="code-controls">
            <button onclick="toggleWrap()" class="control-btn" title="折り返し切り替え">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 12h16M4 12l4-4m-4 4l4 4"/>
                </svg>
            </button>
            <button onclick="adjustFontSize(-2)" class="control-btn" title="縮小">A-</button>
            <button onclick="adjustFontSize(2)" class="control-btn" title="拡大">A+</button>
        </div>
    `;
}

// Code View Controls
let currentFontSize = 14; // Default px
window.adjustFontSize = function (delta) {
    const codeContent = document.getElementById('code-content');
    currentFontSize = Math.max(10, Math.min(24, currentFontSize + delta));
    codeContent.style.fontSize = `${currentFontSize}px`;
}

window.toggleWrap = function () {
    const codeContent = document.getElementById('code-content');
    codeContent.classList.toggle('wrap-text');
}

// Adjust Code Section Height
let currentCodeHeight = 250; // Default height in px
window.adjustCodeHeight = function (delta) {
    const codeSection = document.getElementById('code-section-puzzle');
    if (!codeSection) return; // Only for puzzle mode

    currentCodeHeight = Math.max(150, Math.min(600, currentCodeHeight + delta));
    codeSection.style.maxHeight = `${currentCodeHeight}px`;
}

// Check Answer (For Step Trace)
window.checkStepAnswer = function (btn, isCorrect) {
    const parentGrid = document.getElementById('options-grid');
    const buttons = parentGrid.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('incorrect');
        // Retrieve correct one
        const question = questions[currentQuestionIndex];
        const step = question.steps[currentStepIndex];
        const correctIndex = step.options.findIndex(o => o.isCorrect);
        if (correctIndex !== -1) buttons[correctIndex].classList.add('correct');
    }

    const question = questions[currentQuestionIndex];
    const step = question.steps[currentStepIndex];
    const isLastStep = currentStepIndex === question.steps.length - 1;

    document.getElementById('feedback-area').innerHTML = `
        <div class="explanation-panel">
            <span class="explanation-title">${isCorrect ? '正解！' : '不正解...'}</span>
            <p>${step.explanation}</p>
            <button class="next-btn" onclick="${isLastStep ? 'nextQuestion()' : 'nextStep()'}">
                ${isLastStep ? 'この問題の完了' : '次のステップへ'}
            </button>
        </div>
    `;
}

// Next Step
window.nextStep = function () {
    currentStepIndex++;
    updateStepUI();
}

// Check Answer (For Standard)
window.checkAnswer = function (btn, isCorrect) {
    const parentGrid = document.getElementById('options-grid');
    const buttons = parentGrid.querySelectorAll('.option-btn');

    // Disable all buttons
    buttons.forEach(b => b.disabled = true);

    // Apply styles
    if (isCorrect) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('incorrect');
        // Retrieve and highlight the correct answer
        const question = questions[currentQuestionIndex];
        const correctIndex = question.options.findIndex(o => o.isCorrect);
        if (correctIndex !== -1) {
            buttons[correctIndex].classList.add('correct');
        }
    }

    // Show Explanation
    const question = questions[currentQuestionIndex];
    const feedbackArea = document.getElementById('feedback-area');
    feedbackArea.innerHTML = `
        <div class="explanation-panel">
            <span class="explanation-title">${isCorrect ? '正解！' : '不正解...'}</span>
            <p>${question.explanation}</p>
            <button class="next-btn" onclick="nextQuestion()">次の問題へ</button>
        </div>
    `;
}

// Next Question
window.nextQuestion = function () {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        renderQuestion();
    } else {
        // Results (Simple Version)
        quizContainer.innerHTML = `
            <div class="quiz-card" style="display: block; text-align: center;">
                <h2>すべて完了！</h2>
                <p>お疲れ様でした。</p>
                <button class="next-btn" onclick="location.reload()">もう一度</button>
            </div>
        `;
    }
}

// Utility: Escape HTML to detect XSS
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===== TRACE TABLE PUZZLE MODE =====
let currentRowIndex = 0;
let currentPlacements = {}; // Track current placements {variable: value}

// Render Trace Table Puzzle
function renderTraceTablePuzzle(question) {
    currentRowIndex = 0;
    currentPlacements = {};

    // Split code into lines for highlighting
    const lines = question.code.split('\n');
    const codeHtml = lines.map((line, idx) =>
        `<div class="code-line" data-line="${idx + 1}" data-line-num="${idx + 1}">${escapeHtml(line) || '&nbsp;'}</div>`
    ).join('');

    quizContainer.innerHTML = `
        <div class="quiz-card">
            <div class="code-section sticky-code" id="code-section-puzzle">
                <div class="code-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button onclick="toggleCodeSection()" class="control-btn" id="collapse-btn" title="折り畳み/展開">
                            <span class="toggle-icon">▼</span>
                        </button>
                        <span>Trace Table Puzzle</span>
                    </div>
                    <div class="code-controls">
                        <button onclick="adjustCodeHeight(-50)" class="control-btn" title="高さを縮小">H-</button>
                        <button onclick="adjustCodeHeight(50)" class="control-btn" title="高さを拡大">H+</button>
                        <button onclick="toggleWrap()" class="control-btn" title="折り返し切り替え">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 12h16M4 12l4-4m-4 4l4 4"/>
                            </svg>
                        </button>
                        <button onclick="adjustFontSize(-2)" class="control-btn" title="縮小">A-</button>
                        <button onclick="adjustFontSize(2)" class="control-btn" title="拡大">A+</button>
                    </div>
                </div>
                <div class="code-content" id="code-content">${codeHtml}</div>
            </div>

            <div class="question-section" id="trace-table-section">
                <!-- Content will be injected by updateTraceTableUI -->
            </div>
        </div>
    `;
    updateTraceTableUI();
}

// Toggle Code Section Visibility (Mobile)
window.toggleCodeSection = function () {
    const codeSection = document.getElementById('code-section-puzzle');
    const toggleIcon = document.querySelector('.toggle-icon');

    if (codeSection.classList.contains('collapsed')) {
        codeSection.classList.remove('collapsed');
        toggleIcon.textContent = '▼';
    } else {
        codeSection.classList.add('collapsed');
        toggleIcon.textContent = '▶';
    }
};

// Update Trace Table UI
// Update Trace Table UI
function updateTraceTableUI() {
    // Save scroll position of table container if it exists
    const tableContainer = document.querySelector('.trace-table-container');
    const scrollX = tableContainer ? tableContainer.scrollLeft : 0;

    // Save page scroll position might be needed too, but mainly horizontal scroll is the issue
    // const scrollY = window.scrollY;

    const question = questions[currentQuestionIndex];
    const row = question.rows[currentRowIndex];
    const section = document.getElementById('trace-table-section');

    // Highlight current line
    document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active-line'));
    const activeLine = document.querySelector(`.code-line[data-line="${row.line}"]`);
    if (activeLine) {
        activeLine.classList.add('active-line');
        // Removed scrollIntoView to prevent unwanted scroll jump on mobile
        // activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Build completed rows HTML
    let completedRowsHtml = '';
    for (let i = 0; i < currentRowIndex; i++) {
        const completedRow = question.rows[i];
        const cells = question.variables.map(varName =>
            `<td class="trace-cell">${escapeHtml(completedRow.correctValues[varName])}</td>`
        ).join('');
        completedRowsHtml += `<tr class="trace-row completed"><td>${i + 1}</td>${cells}</tr>`;
    }

    // Build current row with drop zones
    const currentRowCells = question.variables.map(varName => {
        const placedPieceId = currentPlacements[varName];
        const placedValue = placedPieceId ? placedPieceId.split('_')[0] : ''; // Extract value from ID
        const filledClass = placedValue ? 'filled' : '';
        const clickHandler = placedValue ? `onclick="removePiece('${varName}')"` : '';
        return `<td class="trace-cell">
            <div class="drop-zone ${filledClass}" data-variable="${varName}" ondrop="handleDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ${clickHandler} style="${placedValue ? 'cursor: pointer;' : ''}" title="${placedValue ? 'クリックで削除' : ''}">
                ${placedValue ? `<span class="placed-piece">${escapeHtml(placedValue)}</span>` : '?'}
            </div>
        </td>`;
    }).join('');

    // Build puzzle pieces with unique IDs
    const allPieces = [];
    let pieceIdCounter = 0;
    question.variables.forEach(varName => {
        row.pieces[varName].forEach(piece => {
            allPieces.push({
                id: `${piece}_${pieceIdCounter++}`, // Unique ID
                variable: varName,
                value: piece
            });
        });
    });

    // Shuffle pieces
    shuffleArray(allPieces);

    // Filter out already placed pieces by ID
    const placedPieceIds = Object.values(currentPlacements);
    const availablePieces = allPieces.filter(p => {
        return !placedPieceIds.includes(p.id);
    });

    const piecesHtml = availablePieces.map((piece, idx) =>
        `<div class="puzzle-piece" 
            draggable="true" 
            data-piece-id="${escapeHtml(piece.id)}" 
            data-value="${escapeHtml(piece.value)}" 
            ondragstart="handleDragStart(event)" 
            ondragend="handleDragEnd(event)"
            ontouchstart="handleTouchStart(event, '${escapeHtml(piece.id)}', '${escapeHtml(piece.value)}')"
            ontouchmove="handleTouchMove(event)"
            ontouchend="handleTouchEnd(event)">
            ${escapeHtml(piece.value)}
        </div>`
    ).join('');

    section.innerHTML = `
        <h2 class="question-title">Q${currentQuestionIndex + 1}. ${question.title} (行 ${currentRowIndex + 1}/${question.rows.length})</h2>
        <div class="badge-type puzzle">トレース表パズル</div>
        <p class="question-text">トレース表の行${currentRowIndex + 1}を完成させてください。パズルピースをドラッグして配置してください。</p>
        
        <div class="trace-table-container">
            <table class="trace-table">
                <thead>
                    <tr>
                        <th>行</th>
                        ${question.variables.map(v => `<th>${escapeHtml(v)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${completedRowsHtml}
                    <tr class="trace-row current">
                        <td>${currentRowIndex + 1}</td>
                        ${currentRowCells}
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="puzzle-pieces-container">
            <h3>パズルピース</h3>
            <div class="puzzle-pieces" id="puzzle-pieces">
                ${piecesHtml}
            </div>
        </div>

        <div class="action-buttons">
            <button class="next-btn" onclick="checkTraceTableRow()" ${Object.keys(currentPlacements).length !== question.variables.length ? 'disabled' : ''}>確認する</button>
        </div>

        <div id="feedback-area"></div>
    `;

    // Restore scroll position
    const newTableContainer = document.querySelector('.trace-table-container');
    if (newTableContainer) {
        newTableContainer.scrollLeft = scrollX;
    }
}

// Drag and Drop Handlers
window.handleDragStart = function (event) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', event.target.dataset.pieceId); // Transfer piece ID
    event.target.classList.add('dragging');
}

window.handleDragEnd = function (event) {
    event.target.classList.remove('dragging');
}

window.handleDragOver = function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('drag-over');
}

window.handleDragLeave = function (event) {
    event.currentTarget.classList.remove('drag-over');
}

window.handleDrop = function (event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    const pieceId = event.dataTransfer.getData('text/plain');
    const variable = event.currentTarget.dataset.variable;

    // Remove old placement if exists
    if (currentPlacements[variable]) {
        delete currentPlacements[variable];
    }

    // Add new placement with piece ID
    currentPlacements[variable] = pieceId;

    // Re-render
    updateTraceTableUI();
}

// Remove Piece (Click to remove)
window.removePiece = function (variable) {
    if (currentPlacements[variable]) {
        delete currentPlacements[variable];
        updateTraceTableUI();
    }
}

// ===== TOUCH EVENT SUPPORT FOR MOBILE =====
let touchedPiece = null;
let touchedPieceClone = null;
let touchStartX = 0;
let touchStartY = 0;

// Touch Start - Pick up piece
window.handleTouchStart = function (event, pieceId, pieceValue) {
    event.preventDefault();

    touchedPiece = {
        id: pieceId,
        value: pieceValue,
        element: event.target
    };

    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    // Create visual clone for dragging
    touchedPieceClone = event.target.cloneNode(true);
    touchedPieceClone.style.position = 'fixed';
    touchedPieceClone.style.left = touch.clientX - event.target.offsetWidth / 2 + 'px';
    touchedPieceClone.style.top = touch.clientY - event.target.offsetHeight / 2 + 'px';
    touchedPieceClone.style.opacity = '0.8';
    touchedPieceClone.style.pointerEvents = 'none';
    touchedPieceClone.style.zIndex = '1000';
    document.body.appendChild(touchedPieceClone);

    // Add dragging class to original
    event.target.classList.add('dragging');
}

// Touch Move - Drag piece
window.handleTouchMove = function (event) {
    if (!touchedPiece || !touchedPieceClone) return;
    event.preventDefault();

    const touch = event.touches[0];
    touchedPieceClone.style.left = touch.clientX - touchedPieceClone.offsetWidth / 2 + 'px';
    touchedPieceClone.style.top = touch.clientY - touchedPieceClone.offsetHeight / 2 + 'px';

    // Highlight drop zone under touch
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('drag-over'));

    if (elementUnder && elementUnder.classList.contains('drop-zone')) {
        elementUnder.classList.add('drag-over');
    } else if (elementUnder && elementUnder.closest('.drop-zone')) {
        elementUnder.closest('.drop-zone').classList.add('drag-over');
    }
}

// Touch End - Drop piece
window.handleTouchEnd = function (event) {
    if (!touchedPiece || !touchedPieceClone) return;
    event.preventDefault();

    const touch = event.changedTouches[0];
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);

    // Find drop zone
    let dropZone = null;
    if (elementUnder && elementUnder.classList.contains('drop-zone')) {
        dropZone = elementUnder;
    } else if (elementUnder && elementUnder.closest('.drop-zone')) {
        dropZone = elementUnder.closest('.drop-zone');
    }

    // Drop the piece
    if (dropZone) {
        const variable = dropZone.dataset.variable;

        // Remove old placement if exists
        if (currentPlacements[variable]) {
            delete currentPlacements[variable];
        }

        // Add new placement
        currentPlacements[variable] = touchedPiece.id;

        // Re-render
        updateTraceTableUI();
    }

    // Cleanup
    if (touchedPieceClone && touchedPieceClone.parentNode) {
        document.body.removeChild(touchedPieceClone);
    }
    if (touchedPiece && touchedPiece.element) {
        touchedPiece.element.classList.remove('dragging');
    }
    document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('drag-over'));

    touchedPiece = null;
    touchedPieceClone = null;
}

// Check Trace Table Row
window.checkTraceTableRow = function () {
    const question = questions[currentQuestionIndex];
    const row = question.rows[currentRowIndex];

    // Check if all cells are filled
    if (Object.keys(currentPlacements).length !== question.variables.length) {
        alert('すべてのセルにピースを配置してください。');
        return;
    }

    // Validate answers
    let allCorrect = true;
    const results = {};

    question.variables.forEach(varName => {
        const placedPieceId = currentPlacements[varName];
        const userAnswer = placedPieceId ? placedPieceId.split('_')[0] : ''; // Extract value from ID
        const correctAnswer = row.correctValues[varName];
        results[varName] = userAnswer === correctAnswer;
        if (!results[varName]) allCorrect = false;
    });

    // Disable further interaction
    document.querySelectorAll('.puzzle-piece').forEach(p => p.draggable = false);
    document.querySelectorAll('.drop-zone').forEach(z => {
        z.ondrop = null;
        z.ondragover = null;
    });

    // Show feedback with color coding
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        const varName = zone.dataset.variable;
        if (results[varName]) {
            zone.classList.add('correct');
        } else {
            zone.classList.add('incorrect');
            // Show correct answer
            const correctAnswer = row.correctValues[varName];
            zone.innerHTML += `<div class="correct-hint">正解: ${escapeHtml(correctAnswer)}</div>`;
        }
    });

    const isLastRow = currentRowIndex === question.rows.length - 1;

    document.getElementById('feedback-area').innerHTML = `
        <div class="explanation-panel">
            <span class="explanation-title">${allCorrect ? '正解！' : '不正解...'}</span>
            <p>${row.explanation}</p>
            <button class="next-btn" onclick="${isLastRow ? 'nextQuestion()' : 'nextTraceTableRow()'}">
                ${isLastRow ? 'この問題の完了' : '次の行へ'}
            </button>
        </div>
    `;
}

// Next Trace Table Row
window.nextTraceTableRow = function () {
    currentRowIndex++;
    currentPlacements = {};
    updateTraceTableUI();
}

// Utility: Shuffle Array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // No initial fetch needed
});
