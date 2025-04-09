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


// images

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
        } else {
            
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
    drawHeight: 90,
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
        this.width = 60 //breedte en hoogte van de speler (Used for collision AND drawing dimensions)
        this.height = 60
        this.onGround = false; // onground status

        // capybara animatie frames
        this.frames = {
            idle: capybaraIdle, // de idle image
            walk: capybaraWalk, // idle frame+ walk frames
        };
        this.currentFrame = this.frames.idle; // begin met de idle image
        this.walkFrameIndex = 0; // index voor de walk frames
        this.animationTimer = 0; // timer voor de animatie
        this.animationSpeed = 6; // lager nummer= snellere animatie

        this.scaleX = 1; // 1 voor rechts, -1 voor links
    }

    draw(){
        c.save(); // save de huidige canvas staat
        c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
        c.scale(this.scaleX, 1);

        let frameToDraw = this.currentFrame;
        if (frameToDraw && frameToDraw.complete && frameToDraw.naturalHeight !== 0) {
            c.drawImage(frameToDraw, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback drawing
            if (this.frames.idle && this.frames.idle.complete && this.frames.idle.naturalHeight !== 0) {
                c.drawImage(this.frames.idle, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                c.fillStyle = 'purple';
                c.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
        }
        c.restore();
    }

    update(){
        // update de positie van de speler
        if (keys.left.pressed) {
            this.scaleX = -1; // naar links
        } else if (keys.right.pressed) {
            this.scaleX = 1;  // naar rechts
        }

        // animatie logica
        this.animationTimer++;
        let isTryingToWalk = (keys.left.pressed || keys.right.pressed) && this.onGround;

        if (isTryingToWalk) { // walking
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                this.walkFrameIndex++;
                // gebruikt de frames van de walk animatie
                if (this.walkFrameIndex >= this.frames.walk.length) {
                    this.walkFrameIndex = 0;
                }
            }

            this.currentFrame = this.frames.walk[this.walkFrameIndex];

        } else { // idle of jumping/falling state
            this.currentFrame = this.frames.idle; // gebruik de idle image
            this.walkFrameIndex = 0; // reset de walk frame index
            this.animationTimer = 0; // reset de animatie timer
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
        if (!this.onGround && this.position.y + this.height >= groundLevelY) {
             // als de speler op de ondergrond is
             this.velocity.y = 0; // stop met vallen
             this.position.y = groundLevelY - this.height;
             this.onGround = true;
        }

        // voeg zwaartekracht toe als de speler in de lucht is
        // gravity als capybara niet op de grond is
        if (!this.onGround) {
            this.velocity.y += gravity; //verander de snelheid van de speler met de zwaartekracht
        }

    }
}

// ENEMIES
let enemies = [];
let maxEnemies = 1; // max aantal enemies
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

    // Kies de tweede dichtstbijzijnde platform (of de eerstvolgende als er maar 1 is) zodat de enemy niet te dichtbij spawnt
    const targetPlatform = distancePlatforms.length > 1 ? distancePlatforms[1].platform : distancePlatforms[0].platform;

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
        this.width = 60; // breedte van de vijand
        this.height = 40; // hoogte van de vijand
        this.onGround = false; // of de vijand op de grond is
        this.speed = 2; // pas aan voor snellere/slomere enemies
        this.jumpPower = -20; // hoogte van de sprong

        this.enemyImage = new Image();
        this.enemyImage.src = './images/spin.png'; // vijand afbeelding

        this.patrolDistance = 100; // afstand die de vijand kan patrouilleren
        this.initialPositionX = position.x; // beginpositie van de vijand
        this.chasing = false; // of de vijand de speler achterna zit
    }

    update(playerPosition, deltaTime) {
        // 1. ZWAARTEKRACHT
        if (!this.onGround) {
            this.velocity.y += gravity; // Voeg zwaartekracht toe
        }
        // 2. SPRINGEN
        this.jumpTimer -= deltaTime;

        // Platformdetectie en padberekening
    const targetPlatform = this.findNextPlatform(playerPosition);

    if (targetPlatform && this.jumpTimer <= 0) {
        // Spring naar het volgende platform
        this.velocity.y = this.jumpPower;
        this.onGround = false;
        this.jumpTimer = 1000; // Pas de timing aan
    } else if (this.jumpTimer <= 0 && this.onGround) {
        // als er geen platform is, spring dan alsnog af en toe. 
        this.velocity.y = this.jumpPower;
        this.onGround = false;
        this.jumpTimer = Math.random() * 2000 + 500;
    }
        
    const deltaX = playerPosition.x - this.position.x; 
    const deltaY = playerPosition.y - this.position.y;

        // 3. BEWEGEN EN ACHTERVOLGEN VAN PLAYER
    if (deltaX > 5) {
        this.velocity.x = this.speed;
    } else if (deltaX < -5) {
            this.velocity.x = -this.speed;
    } else {
        this.velocity.x = 0; // stop met bewegen als de vijand dichtbij de speler is
    }
        
        
    if (deltaY < -50 && this.onGround) {
        // Kijk of er een platform boven de vijand zit én onder de speler
        const targetPlatform = platforms.find(platform => {
            const isAbove = platform.position.y + platform.height < this.position.y;
            const isBetween = platform.position.y < playerPosition.y;
            const isHorizontallyClose = 
                playerPosition.x + 20 > platform.position.x &&
                playerPosition.x < platform.position.x + platform.width;
            return isAbove && isBetween && isHorizontallyClose;
        });
    
        if (targetPlatform) {
            this.velocity.y = this.jumpPower;
            this.onGround = false;
        }
    }

    // Spring indien nodig (bijvoorbeeld als de speler hoger is)
    if (deltaY < -50 && this.onGround) {
        this.velocity.y = this.jumpPower;
        this.onGround = false;
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
            this.position.x < platform.position.x + platform.width
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
            this.onGround = true; // Markeer dat de enemy op de grond is
        } else {
            this.onGround = false; // De enemy is niet op de grond als hij niet op de grond komt
        }
    }


    draw() {
        c.drawImage(this.enemyImage, this.position.x, this.position.y, this.width, this.height);
    } 

    findNextPlatform(playerPosition) {
        let bestPlatform = null;
        let bestDistance = Infinity;
    
        platforms.forEach(platform => {
            const platformCenterX = platform.position.x + platform.width / 2;
            const playerCenterX = playerPosition.x;
            const distance = Math.abs(platformCenterX - playerCenterX);
    
            if (
                platform.position.y + platform.height < this.position.y &&
                platform.position.y < playerPosition.y &&
                distance < bestDistance
            ) {
                bestPlatform = platform;
                bestDistance = distance;
            }
        });
    
        return bestPlatform;
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
    constructor({x, y, image}){ 
        this.position = {
            x,
            y
        }
        this.image = image; 

        // width en height worden bepaald door de afbeelding
        // checks of de afbeelding is geladen
        if (this.image && this.image.naturalWidth > 0) {
             this.width = this.image.naturalWidth * platformScaleFactor;
             this.height = this.image.naturalHeight * platformScaleFactor;
        } else {
            // fallback groottes als de images niet geladen zijn
            console.warn(`Platform image not ready or invalid for Platform at ${x},${y}. Using fallback size.`);
            this.width = 100; // Example fallback
            this.height = 20;  // Example fallback
        }

        const redApple = new Image();
        redApple.src = 'images/red-apple.png';
        this.itemSize = 40;
        this.item = { // appel object, fading-out en opacity erbij geplaatst
            x: this.position.x + this.width / 2 - this.itemSize / 2, // x position van de items
            y: this.position.y - this.itemSize, // y position van de items
            width: this.itemSize,
            height: this.itemSize,
            image: redApple, // appel foto
            opacity: 1, // transparantie van de appel, word 0 als het aangeraakt is
            fadingOut: false // of de appel aan het vervagen is
        } 
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
let healthDisplay = "❤️❤️❤️"; // begin met 3 levens

function getHealthDisplay() {
    return healthDisplay
}

function displayHealth() {
    c.font = '24px Arial';
    c.fillStyle = 'white';
    c.textAlign = 'left';
    c.fillText(`Health: ${getHealthDisplay()}`, 20, 40); // text in boven links
}

// platform logica
function generatePlatforms(num) {
    platforms.length = 0; // Clear existing platforms
    const groundLevelY = canvas.height - groundHeight; // Calculate the Y position of the ground

    const heights = [ // Fixed heights for the platforms
        groundLevelY - 150, // Low
        groundLevelY - 275, // Medium
        groundLevelY - 400, // High
        groundLevelY - 550  // Very high
    ].filter(h => h > 50); // Filter to ensure heights are not below 50

    let safeSpaceWidth = 700; // Space before the platforms + enemies spawn
    let lastPlatformEndX = safeSpaceWidth; // Start platforms after the safe space

    const heightGaps = { // Different gaps between height platforms
        [groundLevelY - 150]: { min: 100, max: 200 }, // Low height gap range
        [groundLevelY - 275]: { min: 150, max: 250 }, // Medium height gap range
        [groundLevelY - 400]: { min: 200, max: 300 }, // High height gap range
        [groundLevelY - 550]: { min: 50, max: 150 }, // Very high height gap range
    };

    if (platformImageArray.length === 0) {
        console.error("Platform image array is empty! Cannot generate platforms.");
        return;
    }

    for (let i = 0; i < num; i++) { 
        // Randomize the number of platforms in the cluster
        const numberOfHeights = Math.floor(Math.random() * heights.length) + 1; // Random between 1 and number of heights
        const shuffledHeights = heights.sort(() => 0.5 - Math.random()); // Shuffle heights array
        const selectedHeights = shuffledHeights.slice(0, numberOfHeights); // Select a random number of heights

        let clusterX = lastPlatformEndX; // Start position for the cluster

        // For each selected height, create a platform
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

            // Calculate the gap for this platform's height and adjust the position for the next platform
            const gapRange = heightGaps[currentHeight];
            const randomGap = Math.random() * (gapRange.max - gapRange.min) + gapRange.min;
            clusterX += randomGap; // Move to the next position for the next platform
        }

        // Update lastPlatformEndX after all platforms in this cluster are placed
        lastPlatformEndX = clusterX; // Set position for the next cluster
    }
}

// water pit generation
function generateDeathPits(numPits) {
    deathPits.length = 0; // haal bestaande pits weg
    const groundLevelY = canvas.height - groundHeight; 
    const minPitWidth = 200; // minimale width van een pit
    const maxPitWidth = 400; // maximale width van een pit
    const minPitGap = 400;   // minimale ruimte tussen 2 pits
    const maxPitGap = 800;   // maximale ruimte

    let currentX = 1500; // begin positie van de pits (na de platforms)

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

function animate(){
    if (!gameRunning) return;

    requestAnimationFrame(animate); //roept de functie opnieuw aan, waardoor er een animatie ontstaat
    c.clearRect(0, 0, canvas.width, canvas.height); //maakt het canvas leeg

    // update de snelheid op basis van de score
    let speedProgress = Math.min(score / scoreForMaxSpeed, 1.0);
    currentPlayerMoveSpeed = basePlayerMoveSpeed + (maxPlayerMoveSpeed - basePlayerMoveSpeed) * speedProgress;
    currentPlayerMoveSpeed = Math.min(currentPlayerMoveSpeed, maxPlayerMoveSpeed);

    // water animatie 
    waterAnimationTimer++;
    if (waterAnimationTimer >= waterAnimationSpeed) {
        waterAnimationTimer = 0;
        currentWaterFrameIndex++;
        if (currentWaterFrameIndex >= waterFrames.length) {
            currentWaterFrameIndex = 0;
        }
    }
    const currentWaterFrame = waterFrames[currentWaterFrameIndex];

    let scrollSpeed = 0;
    let scoredThisFrame = false; // dubbele scrolling voorkomen

    // beweging van de capybara & Scrolling logic using currentPlayerMoveSpeed
    if (keys.right.pressed && player.position.x < canvas.width * 0.4) {
        player.velocity.x = currentPlayerMoveSpeed;
    } else if (keys.left.pressed && player.position.x > canvas.width * 0.2) {
        player.velocity.x = -currentPlayerMoveSpeed;
    } else {
        player.velocity.x = 0;

        // Scrolling
        if (keys.right.pressed) {
            scrollSpeed = currentPlayerMoveSpeed;
            platforms.forEach((platform) => { platform.position.x -= scrollSpeed; });
            deathPits.forEach((pit) => { pit.x -= scrollSpeed; });
            capyFamily.x -= scrollSpeed;
            enemies.forEach((enemy) => { enemy.position.x -= scrollSpeed; });

        } else if (keys.left.pressed && scrollOffset > 0) {
            scrollSpeed = -currentPlayerMoveSpeed;
            platforms.forEach((platform) => { platform.position.x -= scrollSpeed; });
            deathPits.forEach((pit) => { pit.x -= scrollSpeed; });
            capyFamily.x -= scrollSpeed;
            enemies.forEach((enemy) => { enemy.position.x -= scrollSpeed; }); 
        }
    }


    // de volgorde van hoe alles wordt geladen

    // 1. laadt alle parralax lagen in
    layers.forEach(layer => {
        layer.update(scrollSpeed);
        layer.draw();
    });

    // 2. Teken de grondlaag met pits door gebruik te maken van clipping (clipping = stukken uit de grond halen en alleen in die plekken mag water)
    groundLayer.update(scrollSpeed); // update de positie eerst

    c.save(); // save canvas eerst
    c.beginPath(); 

    const groundY = canvas.height - groundHeight; // y positie waar de grond/water begint
    let lastSafeX = 0; // Begin met de laatste veilige x positie (waar de speler kan staan)

    deathPits.sort((a, b) => a.x - b.x); // sorteer de pits op x positie (van links naar rechts)

    // Loop door de death pits en maak een clipping path
    deathPits.forEach(pit => {
        // bereken het einde van de veilige x positie
        const safeEndX = Math.max(lastSafeX, pit.x);

        // voeg een rect toe voor de veilige x positie
        if (safeEndX > lastSafeX) {
            c.rect(lastSafeX, groundY, safeEndX - lastSafeX, groundHeight);
        }
        // update het beginpunt voor de volgende pit
        lastSafeX = Math.max(lastSafeX, pit.x + pit.width);
    });

    // voeg het laatste veilige rect toe (tot het einde van het canvas)
    if (lastSafeX < canvas.width) {
        c.rect(lastSafeX, groundY, canvas.width - lastSafeX, groundHeight);
    }
    // voeg een rect toe voor de bovenkant van de grondlaag
    // dit voorkomt dat de grondlaag ook boven de pits wordt getekend
    c.rect(0, 0, canvas.width, groundY);


    c.clip(); 

    // teken de grond laag
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
    if (capyFamily.image.complete && capyFamily.image.naturalHeight !== 0 && capyFamily.drawWidth > 0) { /* ... */ }
    if (capyFamily.image.complete && capyFamily.image.naturalHeight !== 0 && capyFamily.drawWidth > 0) {
        c.drawImage(
            capyFamily.image,
            capyFamily.x,
            capyFamily.y,
            capyFamily.drawWidth,
            capyFamily.drawHeight
        );
        if (scrollOffset > 300) { capyFamily.showText = false; }
        if (capyFamily.showText && capyFamily.x + capyFamily.drawWidth > 0 && capyFamily.x < canvas.width) {
             c.font = 'bold 20px Arial';
             c.fillStyle = 'white';
             c.textAlign = 'center';
             c.fillText(capyFamily.text, capyFamily.x + capyFamily.drawWidth / 2, capyFamily.y - 15);
        }
    }

    // 5. teken platforms met imgs
    platforms.forEach(platform =>{
        platform.draw(); // Draw method now uses drawImage

        // item collision
        if ( // als de speler de appel raakt 
            platform.item && 
            !platform.item.collected && 
            platform.checkCollision(player)
        ) { 
            console.log("player touched the item");
            score += 1; //verander de score
            // platform.item.opacity = 0; // maak de appel transparant
            platform.item.collected = true; // verwijder de appel

            setTimeout(() => {
                platform.item.collected = false; // reset de appel
            }, 5000); // 5 seconden wachten voordat de appel weer verschijnt
        }

        if (platform.item && !platform.item.collected) { // als de appel nog niet is aangeraakt en de appel is geladen
            platform.item.x -= scrollSpeed; // scroll de appel met de platform
        }        
        // beweeg de appel (item) met het platform
    });

    // 6. update capybara / player
    player.update();

    for (let i = enemies.length - 1; i >= 0; i--) { // Loop backwards om te voorkomen dat de array wordt aangepast tijdens de iteratie
        const enemy = enemies[i]; // update de vijand
        enemy.update(player.position, platforms);
        enemy.draw(); // teken de vijand

        // collision met speler
        if (enemy.checkCollision(player)) {
            // Botsing gedetecteerd
            console.log("Player hit enemy!");

            // Verwijder de vijand uit de array
            enemies.splice(i, 1);

            // Verminder het aantal levens
            health--;
            updateHealthDisplay(); // Update de healthDisplay string

            // Controleer of de speler nog levens heeft
            if (health <= 0) {
                console.log("Game Over! No more health.");
                gameRunning = false; // Stop het spel
            }
        }
    }
    

    // water / death pit collision check 
    const groundSurfaceY = canvas.height - groundHeight;
    if (player.position.y + player.height > groundSurfaceY) { // check alleen als de speler on de ground level is
        for (const pit of deathPits) {
            // Check horizontale overlapping
            if (player.position.x < pit.x + pit.width && // speler is links van de pit
                player.position.x + player.width > pit.x)   // spele is rechts van de pit
            {
                // speler is in de pit
                console.log("Game Over! Player fell into a pit. Final Score:", Math.floor(score));
                gameRunning = false; // Stop the game loop
                break; 
            }
        }
    }

    // scroll update
    if(scrollSpeed !== 0 && player.velocity.x === 0) {
         scrollOffset += scrollSpeed;
    }

    // Draw Score
    c.font = '24px Arial';
    c.fillStyle = 'white';
    c.textAlign = 'center';
    c.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, 40); // text in boven midden

    displayHealth(); // toon de levens

    if (player.position.y > canvas.height + 200) { 
        console.log("Game Over! Player fell off screen. Final Score:", Math.floor(score));
        gameRunning = false; // Stop de game loop
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



// event listeners
window.addEventListener('keydown', ({ key }) => { // Luistert naar de toetsenbord input
    switch (key.toLowerCase()) { // Zet hoofdletters om naar kleine letters voor consistentie
        case 'a': // 'A' toets
            keys.left.pressed = true; // Zet de toets op 'ingedrukt'
            break;

        case 'd': // 'D' toets
            keys.right.pressed = true;
            break;

        case 'w': // 'W' toets
        case ' ': // Spatiebalk als alternatief voor 'W'
            if (player.onGround) { // spring alleen als de speler op de grond is of op een platform
                 player.velocity.y = -jumpHeight; // Spring omhoog
            }
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
