

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d'); //c = context

canvas.width = window.innerWidth; //breedte van het canvas
canvas.height = window.innerHeight; //hoogte van het canvas

const gravity = 1 //zwaartekracht

const groundHeight = 70; // Hooe hoog de ondegrond is

const platformScaleFactor = 0.5; //de groottes van de platform images

// speed increase
const basePlayerMoveSpeed = 5;    // begin speed
const maxPlayerMoveSpeed = 12;   // de maximum speed
const scoreForMaxSpeed = 2000; // score waar de max speed is
let currentPlayerMoveSpeed = basePlayerMoveSpeed;

// Audio 
const jumpSound = new Audio('audio/jump.mp3');
const dodespinSound = new Audio('audio/dodespin.mp3');
const itemSound = new Audio('audio/itemsound.mp3');
const gameoverSound = new Audio('audio/gameover.mp3');
const achtergrondmuziekSound = new Audio('audio/achtergrondmuziek.mp3');
const smackSound = new Audio('audio/smack.mp3');

achtergrondmuziekSound.loop = true; // background music loop

//volume aanpassen als het nodig is
jumpSound.volume = 0.7;
achtergrondmuziekSound.volume = 0.5;
smackSound.volume = 0.6; 
dodespinSound.volume = 0.6; 

//preloaden
itemSound.preload = 'auto';
jumpSound.preload = 'auto';
gameoverSound.preload = 'auto';
achtergrondmuziekSound.preload = 'auto';
smackSound.preload = 'auto';
dodespinSound.preload = 'auto';

let isMusicPlaying = false;

// verschillende items die spawnen ipv alleen maar appels:
const itemTypes = [
    {name: 'appel', image: 'images/red-apple.png', probability: 0.85},
    {name: 'hart', image: 'images/hart.png', probability: 0.15},
]

let cumulativeProbability = 0;
itemTypes.forEach(item => {
    cumulativeProbability += item.probability;
    item.cumulativeProbability = cumulativeProbability;
})

function chooseRandomItem() {
    const randomNumber = Math.random();
    for (const item of itemTypes) {
        if (randomNumber <= item.cumulativeProbability) {
            return item;
        }
    }
    return itemTypes[itemTypes.length - 1]; // return de laatste item als er geen match is
}

// IMAGES
const groundImage = new Image();
groundImage.src = 'images/Ondergrond.png';

const capyFamilyImage = new Image();
capyFamilyImage.src = 'images/capyfamily.png';

// player animatie
const capybaraIdle = new Image(); //capybara idle (laadt ook apart voor de idle animatie)
capybaraIdle.src = 'images/capybara-character.png';

// Player Walk Frames
const capybaraWalk = [
    capybaraIdle, //idle image is de eerste frame van de animate
    new Image(),
    new Image(),
    new Image(),
];
capybaraWalk[1].src = 'images/capywalk2.png';
capybaraWalk[2].src = 'images/capywalk3.png';
capybaraWalk[3].src = 'images/capywalk4.png';

// Player Attack Frames 
const capybaraAttackFrames = [
    new Image(), // attack1.png
    new Image(), // attack2.png
    new Image(), // attack3.png
];
capybaraAttackFrames[0].src = 'images/attack1.png';
capybaraAttackFrames[1].src = 'images/attack2.png';
capybaraAttackFrames[2].src = 'images/attack3.png';

// Spider Idle
const spinIdleImage = new Image(); //spin idle (laadt ook apart voor de idle animatie)
spinIdleImage.src = 'images/spin.png';

// Spider Walk Frames
const spinWalkFrames = [
    spinIdleImage, //idle image is de eerste frame van de animate
    new Image(),
    new Image(),
    new Image(),
];
spinWalkFrames[1].src = 'images/spin-walk-2.png'; 
spinWalkFrames[2].src = 'images/spin-walk-3.png';
spinWalkFrames[3].src = 'images/spin-walk-4.png';

// platform images
const platformImages = {
    klein1: new Image(),
    groot1: new Image(),
    groot2: new Image(),
    medium1: new Image(),
    medium3: new Image(),
};
platformImages.klein1.src = 'images/Kleinplatform.png';
platformImages.groot1.src = 'images/Grootplatform.png';
platformImages.groot2.src = 'images/Grootplatform2.png';
platformImages.medium1.src = 'images/Mediumplatform.png';
platformImages.medium3.src = 'images/Mediumplatform3.png';

// array voor de platform images voor random platforms
const platformImageArray = Object.values(platformImages);

// water animatie
const waterFrames = [
    new Image(),
    new Image(),
    new Image(),
];
waterFrames[0].src = 'images/water1.png';
waterFrames[1].src = 'images/water2.png';
waterFrames[2].src = 'images/water3.png';

// Water Animation Variables
let currentWaterFrameIndex = 0;
let waterAnimationTimer = 0;
const waterAnimationSpeed = 10; // hoe hoger het getal hoe langzamer de animatie

// Health Bar Images (NEW)
const fullhealthImage = new Image();
fullhealthImage.src = 'health-bar/full-health.png'; // afbeelding voor de levens
const twohealthImage = new Image();
twohealthImage.src = 'health-bar/two-health.png'; // afbeelding voor 2 levens
const onehealthImage = new Image();
onehealthImage.src = 'health-bar/one-health.png'; // afbeelding voor 1 leven
const nohealthImage = new Image();
nohealthImage.src = 'health-bar/no-health.png'; // afbeelding voor geen levens
let currenthealthImage = fullhealthImage; // Initialiseer currenthealthImage aan het begin van het spel

// Sound Functies
function playBGM(){ //NEW CODE (comment kept from original)
    if (isMusicPlaying){
        return;
    }
    console.log("Attempting to play BGM...");
    // 2. begin met afspelen
    let playPromise = achtergrondmuziekSound.play();
    // 3. check of de audio kan worden afgespeeld
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            console.log("Background music playback started.");
            isMusicPlaying = true;
        }).catch(error => {
            console.warn(`Background music playback failed:`, error);
            isMusicPlaying = false;
        });
    } else {
         console.log("Playback initiated (no promise returned).");
         isMusicPlaying = true;
    }
}

function pauseBGM() {
    achtergrondmuziekSound.pause();
    isMusicPlaying = false; // muziek gepauzeerd
    console.log("Background music paused.");
}

function stopBGM() {
    achtergrondmuziekSound.pause();
    achtergrondmuziekSound.currentTime = 0; // begin opnieuw
    isMusicPlaying = false; // muziek stopt
    console.log("Background music stopped and reset.");
}

