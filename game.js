// US States Quiz Game using D3.js and TopoJSON for accurate map rendering

// State data: FIPS codes, names, capitals, and mottos
const stateData = {
    "01": { name: "Alabama", capital: "Montgomery", motto: "We Dare Defend Our Rights" },
    "02": { name: "Alaska", capital: "Juneau", motto: "North to the Future" },
    "04": { name: "Arizona", capital: "Phoenix", motto: "God Enriches" },
    "05": { name: "Arkansas", capital: "Little Rock", motto: "The People Rule" },
    "06": { name: "California", capital: "Sacramento", motto: "Eureka" },
    "08": { name: "Colorado", capital: "Denver", motto: "Nothing Without Providence" },
    "09": { name: "Connecticut", capital: "Hartford", motto: "He Who Transplanted Still Sustains" },
    "10": { name: "Delaware", capital: "Dover", motto: "Liberty and Independence" },
    "12": { name: "Florida", capital: "Tallahassee", motto: "In God We Trust" },
    "13": { name: "Georgia", capital: "Atlanta", motto: "Wisdom, Justice, and Moderation" },
    "15": { name: "Hawaii", capital: "Honolulu", motto: "The Life of the Land is Perpetuated in Righteousness" },
    "16": { name: "Idaho", capital: "Boise", motto: "Let It Be Perpetual" },
    "17": { name: "Illinois", capital: "Springfield", motto: "State Sovereignty, National Union" },
    "18": { name: "Indiana", capital: "Indianapolis", motto: "The Crossroads of America" },
    "19": { name: "Iowa", capital: "Des Moines", motto: "Our Liberties We Prize and Our Rights We Will Maintain" },
    "20": { name: "Kansas", capital: "Topeka", motto: "To the Stars Through Difficulties" },
    "21": { name: "Kentucky", capital: "Frankfort", motto: "United We Stand, Divided We Fall" },
    "22": { name: "Louisiana", capital: "Baton Rouge", motto: "Union, Justice, Confidence" },
    "23": { name: "Maine", capital: "Augusta", motto: "I Lead" },
    "24": { name: "Maryland", capital: "Annapolis", motto: "Manly Deeds, Womanly Words" },
    "25": { name: "Massachusetts", capital: "Boston", motto: "By the Sword We Seek Peace, But Peace Only Under Liberty" },
    "26": { name: "Michigan", capital: "Lansing", motto: "If You Seek a Pleasant Peninsula, Look About You" },
    "27": { name: "Minnesota", capital: "Saint Paul", motto: "The Star of the North" },
    "28": { name: "Mississippi", capital: "Jackson", motto: "By Valor and Arms" },
    "29": { name: "Missouri", capital: "Jefferson City", motto: "The Welfare of the People Shall Be the Supreme Law" },
    "30": { name: "Montana", capital: "Helena", motto: "Gold and Silver" },
    "31": { name: "Nebraska", capital: "Lincoln", motto: "Equality Before the Law" },
    "32": { name: "Nevada", capital: "Carson City", motto: "All for Our Country" },
    "33": { name: "New Hampshire", capital: "Concord", motto: "Live Free or Die" },
    "34": { name: "New Jersey", capital: "Trenton", motto: "Liberty and Prosperity" },
    "35": { name: "New Mexico", capital: "Santa Fe", motto: "It Grows as It Goes" },
    "36": { name: "New York", capital: "Albany", motto: "Ever Upward" },
    "37": { name: "North Carolina", capital: "Raleigh", motto: "To Be, Rather Than to Seem" },
    "38": { name: "North Dakota", capital: "Bismarck", motto: "Liberty and Union, Now and Forever, One and Inseparable" },
    "39": { name: "Ohio", capital: "Columbus", motto: "With God, All Things Are Possible" },
    "40": { name: "Oklahoma", capital: "Oklahoma City", motto: "Labor Conquers All Things" },
    "41": { name: "Oregon", capital: "Salem", motto: "She Flies With Her Own Wings" },
    "42": { name: "Pennsylvania", capital: "Harrisburg", motto: "Virtue, Liberty and Independence" },
    "44": { name: "Rhode Island", capital: "Providence", motto: "Hope" },
    "45": { name: "South Carolina", capital: "Columbia", motto: "While I Breathe, I Hope" },
    "46": { name: "South Dakota", capital: "Pierre", motto: "Under God the People Rule" },
    "47": { name: "Tennessee", capital: "Nashville", motto: "Agriculture and Commerce" },
    "48": { name: "Texas", capital: "Austin", motto: "Friendship" },
    "49": { name: "Utah", capital: "Salt Lake City", motto: "Industry" },
    "50": { name: "Vermont", capital: "Montpelier", motto: "Freedom and Unity" },
    "51": { name: "Virginia", capital: "Richmond", motto: "Thus Always to Tyrants" },
    "53": { name: "Washington", capital: "Olympia", motto: "By and By" },
    "54": { name: "West Virginia", capital: "Charleston", motto: "Mountaineers Are Always Free" },
    "55": { name: "Wisconsin", capital: "Madison", motto: "Forward" },
    "56": { name: "Wyoming", capital: "Cheyenne", motto: "Equal Rights" }
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
    MOTTOS: 'mottos',
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
                const mode = e.target.dataset.mode;
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
                const types = ['state', 'capital', 'motto'];
                const type = types[Math.floor(Math.random() * types.length)];
                return { ...state, questionType: type };
            });
            this.totalQuestions = 50;
        } else {
            const questionType = this.mode === MODES.STATES ? 'state' :
                                 this.mode === MODES.CAPITALS ? 'capital' : 'motto';
            this.remainingQuestions = states.map(state => ({ ...state, questionType }));
            this.totalQuestions = 50;
        }
    }

    getModeDisplayName() {
        switch (this.mode) {
            case MODES.STATES: return 'States';
            case MODES.CAPITALS: return 'Capitals';
            case MODES.MOTTOS: return 'Mottos';
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
            case 'motto':
                return `"${question.motto}"`;
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
            case MODES.MOTTOS: return 'Mottos';
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
