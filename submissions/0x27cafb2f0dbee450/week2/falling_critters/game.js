class FallingCrittersGame {
    constructor() {
        this.gameArea = document.getElementById('game-area');
        this.scoreElement = document.getElementById('score-value');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverScreen = document.getElementById('game-over');
        this.startScreen = document.getElementById('start-screen');
        this.startButton = document.getElementById('start-button');
        this.restartButton = document.getElementById('restart-button');
        this.scoreDisplay = document.getElementById('score');
        
        this.score = 0;
        this.gameSpeed = 2;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.critters = [];
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000;
        
        // List of animal images
        this.animalImages = [
            'images/deer.png',
            'images/owl.png',
            'images/frog.png',
            'images/fox.png',
            'images/wolf.png'
        ];

        this.init();
    }

    init() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restart());
    }

    startGame() {
        this.isGameStarted = true;
        this.startScreen.classList.add('hidden');
        this.scoreDisplay.classList.add('visible');
        this.gameLoop();
        this.speedIncreaseLoop();
    }

    restart() {
        this.score = 0;
        this.gameSpeed = 2;
        this.isGameOver = false;
        this.isGameStarted = true;
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000;
        this.scoreElement.textContent = '0';
        this.gameOverScreen.classList.add('hidden');
        this.scoreDisplay.classList.add('visible');
        
        // Remove all existing critters
        this.critters.forEach(critter => critter.element.remove());
        this.critters = [];
        
        // Start the game
        this.gameLoop();
        this.speedIncreaseLoop();
    }

    createCritter() {
        const critterElement = document.createElement('img');
        const randomAnimal = this.animalImages[Math.floor(Math.random() * this.animalImages.length)];
        
        critterElement.src = randomAnimal;
        critterElement.classList.add('critter');
        critterElement.style.width = '80px';  // Increased size
        critterElement.style.height = '80px';  // Increased size
        
        // Random horizontal position (adjusted for new size)
        const xPos = Math.random() * (this.gameArea.offsetWidth - 80);
        critterElement.style.left = `${xPos}px`;
        critterElement.style.top = '0px';
        
        this.gameArea.appendChild(critterElement);
        
        // Add click handler
        critterElement.addEventListener('click', () => this.catchCritter(critterElement));
        
        return {
            element: critterElement,
            speed: this.gameSpeed,
            position: 0
        };
    }

    catchCritter(element) {
        if (this.isGameOver) return;
        
        const index = this.critters.findIndex(critter => critter.element === element);
        if (index !== -1) {
            this.critters[index].element.remove();
            this.critters.splice(index, 1);
            this.score += 10;
            this.scoreElement.textContent = this.score;
            
            // Check if score reached 200
            if (this.score === 100) {
                // Open Flow developers website in a new tab
                window.open('https://developers.flow.com/', '_blank');
                // End the game with victory
                this.gameVictory();
            }
        }
    }

    gameLoop() {
        if (this.isGameOver || !this.isGameStarted) return;

        const currentTime = Date.now();
        
        // Spawn new critter
        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.critters.push(this.createCritter());
            this.lastSpawnTime = currentTime;
        }

        // Update critter positions
        this.critters.forEach((critter, index) => {
            critter.position += critter.speed;
            critter.element.style.top = `${critter.position}px`;

            // Check if critter hit the ground
            if (critter.position > this.gameArea.offsetHeight - 50) {
                this.gameOver();
                return;
            }
        });

        requestAnimationFrame(() => this.gameLoop());
    }

    speedIncreaseLoop() {
        if (this.isGameOver || !this.isGameStarted) return;
        
        this.gameSpeed += 0.2;
        this.critters.forEach(critter => {
            critter.speed = this.gameSpeed;
        });
        
        // Decrease spawn interval
        this.spawnInterval = Math.max(500, this.spawnInterval - 50);
        
        setTimeout(() => this.speedIncreaseLoop(), 1000);
    }

    gameOver() {
        this.isGameOver = true;
        this.isGameStarted = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
        this.scoreDisplay.classList.remove('visible');
    }

    gameVictory() {
        this.isGameOver = true;
        this.isGameStarted = false;
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
        this.scoreDisplay.classList.remove('visible');
        
        // Change game over text to show victory
        document.querySelector('#game-over h2').textContent = 'Congratulations!';
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new FallingCrittersGame();
}); 