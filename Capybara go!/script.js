const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d'); //c = context

canvas.width = window.innerWidth; //breedte van het canvas
canvas.height = window.innerHeight; //hoogte van het canvas

const gravity = 1 //zwaartekracht


// parralax
class Layer {
    constructor(imageSrc, speedModifier) {
        this.image = new Image();
        this.image.src = imageSrc;
        this.speedModifier = speedModifier;
        this.x = 0;
        this.y = 0;
        this.drawWidth = 0;
    }

    calculateDrawWidth() {
        if (this.image.naturalHeight > 0) {
            const aspectRatio = this.image.naturalWidth / this.image.naturalHeight;
            this.drawWidth = canvas.height * aspectRatio;
        } else {
            this.drawWidth = canvas.width;
        }
    }

    update(scrollSpeed) {
        if (this.drawWidth === 0 && this.image.naturalWidth > 0) {
            this.calculateDrawWidth();
        }
        if (this.drawWidth <= 0) return;

        this.x -= scrollSpeed * this.speedModifier;

        if (this.x <= -this.drawWidth) {
            const times = Math.ceil(Math.abs(this.x) / this.drawWidth);
            this.x += this.drawWidth * times;
        } else if (this.x > 0 && scrollSpeed < 0) {
             const times = Math.ceil(this.x / this.drawWidth);
             this.x -= this.drawWidth * times;
        }
    }

    draw() {
        if (this.drawWidth <= 0) return;
        c.drawImage(this.image, this.x, this.y, this.drawWidth, canvas.height);
        c.drawImage(this.image, this.x + this.drawWidth, this.y, this.drawWidth, canvas.height);
        c.drawImage(this.image, this.x - this.drawWidth, this.y, this.drawWidth, canvas.height);
    }
}

// de parralax lagen
const layers = [
    new Layer('Background1/lucht.png', 0.1),
    new Layer('Background1/wolken.png', 0.3),
    new Layer('Background1/achtergrondgras.png', 0.6),
    new Layer('Background1/voorgrondgras.png', 1.0)
];


// capybara familie
const capyFamilyImage = new Image();
capyFamilyImage.src = 'images/capyfamily.png';

const capybara = new Image(); // Player image
capybara.src = 'images/capybara-character.png'; // Player image source

const capyFamily = {
    image: capyFamilyImage,
    x: 10,
    y: 0,
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
        this.onGround = false;
    }

    draw(){
        // de capybara image
        if (capybara.complete && capybara.naturalHeight !== 0) {
            c.drawImage(capybara, this.position.x, this.position.y, this.width, this.height);
        } else {
            // Fallback drawing if image isn't loaded yet
            c.fillStyle = 'purple'; 
            c.fillRect(this.position.x, this.position.y, this.width, this.height);
        }
    }

    update(){
        this.draw() //teken de speler
        this.position.x += this.velocity.x //verander de x-positie van de speler met de snelheid
        this.position.y += this.velocity.y //verander de y-positie van de speler met de snelheid

        if (this.position.y + this.height + this.velocity.y < canvas.height) //als het nog boven de canvas is valt de speler nog naar beneden
         {
            if (!this.onGround) {
                 this.velocity.y += gravity //verander de snelheid van de speler met de zwaartekracht
            }
        } else {
            this.velocity.y = 0 //als de speler de onderkant van het canvas raakt stopt het met vallen
            this.position.y = canvas.height - this.height;
            this.onGround = true;
        }
    }
}

class Platform{
    constructor({x, y}){
        this.position = {
            x,
            y
        }
        this.width = Math.random() < 0.5 ? 200 : 100; //random width, 50% kans op 200 en 50% kans op 100
        this.height = 20
    }
    draw(){
        c.fillStyle = 'blue' //kleur van de platform
        c.fillRect(this.position.x, this.position.y, this.width, this.height) //teken de platform
    }
}

const player = new Player() //maak een speler aan
const platforms = [] //lege array voor random platforms
let scrollOffset = 0;
const playerMoveSpeed = 5;
const jumpHeight = 23;

// --- Score Variables ---
let score = 0;
const pointsPerScrollTick = 0.01; // punten per scroll tick