function playSound(sound) {
    // reset de tijd van de audio naar 0
    sound.currentTime = 0;
    let playPromise = sound.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => { 
            // Playback failed
            console.warn(`Sound playback failed for ${sound.src}:`, error);
        });
    }
}

// parralax
class Layer {
    constructor(imageSrc, speedModifier, fixedHeight = null) {
        this.image = new Image(); // Maak een nieuw afbeeldingsobject
        this.image.src = imageSrc; // Stel het afbeeldingsbestand in
        this.speedModifier = speedModifier; // Snelheid waarmee de laag beweegt
        this.x = 0; // Start x-positie
        this.y = 0; // Start y-positie
        this.drawWidth = 0; // Breedte om te tekenen
        this.fixedHeight = fixedHeight;
        this.drawHeight = 0;

        // zorg dat de image goed is geladen
        this.image.onload = () => {
             this.calculateDrawWidthAndHeight();
        }
        if (this.image.complete && this.image.naturalWidth > 0) {
             this.calculateDrawWidthAndHeight();
        }
    }


    calculateDrawWidthAndHeight() {
        // gebruik fixed height als het kan, anders gebruik de canvas hoogte
        this.drawHeight = this.fixedHeight !== null ? this.fixedHeight : canvas.height;

        // zorgen dat de drawwidth hetzelfde is als de canvas breedte
        if (canvas.width > 0 && this.image.naturalHeight > 0 && this.image.naturalWidth > 0) {
            const aspectRatio = this.image.naturalWidth / this.image.naturalHeight;
            // bereken de breedte op basis van de hoogte
            let calculatedWidthBasedOnHeight = this.drawHeight * aspectRatio;
            this.drawWidth = Math.max(calculatedWidthBasedOnHeight, canvas.width) + 1; // zorg dat het de canvas width bedekt
        } else if (canvas.width > 0) {
            this.drawWidth = canvas.width + 1; // Fallback
        } else {
            this.drawWidth = 0; // kan de breedte niet berekenen
        }

        // zorg dat de hoogte van de laag hetzelfde is als de canvas hoogte
        if (this.fixedHeight === null) {
            this.y = 0; // parralax lagen beginnen bovenaan
        } 
    }


    update(scrollSpeed) {
        // her bereken de breedte en hoogte als de afbeelding nog niet is geladen
        if (this.drawWidth <= 1 && this.image.naturalWidth > 0) {
            this.calculateDrawWidthAndHeight();
            if (this.fixedHeight === null) this.y = 0;
        }
        if (this.drawWidth <= 0) return;
        // beweeg alleen de x positie van de laag
        this.x -= scrollSpeed * this.speedModifier;
    }


    draw() {
        if (this.drawWidth <= 0 || !this.image.complete || this.image.naturalHeight === 0) {
            return; // niet tekenen als de afbeelding niet is geladen of de breedte is 0
        }
        // gebruik modulo for smooth looping
        let effectiveX = this.x % this.drawWidth;
        // teken 3 keer zodat de laag doorloopt
        c.drawImage(this.image, effectiveX, this.y, this.drawWidth, this.drawHeight);
        c.drawImage(this.image, effectiveX + this.drawWidth, this.y, this.drawWidth, this.drawHeight);
        c.drawImage(this.image, effectiveX - this.drawWidth, this.y, this.drawWidth, this.drawHeight);
    }
}

// de parralax lagen (background)
const layers = [
    new Layer('Background1/lucht.png', 0.1),
    new Layer('Background1/wolken.png', 0.3),
    new Layer('Background1/achtergrondgras.png', 0.6),
    new Layer('Background1/voorgrondgras.png', 0.8)
];

// ondergrond laag
const groundLayer = new Layer('images/Ondergrond.png', 1.0, groundHeight);

// capybara familie
const capyFamily = {
    image: capyFamilyImage,
    x: 10,
    y: 0, // hetzelfde als de ondergrond hoogte (wordt later geset)
    drawWidth: 0,
    drawHeight: 110,
    text: "We're hungry!",
    showText: true,
};

//  Player Class 
class Player {
    constructor(){
        this.position = { //positie van de speler
            x: 100,
            y: 100
        }
        this.velocity = { //snelheid van de speler
            x: 0,
            y: 0
        }
        this.width = 130 //breedte en hoogte van de speler 
        this.height = 100
        this.onGround = false; // onground status

        // capybara animatie frames
        this.frames = {
            idle: capybaraIdle, // de idle image
            walk: capybaraWalk, // idle frame+ walk frames
            attack: capybaraAttackFrames // attack frames (NEW)
        };
        this.currentFrame = this.frames.idle; // begin met de idle image

        // Animation Timers/Indexes
        this.walkFrameIndex = 0; // index voor de walk frames
        this.animationTimer = 0; // timer voor de animatie
        this.animationSpeed = 6; // lager nummer= snellere animatie (voor walk/idle)

        this.attackFrameIndex = 0;      // index voor de attack frames (NEW)
        this.attackAnimationTimer = 0;  // timer voor de animatie (attack) (NEW)
        this.attackAnimationSpeed = 4;  // lager nummer = snellere animatie (attack) 
        this.isAttacking = false;       
        this.attackHitApplied = false; // mag maar 1 spin tegelijk hitten

        this.scaleX = 1; // 1 voor rechts, -1 voor links

        // Attack properties
        this.attackRange = 150; // bereik van de aanval
        this.attackDamage = 1; // schade van de aanval
    }

    draw(){
        c.save(); // save de huidige canvas staat
        c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2); // verander de positie van de speler
        c.scale(this.scaleX, 1);

