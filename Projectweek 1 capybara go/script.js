const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d'); //c = context

canvas.width = window.innerWidth; //breedte van het canvas
canvas.height = window.innerHeight; //hoogte van het canvas

const gravity = 1 //zwaartekracht


// -parralax
// Klasse voor een achtergrondlaag
class Layer {
    // Wordt uitgevoerd bij het maken van een nieuwe laag
    constructor(imageSrc, speedModifier) {
        this.image = new Image(); // Maak een nieuw afbeeldingsobject
        this.image.src = imageSrc; // Stel het afbeeldingsbestand in
        this.speedModifier = speedModifier; // Snelheid waarmee de laag beweegt
        this.x = 0; // Start x-positie
        this.y = 0; // Start y-positie
        this.drawWidth = 0; // Breedte om te tekenen (wordt later berekend)
    }

    // Berekent hoe breed de afbeelding getekend moet worden
    calculateDrawWidth() {
        // Als de hoogte van de afbeelding bekend is
        if (this.image.naturalHeight > 0) {
            const aspectRatio = this.image.naturalWidth / this.image.naturalHeight; // Bereken verhouding
            // Bereken breedte op basis van canvas hoogte en verhouding
            this.drawWidth = canvas.height * aspectRatio;
        } else {
            // Anders, gebruik de volledige canvas breedte
            this.drawWidth = canvas.width;
        }
    }

