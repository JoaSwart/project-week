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
achtergrondmuziekSound.volume = 0.3;
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
    return itemTypes[itemTypes.length - 1]; // Return the last item if none matched
}

// IMAGES
const groundImage = new Image();
groundImage.src = 'images/Ondergrond.png';

const capyFamilyImage = new Image();
capyFamilyImage.src = 'images/capyfamily.png';

// player animatie
const capybaraIdle = new Image(); //capybara idle (laadt ook apart voor de idle animatie)
capybaraIdle.src = 'images/capybara-character.png';

// walking frames
const capybaraWalk = [
    capybaraIdle, //idle image is de eerste frame van de animate
    new Image(),
    new Image(),
    new Image(),
];
capybaraWalk[1].src = 'images/capywalk2.png';
capybaraWalk[2].src = 'images/capywalk3.png';
capybaraWalk[3].src = 'images/capywalk4.png';

// / Player Attack Frames 
const capybaraAttackFrames = [
    new Image(), // attack1.png
    new Image(), // attack2.png
    new Image(), // attack3.png
];
capybaraAttackFrames[0].src = 'images/attack-1.png';
capybaraAttackFrames[1].src = 'images/attack-2.png';
capybaraAttackFrames[2].src = 'images/attack-3.png';

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

let currentWaterFrameIndex = 0;
let waterAnimationTimer = 0;
const waterAnimationSpeed = 10; // hoe hoger het getal hoe langzamer de animatie

