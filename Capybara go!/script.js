const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d'); //c = context

canvas.width = window.innerWidth; //breedte van het canvas
canvas.height = window.innerHeight; //hoogte van het canvas

const gravity = 1.5 //zwaartekracht


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
        this.width = 30 //breedte en hoogte van de speler
        this.height = 30
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

        this.width = 200
        this.height = 20
    }
    draw(){
        c.fillStyle = 'blue' //kleur van de platform
        c.fillRect(this.position.x, this.position.y, this.width, this.height) //teken de platform
        
    }
}

const player = new Player() //maak een speler aan
const platforms = [new Platform({
    x: 200,
    y: 400
}), new Platform({
    x: 600,
    y: 350
})
, new Platform({
    x: 1000,
    y: 500
}), new Platform({
    x: 1600,
    y: 400
})
] //array voor de platforms

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
