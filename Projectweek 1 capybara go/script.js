const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d'); //c = context

canvas.width = window.innerWidth; //breedte van het canvas
canvas.height = window.innerHeight; //hoogte van het canvas

const gravity = 1 //zwaartekracht

const groundHeight = 70; // Hooe hoog de ondegrond is

// images

const groundImage = new Image();
groundImage.src = 'images/Ondergrond.png';


const capyFamilyImage = new Image();
capyFamilyImage.src = 'images/capyfamily.png';

const capybara = new Image(); //capybara
capybara.src = 'images/capybara-character.png';

const platformScaleFactor = 0.5; //de groottes van de platform images

// platform images
// Load all platform images globally
const platformImages = {
    klein1: new Image(),
    klein2: new Image(),
    groot1: new Image(),
    groot2: new Image(),
    medium1: new Image(),
    medium2: new Image(),
    medium3: new Image(),
};
platformImages.klein1.src = 'images/Kleinplatform.png';
platformImages.klein2.src = 'images/Kleinplatform2.png';
platformImages.groot1.src = 'images/Grootplatform.png';
platformImages.groot2.src = 'images/Grootplatform2.png';
platformImages.medium1.src = 'images/Mediumplatform.png';
platformImages.medium2.src = 'images/Mediumplatform2.png';
platformImages.medium3.src = 'images/Mediumplatform3.png';

// array voor de platform images voor random platforms
const platformImageArray = Object.values(platformImages);



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

    // bereken de breedte en hoogte van de laag
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

    // Werkt de positie van de laag bij
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

    // Tekent de laag met een goeie overgang
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
        this.width = 60 //breedte en hoogte van de speler
        this.height = 60
        this.onGround = false; // onground status
    }

    draw(){
        //capybara image
        if (capybara.complete && capybara.naturalHeight !== 0) {
            c.drawImage(capybara, this.position.x, this.position.y, this.width, this.height);
        } else {

            c.fillStyle = 'purple'; // Placeholder kleur als de image nog niet is geladen
            c.fillRect(this.position.x, this.position.y, this.width, this.height);
        }
    }

    update(){
        this.draw(); //teken de speler
        this.position.x += this.velocity.x; //verander de x-positie van de speler met de snelheid

        this.position.y += this.velocity.y; //verander de y-positie van de speler met de snelheid

        this.onGround = false;

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

    } 

    draw(){
        // teken de image als het goed is geladen 
        if (this.image && this.image.complete && this.width > 0) {
             c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height); //teken de platform (image)
        } else {
            c.fillStyle = 'grey'; //kleur van de platform (fallback)
            c.fillRect(this.position.x, this.position.y, this.width || 100, this.height || 20); //teken de platform (fallback)
        }
    }
}
// --------------------------------------------

const player = new Player() //maak een speler aan
const platforms = [] //lege array voor random platforms
let scrollOffset = 0;
const playerMoveSpeed = 5;
const jumpHeight = 23;

// score variabelen
let score = 0;
const pointsPerScrollTick = 0.01; // punten per scroll tick

// platform logica
// modified voor platform images
function generatePlatforms(num){
    platforms.length = 0; // verwijder bestaande platforms
    const groundLevelY = canvas.height - groundHeight;
    // Hoogtes voor de platforms (relatief aan de grond)
    const heights = [ // 4 vaste hoogtes voor de platforms (laag, middel, hoog)
        groundLevelY - 150, // Higher
        groundLevelY - 275, // Mid-high
        groundLevelY - 400, // Mid-low
        groundLevelY - 500
    ].filter(h => h > 50); // filter heights die te hoog zijn
    let safeSpaceWidth = 700; // ruimte voordat je moet beginnen
    let minGap = 150; // afstand tussen de platforms

    let lastPlatformEndX = safeSpaceWidth; // kijk waar het laatste platform eindigt

    if (platformImageArray.length === 0) {
        console.error("Platform image array is empty! Cannot generate platforms.");
        return;
    }

    for (let i = 0; i < num; i++) {
        let platformCount = Math.floor(Math.random() * 5) + 2; // Kies 2-5 platforms tegelijk
        let currentClusterX = lastPlatformEndX + minGap + Math.random() * 150; // voeg ruimte tussen de platforms toe

        // de platforms worden op een random hoogte geplaatst
        for (let j = 0; j < platformCount; j++) {
            // een random image uit de platformImageArray kiezen
            const randomImageIndex = Math.floor(Math.random() * platformImageArray.length);
            const selectedImage = platformImageArray[randomImageIndex];

            let platformHeight = heights[Math.floor(Math.random() * heights.length)]; // kiest een random hoogte uit de beschikbare hoogtes
            let platformX = currentClusterX;

            // Create platform met de image 
            const newPlatform = new Platform({
                x: platformX,
                y: platformHeight,
                image: selectedImage 
            });
            platforms.push(newPlatform); // voeg de nieuwe platform toe aan de lijst

            // Update waar de volgende platform moet komen
            currentClusterX = platformX + newPlatform.width + minGap / 2 + Math.random() * 50;
        }
         lastPlatformEndX = currentClusterX;
    }
}



