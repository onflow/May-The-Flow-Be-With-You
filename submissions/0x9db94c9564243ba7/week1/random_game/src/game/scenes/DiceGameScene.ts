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
        // Add background
        this.background = this.add.image(512, 384, 'background');

        // Add back button
        const backButton = this.add.text(50, 50, '← Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
        .setInteractive()
        .on('pointerdown', () => this.scene.start('MainMenu'));

        // Initialize game objects
        this.add.text(512, 150, 'FLOW Community Craps', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create two dice sprites side by side
        this.dice1 = this.add.sprite(462, 300, 'dice', 0)
            .setScale(0.3); // Increased scale from 0.2 to 0.3
            
        this.dice2 = this.add.sprite(562, 300, 'dice', 0)
            .setScale(0.3);

        // Create roll button
        this.rollButton = this.add.text(512, 450, 'Roll Dice', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => this.rollDice())
        .on('pointerover', () => this.rollButton.setStyle({ backgroundColor: '#333333' }))
        .on('pointerout', () => this.rollButton.setStyle({ backgroundColor: '#000000' }));

        // Create score text
        this.scoreText = this.add.text(512, 550, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Emit scene ready event
        EventBus.emit('current-scene-ready', this);
    }
    
    update() {
        // Game loop - will be used for animations later
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
                this.dice1.y = 300 + Math.sin(Date.now() / 100) * 10;
                this.dice2.y = 300 + Math.sin(Date.now() / 100 + Math.PI) * 10;
                
                // Check if we should stop rolling
                if (Date.now() - startTime >= rollDuration) {
                    rollAnimation.remove();
                    this.isRolling = false;
                    this.rollButton.setStyle({ backgroundColor: '#000000' });
                    
                    // Reset dice position and rotation
                    this.dice1.angle = 0;
                    this.dice2.angle = 0;
                    this.dice1.y = 300;
                    this.dice2.y = 300;
                    
                    // Emit a custom event that the roll is complete
                    console.log('Emitting diceRollComplete event');
                    this.events.emit('diceRollComplete');
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    // Public method to update score text
    public updateScoreText(text: string) {
        console.log('updateScoreText called with:', text);
        if (this.scoreText) {
            this.scoreText.setText(text);
            console.log('Score text updated to:', text);
        } else {
            console.log('scoreText object not found!');
        }
    }
} 