// sound Functies
function playBGM(){
    if (isMusicPlaying){
        return;
    }
    console.log("Attempting to play BGM...");
    // 2. begin met afspelen
    let playPromise = achtergrondmuziekSound.play();
    // 3. check of de audio kan worden afgespeeld
    if (playPromise !== undefined) { // als de audio kan worden afgespeeld
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

function stopBGM() { // stop de achtergrond muziek
    achtergrondmuziekSound.pause();
    achtergrondmuziekSound.currentTime = 0; // begin opnieuw
    isMusicPlaying = false; // muziek stopt
    console.log("Background music stopped and reset.");
}

function playSound(sound) { // speel een geluid af
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

            this.drawWidth = Math.max(calculatedWidthBasedOnHeight, canvas.width);
            this.drawWidth += 1; // Add buffer

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
            return;
        }
        let effectiveX = this.x % this.drawWidth;

        // teken door gebruik te maken van de berekende breedte en hoogte
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
    y: 0, // hetzelfde als de ondergrond
    drawWidth: 0,
    drawHeight: 110,
    text: "We're hungry!",
    showText: true,
};

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
        this.width = 80 //breedte en hoogte van de speler 
        this.height = 80
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
        this.attackWidth = 200; // breedte van de attack hitbox (foto is te smal)   
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

        let frameToDraw = this.currentFrame; // teken de huidige frame
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

    update(){
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
                                 score += 3; // score als je een spin killt
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

        this.draw(); //teken de speler
        this.position.x += this.velocity.x; //verander de x-positie van de speler met de snelheid
        this.position.y += this.velocity.y; //verander de y-positie van de speler met de snelheid

        this.onGround = false; // ga er vanuit dat de speler niet op de grond is

        // platform collision
        platforms.forEach(platform => {
            // een speler is alleen op een platform als:
            if (
                this.velocity.y >= 0 && // 1. de speler staat stil of beweegt naar beneden
                this.position.y + this.height >= platform.position.y && // 2. onderkant is gelijk of lager dan de bovenkant van het platform
                // 3. bekijk of de onderkant van de speler boven het platform was
                (this.position.y + this.height - this.velocity.y) <= platform.position.y + 1 &&
                // 4. horizontale overlap
                this.position.x + this.width > platform.position.x &&
                this.position.x < platform.position.x + platform.width
               )
            {
                 this.velocity.y = 0; // Stop verticale movement
                 this.position.y = platform.position.y - this.height; //
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
        if (!this.onGround) {
            this.velocity.y += gravity; //verander de snelheid van de speler met de zwaartekracht
        }
    }   
}

let enemies = [];
let maxEnemies = 5; // max aantal enemies
let spawnInterval = 3000; // 3 seconden

// if score < 100, change max enemies, increase speed?
// if score < 200, increase it more etc. etc.

function spawnEnemyOnItem(item) { // spawnt de enemies op de items 
    if (enemies.length < maxEnemies) {
        const enemy = new Enemy({ x: item.x, y: item.y });
        enemies.push(enemy);
    }
}

setInterval(() => { 
    // vind alle platforms met een actief item die nog niet zijn verzameld
    const spawnablePlatforms = platforms.filter(p => p.item && !p.item.collected);
    
    // als er geen spawnbare platforms zijn, doe dan niets
    if (spawnablePlatforms.length === 0) return;

    // bereken de afstand van elk platform naar de speler
    const playerPosition = player.position;
    const distancePlatforms = spawnablePlatforms.map(p => {
        const dist = Math.sqrt(Math.pow(p.item.x - playerPosition.x, 2) + Math.pow(p.item.y - playerPosition.y, 2)); // Euclidische afstand
        return { platform: p, distance: dist };
    });

    // Sorteer platforms op basis van de afstand (oplopend)
    distancePlatforms.sort((a, b) => a.distance - b.distance);

    // Kies de 3rde dichtstbijzijnde platform (of de eerstvolgende als er maar 1 is) zodat de enemy niet te dichtbij spawnt
    const targetPlatform = distancePlatforms.length > 2 ? distancePlatforms[2].platform : distancePlatforms[0].platform;

    // Spawn de enemy op dit platform
    if (enemies.length < maxEnemies) {
        enemies.push(new Enemy({
            x: targetPlatform.item.x,
            y: targetPlatform.item.y
        }));
    }
}, spawnInterval);

// class voor de vijanden
class Enemy {
    constructor(position) {
        this.position = {x: position.x, y: position.y};
        this.velocity = {x: 0, y: 0};
        this.width = 65; // breedte van de vijand
        this.height = 50; // hoogte van de vijand
        this.onGround = false; // of de vijand op de grond is
        this.speed = 4; // pas aan voor snellere/slomere enemies
        this.acceleration = 0.07; // versnelling van de vijand
        this.jumpPower = -18; // hoogte van de sprong

        this.frames = { // Store references to the loaded frames
            idle: spinIdleImage,
            walk: spinWalkFrames
        };
        this.currentFrame = this.frames.idle; // Start idle
        
        // Animation properties added
        this.walkFrameIndex = 0;
        this.animationTimer = 0;
        this.animationSpeed = 8; // Adjust speed (higher = langzamer) for spider walk

        this.scaleX = -1; // 1 voor rechts, -1 voor links

        this.initialPositionX = position.x; // beginpositie van de vijand
        // this.chasing = false; // of de vijand de speler achterna zit
    }

    update(playerPosition, deltaTime) {
        const deltaX = playerPosition.x - this.position.x; // afstand tussen de vijand en de speler
        const deltaY = playerPosition.y - this.position.y; // hoogte verschil tussen de vijand en de speler
    
        // 1. ZWAARTEKRACHT
        this.velocity.y += gravity; 
        // 2. SPRINGEN
        this.jumpTimer -= deltaTime; // de vijand heeft een jump timer

        // Platformdetectie en padberekening
        const targetPlatform = this.findNextPlatform(playerPosition); // vind het beste platform

        if (targetPlatform && this.jumpTimer <= 0) { // als er een platform is en de timer is op
            // Spring naar het volgende platform
            this.velocity.y = this.jumpPower;
            this.onGround = false;
            this.jumpTimer = 1000; // Pas de timing aan
        } else if (this.jumpTimer <= 0 && this.onGround) {
            // Indien geen platform, spring dan alsnog af en toe.
            this.velocity.y = this.jumpPower;
            this.onGround = false;
            this.jumpTimer = Math.random() * 2000 + 500; // Random interval tussen 0.5 en 2.5 seconden
        }

        if (this.velocity.x > 0.1) { // Moving right
            this.scaleX = -1; // Facing right
        } else if (this.velocity.x < -0.1) { // Moving left
            this.scaleX = 1; // Facing left
        }

        // 3. BEWEGEN EN ACHTERVOLGEN VAN PLAYER
        if (deltaX > 5) { // als de speler ver genoeg naar rechts is gaat de spin daar naartoe
            this.velocity.x += this.acceleration; 
            if (this.velocity.x > this.speed) this.velocity.x = this.speed; // Limiteer de snelheid
        } else if (deltaX < -5) { // speler is links gaat spin ook naar links
            this.velocity.x -= this.acceleration;
            if (this.velocity.x < -this.speed) this.velocity.x = -this.speed; // Limiteer de snelheid
        } else { // als de vijand dichtbij de speler is, stop met bewegen
            // Vertraag de vijand geleidelijk
            if (this.velocity.x > 0) {
                this.velocity.x -= this.acceleration;
                if (this.velocity.x < 0) this.velocity.x = 0;
            } else if (this.velocity.x < 0) {
                this.velocity.x += this.acceleration;
                if (this.velocity.x > 0) this.velocity.x = 0;
            }
        }
        
        if (deltaY < -50 && this.onGround) { // als de vijand boven de speler is
            // Kijk of er een platform boven de vijand zit én onder de speler
            const targetPlatform = platforms.find(platform => {
                const isAbove = platform.position.y + platform.height < this.position.y;
                const isBetween = platform.position.y < playerPosition.y;
                const isHorizontallyClose =  
                playerPosition.x + 20 > platform.position.x &&
                playerPosition.x < platform.position.x + platform.width;
            return isAbove && isBetween && isHorizontallyClose;
        });
    
        if (targetPlatform) { // als er een platform boven me is die goes is om naartoe te springen
            this.velocity.y = this.jumpPower; // spring
            this.onGround = false; // niet meer op de grond
        }
    }

    // Spring indien nodig (bijvoorbeeld als de speler hoger is)
    if (deltaY < -50 && this.onGround) {
        this.velocity.y = this.jumpPower;
        this.onGround = false;
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

    // 5. BEWEEG SPIN
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    
    platforms.forEach(platform => {
        if (
            this.velocity.y >= 0 && // De vijand beweegt naar beneden
            this.position.y + this.height >= platform.position.y && // Onderkant van de vijand raakt het platform
            this.position.y + this.height - this.velocity.y <= platform.position.y + 1 && // De vijand was boven het platform
            this.position.x + this.width > platform.position.x && // De vijand overlapt horizontaal met het platform
            this.position.x < platform.position.x + platform.width // De vijand overlapt horizontaal met het platform
            ) {
                this.velocity.y = 0; // Stop de verticale snelheid (val niet verder)
                this.position.y = platform.position.y - this.height; // Zet de vijand boven het platform
                this.onGround = true; // De vijand staat op het platform
            }
        })
        // Controleer of de enemy de grond heeft geraakt (grondhoogte is afhankelijk van jouw spel)
        const groundY = canvas.height - groundHeight; // De Y-positie van de grond
        if (this.position.y + this.height >= groundY) {
            this.position.y = groundY - this.height; // Zet de Y-positie gelijk aan de grond
            this.velocity.y = 0; // Stop de val
            this.onGround = true; // Markeer dat de vijand op de grond is
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

    findNextPlatform(playerPosition) {
        let bestPlatform = null; // nog geen beste platform gevonden
        let bestDistance = Infinity; // begin met oneindig grote afstand
    
        platforms.forEach(platform => { // gaat door lijst met platformen heen
            const platformCenterX = platform.position.x + platform.width / 2; // center van het platform
            const playerCenterX = playerPosition.x; // center van de speler
            const distance = Math.abs(platformCenterX - playerCenterX); // bereken afstand tussen de speler en het platform
    
            if ( // als de speler boven het platform is en de vijand onder het platform is
                platform.position.y + platform.height < this.position.y &&
                platform.position.y < playerPosition.y &&
                distance < bestDistance
            ) { // anders is het platform niet goed
                bestPlatform = platform; // als platform aan alles voldoet is dit platform het beste platform
                bestDistance = distance; // update de beste afstand
            }
        }); 
        return bestPlatform; // geef het beste platform terug
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
        this.position = {
            x,
            y
        };
        this.image = image;

        if (this.image && this.image.naturalWidth > 0) {
            this.width = this.image.naturalWidth * platformScaleFactor;
            this.height = this.image.naturalHeight * platformScaleFactor;
        } else {
            console.warn(`Platform image not ready or invalid for Platform at ${x},${y}. Using fallback size.`);
            this.width = 100;
            this.height = 20;
        }

        const chosenItem = chooseRandomItem();
        const itemImage = new Image();
        itemImage.src = chosenItem.image; // Gebruik chosenItem.image als src

        this.itemSize = 40;
        this.item = {
            x: this.position.x + this.width / 2 - this.itemSize / 2,
            y: this.position.y - this.itemSize,
            width: this.itemSize,
            height: this.itemSize,
            image: itemImage,
            opacity: 1,
            fadingOut: false,
            name: chosenItem.name,
        };
    }

    draw(){
        // teken de image als het goed is geladen 
        if (this.image && this.image.complete && this.width > 0) {
             c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height); //teken de platform (image)
        } else {
            c.fillStyle = 'grey'; //kleur van de platform (fallback)
            c.fillRect(this.position.x, this.position.y, this.width || 100, this.height || 20); //teken de platform (fallback)
        }

        // teken de appel als het goed is geladen
        if (
            this.item &&
            !this.item.collected &&
            this.image && this.image.complete && this.width > 0
        ) {
            // als de afbeelding is geladen, teken de appel
            this.item.x = this.position.x + this.width / 2 - this.itemSize / 2; // x position van de appel
            this.item.y = this.position.y - this.itemSize; // y position van de appel
        
            c.save();
            c.globalAlpha = this.item.opacity ?? 1;
        
            if (this.item.image.complete) {
                c.drawImage(this.item.image, this.item.x, this.item.y, this.item.width, this.item.height);
            } else {
                c.fillStyle = 'red';
                c.fillRect(this.item.x, this.item.y, this.item.width, this.item.height);
            }
        
            c.restore();
        }
    }
    // checkCollision met de speler
    checkCollision(player) {
        const item = this.item;

        return ( // als de speler de appel raakt
            player.position.x < item.x + item.width && 
            player.position.x + player.width > item.x &&
            player.position.y < item.y + item.height &&
            player.position.y + player.height > item.y
        ); 
    }
}

// Game variablenen
const player = new Player() //maak een speler aan
const platforms = [] //lege array voor random platforms
// water / death pits 
const deathPits = []; // array om de death pits op te slaan
// ---------------------------------
let scrollOffset = 0;
const jumpHeight = 23; 

// score variabelen
let score = 0;

// HEALTH //
let health = 3; // begin met 3 levens
const maxHealth = 3; // max levens

const fullhealthImage = new Image();
fullhealthImage.src = 'health-bar/full-health.png'; // afbeelding voor de levens
const twohealthImage = new Image();
twohealthImage.src = 'health-bar/two-health.png'; // afbeelding voor 2 levens
const onehealthImage = new Image();
onehealthImage.src = 'health-bar/one-health.png'; // afbeelding voor 1 leven
const nohealthImage = new Image();
nohealthImage.src = 'health-bar/no-health.png'; // afbeelding voor geen levens

// Initialiseer currenthealthImage aan het begin van het spel
let currenthealthImage = fullhealthImage;

function displayHealth() {
    c.drawImage(currenthealthImage, 20, 20, 250, 100); // teken de health bar
}

function updateHealthDisplay() {
    if (health === 3) {
        currenthealthImage = fullhealthImage;
    } else if (health === 2) {
        currenthealthImage = twohealthImage;
    } else if (health === 1) {
        currenthealthImage = onehealthImage;
    } else {
        currenthealthImage = nohealthImage;
    }
}
// platform logica
function generatePlatforms(num) {
    platforms.length = 0; // geen platforms totdat het spel start
    const groundLevelY = canvas.height - groundHeight; // hoogte van de ondergrond

    const heights = [ // vaste hoogtes voor alle platforms waar ze spawnen
        groundLevelY - 150, // Low
        groundLevelY - 275, // Medium
        groundLevelY - 400, // High
        groundLevelY - 550  // Very high
    ].filter(h => h > 50); // Filter to ensure heights are not below 50

    let safeSpaceWidth = 700; // Space before the platforms + enemies spawn
    let lastPlatformEndX = safeSpaceWidth; // Start platforms after the safe space

    const heightGaps = { // verschillende stukken tussen platforms
        [groundLevelY - 150]: { min: 100, max: 200 }, // lage gap
        [groundLevelY - 275]: { min: 150, max: 250 }, // medium gap
        [groundLevelY - 400]: { min: 200, max: 300 }, // hoge gap
        [groundLevelY - 550]: { min: 50, max: 150 }, // hele hoge gap
    }; 

    if (platformImageArray.length === 0) {
        console.error("Platform image array is empty! Cannot generate platforms.");
        return;
    }

    for (let i = 0; i < num; i++) { 
        // kies een random height voor de platforms
        const numberOfHeights = Math.floor(Math.random() * heights.length) + 1; // Random between 1 and number of heights
        const shuffledHeights = heights.sort(() => 0.5 - Math.random()); // Shuffle heights array
        const selectedHeights = shuffledHeights.slice(0, numberOfHeights); // Select a random number of heights

        let clusterX = lastPlatformEndX; // start positie

        // voor elke geselecteerde hoogte 
        for (let j = 0; j < selectedHeights.length; j++) {
            const currentHeight = selectedHeights[j];
            const randomImageIndex = Math.floor(Math.random() * platformImageArray.length); // Random image selection
            const selectedImage = platformImageArray[randomImageIndex];

            const newPlatform = new Platform({ 
                x: clusterX,
                y: currentHeight,
                image: selectedImage
            });

            platforms.push(newPlatform);

            // bereken de x positie van de volgende platform
            const gapRange = heightGaps[currentHeight];
            const randomGap = Math.random() * (gapRange.max - gapRange.min) + gapRange.min;
            clusterX += randomGap; // Move to the next position for the next platform
        }

        // update de x positie van de cluster
        lastPlatformEndX = clusterX; // update de laatste platform positie
    }
}

// water pit generation
function generateDeathPits(numPits) {
    deathPits.length = 0; // haal bestaande pits weg
    const groundLevelY = canvas.height - groundHeight; 
    const minPitWidth = 150; // minimale width van een pit (adjusted)
    const maxPitWidth = 300; // maximale width van een pit (adjusted)
    const minPitGap = 500;   // minimale ruimte tussen 2 pits (adjusted)
    const maxPitGap = 1000;   // maximale ruimte (adjusted)

    let currentX = 2000; // begin positie van de pits (na de platforms)

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
// ------------------------------------

generatePlatforms(0); // geen platforms totdat het spel start
generateDeathPits(0); // geen pits totdat het spel start

const keys = {
    right: { pressed: false }, //toetsen voor de speler
    left: { pressed: false },
    up: { pressed: false },
    down: { pressed: false }
}


let gameRunning = false;
let imagesLoaded = 0;


const totalImages = layers.length // Background layers (incl. voorgrond)
                  + 1 // ondergrond
                  + Object.keys(platformImages).length // platform images
                  + 1 // Capy familie
                  + capybaraWalk.length // alle player frames
                  + waterFrames.length; // water animatie frames
// ---------------------------------------------------------

// functie om de afbeeldingen te laden
function startGameIfReady() {
    imagesLoaded++;
    console.log(`Images loaded: ${imagesLoaded}/${totalImages}`); // Debug log

    // gebruik >= om te zorgen dat de game start als alle afbeeldingen zijn geladen
    if (imagesLoaded >= totalImages && !gameRunning) {
        console.log("All images loaded or accounted for. Starting game...");

        // bereken de breedte en hoogte van de lagen
        layers.forEach(layer => layer.calculateDrawWidthAndHeight());

        // bereken alleen de grondlaag
        groundLayer.calculateDrawWidthAndHeight();
        groundLayer.y = canvas.height - groundHeight; // ondergrond laag onderaan het canvas

        // Capy Family
        if (capyFamily.image.naturalHeight > 0) { /* ... */ } else { /* ... */ }
        if (capyFamily.image.naturalHeight > 0) {
            const aspectRatio = capyFamily.image.naturalWidth / capyFamily.image.naturalHeight;
            capyFamily.drawWidth = capyFamily.drawHeight * aspectRatio;
            capyFamily.y = canvas.height - groundHeight - capyFamily.drawHeight - 5;
        } else {
            capyFamily.drawWidth = 200;
            capyFamily.y = canvas.height - groundHeight - capyFamily.drawHeight - 5;
        }

        // Reset game
        player.position.x = 200; //de ruimte tussen links en de speler
        player.position.y = 100;
        player.velocity.x = 0;
        player.velocity.y = 0;
        player.onGround = false;
        player.currentFrame = player.frames.idle;
        player.walkFrameIndex = 0;
        player.animationTimer = 0;
        player.scaleX = 1;

        scrollOffset = 0;
        capyFamily.x = 10;
        capyFamily.showText = true;

        currentPlayerMoveSpeed = basePlayerMoveSpeed; // Reset speed

        generatePlatforms(30); // Generate platforms in het begin
        
        generateDeathPits(15); // Generate some initial pits 
        
        score = 0; // reset score
        gameRunning = true;
        animate(); // Start the animation loop
    }

    else if (totalImages === 0 && !gameRunning) { gameRunning = true; animate(); }
}

// game loop
function animate(timestamp){
    if (!gameRunning) return;

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
        const waterTileWidth = currentWaterFrame.naturalWidth;
        deathPits.forEach(pit => {
            // check of de pit binnen het canvas valt voordat je gaat tekenen
            if (pit.x + pit.width > 0 && pit.x < canvas.width) {
                // image van het water horizontaal in de pit tekenen
                for (let tileX = 0; tileX < pit.width; tileX += waterTileWidth) {
                    const drawW = Math.min(waterTileWidth, pit.width - tileX);
                    c.drawImage(
                        currentWaterFrame,
                        0, 0, 
                        drawW, currentWaterFrame.naturalHeight,
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

        if (scrollOffset > 300) { capyFamily.showText = false; }
        if (capyFamily.showText && capyFamily.x + capyFamily.drawWidth > 0 && capyFamily.x < canvas.width) {
             c.font = 'bold 20px Arial';
             c.fillStyle = 'white';
             c.textAlign = 'center';
             c.fillText(capyFamily.text, capyFamily.x + capyFamily.drawWidth / 2, capyFamily.y - 15);
        }
    }

    // 5. teken platforms met imgs
    platforms.forEach(platform => {
        platform.draw();

        if (platform.item && !platform.item.collected && platform.checkCollision(player)) { // check of de speler de appel raakt
            console.log("player raakte het item");
            if (platform.item.name === "hart") { // als de item een hart is
                if (health < maxHealth) { // als de geraakte item een hart is en onder de maxhealth zit
                    health++; // health omhoog
                    platform.item.collected = true; //item gecollecteerd
                    playSound(itemSound); // speel het geluid af

                    setTimeout(() => { // na een tijd word het hartje gecollecteerd gereset naar niet gecollecteerd zodat het weer spawnt
                        platform.item.collected = false;
                    }, 8000);
                }
            } else if (platform.item.name === "appel") { // als de item een appel is
                score += 1;
                platform.item.collected = true;
                playSound(itemSound); // speel het geluid af
                setTimeout(() => {
                    platform.item.collected = false;
                }, 5000);
            }
        }

        if (platform.item && !platform.item.collected) {
            platform.item.x -= scrollSpeed;
        }
    });
    
    // 6. update capybara / player
    player.update();

    for (let i = enemies.length - 1; i >= 0; i--) { // Loop backwards om te voorkomen dat de array wordt aangepast tijdens de iteratie
        const enemy = enemies[i]; // update de vijand
        enemy.update(player.position, platforms);
        enemy.draw(); // teken de vijand

        // spin collision met speler
        if (enemy.checkCollision(player)) {
            // Botsing gedetecteerd
            console.log("Player hit enemy!");

            playSound(dodespinSound);

            // Verwijder de vijand uit de array
            enemies.splice(i, 1);

            // Verminder het aantal levens
            health--;
            updateHealthDisplay(); // Update de healthDisplay string

            // Controleer of de speler nog levens heeft
            if (health <= 0) {
                console.log("Game Over! No more health.");
                gameRunning = false; // Stop het spel
                console.log("Score:", score);
                console.log("High score voor update:", highScore); // Voeg deze regel toe
                updateHighScore(score);
                loadGameOver().then(() =>{
                    document.getElementById("game-over-overlay").style.display = "block";
                    document.getElementById("final-score").textContent = "Your score was: " + Math.floor(score);
                });
            }
        }
    }

    // Doodcondities
    const groundSurfaceY = canvas.height - groundHeight; // groundSurfaceY definiëren
    let playerFellInPit = false;
    if (!player.onGround && player.position.y + player.height >= groundSurfaceY) {
        const playerCenterX = player.position.x + player.width / 2;
        for (const pit of deathPits) {
            if (playerCenterX > pit.x && playerCenterX < pit.x + pit.width) {
                playerFellInPit = true;
                break;
            }
        }
        
        // scroll update
        if(scrollSpeed !== 0 && player.velocity.x === 0) {
            scrollOffset += scrollSpeed;
        }
    }   
   
    // teken de score
    c.font = '24px Arial';
    c.fillStyle = 'white';
    c.textAlign = 'center';
    c.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, 40); // text in boven midden

    updateHealthDisplay(); // update de health display
    displayHealth(); // teken de health bar

    // als de speler buiten het canvas valt, stopt het spel en resets het
    if (player.position.y > canvas.height + 200) { 
        console.log("Game Over! No more health.");
        gameRunning = false; // Stop het spel
        console.log("Score:", score);
        console.log("High score voor update:", highScore); // Voeg deze regel toe
        updateHighScore(score);
        loadGameOver().then(() =>{
            document.getElementById("game-over-overlay").style.display = "block";
            document.getElementById("final-score").textContent = "Your score was: " + Math.floor(score);
        });
    }
}

// image loading
function setupImageLoadListener(imageObject, name) {

    if (!imageObject) {
        console.error(`setupImageLoadListener called with invalid imageObject for name: "${name}". Skipping setup.`);
        // start alsnog met het spel als deze afbeelding niet bestaat
         console.warn(`Attempting to continue game start despite missing image object for "${name}"`);
         startGameIfReady();
        return; // stop met de setup
    }

    imageObject.onload = () => {
        console.log(`${name} image loaded.`);
        startGameIfReady();
    };
    imageObject.onerror = () => {
        console.error(`Failed to load ${name} image: ${imageObject.src}`);
        // alsnog beginnen met het spel ookals de afbeelding niet is geladen
        startGameIfReady();
    };

    if (imageObject.complete && imageObject.naturalHeight !== 0) {
        console.log(`${name} image already complete (cached).`);
        // gebruik setTimeout om te zorgen dat de game pas begint als de afbeelding is geladen
        setTimeout(startGameIfReady, 1);
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


if (totalImages === 0) {
    startGameIfReady();
} else {
    console.log(`Setting up load listeners for ${totalImages} images...`);
    // Laadt alle layers in de layers array
    layers.forEach((layer, index) => {

        let layerName = `Layer ${index} (${layer.image.src.split('/').pop()})`;
        setupImageLoadListener(layer.image, layerName);
    });

    // ondergrond laag
    setupImageLoadListener(groundLayer.image, "Ground (Ondergrond.png)");

    // platform images
    for (const key in platformImages) {
        setupImageLoadListener(platformImages[key], `Platform (${key})`);
    }

    // andere images
    setupImageLoadListener(capyFamily.image, "Capy Family");


    // de animatie images (player)
    capybaraWalk.forEach((frame, index) => {
        let frameName = (index === 0) ? "Player (Idle/Walk 0)" : `Player (Walk ${index})`;
        setupImageLoadListener(frame, frameName);
    });

    // *** ADDED: Load Water Frames ***
    waterFrames.forEach((frame, index) => {
        setupImageLoadListener(frame, `Water (${index + 1})`);
    });
    // --------------------------------
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
    groundLayer.y = canvas.height - groundHeight;


    // bereken capy familie opnieuw
    if (capyFamily.image.naturalHeight > 0) {
        const aspectRatio = capyFamily.image.naturalWidth / capyFamily.image.naturalHeight;
        capyFamily.drawWidth = capyFamily.drawHeight * aspectRatio;
        capyFamily.y = canvas.height - groundHeight - capyFamily.drawHeight - 5;
    } else { // als de image nog niet goed geladen is
        capyFamily.drawWidth = 200;
        capyFamily.y = canvas.height - groundHeight - capyFamily.drawHeight - 5;
    }
});


// game over als de health onder de 0 is
async function loadGameOver() {
    try {
        playSound(gameoverSound); // verlies geluid
        stopBGM(); // stop de achtergrond muziek
        const response = await fetch("gameover.html");
        const text = await response.text();
        document.getElementById("game-over-content").innerHTML = text;
        document.getElementById("final-score").textContent = "Your score was: " + Math.floor(score);
        displayHighScore(); // Verplaats deze regel naar het einde
        console.log("gameover.html inhoud geladen en high score weergegeven.");
    } catch (error) {
        console.error("Fout bij het laden van gameover.html:", error);
    }
}

  // pauze menu
  async function loadPauze() {
    try {
        const response = await fetch("pauze.html");
        const text = await response.text();
        document.getElementById("pauze-content").innerHTML = text;
        document.getElementById("pauze-score").textContent = "Your score is: " + Math.floor(score);

        // Event listeners voor de knoppen in pauze.html
        document.getElementById("continue-btn").addEventListener("click", () => {
            console.log("Continue knop geklikt!"); 
            document.getElementById("pauze-overlay").style.display = "none";
            gameRunning = true;
            animate();
        });

        document.getElementById("restart-btn").addEventListener("click", () => {
            // Voeg hier code toe om het spel te herstarten
            location.reload();
        });
    } catch (error) {
        console.error("Fout bij het laden van pauze.html:", error);
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (gameRunning) { // Spel pauzeren
            gameRunning = false; // Spel pauzeren
            loadPauze().then(() => {
                document.getElementById("pauze-overlay").style.display = "block";
            });
        } else { // Spel hervatten
            document.getElementById("pauze-overlay").style.display = "none";
            gameRunning = true; // Spel hervatten
            animate(); // Start de animatiecyclus opnieuw
        }
    }
});

// Haal de high score op uit localStorage of stel deze in op 0
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

// Functie om de high score weer te geven
function displayHighScore() {
    document.getElementById("high-score").textContent = "Your highscore is: " + highScore;
}

// Functie om de high score bij te werken
function updateHighScore(score) {
    console.log("updateHighScore() aangeroepen met score:", score);
    console.log("Huidige high score:", highScore);
    if (score > highScore) {
        console.log("Nieuwe high score gevonden!");
        highScore = score;
        localStorage.setItem("highScore", highScore);
        displayHighScore();
    } else {
        console.log("Score is niet hoger dan high score.");
    }
}

// achtergrond muziek
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