generatePlatforms(0); // geen platforms totdat het spel start

const keys = {
    right: { pressed: false }, //toetsen voor de speler
    left: { pressed: false },
    up: { pressed: false },
    down: { pressed: false }
}

let gameRunning = false;
let imagesLoaded = 0;

// update de totale images die moeten worden geladen
const totalImages = layers.length // Background layers (incl. voorgrond)
                  + 1 // ondergrond
                  + Object.keys(platformImages).length // platform images
                  + 1 // Capy familie
                  + 1; // player capybara
// -----------------------------

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
        if (capyFamily.image.naturalHeight > 0) {
            const aspectRatio = capyFamily.image.naturalWidth / capyFamily.image.naturalHeight;
            capyFamily.drawWidth = capyFamily.drawHeight * aspectRatio;
             // pas y aan op basis van de grond
            capyFamily.y = canvas.height - groundHeight - capyFamily.drawHeight - 5;
        } else {
            capyFamily.drawWidth = 200; //width als de afbeelding nog niet is geladen
            capyFamily.y = canvas.height - groundHeight - capyFamily.drawHeight - 5;
        }

        // Reset game
        player.position.x = 200; //de ruimte tussen links en de speler
        player.position.y = 100;
        player.velocity.x = 0;
        player.velocity.y = 0;
        player.onGround = false;
        scrollOffset = 0;
        capyFamily.x = 10;
        capyFamily.showText = true;

        generatePlatforms(30); // Generate platforms in het begin

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

    let scrollSpeed = 0;
    let scoredThisFrame = false; // dubbele scrolling voorkomen

    // beweging van de capybara & Scrolling logic
    if (keys.right.pressed && player.position.x < canvas.width * 0.4) {
        player.velocity.x = playerMoveSpeed; //verander de snelheid van de speler naar rechts
    } else if (keys.left.pressed && player.position.x > canvas.width * 0.2) { //als de toets ingedrukt is en de speler is niet buiten het canvas
        player.velocity.x = -playerMoveSpeed; //verander de snelheid van de speler naar links
    } else {
        player.velocity.x = 0; //als de toets niet ingedrukt is, stopt de speler met bewegen

        // Scrolling begint als de speler meer dan 40% van het canvas is
        if (keys.right.pressed) {
            scrollSpeed = playerMoveSpeed;
            if (!scoredThisFrame) { score += pointsPerScrollTick; scoredThisFrame = true; }
            platforms.forEach((platform) => { platform.position.x -= scrollSpeed; }); //als de speler naar rechts beweegt, beweegt de platform ook naar links
            capyFamily.x -= scrollSpeed; // scroll familie image

        } else if (keys.left.pressed && scrollOffset > 0) {
            scrollSpeed = -playerMoveSpeed;
             if (!scoredThisFrame) { score += pointsPerScrollTick; scoredThisFrame = true; }
            platforms.forEach((platform) => { platform.position.x -= scrollSpeed; }); //als de speler naar links beweegt, beweegt de platform ook naar rechts
             capyFamily.x -= scrollSpeed; // scroll familie image
        }
    }


    // de volgorde van hoe alles wordt geladen

    // 1. laadt alle parralax lagen in
    layers.forEach(layer => {
        layer.update(scrollSpeed);
        layer.draw();
    });

    // 2. ondergrond (wordt over de parralax lagen heen getekend)
    groundLayer.update(scrollSpeed);
    groundLayer.draw();

    // 3. capy familie
    if (capyFamily.image.complete && capyFamily.image.naturalHeight !== 0 && capyFamily.drawWidth > 0) {
        c.drawImage(
            capyFamily.image,
            capyFamily.x,
            capyFamily.y,
            capyFamily.drawWidth,
            capyFamily.drawHeight
        );

        if (scrollOffset > 300) { capyFamily.showText = false; } //haal de tekst weg na 300 pixels
        if (capyFamily.showText && capyFamily.x + capyFamily.drawWidth > 0 && capyFamily.x < canvas.width) {
             c.font = 'bold 20px Arial';
             c.fillStyle = 'white'; // Color used here for text
             c.textAlign = 'center';
             c.fillText(capyFamily.text, capyFamily.x + capyFamily.drawWidth / 2, capyFamily.y - 15);
        }
    }


    // 4. teken platforms (Now drawn with images)
    platforms.forEach(platform =>{
        platform.draw(); // Draw method now uses drawImage
    });

    // 5. update capybara
    player.update(); //update de speler

    // scroll update
    if(scrollSpeed !== 0 && player.velocity.x === 0) {
         scrollOffset += scrollSpeed;
    }

    // Draw Score
    c.font = '24px Arial';
    c.fillStyle = 'white';
    c.textAlign = 'center';
    c.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, 40); // text in boven midden

    // lose condition
    const groundLevelY = canvas.height - groundHeight;
    if (player.position.y > groundLevelY + 200) { // speler is onder de ondergrond
        console.log("Game Over! Player fell too low. Final Score:", Math.floor(score));
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
    setupImageLoadListener(capybara, "Player");
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