        let frameToDraw = this.currentFrame;
        if (frameToDraw && frameToDraw.complete && frameToDraw.naturalHeight !== 0) {
            c.drawImage(frameToDraw, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback drawing
            if (this.frames.idle && this.frames.idle.complete && this.frames.idle.naturalHeight !== 0) {
                c.drawImage(this.frames.idle, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                c.fillStyle = 'purple'; // Fallback color
                c.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                 console.warn("Drawing fallback box for player - currentFrame issue?");
            }
        }
        c.restore();
    }

    // attack functie
    attack() {
        if (!this.isAttacking) { // mag alleen attacken als je niet aan het attacken bent
            playSound(smackSound);
            this.isAttacking = true;
            this.attackFrameIndex = 0;      // Reset de animatie-index
            this.attackAnimationTimer = 0;  // Reset de animatie timer
            this.currentFrame = this.frames.attack[0]; // de eerste attack frame
            this.attackHitApplied = false; // reset de hit status
        }
    }

    
    update() {
        // waar de capybara naartoe kijkt
        // je mag alleen omdraaien als je niet attackt
        if (!this.isAttacking) {
            if (keys.left.pressed) {
                this.scaleX = -1; // naar links
            } else if (keys.right.pressed) {
                this.scaleX = 1;  // naar rechts
            }
        }

        // Animatie State Logica
        if (this.isAttacking) {
            // --- Attack Animatie
            this.attackAnimationTimer++;
            if (this.attackAnimationTimer >= this.attackAnimationSpeed) {
                this.attackAnimationTimer = 0;
                this.attackFrameIndex++;

                // Check of attack animatie klaar is 
                if (this.attackFrameIndex >= this.frames.attack.length) {
                    this.isAttacking = false; // einde attack animatie
                   
                } else {
                    // Continue attack animatie
                    this.currentFrame = this.frames.attack[this.attackFrameIndex];
             

                    // damage check
                    const hitFrameIndex = 1; 
                    if (this.attackFrameIndex === hitFrameIndex && !this.attackHitApplied) {
                        let enemyHitThisCheck = false; // niet meerdere spinnen tegelijk raken
                        enemies.forEach((enemy, index) => {
                             if (enemyHitThisCheck) return; // skip als er al een spin is geraakt

                             // bereken de afstand tussen de speler en de vijand
                             const distanceX = (this.position.x + this.width / 2) - (enemy.position.x + enemy.width / 2);
                             const distanceY = (this.position.y + this.height / 2) - (enemy.position.y + enemy.height / 2);

                             const facingRight = this.scaleX === 1;
                             const enemyToRight = distanceX < 0;
                             const enemyToLeft = distanceX > 0;

                             const withinRangeX = Math.abs(distanceX) < (this.attackRange + enemy.width / 2); // spin width
                             const withinRangeY = Math.abs(distanceY) < (this.height / 2 + enemy.height / 2); // heights

                             // hit de spin als hij dichtbij is
                             if ( ((facingRight && enemyToRight) || (!facingRight && enemyToLeft)) && withinRangeX && withinRangeY ) {
                                 console.log("Hit enemy!");
                                 playSound(dodespinSound); 
                                 enemies.splice(index, 1); // spin is dood
                                 this.attackHitApplied = true; 
                                 enemyHitThisCheck = true; // je kan niet meerdere spinnen in 1 klap slaan
                                 score += 10; // score als je een spin killt
                             }
                         });
                    }
                }
            }
        } else {
            //  Idle/Walk Animation (geen attack)
            this.animationTimer++;
            let isTryingToWalk = (keys.left.pressed || keys.right.pressed) && this.onGround;

            if (isTryingToWalk) { // walking
                if (this.animationTimer >= this.animationSpeed) {
                    this.animationTimer = 0;
                    this.walkFrameIndex = (this.walkFrameIndex + 1) % this.frames.walk.length; // Loop using modulo
                }
                this.currentFrame = this.frames.walk[this.walkFrameIndex];
            } else { // idle of jumping/falling state
                this.currentFrame = this.frames.idle; // gebruik de idle image
                this.walkFrameIndex = 0; // reset de walk frame index
                this.animationTimer = 0; // reset de animatie timer
            }
        } 

        // Physics and Collision
        this.position.x += this.velocity.x; //verander de x-positie van de speler met de snelheid
        this.position.y += this.velocity.y; //verander de y-positie van de speler met de snelheid

        this.onGround = false; // ga er vanuit dat de speler niet op de grond is (reset before checks)

        // platform collision
        platforms.forEach(platform => {
            // een speler is alleen op een platform als:
            if (
                this.velocity.y >= 0 && // 1. de speler staat stil of beweegt naar beneden
                this.position.y + this.height >= platform.position.y && // 2. onderkant is gelijk of lager dan de bovenkant van het platform
                (this.position.y + this.height - this.velocity.y) <= platform.position.y + 1 && // 3. was boven platform last frame
                this.position.x + this.width > platform.position.x && // 4. horizontale overlap
                this.position.x < platform.position.x + platform.width
               )
            {
                 this.velocity.y = 0; // Stop verticale movement
                 this.position.y = platform.position.y - this.height; // Correct position
                 this.onGround = true; // op een platform
            }
        });

        // ground collision check (ondergrond dus niet op platform)
        const groundLevelY = canvas.height - groundHeight; // bereken de y positie van de ondergrond
        // check ground collision (ondergrond) als je niet op een platform bent
        if (!this.onGround && this.position.y + this.height >= groundLevelY) {
             let overPit = false;
             const playerCenterX = this.position.x + this.width / 2; 
             for (const pit of deathPits) {
                 // check of de speler horizontaal over de pit is
                 if (playerCenterX > pit.x && playerCenterX < pit.x + pit.width) {
                     overPit = true;
                     break;
                 }
             }

             if (!overPit) { // land alleen op de grond als je niet boven een pit bent
                 // als de speler op de ondergrond is
                 this.velocity.y = 0; // stop met vallen
                 this.position.y = groundLevelY - this.height; // Correct positie
                 this.onGround = true;
             }
        }

        // voeg zwaartekracht toe als de speler in de lucht is
        // gravity als capybara niet op de grond is
        if (!this.onGround) {
            this.velocity.y += gravity; //verander de snelheid van de speler met de zwaartekracht
        }

    } 
} 


// Enemy Spawning Variabelen
let enemies = [];
let maxEnemies = 3; // max aantal enemies 
let spawnInterval = 4000; // 4 seconden 
let lastSpawnTime = 0; 

// spin
class Enemy {
    constructor(position) {
        this.position = {x: position.x, y: position.y};
        this.velocity = {x: 0, y: 0};
        this.width = 60; // breedte van de vijand
        this.height = 40; // hoogte van de vijand
        this.onGround = false; // of de vijand op de grond is
        this.speed = 2; // pas aan voor snellere/slomere enemies 
        this.acceleration = 0.05; // versnelling van de vijand 
        this.jumpPower = -15; // hoogte van de sprong 
        this.jumpTimer = Math.random() * 1500 + 500; // Random initial jump vertraging (500-2000ms)

        this.frames = { // Store references to the loaded frames
            idle: spinIdleImage,
            walk: spinWalkFrames
        };
        this.currentFrame = this.frames.idle; // Start idle

        // Animation properties added
        this.walkFrameIndex = 0;
        this.animationTimer = 0;
        this.animationSpeed = 10; // Adjust speed (higher = langzamer) for spider walk

        this.scaleX = -1; // 1 voor rechts, -1 voor links
        
    }