function generatePlatforms(num){
    platforms.length = 0; // clear bestaande platforms voordat er nieuwe komen
    let currentX = 500; // beginpositie voor het eerste platform
    const minYGap = 150;
    const maxYGap = 350;
    const minHeight = canvas.height * 0.4;
    const maxHeight = canvas.height - 50;

    // Ensure there's at least one starting platform if num > 0
    if (num > 0) {
        platforms.push(new Platform({ x: currentX, y: canvas.height - 50}))
    }

    // Generate the rest
    for (let i = 0; i < num -1; i++){ // Generate num-1 more platforms
        const lastPlatform = platforms[platforms.length - 1];
        // Ensure lastPlatform exists before accessing its properties
        if (!lastPlatform) break;
        currentX = lastPlatform.position.x + lastPlatform.width + minYGap + Math.random() * (maxYGap - minYGap);
        let randomY = minHeight + Math.random() * (maxHeight - minHeight)

        platforms.push(new Platform({ x: currentX, y: randomY })) //voeg een nieuwe platform toe aan de array
    }
}

generatePlatforms(0); 

const keys = {
    right: { pressed: false }, //toetsen voor de speler
    left: { pressed: false },
    up: { pressed: false },
    down: { pressed: false } // 's' key functionality was removed from key listeners, this is unused
}

let gameRunning = false;
let imagesLoaded = 0;
// Update totalImages to include player image as well
const totalImages = layers.length + 1 + 1; // layers + capy family + player

function startGameIfReady() {
    imagesLoaded++;
    console.log(`Images loaded: ${imagesLoaded}/${totalImages}`); // Debug log

    if (imagesLoaded === totalImages && !gameRunning) {
        console.log("All images ready, starting game!"); // Debug log
        layers.forEach(layer => layer.calculateDrawWidth());

        if (capyFamily.image.naturalHeight > 0) {
            const aspectRatio = capyFamily.image.naturalWidth / capyFamily.image.naturalHeight;
            capyFamily.drawWidth = capyFamily.drawHeight * aspectRatio;
            capyFamily.y = canvas.height - capyFamily.drawHeight - 5;
        } else {
            console.warn("Could not calculate capy family dimensions."); // Warning log
            capyFamily.drawWidth = 200; // Fallback width
            capyFamily.y = canvas.height - capyFamily.drawHeight - 5;
        }

        // reset game
        player.position.x = 200; //de ruimte tussen links en de speler
        player.position.y = 100;
        player.velocity.x = 0;
        player.velocity.y = 0;
        player.onGround = false;
        scrollOffset = 0;
        capyFamily.x = 10;
        capyFamily.showText = true;

        generatePlatforms(30); // Generate the actual platforms for the game

        score = 0; // reset score
        gameRunning = true;
        animate();
    } else if (totalImages === 0 && !gameRunning) {
         // This case likely won't happen if player image is required
         console.log("No images defined, starting immediately."); // Debug log
         score = 0; // reset score
         gameRunning = true;
         animate();
    }
}

function animate(){
    if (!gameRunning) return;

    requestAnimationFrame(animate) //roept de functie opnieuw aan, waardoor er een animatie ontstaat
    c.clearRect(0, 0, canvas.width, canvas.height) //maakt het canvas leeg

    let scrollSpeed = 0;
    let scoredThisFrame = false; // dubbele scrolling voorkomen

    // beweging van de capybara
    if (keys.right.pressed && player.position.x < canvas.width * 0.4) {
        player.velocity.x = playerMoveSpeed //verander de snelheid van de speler naar rechts
    } else if (keys.left.pressed && player.position.x > canvas.width * 0.2) { //als de toets ingedrukt is en de speler is niet buiten het canvas
        player.velocity.x = -playerMoveSpeed //verander de snelheid van de speler naar links
    } else {
        player.velocity.x = 0 //als de toets niet ingedrukt is, stopt de speler met bewegen

        // Scrolling
        if (keys.right.pressed) {
            scrollSpeed = playerMoveSpeed;
            if (!scoredThisFrame) {
                 score += pointsPerScrollTick;
                 scoredThisFrame = true;
            }
            platforms.forEach((platform) => {
                platform.position.x -= scrollSpeed //als de speler naar rechts beweegt, beweegt de platform ook naar links
            });
            capyFamily.x -= scrollSpeed; // scroll familie image

        } else if (keys.left.pressed && scrollOffset > 0) {
            scrollSpeed = -playerMoveSpeed;
             if (!scoredThisFrame) { // voeg de score alleen toe als er gescrold wordt
                 score += pointsPerScrollTick;
                 scoredThisFrame = true;
             }
            platforms.forEach((platform) => {
                platform.position.x -= scrollSpeed //als de speler naar links beweegt, beweegt de platform ook naar rechts
            });
            capyFamily.x -= scrollSpeed; // scroll familie image
        }
    }

    // parralax scrolling
    layers.forEach(layer => {
        layer.update(scrollSpeed);
        layer.draw();
    });

    // teken capybara familie
    if (capyFamily.image.complete && capyFamily.image.naturalHeight !== 0 && capyFamily.drawWidth > 0) {
        c.drawImage(
            capyFamily.image,
            capyFamily.x,
            capyFamily.y,
            capyFamily.drawWidth,
            capyFamily.drawHeight
        );

        if (scrollOffset > 300) { //haal de tekst weg na 300 pixels
            capyFamily.showText = false;
        }

        if (capyFamily.showText && capyFamily.x + capyFamily.drawWidth > 0 && capyFamily.x < canvas.width) {
             c.font = 'bold 20px Arial';
             c.fillStyle = 'white'; // Color used here for text
             c.textAlign = 'center';
             c.fillText(capyFamily.text, capyFamily.x + capyFamily.drawWidth / 2, capyFamily.y - 15);
        }
    }


    // platform logica
    if (player.position.y + player.height < canvas.height) {
        player.onGround = false;
    }

    platforms.forEach(platform =>{
        platform.draw() //teken de platform

        //platform collision detection
        if (
            player.position.y + player.height <= platform.position.y &&
            player.position.y + player.height + player.velocity.y >= platform.position.y &&
            player.position.x + player.width > platform.position.x &&
            player.position.x < platform.position.x + platform.width
           )
        {
            if (player.velocity.y >= 0) {
                 player.velocity.y = 0 //als de speler boven de platform is, stopt de speler met vallen
                 player.position.y = platform.position.y - player.height;
                 player.onGround = true;
            }
        }
    });


    player.update() //update de speler

    // scroll update
    if(scrollSpeed !== 0 && player.velocity.x === 0) {
         scrollOffset += scrollSpeed;
    }

    // score
    c.font = '24px Arial';
    c.fillStyle = 'white';
    c.textAlign = 'center';
    c.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, 40); // text in boven midden

    // lose scenario
    if (player.position.y > canvas.height + 200) {
        console.log("Game Over! Final Score:", Math.floor(score));
        gameRunning = false; // Stop de game loop

    }
}

