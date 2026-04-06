# CD-Muziekspeler-Website

Een persoonlijke website voor het beheren en afspelen van mijn CD-collectie via YouTube-links. Momenteel gevuld met nummers van Twenty One Pilots en Harry Styles.

## Functies

- **Bibliotheek beheren**: Nummers en albums handmatig toevoegen in JSON-bestanden.
- **Overzicht**: Sorteren op artiest, album of genre.
- **Zoeken**: Naar nummers of albums.
- **Muziek afspelen**: Play, pauze, stop, skip, volume, shuffle, repeat.
- **Playlists**: Eigen playlists maken en beheren.
- **Responsive design**: Werkt op desktop en mobiel.

## Technische opzet

- **Frontend**: HTML, CSS, JavaScript
- **Data**: JSON-bestanden in `/data/`
- **Audio**: YouTube IFrame Player API

## Hoe te starten

### Lokale ontwikkeling
1. Zorg dat je Python hebt geïnstalleerd (meestal standaard op Linux/Mac).
2. Open een terminal in de projectmap (`/workspaces/CD-Muziekspeler-Website`).
3. Start een lokale server:
   ```
   python3 -m http.server 8000
   ```
4. Open je browser en ga naar `http://localhost:8000`.
5. Klik op `index.html` om de website te openen.

### Alternatieve manieren om server te starten
- Met Node.js: Installeer `http-server` via npm en run `npx http-server`.
- Met PHP: `php -S localhost:8000`.
- Of gebruik een IDE-extensie voor live server.

### Voor productie
- Push de code naar GitHub.
- Schakel GitHub Pages in via repository settings.
- De site is dan live op `https://frederieke12.github.io/CD-Muziekspeler-Website/`.

## Data toevoegen
- Bewerk `data/songs.json` voor nummers.
- Bewerk `data/albums.json` voor albums.
- Bewerk `data/playlists.json` voor playlists.
- Gebruik echte YouTube-video-ID's voor `youtubeId` (bijv. van youtube.com/watch?v=VIDEO_ID).

## Ontwikkeling
Om te ontwikkelen, bewerk de bestanden en herlaad de pagina. Geen build-stap nodig.