    // update spin
    update(playerPosition, platforms) { 
        // ai beweging van de spin
        const deltaX = playerPosition.x - this.position.x;
        const deltaY = playerPosition.y - this.position.y;

        // Horizontal Movement
        let targetVelocityX = 0;
        if (Math.abs(deltaX) > 10) { // beweeg alleen als de speler verder dan 10px is
            targetVelocityX = Math.sign(deltaX) * this.speed; // beweeg richting de speler
        }

        // smooth de snelheid van de vijand
        if (this.velocity.x < targetVelocityX) {
            this.velocity.x = Math.min(targetVelocityX, this.velocity.x + this.acceleration);
        } else if (this.velocity.x > targetVelocityX) {
            this.velocity.x = Math.max(targetVelocityX, this.velocity.x - this.acceleration);
        }

        // welke kant de spin op kijkt als hij naar links/rechts beweegt
        if (this.velocity.x > 0.1) { // Moving right
            this.scaleX = -1; // Facing right
        } else if (this.velocity.x < -0.1) { // Moving left
            this.scaleX = 1; // Facing left
        }

        // Vertical Movement (Gravity)
        this.velocity.y += gravity;

        // Simple Jumping Logic
        this.jumpTimer -= 16; // delta tijd (16ms voor 60fps)
        if (this.onGround && this.jumpTimer <= 0) {
            if (deltaY < -80) { //jump als de speler boven de spin is
                this.velocity.y = this.jumpPower;
                this.onGround = false;
                this.jumpTimer = 1000; // Cooldown na een sprong
            } else if (Math.random() < 0.01) { // random kans om te springen
                 this.velocity.y = this.jumpPower * (0.5 + Math.random() * 0.5); // random jump hoogte
                 this.onGround = false;
                 this.jumpTimer = 1500 + Math.random() * 1000; // cooldown voor random jump
            }
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Collision checks (reset onGround eerst)
        this.onGround = false;

        // Platform Collision
        platforms.forEach(platform => {
            if (
                this.velocity.y >= 0 &&
                this.position.y + this.height >= platform.position.y &&
                (this.position.y + this.height - this.velocity.y) <= platform.position.y + 1 &&
                this.position.x + this.width > platform.position.x &&
                this.position.x < platform.position.x + platform.width
            ) {
                this.velocity.y = 0;
                this.position.y = platform.position.y - this.height;
                this.onGround = true;
            }
        });

        // Ground Collision
        const groundY = canvas.height - groundHeight; // De Y-positie van de grond
        if (!this.onGround && this.position.y + this.height >= groundY) {
            // check of je niet op een pit landt
            let overPit = false;
            const enemyCenterX = this.position.x + this.width / 2;
            for (const pit of deathPits) {
                if (enemyCenterX > pit.x && enemyCenterX < pit.x + pit.width) {
                    overPit = true;
                    break;
                }
            }

            if (!overPit) { // land alleen als je niet boven een pit bent
                this.position.y = groundY - this.height; // Zet de Y-positie gelijk aan de grond
                this.velocity.y = 0; // Stop de val
                this.onGround = true; // Markeer dat de vijand op de grond is
            }
            
        }


        // Animation Logica
        this.animationTimer++;
        // check voor loop animatie
        if (Math.abs(this.velocity.x) > 0.1 && this.onGround) {
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.walkFrameIndex = (this.walkFrameIndex + 1) % this.frames.walk.length; // Loop walk frames using modulo
            }
            this.currentFrame = this.frames.walk[this.walkFrameIndex];
        } else { // Idle of in the lucht
            this.currentFrame = this.frames.idle; // idle frame
            this.walkFrameIndex = 0; // Reset walk index als je idle bent of in de lucht
            this.animationTimer = 0; // Reset timer 
        }
    } 

    
    draw() {
        c.save(); 
        c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
        c.scale(this.scaleX, 1); // flip zodat de spin andersom staat

        let frameToDraw = this.currentFrame;
        // teken de image als het goed is geladen
        if (frameToDraw && frameToDraw.complete && frameToDraw.naturalHeight !== 0) {
             c.drawImage(frameToDraw, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
             // fallback als de image niet goed is geladen
             frameToDraw = this.frames.idle; 
             if (frameToDraw && frameToDraw.complete && frameToDraw.naturalHeight !== 0) {
                  c.drawImage(frameToDraw, -this.width / 2, -this.height / 2, this.width, this.height);
             } else {
                 // Last resort: draw a rectangle
                 c.fillStyle = 'red';
                 c.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                 console.warn("Drawing fallback box for enemy - frame issue?");
             }
        }
        c.restore(); 
    }


    // collision met de speler
    checkCollision(player) {
        return (
            player.position.x < this.position.x + this.width &&
            player.position.x + player.width > this.position.x &&
            player.position.y < this.position.y + this.height &&
            player.position.y + player.height > this.position.y
        );
    }
} 


// class voor de platforms
class Platform{
    // constructor gebruikt images ipv random breedte en hoogte
    constructor({ x, y, image }) {
        this.position = { x, y };
        this.image = image;

        // de platform breedte en hoogte (ook als de image niet is geladen)
        if (this.image && this.image.naturalWidth > 0) {
            this.width = this.image.naturalWidth * platformScaleFactor;
            this.height = this.image.naturalHeight * platformScaleFactor;
        } else {
            // fallback
            this.width = 150; // Default width
            this.height = 30; // Default height
    
            this.image.onload = () => {
                if (this.image.naturalWidth > 0) { // check opnieuw of de image is geladen
                    this.width = this.image.naturalWidth * platformScaleFactor;
                    this.height = this.image.naturalHeight * platformScaleFactor;
                    this.positionItem(); // re-position item after image load
                } else {
                    console.warn(`Image loaded but has 0 width/height: ${this.image.src}`);
                }
            }
        }

        // Item generation
        const chosenItem = chooseRandomItem();
        const itemImage = new Image();
        itemImage.src = chosenItem.image; // Gebruik chosenItem.image als src

        this.itemSize = 40;
        this.item = {
            x: 0, 
            y: 0,
            width: this.itemSize,
            height: this.itemSize,
            image: itemImage,
            opacity: 1, // voor als we fade effects willen toevoegen
            collected: false, // houdt bij of het item is opgepakt
            name: chosenItem.name,
        };
        this.positionItem(); 
    }