// image loading
if (totalImages === 0) {
    startGameIfReady(); 
} else {
    // Loaad de parralax layers
    layers.forEach(layer => {
        layer.image.onload = startGameIfReady;
        layer.image.onerror = () => {
            console.error(`Failed to load layer: ${layer.image.src}`);
            startGameIfReady(); 
        }
        // Check cache
        if(layer.image.complete && layer.image.naturalHeight !== 0) {
             setTimeout(startGameIfReady, 1);
        }
    });

    // Laad capy familie
    capyFamily.image.onload = startGameIfReady;
    capyFamily.image.onerror = () => {
        console.error(`Failed to load capy family image: ${capyFamily.image.src}`);
        startGameIfReady(); // Increment counter even on error
    }
    // Check cache
    if(capyFamily.image.complete && capyFamily.image.naturalHeight !== 0) {
        setTimeout(startGameIfReady, 1);
    }

    // Laad player image
    capybara.onload = startGameIfReady;
    capybara.onerror = () => {
        console.error(`Failed to load player image: ${capybara.src}`);
        startGameIfReady(); // 
    }
     // Check cache
     if(capybara.complete && capybara.naturalHeight !== 0) {
        setTimeout(startGameIfReady, 1);
    }
}


window.addEventListener('keydown', ({ key }) => { // Luistert naar de toetsenbord input
    switch (key.toLowerCase()) { // Zet hoofdletters om naar kleine letters voor consistentie
        case 'a': // 'A' toets
            console.log('left')
            keys.left.pressed = true; // Zet de toets op 'ingedrukt'
            break;

        case 'd': // 'D' toets
            console.log('right')
            keys.right.pressed = true;
            break;

        case 'w': // 'W' toets
            console.log('up')
            if (player.onGround) {
                 player.velocity.y = -jumpHeight; // Spring omhoog
                 player.onGround = false;
            }
            break;
    }
});

window.addEventListener('keyup', ({ key }) => { // Luistert naar de toetsenbord input
    switch (key.toLowerCase()) { // Zet hoofdletters om naar kleine letters voor consistentie
        case 'a': // 'A' toets
            console.log('left')
            keys.left.pressed = false; // Zet de toets op 'niet ingedrukt'
            break;

        case 'd': // 'D' toets
            console.log('right')
            keys.right.pressed = false;
            break;
    }
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    layers.forEach(layer => layer.calculateDrawWidth());
    if (capyFamily.image.naturalHeight > 0) {
        const aspectRatio = capyFamily.image.naturalWidth / capyFamily.image.naturalHeight;
        capyFamily.drawWidth = capyFamily.drawHeight * aspectRatio;
        capyFamily.y = canvas.height - capyFamily.drawHeight - 5;
    }
});
