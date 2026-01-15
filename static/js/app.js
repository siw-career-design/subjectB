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
    } else {
        renderResultQuiz(question);
    }
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // No initial fetch needed
});