    // positie van de items
    positionItem() {
        if (this.width > 0) { // Only position if platform has a calculated width
             this.item.x = this.position.x + this.width / 2 - this.itemSize / 2; // centreer het item horizontaal
             this.item.y = this.position.y - this.itemSize - 5; // plaats net iets boven het platform
        }
    }


    draw(){
        // teken de image als het goed is geladen
        if (this.image && this.image.complete && this.width > 0 && this.height > 0) {
             c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height); //teken de platform (image)
        } else {
           
            c.fillStyle = 'grey'; //kleur van de platform (fallback)
            c.fillRect(this.position.x, this.position.y, this.width || 150, this.height || 30); //teken de platform (fallback)
        }

        // teken de appel (item) als het goed is geladen and not collected
        if (this.item && !this.item.collected && this.width > 0) {
             // zorg dat het item goed is geplaatst
             this.positionItem();

             c.save();
             c.globalAlpha = this.item.opacity ?? 1; // gebruik opacity als het er is, anders 1

             // Draw item image or fallback
             if (this.item.image.complete && this.item.image.naturalHeight > 0) {
                 c.drawImage(this.item.image, this.item.x, this.item.y, this.item.width, this.item.height);
             } else {
                 // Fallback items
                 c.fillStyle = this.item.name === 'hart' ? 'pink' : 'red'; // fallback kleuren
                 c.fillRect(this.item.x, this.item.y, this.item.width, this.item.height);
             }
             c.restore();
        }
    }

