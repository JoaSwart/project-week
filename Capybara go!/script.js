const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d'); //c = context

canvas.width = window.innerWidth; //breedte van het canvas
canvas.height = window.innerHeight; //hoogte van het canvas

const gravity = 1 //zwaartekracht


class Player {
    constructor(){
        this.position = { //positie van de speler
            x: 100,
            y: 100
        }
        this.velocity = { //snelheid van de speler
            x: 0,
            y: 1   //hoe hoger dit getal, hoe sneller de speler naar beneden valt
        }
        this.width = 40 //breedte en hoogte van de speler
        this.height = 40
    }

    draw(){
        c.fillStyle = 'red' //kleur van de speler
        c.fillRect(this.position.x, this.position.y, this.width, this.height) //tekent een vierkant
    }

    update(){
        this.draw() //teken de speler
        this.position.y += this.velocity.y //verander de y-positie van de speler met de snelheid
        this.position.x += this.velocity.x //verander de x-positie van de speler met de snelheid
        
        if (this.position.y + this.height + this.velocity.y <= canvas.height) //als het nog boven de canvas is valt de speler nog naar beneden
        this.velocity.y += gravity //verander de snelheid van de speler met de zwaartekracht
    else this.velocity.y = 0 //als de speler de onderkant van het canvas raakt stopt het met vallen
    }
}

class Platform{
    constructor({x, y}){
        this.position = {
            x,
            y
        }
        const widths = [ //random widths for the platforms en %kans dat ze voorkomen 
            {width: 100, chance: 0.15},
            {width: 150, chance: 0.15},
            {width: 250, chance: 0.5},
            {width: 350, chance: 0.10},
        ];
        const getRandomWidth = () => { //functie om een random width te krijgen
            const random = Math.random(); //random getal tussen 0 en 1
            let cumulativeChance = 0; //de kans dat de random width voorkomt

            for (const option of widths){
                cumulativeChance += option.chance; //de kans dat de random width voorkomt optelt
                if (random < cumulativeChance){ 
                    return option.width; //random width
                }
            }
            return widths[widths.length - 1].width; //laatste optie
        }
        this.width = getRandomWidth() //random width van de platform
        this.height = 20
    }
    draw(){
        c.fillStyle = 'blue' //kleur van de platform
        c.fillRect(this.position.x, this.position.y, this.width, this.height) //teken de platform
    }
}

const player = new Player() //maak een speler aan
const platforms = [] //lege array voor random platforms

// genereerd random platforms met verschillende breedtes en posities
function generatePlatforms(num){
    let safeSpaceWidth = 700; // Ruimte om te starten zonder platforms
    let minGap = 150; // Minimale horizontale afstand tussen platforms
    let minVerticalGap = 100; // Minimale verticale afstand (zodat je erop kunt springen)
    let maxTries = 10; // Maximaal aantal pogingen om een platform te plaatsen zonder overlap

    let placedPlatforms = []; // Array om de geplaatste platforms bij te houden

    for (let i = 0; i < num; i++) {
        let platformCount = Math.floor(Math.random() * 2) + 1; // Kies 1-2 platforms tegelijk
        let baseX = safeSpaceWidth + i * 400 + Math.random() * 100; // Basis X-positie
        let lastY = 0; // Houdt de vorige Y-positie bij om overlap te voorkomen

        for (let j = 0; j < platformCount; j++) {
            let offsetX = j * (Math.random() * 200 + minGap); // Zorgt dat platforms niet overlappen
            let randomY;

            do {
                randomY = 200 + Math.random() * 450; // Random hoogte. 300 is de start hoogte
            } while (Math.abs(randomY - lastY) < minVerticalGap); // Check dat platforms niet te dicht boven elkaar zitten

            lastY = randomY; // Sla de laatst gekozen Y op voor de volgende check

            platforms.push(new Platform({ x: baseX + offsetX, y: randomY }));
        }
    }
}
generatePlatforms(30) //genereer een hoeveelheid platforms

const keys = {
    right: { pressed: false }, //toetsen voor de speler
    left: { pressed: false },
    up: { pressed: false },
    down: { pressed: false }
}
player.draw()

function animate(){
    requestAnimationFrame(animate) //roept de functie opnieuw aan, waardoor er een animatie ontstaat
    c.clearRect(0, 0, canvas.width, canvas.height) //maakt het canvas leeg
    player.update() //update de speler
    platforms.forEach(platform =>{
        platform.draw() //teken de platform
    })

    if (keys.right.pressed && player.position.x <400){
        player.velocity.x = 5 //verander de snelheid van de speler naar rechts
    } else if (keys.left.pressed && player.position.x > 100) { //als de toets ingedrukt is en de speler is niet buiten het canvas
        player.velocity.x = -5 }//verander de snelheid van de speler naar links}
       
        else {
            player.velocity.x = 0 //als de toets niet ingedrukt is, stopt de speler met bewegen
        
        if (keys.right.pressed){
            platforms.forEach((platform) =>{
                platform.position.x -= 5 //als de speler naar rechts beweegt, beweegt de platform ook naar links
            })
        
        } else if (keys.left.pressed){
            platforms.forEach((platform) =>{
                platform.position.x += 5 //als de speler naar links beweegt, beweegt de platform ook naar rechts 
            })
        }
        }

        platforms.forEach((platform) =>{
        //platform collision detection
        if (player.position.y + player.height <= platform.position.y && player.position.y 
            + player.height + player.velocity.y >= platform.position.y && player.position.x
            + player.width >= platform.position.x && player.position.x <= platform.position.x 
            + platform.width) { 
            player.velocity.y = 0 //als de speler boven de platform is, stopt de speler met vallen
        }
    })
}

animate() //start de animatie

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
            player.velocity.y -= 10; // Spring omhoog
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

        case 'w': // 'W' toets
            console.log('up')
            player.velocity.y -= 20; // Spring omhoog
            break;
    }
});