    // Werkt de positie van de laag bij
    update(scrollSpeed) {
        // Bereken breedte als dat nog niet gedaan is
        if (this.drawWidth === 0 && this.image.naturalWidth > 0) {
            this.calculateDrawWidth();
        }
        // Stop als de breedte ongeldig is
        if (this.drawWidth <= 0) return;

        // Verplaats de laag op basis van scrollsnelheid en laag-snelheid
        this.x -= scrollSpeed * this.speedModifier;

        // Als de laag te ver naar links is geschoven
        if (this.x <= -this.drawWidth) {
            const times = Math.ceil(Math.abs(this.x) / this.drawWidth);
            // Schuif terug naar rechts om te herhalen
            this.x += this.drawWidth * times;
        // Als de laag naar rechts is geschoven (bij terug scrollen)
        } else if (this.x > 0 && scrollSpeed < 0) {
             const times = Math.ceil(this.x / this.drawWidth);
             // Schuif terug naar links om te herhalen
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

//capybara
const capybara = new Image(); 
capybara.src = 'images/capybara-character.png'; 

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
        //capybara image
        if (capybara.complete && capybara.naturalHeight !== 0) {
            c.drawImage(capybara, this.position.x, this.position.y, this.width, this.height);
        } else {
            
            c.fillStyle = 'purple'; // Placeholder color
            c.fillRect(this.position.x, this.position.y, this.width, this.height);
        }
    }

    update(){
        this.draw() //teken de speler
        this.position.x += this.velocity.x //verander de x-positie van de speler met de snelheid
        this.position.y += this.velocity.y //verander de y-positie van de speler met de snelheid

        if (this.position.y + this.height + this.velocity.y < canvas.height) //als het nog boven de canvas is valt de speler nog naar beneden
         {
            // gravity als capybara niet op de grond is
            if (!this.onGround) {
                 this.velocity.y += gravity //verander de snelheid van de speler met de zwaartekracht
            }
        } else {
            this.velocity.y = 0 //als de speler de onderkant van het canvas raakt stopt het met vallen
            this.position.y = canvas.height - this.height; 
            this.onGround = true; // op de grond
        }
    }
}

// class voor de platforms
class Platform{
    constructor({x, y}){
        this.position = {
            x,
            y
        }
       
        const widths = [ // random widths for the platforms
            {width: 100, chance: 0.15},
            {width: 150, chance: 0.25}, 
            {width: 250, chance: 0.5},
            {width: 350, chance: 0.10},
        ];
        const getRandomWidth = () => { //functie om een random width te krijgen
            const random = Math.random(); //random getal tussen 0 en 1
            let cumulativeChance = 0; // de kans dat de random width voorkomt

            for (const option of widths){
                cumulativeChance += option.chance; // de kans dat de random width voorkomt optelt
                if (random < cumulativeChance){
                    return option.width; //random width
                }
            }
            return widths[widths.length - 1].width; // laatste optie
        }
        this.width = getRandomWidth() // random width van de platform
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

// score variabelen
let score = 0; 
const pointsPerScrollTick = 0.01; // punten per scroll tick 

// platform logica
function generatePlatforms(num){
    platforms.length = 0; // verwijder bestaande platforms
    const heights = [200, 325, 450, 525, 600]; // 4 vaste hoogtes voor de platforms (laag, middel, hoog)
    let safeSpaceWidth = 700; // ruimte voordat je moet beginnen
    let minGap = 150; // afstand tussen de platforms


    for (let i = 0; i < num; i++) {
        let platformCount = Math.floor(Math.random() * 3) + 1; // Kies 1-3 platforms tegelijk
        let baseX = safeSpaceWidth + i * 400 + Math.random() * 100; // Basis X-positie

        // de platforms worden op een random hoogte geplaatst
        for (let j = 0; j < platformCount; j++) {
            let randomHeight = heights[Math.floor(Math.random() * heights.length)]; // kiest een random hoogte uit de 4 beschikbare hoogtes
            let randomX = baseX + j * (Math.random() * 200 + minGap); // random X-positie

            platforms.push(new Platform({ x: randomX, y: randomHeight })); // voeg de nieuwe platform toe aan de lijst
        }
    }
}

generatePlatforms(0); 

const keys = {
    right: { pressed: false }, //toetsen voor de speler
    left: { pressed: false },
    up: { pressed: false }, 
    down: { pressed: false } 
}

let gameRunning = false; 
let imagesLoaded = 0; 
const totalImages = layers.length + 1 + 1; // layers + capy family + player 

function startGameIfReady() {
    imagesLoaded++;
    console.log(`Images loaded: ${imagesLoaded}/${totalImages}`); // Debug log

    if (imagesLoaded === totalImages && !gameRunning) {
        layers.forEach(layer => layer.calculateDrawWidth());

        if (capyFamily.image.naturalHeight > 0) {
            const aspectRatio = capyFamily.image.naturalWidth / capyFamily.image.naturalHeight;
            capyFamily.drawWidth = capyFamily.drawHeight * aspectRatio;
            capyFamily.y = canvas.height - capyFamily.drawHeight - 5;
        } else {
           
            capyFamily.drawWidth = 200; 
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

        generatePlatforms(30); 

        score = 0; // reset score
        gameRunning = true;
        animate();
    } else if (totalImages === 0 && !gameRunning) {
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

    // beweging van de capybara (using scroll limits from file 2)
    if (keys.right.pressed && player.position.x < canvas.width * 0.4) {
        player.velocity.x = playerMoveSpeed //verander de snelheid van de speler naar rechts
    } else if (keys.left.pressed && player.position.x > canvas.width * 0.2) { //als de toets ingedrukt is en de speler is niet buiten het canvas (using 0.2 from file 2)
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

        //platform collision detection (using file 2's format which includes setting onGround)
        if (
            player.position.y + player.height <= platform.position.y &&
            player.position.y + player.height + player.velocity.y >= platform.position.y &&
            player.position.x + player.width > platform.position.x &&
            player.position.x < platform.position.x + platform.width
           )
        {
            // Check of die op het platform staat
            if (player.velocity.y >= 0) {
                 player.velocity.y = 0 //als de speler boven de platform is, stopt de speler met vallen
                 player.position.y = platform.position.y - player.height; // Adjust position precisely
                 player.onGround = true; // Set grounded status
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
    // Laadt de parralax layers
    layers.forEach(layer => {
        layer.image.onload = startGameIfReady;
        layer.image.onerror = () => {
            console.error(`Failed to load layer: ${layer.image.src}`);
            startGameIfReady();
        }
        // check cache
        if(layer.image.complete && layer.image.naturalHeight !== 0) {
             setTimeout(startGameIfReady, 1);
        }
    });

    // laad capy familie
    capyFamily.image.onload = startGameIfReady;
    capyFamily.image.onerror = () => {
        console.error(`Failed to load capy family image: ${capyFamily.image.src}`);
        startGameIfReady(); 
    }
    // check cache
    if(capyFamily.image.complete && capyFamily.image.naturalHeight !== 0) {
        setTimeout(startGameIfReady, 1);
    }

    // laad capybara image
    capybara.onload = startGameIfReady;
    capybara.onerror = () => {
        console.error(`Failed to load player image: ${capybara.src}`);
        startGameIfReady(); 
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
        case ' ': // Spatiebalk als alternatief voor 'W' 
            console.log('up')
            if (player.onGround) {
                 player.velocity.y = -jumpHeight; // Spring omhoog
                 player.onGround = false;
            }
            break;

        case 's': // 'S' toets 
            console.log('down')
            player.velocity.y += 10; // naar beneden
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

        // No action needed on keyup for 'w', 's', or space for this implementation
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