    // checkCollision met de speler (het item op de platforms)
    checkItemCollision(player) {
         if (!this.item || this.item.collected) {
             return false; // No item or already collected
         }
         const item = this.item;
         // AABB collision check
         return (
             player.position.x < item.x + item.width &&
             player.position.x + player.width > item.x &&
             player.position.y < item.y + item.height &&
             player.position.y + player.height > item.y
         );
     }
} 


// Game Variabelen
const player = new Player() //maak een speler aan
let platforms = [] //lege array voor random platforms
// water / death pits
let deathPits = []; // array om de death pits op te slaan

// Scrolling Variable
let scrollOffset = 0;
const jumpHeight = 23;

// score variabelen
let score = 0;

// HEALTH //
let health = 3; // begin met 3 levens
const maxHealth = 3; // max levens

// game status
let gameRunning = false;
let imagesLoaded = 0;
let totalImages = 0; // wordt berekent voor het laden van de images

// Health Display Functions 
function displayHealth() {
    // teken de health bar als de image is geladen
    if (currenthealthImage.complete && currenthealthImage.naturalHeight > 0) {
        c.drawImage(currenthealthImage, 20, 20, 250, 100); // teken de health bar 
    } else {
        // fallback text als de image nog niet is geladen
        c.fillStyle = 'white';
        c.font = '20px Arial';
        c.fillText(`Health: ${health}`, 50, 50);
    }
}

function updateHealthDisplay() {
    
    if (health >= 3) { // gebruik >= 3 voor full health
        currenthealthImage = fullhealthImage;
    } else if (health === 2) {
        currenthealthImage = twohealthImage;
    } else if (health === 1) {
        currenthealthImage = onehealthImage;
    } else { // health <= 0
        currenthealthImage = nohealthImage;
    }
}

// platform logica
function generatePlatforms(num) {
    platforms = []; // Clear bestaande platforms
    const groundLevelY = canvas.height - groundHeight; // bereken de y position van de grond

    // platform hoogtes
    const heights = [ 
        groundLevelY - 150, // Low
        groundLevelY - 275, // Medium
        groundLevelY - 400, // High
    ].filter(h => h > 50); // filter om zeker te zijn dat de hoogte niet te laag is

    let safeSpaceWidth = 600; // ruimte voordat de platforms en spinnen spawnen
    let lastPlatformEndX = safeSpaceWidth; // spawn na de safespace

    // different gaps based on height 
    const heightGaps = { 
        [groundLevelY - 150]: { min: 100, max: 250 }, // Low height gap range
        [groundLevelY - 275]: { min: 150, max: 300 }, // Medium height gap range
        [groundLevelY - 400]: { min: 200, max: 350 }, // High height gap range
    };

    if (platformImageArray.length === 0 || heights.length === 0) {
        console.error("Cannot generate platforms: Image array or heights array is empty.");
        return;
    }

    for (let i = 0; i < num; i++) {
        // kies een random height voor de platforms
        const currentHeight = heights[Math.floor(Math.random() * heights.length)];
        // kies een random image voor de platforms
        const randomImageIndex = Math.floor(Math.random() * platformImageArray.length);
        const selectedImage = platformImageArray[randomImageIndex];

        // bereken de ruimte tussen de platforms
        const gapRange = heightGaps[currentHeight] || { min: 100, max: 300 }; // gebruik fallback als de hoogte niet bestaat
        const randomGap = Math.random() * (gapRange.max - gapRange.min) + gapRange.min;
        const platformX = lastPlatformEndX + randomGap;

        // create nieuwe platforms
        const newPlatform = new Platform({
            x: platformX,
            y: currentHeight,
            image: selectedImage
        });
        platforms.push(newPlatform);

        //fallback width (150) als de image nog niet geladen is
        lastPlatformEndX = platformX + (newPlatform.width || 150);
    }
}

// water pit generation
function generateDeathPits(numPits) {
    deathPits = []; // haal bestaande pits weg
    const groundLevelY = canvas.height - groundHeight; // Y position calculation 
    const minPitWidth = 150; // minimale width van een pit (adjusted)
    const maxPitWidth = 270; // maximale width van een pit (adjusted)
    const minPitGap = 500;   // minimale ruimte tussen 2 pits (adjusted)
    const maxPitGap = 1000;   // maximale ruimte (adjusted)

    let currentX = 2000; // begin positie van de pits (na de platforms, adjusted start)

    for (let i = 0; i < numPits; i++) {
        // bereken de positie van de pit
        const gap = minPitGap + Math.random() * (maxPitGap - minPitGap);
        currentX += gap;

        // bereken de breedte van de pit
        const pitWidth = minPitWidth + Math.random() * (maxPitWidth - minPitWidth);

        // voeg de pit toe aan de deathPits array
        deathPits.push({ x: currentX, width: pitWidth });

        // update currentx voor de volgende pit
        currentX += pitWidth;
    }
}




const keys = {
    right: { pressed: false }, //toetsen voor de speler
    left: { pressed: false },
}

// Initialization 
function resetGame() {
     console.log("Resetting game...");
     // Reset player state
     player.position.x = 150; //de ruimte tussen links en de speler 
     player.position.y = 100;
     player.velocity.x = 0;
     player.velocity.y = 0;
     player.onGround = false;
     player.isAttacking = false; 
     player.currentFrame = player.frames.idle; // Start idle
     player.walkFrameIndex = 0;
     player.animationTimer = 0;
     player.attackFrameIndex = 0; // Reset attack animation too
     player.attackAnimationTimer = 0;
     player.scaleX = 1; // Face naar rechts aan het begin

     // Reset world state
     scrollOffset = 0;
     capyFamily.x = 10; // reset de capyfamily positie
     capyFamily.showText = true; // Show text opnieuw

     currentPlayerMoveSpeed = basePlayerMoveSpeed; // Reset speed

     // Clear and regenerate level elements
     platforms = [];
     enemies = [];
     deathPits = [];
     generatePlatforms(40); // Generate platforms
     generateDeathPits(20); // Generate pits

     // Reset score en health
     score = 0;
     health = 3;
     updateHealthDisplay(); // Update the health bar image

     // Reset enemy spawning timer
     lastSpawnTime = 0;

     // zorg dat de lagen goed zijn geladen
     layers.forEach(layer => layer.calculateDrawWidthAndHeight());
     groundLayer.calculateDrawWidthAndHeight();
     groundLayer.y = canvas.height - groundHeight; // ondergrond laag onderaan het canvas

     // Position Capy Family op de grond
     if (capyFamily.image.naturalHeight > 0) {
         const aspectRatio = capyFamily.image.naturalWidth / capyFamily.image.naturalHeight;
         capyFamily.drawWidth = capyFamily.drawHeight * aspectRatio;
     } else { capyFamily.drawWidth = 200; } // Fallback width als image niet geladen is
     capyFamily.y = canvas.height - groundHeight - capyFamily.drawHeight - 5; // positie boven de grond


     console.log("Game reset complete.");
}

// Game Loop 
function animate(timestamp){ 
    if (!gameRunning) return; // stop de loop als het spel niet beweegt

    requestAnimationFrame(animate); //roept de functie opnieuw aan, waardoor er een animatie ontstaat
    c.clearRect(0, 0, canvas.width, canvas.height); //maakt het canvas leeg

    // update de snelheid op basis van de score
    let speedProgress = Math.min(score / scoreForMaxSpeed, 1.0); 
    currentPlayerMoveSpeed = basePlayerMoveSpeed + (maxPlayerMoveSpeed - basePlayerMoveSpeed) * speedProgress;

    // water animatie
    waterAnimationTimer++;
    if (waterAnimationTimer >= waterAnimationSpeed) {
        waterAnimationTimer = 0;
        currentWaterFrameIndex = (currentWaterFrameIndex + 1) % waterFrames.length; // gebruik modulo voor de loop
    }
    const currentWaterFrame = waterFrames[currentWaterFrameIndex];

    // --- Player Movement & Scrolling ---
    let scrollSpeed = 0; // How much the world scrolls this frame
    // Player horizontal movement input
    if (keys.right.pressed && player.position.x < canvas.width * 0.4) { // beweeg naar rechts
        player.velocity.x = currentPlayerMoveSpeed;
    } else if (keys.left.pressed && player.position.x > canvas.width * 0.2) { // beweeg naar links
        player.velocity.x = -currentPlayerMoveSpeed;
    } else {
        // als de speler niet beweegt, stop met bewegen
        player.velocity.x = 0;
        if (keys.right.pressed) { 
            scrollSpeed = currentPlayerMoveSpeed;
        } else if (keys.left.pressed && scrollOffset > 0) { 
            scrollSpeed = -currentPlayerMoveSpeed;
            // voorkom scrollen bij het begin van het canvas
            if (scrollOffset + scrollSpeed < 0) {
                scrollSpeed = -scrollOffset;
            }
        }
    }

    // scrolling voor de voorgrond en achtergrond objecten
    if (scrollSpeed !== 0) {
        scrollOffset += scrollSpeed;
        platforms.forEach((platform) => { platform.position.x -= scrollSpeed; });
        deathPits.forEach((pit) => { pit.x -= scrollSpeed; });
        capyFamily.x -= scrollSpeed;
        enemies.forEach((enemy) => { enemy.position.x -= scrollSpeed; });
    }

    // de volgorde van hoe alles wordt geladen 

    // 1. laadt alle parralax lagen in
    layers.forEach(layer => {
        layer.update(scrollSpeed); 
        layer.draw();
    });

    // 2. Teken de grondlaag met pits door gebruik te maken van clipping
    groundLayer.update(scrollSpeed); // update de positie eerst
    c.save(); // save canvas eerst
    c.beginPath();
    const groundY = canvas.height - groundHeight; // y positie waar de grond/water begint
    let lastSafeX = -scrollOffset; 
    deathPits.sort((a, b) => a.x - b.x); // sorteer de pits op x positie (van links naar rechts)

    // loop door de deathPits en teken de segmenten
    deathPits.forEach(pit => {
        const pitStartX = pit.x;
        const pitEndX = pit.x + pit.width;
        // voeg een rectangle toe voor de segmenten (tot het begin van de pit)
        if (pitStartX > lastSafeX) {
            c.rect(lastSafeX, groundY, pitStartX - lastSafeX, groundHeight);
        }
        // beweeg de lastSafeX naar het einde van de pit
        lastSafeX = Math.max(lastSafeX, pitEndX);
    });
    // voeg de laatste segment toe tot het einde van het canvas
    c.rect(lastSafeX, groundY, (canvas.width - lastSafeX + scrollOffset) + 5, groundHeight);
    // voeg een rectangle toe voor de laatste segment (tot het einde van het canvas)
    c.rect(-scrollOffset - 5, 0, canvas.width + 10, groundY);
    c.clip(); // voeg de clipping toe (dit zorgt ervoor dat de grond alleen zichtbaar is binnen de rects)
    groundLayer.draw(); 
    c.restore(); // restore canvas na het tekenen van de grondlaag

    // 3. teken de geanimeerde water pits
    if (currentWaterFrame && currentWaterFrame.complete && currentWaterFrame.naturalWidth > 0) {
        const waterTileWidth = currentWaterFrame.naturalWidth; // gebruik image width voor de tiles
        deathPits.forEach(pit => {
            // check of de pit binnen het canvas valt voordat je gaat tekenen
            if (pit.x + pit.width > 0 && pit.x < canvas.width) {
                // image van het water horizontaal in de pit tekenen
                for (let tileX = 0; tileX < pit.width; tileX += waterTileWidth) {
                    const drawW = Math.min(waterTileWidth, pit.width - tileX); // Handle partial tile at the end
                    const sourceH = currentWaterFrame.naturalHeight;
                    const sourceW = (drawW / groundHeight) * sourceH; // bereken de source width gebaseerd op de hoogte
                    c.drawImage(
                        currentWaterFrame,
                        0, 0, sourceW > 0 ? sourceW : 1, sourceH, // zorg dat sourceW > 0 zodat je geen 0 width hebt
                        pit.x + tileX, groundY,
                        drawW, groundHeight
                    );
                }
            }
        });
    }

    // 4. capy familie (wordt getekend na ondergrond en water)
    if (capyFamily.image.complete && capyFamily.image.naturalHeight !== 0 && capyFamily.drawWidth > 0) {
         c.drawImage(capyFamily.image, capyFamily.x, capyFamily.y, capyFamily.drawWidth, capyFamily.drawHeight);
         if (scrollOffset > 400) { capyFamily.showText = false; } // text verdwijnt nadat je 400 pixels hebt gescrold
         if (capyFamily.showText && capyFamily.x + capyFamily.drawWidth > 0 && capyFamily.x < canvas.width) {
              c.font = 'bold 20px Arial';
              c.fillStyle = 'white';
              c.textAlign = 'center';
              c.strokeStyle = 'black'; c.lineWidth = 2; // outline
              c.strokeText(capyFamily.text, capyFamily.x + capyFamily.drawWidth / 2, capyFamily.y - 15);
              c.fillText(capyFamily.text, capyFamily.x + capyFamily.drawWidth / 2, capyFamily.y - 15);
         }
    }

    // 5. teken platforms met imgs (and check item collision)
    platforms.forEach(platform => {
        if (platform.position.x + platform.width > 0 && platform.position.x < canvas.width) { // process alleen zichtbara platforms
            platform.draw();
            if (platform.checkItemCollision(player)) {
                if (platform.item.name === "hart") {
                    if (health < maxHealth) {
                        health++; updateHealthDisplay(); platform.item.collected = true; playSound(itemSound);
                        setTimeout(() => { if (platform.item) platform.item.collected = false; }, 8000);
                    }
                } else if (platform.item.name === "appel") {
                    score += 10; platform.item.collected = true; playSound(itemSound);
                    setTimeout(() => { if (platform.item) platform.item.collected = false; }, 5000);
                }
            }
        }
    });

    // 6. Enemies Update and Draw
    const groundSurfaceY = canvas.height - groundHeight; // y ground level voor de death pit checks
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.position.x + enemy.width > -200 && enemy.position.x < canvas.width + 200) { // Check visibility
             enemy.update(player.position, platforms); // update de vijand

             // spin pit check
             let enemyFellInPit = false;
             // check of de spin in de lucht is en onder de ondergrond level is
             if (!enemy.onGround && enemy.position.y + enemy.height >= groundSurfaceY) {
                 const enemyCenterX = enemy.position.x + enemy.width / 2;
                 for (const pit of deathPits) {
                     // check of de spin horizontaal binnen de pit valt
                     if (enemyCenterX > pit.x && enemyCenterX < pit.x + pit.width) {
                         enemyFellInPit = true;
                         break; 
                     }
                 }
             }

             if (enemyFellInPit) {
                 playSound(dodespinSound); // sound als spin in de pit valt
                 enemies.splice(i, 1); // spin gaat dood
                 continue; 
             }
             

             enemy.draw(); // teken de vijand 

             // collision met speler 
             if (enemy.checkCollision(player)) {
                 console.log("Player hit by enemy!");
                 health--; updateHealthDisplay(); enemies.splice(i, 1); playSound(dodespinSound);
                 continue; 
             }
        } else if (enemy.position.x + enemy.width < -500) { //verwijder off-screen enemies
            enemies.splice(i, 1);
        }
    }

    // 7. update capybara 
    player.update();

    // 8. teken capybara
    player.draw(); 

    // Enemy Spawning Logica
    if (timestamp - lastSpawnTime > spawnInterval && enemies.length < maxEnemies) {
        const spawnCandidates = platforms.filter(p => p.position.x > canvas.width + 50 && p.position.x < canvas.width + 800 && (!p.item || !p.item.collected));
        if (spawnCandidates.length > 0) {
            const randomPlatform = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];
            enemies.push(new Enemy({ x: randomPlatform.position.x + randomPlatform.width / 2 - 30, y: randomPlatform.position.y - 50 }));
            lastSpawnTime = timestamp;
        }
    }

    // Death Conditions Checks

    let playerFellInPit = false; 
    // check of de capybara in de lucht is en onder de ondergrond level is
    if (!player.onGround && player.position.y + player.height >= groundSurfaceY) {
        const playerCenterX = player.position.x + player.width / 2; 
        for (const pit of deathPits) {
            // Check of de speler horizontaal binnen de pit valt 
            if (playerCenterX > pit.x && playerCenterX < pit.x + pit.width) {
                playerFellInPit = true;
                break; // Found overlap with a pit
            }
        }
    }

    // game over als capybara in het water is of geen hp meer heeft
    if (playerFellInPit) { // in het water gevallen
        console.log("Game Over! Player fell into a pit. Final Score:", Math.floor(score));
        gameOver();
    } else if (health <= 0 && gameRunning) { // geen health meer
        console.log("Game Over! No more health.");
        gameOver();
    }


    
    // Draw Score
    c.font = 'bold 28px Arial';
    c.fillStyle = 'white'; c.textAlign = 'center';
    c.strokeStyle = 'black'; c.lineWidth = 3; // outline
    c.strokeText(`Score: ${Math.floor(score)}`, canvas.width / 2, 50);
    c.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, 50); // text in boven midden

    // Health Bar
    displayHealth(); // teken de health bar

} 


