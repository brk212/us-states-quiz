// US States Quiz Game using D3.js and TopoJSON for accurate map rendering

// State data: FIPS codes, names, capitals, and nicknames
const stateData = {
    "01": { name: "Alabama", capital: "Montgomery", nickname: "The Yellowhammer State" },
    "02": { name: "Alaska", capital: "Juneau", nickname: "The Last Frontier" },
    "04": { name: "Arizona", capital: "Phoenix", nickname: "The Grand Canyon State" },
    "05": { name: "Arkansas", capital: "Little Rock", nickname: "The Natural State" },
    "06": { name: "California", capital: "Sacramento", nickname: "The Golden State" },
    "08": { name: "Colorado", capital: "Denver", nickname: "The Centennial State" },
    "09": { name: "Connecticut", capital: "Hartford", nickname: "The Constitution State" },
    "10": { name: "Delaware", capital: "Dover", nickname: "The First State" },
    "12": { name: "Florida", capital: "Tallahassee", nickname: "The Sunshine State" },
    "13": { name: "Georgia", capital: "Atlanta", nickname: "The Peach State" },
    "15": { name: "Hawaii", capital: "Honolulu", nickname: "The Aloha State" },
    "16": { name: "Idaho", capital: "Boise", nickname: "The Gem State" },
    "17": { name: "Illinois", capital: "Springfield", nickname: "The Prairie State" },
    "18": { name: "Indiana", capital: "Indianapolis", nickname: "The Hoosier State" },
    "19": { name: "Iowa", capital: "Des Moines", nickname: "The Hawkeye State" },
    "20": { name: "Kansas", capital: "Topeka", nickname: "The Sunflower State" },
    "21": { name: "Kentucky", capital: "Frankfort", nickname: "The Bluegrass State" },
    "22": { name: "Louisiana", capital: "Baton Rouge", nickname: "The Pelican State" },
    "23": { name: "Maine", capital: "Augusta", nickname: "The Pine Tree State" },
    "24": { name: "Maryland", capital: "Annapolis", nickname: "The Old Line State" },
    "25": { name: "Massachusetts", capital: "Boston", nickname: "The Bay State" },
    "26": { name: "Michigan", capital: "Lansing", nickname: "The Great Lakes State" },
    "27": { name: "Minnesota", capital: "Saint Paul", nickname: "The North Star State" },
    "28": { name: "Mississippi", capital: "Jackson", nickname: "The Magnolia State" },
    "29": { name: "Missouri", capital: "Jefferson City", nickname: "The Show-Me State" },
    "30": { name: "Montana", capital: "Helena", nickname: "The Treasure State" },
    "31": { name: "Nebraska", capital: "Lincoln", nickname: "The Cornhusker State" },
    "32": { name: "Nevada", capital: "Carson City", nickname: "The Silver State" },
    "33": { name: "New Hampshire", capital: "Concord", nickname: "The Granite State" },
    "34": { name: "New Jersey", capital: "Trenton", nickname: "The Garden State" },
    "35": { name: "New Mexico", capital: "Santa Fe", nickname: "The Land of Enchantment" },
    "36": { name: "New York", capital: "Albany", nickname: "The Empire State" },
    "37": { name: "North Carolina", capital: "Raleigh", nickname: "The Tar Heel State" },
    "38": { name: "North Dakota", capital: "Bismarck", nickname: "The Peace Garden State" },
    "39": { name: "Ohio", capital: "Columbus", nickname: "The Buckeye State" },
    "40": { name: "Oklahoma", capital: "Oklahoma City", nickname: "The Sooner State" },
    "41": { name: "Oregon", capital: "Salem", nickname: "The Beaver State" },
    "42": { name: "Pennsylvania", capital: "Harrisburg", nickname: "The Keystone State" },
    "44": { name: "Rhode Island", capital: "Providence", nickname: "The Ocean State" },
    "45": { name: "South Carolina", capital: "Columbia", nickname: "The Palmetto State" },
    "46": { name: "South Dakota", capital: "Pierre", nickname: "The Mount Rushmore State" },
    "47": { name: "Tennessee", capital: "Nashville", nickname: "The Volunteer State" },
    "48": { name: "Texas", capital: "Austin", nickname: "The Lone Star State" },
    "49": { name: "Utah", capital: "Salt Lake City", nickname: "The Beehive State" },
    "50": { name: "Vermont", capital: "Montpelier", nickname: "The Green Mountain State" },
    "51": { name: "Virginia", capital: "Richmond", nickname: "The Old Dominion" },
    "53": { name: "Washington", capital: "Olympia", nickname: "The Evergreen State" },
    "54": { name: "West Virginia", capital: "Charleston", nickname: "The Mountain State" },
    "55": { name: "Wisconsin", capital: "Madison", nickname: "The Badger State" },
    "56": { name: "Wyoming", capital: "Cheyenne", nickname: "The Cowboy State" }
};

