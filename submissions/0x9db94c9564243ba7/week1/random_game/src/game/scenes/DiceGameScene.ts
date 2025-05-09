import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class DiceGameScene extends Phaser.Scene {
    private dice1: Phaser.GameObjects.Sprite;
    private dice2: Phaser.GameObjects.Sprite;
    private rollButton: Phaser.GameObjects.Text;
    private scoreText: Phaser.GameObjects.Text;
    private isRolling: boolean = false;
    private dice1Value: number = 1;
    private dice2Value: number = 1;
    private background: Phaser.GameObjects.Image;
    private isMobile: boolean = false;
    
    constructor() {
        super({ key: 'DiceGameScene' });
    }
    
    preload() {
        // Load the spritesheet with correct frame dimensions
        this.load.spritesheet('dice', 'assets/dice.png', {
            frameWidth: 256,
            frameHeight: 256
        });
    }
    
    create() {
        // Check if running on mobile
        this.isMobile = this.scale.width < 768 || this.sys.game.device.os.android || this.sys.game.device.os.iOS;
        
        // Set background to fit screen
        this.background = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
        this.background.setDisplaySize(this.scale.width, this.scale.height);

        // Set game title with responsive positioning
        const titleY = this.isMobile ? 150 : 200;
        const title = this.add.text(this.scale.width / 2, titleY, 'FLOW Onchain Craps', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add back button
        const backButton = this.add.text(50, 50, '← Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start('MainMenu'));

        // Calculate dice positioning based on screen size
        const diceScale = this.isMobile ? 0.3 : 0.45;
        const diceY = this.isMobile ? this.scale.height / 2 - 50 : 300;
        const diceGap = this.isMobile ? 100 : 150;
        
        // Create two dice sprites side by side
        this.dice1 = this.add.sprite(this.scale.width / 2 - diceGap / 2, diceY, 'dice', 0)
            .setScale(diceScale);
            
        this.dice2 = this.add.sprite(this.scale.width / 2 + diceGap / 2, diceY, 'dice', 0)
            .setScale(diceScale);

        // Create roll button with responsive positioning
        const buttonY = this.isMobile ? this.scale.height / 2 + 100 : 450;
        this.rollButton = this.add.text(this.scale.width / 2, buttonY, 'Roll Dice', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.rollDice())
        .on('pointerover', () => this.rollButton.setStyle({ backgroundColor: '#333333' }))
        .on('pointerout', () => this.rollButton.setStyle({ backgroundColor: '#000000' }));

        // Create score text with responsive positioning
        const scoreY = this.isMobile ? this.scale.height / 2 + 170 : 550;
        this.scoreText = this.add.text(this.scale.width / 2, scoreY, 'Score: 0', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add resize handler to adjust layout when the screen size changes
        this.scale.on('resize', this.resize, this);

        // Emit scene ready event
        EventBus.emit('current-scene-ready', this);
    }
    
    // Handle resize events for responsiveness
    resize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;
        
        this.isMobile = width < 768;
        
        // Update background
        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);
        
        // Update title
        const title = this.children.getByName('title') as Phaser.GameObjects.Text;
        if (title) {
            title.setPosition(width / 2, this.isMobile ? 150 : 200);
            title.setFontSize(this.isMobile ? 24 : 32);
        }
        
        // Update dice positions
        const diceScale = this.isMobile ? 0.3 : 0.45;
        const diceY = this.isMobile ? height / 2 - 50 : 300;
        const diceGap = this.isMobile ? 100 : 150;
        
        this.dice1.setPosition(width / 2 - diceGap / 2, diceY);
        this.dice1.setScale(diceScale);
        
        this.dice2.setPosition(width / 2 + diceGap / 2, diceY);
        this.dice2.setScale(diceScale);
        
        // Update button position
        const buttonY = this.isMobile ? height / 2 + 100 : 450;
        this.rollButton.setPosition(width / 2, buttonY);
        this.rollButton.setFontSize(32);
        
        // Update score text position
        const scoreY = this.isMobile ? height / 2 + 170 : 550;
        this.scoreText.setPosition(width / 2, scoreY);
        this.scoreText.setFontSize(32);
    }
    
    update() {
        // Game loop - will be used for animations later
    }
    
    // Helper method to update score text (used by React component)
    updateScoreText(text: string) {
        if (this.scoreText) {
            this.scoreText.setText(text);
        }
    }

    private rollDice() {
        if (this.isRolling) return;
        
        console.log('Starting dice roll');
        this.isRolling = true;
        this.rollButton.setStyle({ backgroundColor: '#666666' });
        
        // Create a timer for 3 seconds of rolling
        const rollDuration = 3000; // 3 seconds
        const rollInterval = 100; // Update every 100ms
        const startTime = Date.now();
        
        // Create the rolling animation
        const rollAnimation = this.time.addEvent({
            delay: rollInterval,
            callback: () => {
                // Generate random numbers between 1 and 6 for visual effect
                const randomDice1 = Phaser.Math.Between(1, 6);
                const randomDice2 = Phaser.Math.Between(1, 6);
                
                // Update the dice sprites with random values during animation
                this.dice1.setFrame(randomDice1 - 1);
                this.dice2.setFrame(randomDice2 - 1);
                
                // Add some rotation animation
                this.dice1.angle += 45;
                this.dice2.angle -= 45;
                
                // Add some bounce effect
                this.dice1.y = (this.isMobile ? this.scale.height / 2 - 50 : 300) + Math.sin(Date.now() / 100) * 10;
                this.dice2.y = (this.isMobile ? this.scale.height / 2 - 50 : 300) + Math.sin(Date.now() / 100 + Math.PI) * 10;
                
                // Check if we should stop rolling
                if (Date.now() - startTime >= rollDuration) {
                    rollAnimation.remove();
                    this.isRolling = false;
                    this.rollButton.setStyle({ backgroundColor: '#000000' });
                    
                    // Reset dice position and rotation
                    this.dice1.angle = 0;
                    this.dice2.angle = 0;
                    this.dice1.y = this.isMobile ? this.scale.height / 2 - 50 : 300;
                    this.dice2.y = this.isMobile ? this.scale.height / 2 - 50 : 300;
                    
                    // Emit a custom event that the roll is complete
                    console.log('Emitting diceRollComplete event');
                    this.events.emit('diceRollComplete');
                }
            },
            callbackScope: this,
            loop: true
        });
    }
} 