// Game Over Functie
function gameOver() {
    if (!gameRunning) return; // voorkom dubbele calls
    console.log("Executing GameOver Sequence. Final Score:", Math.floor(score));
    gameRunning = false; // Stop the animation loop FIRST
    stopBGM(); // Stop de achtergrondmuziek
    playSound(gameoverSound); // Play game over sound immediately
}


// Image Loading Setup 
function setupImageLoadListener(imageObject, name) {
    // Check of imageObject is valid en een src property heeft
    if (!imageObject || !imageObject.src) {
        console.error(`setupImageLoadListener: Invalid image object or no src for "${name}". Skipping setup.`);
        imagesLoaded++; if (totalImages > 0 && imagesLoaded >= totalImages && !gameRunning) startGame(); return;
    }
    imageObject.onload = () => {
        imagesLoaded++; if (totalImages > 0 && imagesLoaded >= totalImages && !gameRunning) startGame();
    };
    imageObject.onerror = () => {
        console.error(`Failed to load ${name} image: ${imageObject.src}`);
        imagesLoaded++; if (totalImages > 0 && imagesLoaded >= totalImages && !gameRunning) startGame();
    };
    if (imageObject.complete) {
         if (imageObject.naturalHeight !== 0) {
             setTimeout(() => { imagesLoaded++; if (totalImages > 0 && imagesLoaded >= totalImages && !gameRunning) startGame(); }, 1);
         } else {
              console.warn(`${name} reported complete but has 0 height (likely failed): ${imageObject.src}`);
              setTimeout(() => { imagesLoaded++; if (totalImages > 0 && imagesLoaded >= totalImages && !gameRunning) startGame(); }, 1);
         }
    }
}