// Get list of 50 states (excluding DC)
const fiftyStates = Object.entries(stateData).map(([fips, data]) => ({
    fips,
    ...data
}));

// Game modes
const MODES = {
    STATES: 'states',
    CAPITALS: 'capitals',
    NICKNAMES: 'nicknames',
    WILDCARD: 'wildcard'
};

class USStatesQuiz {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.attempts = 0;
        this.correctAnswers = 0;
        this.completedStates = new Set();
        this.remainingQuestions = [];
        this.currentQuestion = null;
        this.statesGeoData = null;
        this.mode = null;
        this.timerInterval = null;
        this.startTime = null;
        this.elapsedSeconds = 0;
        this.totalQuestions = 50;

        this.init();
    }

    async init() {
        await this.loadMap();
        this.bindEvents();
        this.loadHighScores();
        this.showModeSelection();
    }

    async loadMap() {
        const width = 960;
        const height = 600;

        const svg = d3.select("#us-map")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Load US topology data
        const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json");

        // Create path generator
        const path = d3.geoPath();

        // Extract states features
        this.statesGeoData = topojson.feature(us, us.objects.states).features;

        // Draw states
        svg.append("g")
            .attr("class", "states")
            .selectAll("path")
            .data(this.statesGeoData)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "state")
            .attr("data-fips", d => String(d.id).padStart(2, '0'))
            .attr("data-name", d => stateData[String(d.id).padStart(2, '0')]?.name || "Unknown")
            .on("click", (event, d) => {
                const fips = String(d.id).padStart(2, '0');
                this.handleStateClick(fips);
            });

        // Draw state borders
        svg.append("path")
            .attr("class", "state-borders")
            .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
    }

    bindEvents() {
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.showModeSelection();
        });

        document.getElementById('skip-btn').addEventListener('click', () => {
            this.skipQuestion();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.showModeSelection();
        });

        document.getElementById('view-scores-btn').addEventListener('click', () => {
            this.showHighScores();
        });

        document.getElementById('close-scores-btn').addEventListener('click', () => {
            this.hideHighScores();
        });

        document.getElementById('submit-initials-btn').addEventListener('click', () => {
            this.submitHighScore();
        });

        // Mode selection buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.closest('.mode-btn').dataset.mode;
                this.startGame(mode);
            });
        });
    }

    showModeSelection() {
        this.stopTimer();
        document.getElementById('mode-selection').classList.remove('hidden');
        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('high-scores-modal').classList.add('hidden');
        document.getElementById('initials-modal').classList.add('hidden');
    }

    startGame(mode) {
        this.mode = mode;
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.attempts = 0;
        this.correctAnswers = 0;
        this.completedStates = new Set();
        this.elapsedSeconds = 0;

        // Generate questions based on mode
        this.generateQuestions();

        // Update UI
        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('game-area').classList.remove('hidden');
        document.getElementById('current-mode').textContent = this.getModeDisplayName();

        this.updateScoreboard();
        this.hideFeedback();
        this.hideGameOver();
        this.resetMapColors();

        // Start timer
        this.startTimer();

        // First question
        this.nextQuestion();
    }

    generateQuestions() {
        const states = [...fiftyStates];
        this.shuffleArray(states);

        if (this.mode === MODES.WILDCARD) {
            // Mix of all three types, 50 questions total
            this.remainingQuestions = states.map(state => {
                const types = ['state', 'capital', 'nickname'];
                const type = types[Math.floor(Math.random() * types.length)];
                return { ...state, questionType: type };
            });
            this.totalQuestions = 50;
        } else {
            let questionType;
            switch (this.mode) {
                case MODES.STATES:
                    questionType = 'state';
                    break;
                case MODES.CAPITALS:
                    questionType = 'capital';
                    break;
                case MODES.NICKNAMES:
                    questionType = 'nickname';
                    break;
                default:
                    questionType = 'state';
            }
            this.remainingQuestions = states.map(state => ({ ...state, questionType }));
            this.totalQuestions = 50;
        }
    }

    getModeDisplayName() {
        switch (this.mode) {
            case MODES.STATES: return 'States';
            case MODES.CAPITALS: return 'Capitals';
            case MODES.NICKNAMES: return 'Nicknames';
            case MODES.WILDCARD: return 'Wildcard';
            default: return '';
        }
    }

    getQuestionText(question) {
        switch (question.questionType) {
            case 'state':
                return question.name;
            case 'capital':
                return `Capital: ${question.capital}`;
            case 'nickname':
                return `"${question.nickname}"`;
            default:
                return question.name;
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    nextQuestion() {
        if (this.remainingQuestions.length === 0) {
            this.endGame();
            return;
        }

        this.currentQuestion = this.remainingQuestions.pop();
        document.getElementById('target-state').textContent = this.getQuestionText(this.currentQuestion);
    }

    handleStateClick(clickedFips) {
        if (!this.currentQuestion) return;

        // Skip DC if clicked
        if (clickedFips === "11") return;

        this.attempts++;
        const clickedState = stateData[clickedFips];
        const clickedName = clickedState?.name || "Unknown";
        const statePath = d3.select(`path[data-fips="${clickedFips}"]`);
        const correctPath = d3.select(`path[data-fips="${this.currentQuestion.fips}"]`);

        if (clickedFips === this.currentQuestion.fips) {
            // Correct answer!
            this.correctAnswers++;
            this.score += 10 + (this.streak * 2);
            this.streak++;
            this.maxStreak = Math.max(this.maxStreak, this.streak);

            statePath.classed('correct', true);
            this.showFeedback(`Correct! That's ${this.currentQuestion.name}!`, 'correct');

            this.completedStates.add(clickedFips);

            setTimeout(() => {
                statePath.classed('correct', false).classed('completed', true);
                this.hideFeedback();
                this.nextQuestion();
            }, 1000);
        } else {
            // Wrong answer
            this.streak = 0;

            statePath.classed('incorrect', true);
            correctPath.classed('highlight', true);

            let feedbackMsg = `Wrong! That was ${clickedName}. `;
            feedbackMsg += `${this.currentQuestion.name} is highlighted.`;

            this.showFeedback(feedbackMsg, 'incorrect');

            setTimeout(() => {
                statePath.classed('incorrect', false);
                correctPath.classed('highlight', false);
            }, 2000);
        }

        this.updateScoreboard();
    }

    skipQuestion() {
        if (!this.currentQuestion) return;

        this.streak = 0;

        const correctPath = d3.select(`path[data-fips="${this.currentQuestion.fips}"]`);
        correctPath.classed('highlight', true);

        this.showFeedback(`Skipped! ${this.currentQuestion.name} is highlighted.`, 'incorrect');

        setTimeout(() => {
            correctPath.classed('highlight', false);
            this.hideFeedback();
            this.nextQuestion();
        }, 2000);

        this.updateScoreboard();
    }

    // Timer functions
    startTimer() {
        this.startTime = Date.now();
        this.elapsedSeconds = 0;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = display;
    }

    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updateScoreboard() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('progress').textContent = `${this.completedStates.size}/${this.totalQuestions}`;
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
    }

    hideFeedback() {
        document.getElementById('feedback').className = 'feedback hidden';
    }

    resetMapColors() {
        d3.selectAll('#us-map path.state')
            .classed('correct', false)
            .classed('incorrect', false)
            .classed('highlight', false)
            .classed('completed', false);
    }

    endGame() {
        this.stopTimer();
        this.currentQuestion = null;

        const accuracy = this.attempts > 0
            ? Math.round((this.correctAnswers / this.attempts) * 100)
            : 0;

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-time').textContent = this.formatTime(this.elapsedSeconds);
        document.getElementById('correct-count').textContent = this.correctAnswers;
        document.getElementById('accuracy').textContent = accuracy;
        document.getElementById('target-state').textContent = 'Complete!';

        // Check if this is a high score
        if (this.isHighScore(this.score, this.elapsedSeconds)) {
            this.showInitialsModal();
        } else {
            this.showGameOver();
        }
    }

    showGameOver() {
        document.getElementById('game-over').classList.remove('hidden');
    }

    hideGameOver() {
        document.getElementById('game-over').classList.add('hidden');
    }

    // High Scores
    loadHighScores() {
        const stored = localStorage.getItem('usStatesQuizHighScores');
        this.highScores = stored ? JSON.parse(stored) : {};

        // Initialize arrays for each mode if not exists
        Object.values(MODES).forEach(mode => {
            if (!this.highScores[mode]) {
                this.highScores[mode] = [];
            }
        });
    }

    saveHighScores() {
        localStorage.setItem('usStatesQuizHighScores', JSON.stringify(this.highScores));
    }

    isHighScore(score, time) {
        const modeScores = this.highScores[this.mode] || [];
        if (modeScores.length < 10) return true;

        // Check if this score beats any existing score
        return modeScores.some(entry =>
            score > entry.score || (score === entry.score && time < entry.time)
        );
    }

    showInitialsModal() {
        document.getElementById('initials-modal').classList.remove('hidden');
        document.getElementById('initials-input').value = '';
        document.getElementById('initials-input').focus();
    }

    submitHighScore() {
        const initialsInput = document.getElementById('initials-input');
        let initials = initialsInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);

        if (initials.length < 1) {
            initials = 'AAA';
        }

        // Pad to 3 characters
        while (initials.length < 3) {
            initials += 'A';
        }

        const entry = {
            initials,
            score: this.score,
            time: this.elapsedSeconds,
            date: new Date().toISOString()
        };

        // Add to scores
        this.highScores[this.mode].push(entry);

        // Sort: higher score first, then faster time
        this.highScores[this.mode].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time - b.time;
        });

        // Keep only top 10
        this.highScores[this.mode] = this.highScores[this.mode].slice(0, 10);

        this.saveHighScores();

        document.getElementById('initials-modal').classList.add('hidden');
        this.showGameOver();
    }

    showHighScores() {
        const modal = document.getElementById('high-scores-modal');
        const content = document.getElementById('high-scores-content');

        let html = '';

        Object.entries(MODES).forEach(([key, mode]) => {
            const modeName = this.getModeDisplayNameStatic(mode);
            const scores = this.highScores[mode] || [];

            html += `<div class="high-score-section">`;
            html += `<h3>${modeName}</h3>`;

            if (scores.length === 0) {
                html += `<p class="no-scores">No scores yet</p>`;
            } else {
                html += `<table class="scores-table">`;
                html += `<tr><th>#</th><th>Name</th><th>Score</th><th>Time</th></tr>`;
                scores.forEach((entry, index) => {
                    html += `<tr>`;
                    html += `<td>${index + 1}</td>`;
                    html += `<td>${entry.initials}</td>`;
                    html += `<td>${entry.score}</td>`;
                    html += `<td>${this.formatTime(entry.time)}</td>`;
                    html += `</tr>`;
                });
                html += `</table>`;
            }

            html += `</div>`;
        });

        content.innerHTML = html;
        modal.classList.remove('hidden');
    }

    getModeDisplayNameStatic(mode) {
        switch (mode) {
            case MODES.STATES: return 'States';
            case MODES.CAPITALS: return 'Capitals';
            case MODES.NICKNAMES: return 'Nicknames';
            case MODES.WILDCARD: return 'Wildcard';
            default: return '';
        }
    }

    hideHighScores() {
        document.getElementById('high-scores-modal').classList.add('hidden');
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new USStatesQuiz();
});
