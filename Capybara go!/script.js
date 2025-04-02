// Startscherm
// Toon startscherm
// Toon besturing (WAD + J)
// Toon verhaal
// Toon highscore
// Wacht op "Start" knop

// Initialiseer spel
// Zet canvas breedte en hoogte
// Zet zwaartekracht
// Initialiseer capybara (positie, snelheid, grootte, levens)
// Initialiseer vijanden, platformen, appels en hartjes
// Zet score en highscore op 0

// Spel loop
// Herhaal zolang capybara niet dood is of level niet voltooid:
//     - Werk capybara positie bij
//     - Controleer input (WAD + J) en pas beweging aan
//     - Controleer botsingen:
//         - Met platformen (land op platform)
//         - Met water (restart level)
//         - Met vijanden (verlies 1 hartje)
//         - Met hartjes (herstel leven, max 3)
//         - Met appels (score verhogen)
//     - Update vijanden en andere objecten
//     - Verplaats achtergrond voor parallax effect
//     - Speel geluiden indien nodig
//     - Teken alles op het scherm

// Als capybara geen levens meer heeft
// Toon game over scherm
// Toon score en highscore
// Geef optie om opnieuw te starten

// Als capybara het einde van het level bereikt
// Toon overwinning scherm
// Update highscore indien nodig
// Geef optie om opnieuw te spelen