// Functie om alle images te laden en voor de listeners
function loadAllImages() {
    console.log("Starting image loading...");
    imagesLoaded = 0; // Reset count voor restarts

    totalImages = layers.length + 1 + Object.keys(platformImages).length + 1 + capybaraWalk.length + capybaraAttackFrames.length + waterFrames.length + spinWalkFrames.length + 4;

    if (totalImages === 0) { console.warn("No images found to load. Starting game immediately."); startGame(); return; }
    console.log(`Setting up load listeners for ${totalImages} images...`);

    // Laadt alle layers in de layers array
    layers.forEach((layer, index) => setupImageLoadListener(layer.image, `Layer ${index}`));
    // ondergrond laag
    setupImageLoadListener(groundLayer.image, "Ground");
    // platform images
    for (const key in platformImages) setupImageLoadListener(platformImages[key], `Platform (${key})`);
    // andere images
    setupImageLoadListener(capyFamily.image, "Capy Family");
    // de animatie images (player walk)
    capybaraWalk.forEach((frame, index) => setupImageLoadListener(frame, `Player Walk ${index}`));
    // Player attack frames 
    capybaraAttackFrames.forEach((frame, index) => setupImageLoadListener(frame, `Player Attack ${index}`));
    // Water Frames
    waterFrames.forEach((frame, index) => setupImageLoadListener(frame, `Water ${index}`));
    // Spider walk frames 
    spinWalkFrames.forEach((frame, index) => setupImageLoadListener(frame, `Spider Walk ${index}`));
    // Health Bar Images
    setupImageLoadListener(fullhealthImage, "Health Full");
    setupImageLoadListener(twohealthImage, "Health Two");
    setupImageLoadListener(onehealthImage, "Health One");
    setupImageLoadListener(nohealthImage, "Health No");

    // check voor de images die al geladen zijn
    setTimeout(() => { if (imagesLoaded >= totalImages && !gameRunning && totalImages > 0) { console.log("All images were likely cached, starting game..."); startGame(); } }, 50);
}


function startGame() {
     if (gameRunning) { console.log("Game start requested, but already running."); return; }
    console.log("All images loaded or accounted for. Starting game process...");
    resetGame(); // Reset positions, score, platforms etc. eerst
    gameRunning = true; // game is nu aan
    if (!isMusicPlaying) { playBGM(); } // background liedje begint
    animate(0); // loop
}


//  Event Listeners 
window.addEventListener('keydown', ({ key }) => { // Luistert naar de toetsenbord input
    const lowerKey = key.toLowerCase(); // Zet hoofdletters om naar kleine letters voor consistentie

    // restart logica
     if (!gameRunning && lowerKey === 'r') {
          console.log("Restart key pressed.");
          loadAllImages(); 
          return; 
     }

    // game controls (alleen als gamerunning = true)
    if (!gameRunning) return;

    switch (lowerKey) {
        case 'a': // 'A' toets
            keys.left.pressed = true; // Zet de toets op 'ingedrukt'
            break;
        case 'd': // 'D' toets
            keys.right.pressed = true;
            break;
        case 'w': case ' ': // 'W' toets or Spacebar
            if (player.onGround) { // spring alleen als de speler op de grond is of op een platform
                 player.velocity.y = -jumpHeight; // Spring omhoog
                 playSound(jumpSound);
            }
            break;
        case 'j': // 'J' toets
            player.attack(); // aanval
            break;
    }
});

window.addEventListener('keyup', ({ key }) => { // Luistert naar de toetsenbord input
    switch (key.toLowerCase()) { // Zet hoofdletters om naar kleine letters voor consistentie
        case 'a': // 'A' toets
            keys.left.pressed = false; // Zet de toets op 'niet ingedrukt'
            break;

        case 'd': // 'D' toets
            keys.right.pressed = false;
            break;
    }
});

window.addEventListener('resize', () => {
    console.log("Window resized");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // bereken de breedte en hoogte van de lagen opnieuw
    layers.forEach(layer => layer.calculateDrawWidthAndHeight());
    // bereken de ondergrond laag opnieuw
    groundLayer.calculateDrawWidthAndHeight();
    groundLayer.y = canvas.height - groundHeight; // plaats de grondlaag opnieuw
    // bereken capy familie opnieuw
    if (capyFamily.image.naturalHeight > 0) {
        const aspectRatio = capyFamily.image.naturalWidth / capyFamily.image.naturalHeight;
        capyFamily.drawWidth = capyFamily.drawHeight * aspectRatio;
    } else { capyFamily.drawWidth = 200; } // Fallback width
    capyFamily.y = canvas.height - groundHeight - capyFamily.drawHeight - 5; 
});



loadAllImages(); // start image loading process

// een listener voor de eerste interactie (browser policies)
function startMusicOnFirstInteraction() {
     console.log("User interacted, attempting BGM if needed.");
     if (gameRunning && !isMusicPlaying) { playBGM(); } // speel alleen als de game is begonnen 
     
     window.removeEventListener('click', startMusicOnFirstInteraction);
     window.removeEventListener('keydown', startMusicOnFirstInteraction);
     window.removeEventListener('touchstart', startMusicOnFirstInteraction);
}
window.addEventListener('click', startMusicOnFirstInteraction);
window.addEventListener('keydown', startMusicOnFirstInteraction);
window.addEventListener('touchstart', startMusicOnFirstInteraction); // touch event

