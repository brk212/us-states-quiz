// US States Quiz Game using D3.js and TopoJSON for accurate map rendering

// State FIPS codes to names mapping
const stateNames = {
    "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
    "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
    "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii",
    "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
    "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
    "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
    "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
    "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
    "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio",
    "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island",
    "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas",
    "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
    "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
};

// Only the 50 states (excluding DC)
const fiftyStates = Object.entries(stateNames)
    .filter(([fips, name]) => fips !== "11")
    .map(([fips, name]) => ({ fips, name }));

class USStatesQuiz {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.attempts = 0;
        this.correctAnswers = 0;
        this.completedStates = new Set();
        this.remainingStates = [];
        this.currentState = null;
        this.statesGeoData = null;

        this.init();
    }

    async init() {
        await this.loadMap();
        this.bindEvents();
        this.startNewGame();
    }

    async loadMap() {
        const width = 960;
        const height = 600;

        const svg = d3.select("#us-map")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        // Load US topology data
        const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json");

        // Create path generator (already projected in Albers USA)
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
            .attr("data-name", d => stateNames[String(d.id).padStart(2, '0')] || "Unknown")
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
            this.startNewGame();
        });

        document.getElementById('skip-btn').addEventListener('click', () => {
            this.skipState();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.startNewGame();
        });
    }

    startNewGame() {
        // Reset all game state
        this.score = 0;
        this.streak = 0;
        this.maxStreak = 0;
        this.attempts = 0;
        this.correctAnswers = 0;
        this.completedStates = new Set();

        // Shuffle all 50 states
        this.remainingStates = [...fiftyStates];
        this.shuffleArray(this.remainingStates);

        // Reset UI
        this.updateScoreboard();
        this.hideFeedback();
        this.hideGameOver();
        this.resetMapColors();

        // Pick first state
        this.nextState();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    nextState() {
        if (this.remainingStates.length === 0) {
            this.endGame();
            return;
        }

        this.currentState = this.remainingStates.pop();
        document.getElementById('target-state').textContent = this.currentState.name;
    }

    handleStateClick(clickedFips) {
        if (!this.currentState) return;

        // Skip DC if clicked
        if (clickedFips === "11") return;

        this.attempts++;
        const clickedName = stateNames[clickedFips] || "Unknown";
        const statePath = d3.select(`path[data-fips="${clickedFips}"]`);
        const correctPath = d3.select(`path[data-fips="${this.currentState.fips}"]`);

        if (clickedFips === this.currentState.fips) {
            // Correct answer!
            this.correctAnswers++;
            this.score += 10 + (this.streak * 2); // Bonus for streaks
            this.streak++;
            this.maxStreak = Math.max(this.maxStreak, this.streak);

            // Visual feedback
            statePath.classed('correct', true);
            this.showFeedback(`✓ Correct! That's ${clickedName}!`, 'correct');

            // Mark as completed
            this.completedStates.add(clickedFips);

            setTimeout(() => {
                statePath.classed('correct', false).classed('completed', true);
                this.hideFeedback();
                this.nextState();
            }, 1000);
        } else {
            // Wrong answer
            this.streak = 0;

            // Visual feedback
            statePath.classed('incorrect', true);
            correctPath.classed('highlight', true);

            this.showFeedback(
                `✗ Wrong! That was ${clickedName}. ${this.currentState.name} is highlighted in yellow.`,
                'incorrect'
            );

            setTimeout(() => {
                statePath.classed('incorrect', false);
                correctPath.classed('highlight', false);
            }, 2000);
        }

        this.updateScoreboard();
    }

    skipState() {
        if (!this.currentState) return;

        this.streak = 0;

        // Highlight the correct state
        const correctPath = d3.select(`path[data-fips="${this.currentState.fips}"]`);
        correctPath.classed('highlight', true);

        this.showFeedback(`Skipped! ${this.currentState.name} is highlighted in yellow.`, 'incorrect');

        setTimeout(() => {
            correctPath.classed('highlight', false);
            this.hideFeedback();
            this.nextState();
        }, 2000);

        this.updateScoreboard();
    }

    updateScoreboard() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('progress').textContent = `${this.completedStates.size}/50`;
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
        this.currentState = null;

        const accuracy = this.attempts > 0
            ? Math.round((this.correctAnswers / this.attempts) * 100)
            : 0;

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('correct-count').textContent = this.correctAnswers;
        document.getElementById('accuracy').textContent = accuracy;
        document.getElementById('target-state').textContent = 'Complete!';

        this.showGameOver();
    }

    showGameOver() {
        document.getElementById('game-over').classList.remove('hidden');
    }

    hideGameOver() {
        document.getElementById('game-over').classList.add('hidden');
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new USStatesQuiz();
});
