// Globale variabelen
let player;
let songs = [];
let albums = [];
let playlists = [];
let currentSongIndex = 0;
let currentPlaylist = [];
let isPlaying = false;
let isShuffled = false;
let isRepeating = false;
let playerReady = false;
let pendingSongIndex = null;
let progressInterval;
let currentView = 'home';

// YouTube API klaar
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    playerReady = true;
    if (pendingSongIndex !== null) {
        const index = pendingSongIndex;
        pendingSongIndex = null;
        playSong(index);
    }
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        if (isRepeating) {
            playSong(currentSongIndex);
        } else {
            nextSong();
        }
    }
    updateProgress();
}

// Laad data
async function loadData() {
    try {
        const [songsResponse, albumsResponse, playlistsResponse] = await Promise.all([
            fetch('data/songs.json'),
            fetch('data/albums.json'),
            fetch('data/playlists.json')
        ]);

        songs = await songsResponse.json();
        albums = await albumsResponse.json();
        playlists = await playlistsResponse.json();

        initializeApp();
    } catch (error) {
        console.error('Fout bij laden data:', error);
    }
}

// Initialiseer app
function initializeApp() {
    setupNavigation();
    setupPlayerControls();
    setupSearch();
    setupBrowseSearch();
    showView('home');
}

// Navigatie setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('header nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('href').substring(1);
            showView(view);
        });
    });
}

// Toon view
function showView(view) {
    // Verberg alle secties
    const sections = document.querySelectorAll('main > section');
    sections.forEach(section => section.classList.add('hidden'));

    // Toon geselecteerde sectie
    const targetSection = document.getElementById(`${view}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        currentView = view;
    }

    // Update actieve nav link
    const navLinks = document.querySelectorAll('header nav a');
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${view}`);
    });

    // Laad view-specifieke content
    switch(view) {
        case 'home':
            showHomeView();
            break;
        case 'browse':
            showBrowseView();
            break;
        case 'library':
            showLibraryView();
            break;
        case 'search':
            showSearchView();
            break;
    }
}

// Home view
function showHomeView() {
    // Hero sectie is altijd zichtbaar
    displayAlbums('#home-section .album-grid');
    displayPlaylistsOverview();
}

// Browse view
function showBrowseView() {
    displayAlbums('#browse-section .album-grid');
}

// Setup browse search
function setupBrowseSearch() {
    const searchInput = document.getElementById('browse-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterAlbums);
        searchInput.value = ''; // Clear search on view change
    }
}

// Filter albums based on search
function filterAlbums() {
    const query = document.getElementById('browse-search-input').value.toLowerCase();
    const albumGrid = document.querySelector('#browse-section .album-grid');

    if (!albumGrid) return;

    const filteredAlbums = albums.filter(album =>
        album.title.toLowerCase().includes(query) ||
        album.artist.toLowerCase().includes(query)
    );

    displayFilteredAlbums(filteredAlbums, albumGrid);
}

// Display filtered albums
function displayFilteredAlbums(filteredAlbums, container) {
    container.innerHTML = '';

    if (filteredAlbums.length === 0) {
        container.innerHTML = '<p>No albums found.</p>';
        return;
    }

    filteredAlbums.forEach(album => {
        const albumItem = document.createElement('div');
        albumItem.className = 'album-item';
        albumItem.innerHTML = `
            <img src="${album.cover}" alt="${album.title}">
            <div class="album-info">
                <h3>${album.title}</h3>
                <p>${album.artist}</p>
            </div>
        `;
        albumItem.addEventListener('click', () => showAlbumView(album));
        container.appendChild(albumItem);
    });
}

// Library view
function showLibraryView() {
    displayPlaylists();
}

// Search view
function showSearchView() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.focus();
        performSearch();
    }
}

// Toon albums
function displayAlbums(containerSelector = '#home-section .album-grid') {
    const albumGrid = document.querySelector(containerSelector);

    if (!albumGrid) return;

    albumGrid.innerHTML = '';

    albums.forEach(album => {
        const albumItem = document.createElement('div');
        albumItem.className = 'album-item';
        albumItem.innerHTML = `
            <img src="${album.cover}" alt="${album.title}">
            <div class="album-info">
                <h3>${album.title}</h3>
                <p>${album.artist}</p>
            </div>
        `;
        albumItem.addEventListener('click', () => showAlbumView(album));
        albumGrid.appendChild(albumItem);
    });
}

// Toon album view
function showAlbumView(album) {
    // Verberg huidige sectie
    document.querySelectorAll('main > section').forEach(section => section.classList.add('hidden'));

    // Toon album view
    const albumView = document.getElementById('album-view');
    albumView.classList.remove('hidden');

    // Vul album header
    document.querySelector('.album-header img').src = album.cover;
    document.querySelector('.album-info h2').textContent = album.title;
    document.querySelector('.album-info p').textContent = `${album.artist} • ${album.tracks.length} nummers`;

    // Vul tracklist
    const tracklist = document.getElementById('album-tracklist');
    tracklist.innerHTML = '';

    album.tracks.forEach((trackId, index) => {
        const song = songs.find(s => s.id === trackId);
        if (song) {
            const li = document.createElement('li');
            li.dataset.songId = song.id;
            li.innerHTML = `
                <span class="track-number">${index + 1}</span>
                <span class="track-title">${song.title}</span>
                <span class="track-duration">${song.duration}</span>
            `;
            li.addEventListener('click', () => playSong(songs.indexOf(song)));
            tracklist.appendChild(li);
        }
    });
}

// Toon playlists overview
function displayPlaylistsOverview() {
    const playlistGrid = document.querySelector('.playlist-grid');
    if (!playlistGrid) return;

    playlistGrid.innerHTML = '';

    playlists.forEach(playlist => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        playlistItem.innerHTML = `
            <h3>${playlist.name}</h3>
            <p>${playlist.songs.length} nummers</p>
        `;
        playlistItem.addEventListener('click', () => showPlaylistView(playlist));
        playlistGrid.appendChild(playlistItem);
    });
}

// Toon alle playlists
function displayPlaylists() {
    const playlistGrid = document.querySelector('#library-section .playlist-grid');
    if (!playlistGrid) return;

    playlistGrid.innerHTML = '';

    playlists.forEach(playlist => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        playlistItem.innerHTML = `
            <h3>${playlist.name}</h3>
            <p>${playlist.songs.length} nummers</p>
        `;
        playlistItem.addEventListener('click', () => showPlaylistView(playlist));
        playlistGrid.appendChild(playlistItem);
    });

    // Voeg nieuwe playlist knop toe
    const newPlaylistBtn = document.createElement('button');
    newPlaylistBtn.id = 'new-playlist';
    newPlaylistBtn.textContent = '+ Nieuwe Playlist';
    newPlaylistBtn.addEventListener('click', createNewPlaylist);
    playlistGrid.appendChild(newPlaylistBtn);
}

// Toon playlist view
function showPlaylistView(playlist) {
    // Verberg huidige sectie
    document.querySelectorAll('main > section').forEach(section => section.classList.add('hidden'));

    // Toon playlist view
    const playlistView = document.getElementById('playlist-view');
    playlistView.classList.remove('hidden');

    // Vul playlist header
    document.querySelector('#playlist-view h2').textContent = playlist.name;

    // Vul tracklist
    const tracklist = document.getElementById('playlist-tracklist');
    tracklist.innerHTML = '';

    playlist.songs.forEach(trackId => {
        const song = songs.find(s => s.id === trackId);
        if (song) {
            const li = document.createElement('li');
            li.dataset.songId = song.id;
            li.innerHTML = `
                <img src="${song.cover}" alt="${song.title}" style="width: 50px; height: 50px; margin-right: 1rem;">
                <div style="flex: 1;">
                    <div>${song.title}</div>
                    <div style="opacity: 0.7; font-size: 0.9rem;">${song.artist}</div>
                </div>
                <span>${song.duration}</span>
            `;
            li.addEventListener('click', () => playSong(songs.indexOf(song)));
            tracklist.appendChild(li);
        }
    });

    // Voeg nummer toevoegen knop toe
    const addSongBtn = document.createElement('button');
    addSongBtn.id = 'add-song-to-playlist';
    addSongBtn.textContent = '+ Nummer Toevoegen';
    addSongBtn.addEventListener('click', () => addSongToPlaylist(playlist));
    playlistView.appendChild(addSongBtn);
}

// Maak nieuwe playlist
function createNewPlaylist() {
    const name = prompt('Naam van nieuwe playlist:');
    if (name) {
        const newPlaylist = {
            id: Date.now().toString(),
            name: name,
            songs: []
        };
        playlists.push(newPlaylist);
        savePlaylists();
        displayPlaylists();
    }
}

// Voeg nummer toe aan playlist
function addSongToPlaylist(playlist) {
    const songTitle = prompt('Zoek naar een nummer om toe te voegen:');
    if (songTitle) {
        const song = songs.find(s => s.title.toLowerCase().includes(songTitle.toLowerCase()));
        if (song) {
            if (!playlist.songs.includes(song.id)) {
                playlist.songs.push(song.id);
                savePlaylists();
                showPlaylistView(playlist);
            } else {
                alert('Dit nummer zit al in de playlist!');
            }
        } else {
            alert('Nummer niet gevonden!');
        }
    }
}

// Opslaan playlists
function savePlaylists() {
    // In een echte app zou je dit naar de server sturen
    console.log('Playlists opgeslagen:', playlists);
}

// Zoek setup
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', performSearch);
}

// Voer zoek uit
function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const results = songs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.album.toLowerCase().includes(query)
    );

    displaySearchResults(results);
}

// Toon zoekresultaten
function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<p>Geen resultaten gevonden.</p>';
        return;
    }

    results.forEach(song => {
        const resultItem = document.createElement('div');
        resultItem.className = 'album-item';
        resultItem.innerHTML = `
            <img src="${song.cover}" alt="${song.title}">
            <div class="album-info">
                <h3>${song.title}</h3>
                <p>${song.artist} • ${song.album}</p>
            </div>
        `;
        resultItem.addEventListener('click', () => playSong(songs.indexOf(song)));
        searchResults.appendChild(resultItem);
    });
}

// Speel song
function playSong(index) {
    if (index < 0 || index >= songs.length) {
        console.warn('Ongeldig nummer index', index);
        return;
    }

    const song = songs[index];
    if (!song) {
        console.warn('Nummer niet gevonden voor index', index);
        return;
    }

    if (!playerReady || !player || typeof player.loadVideoById !== 'function') {
        pendingSongIndex = index;
        console.warn('YouTube speler niet klaar, nummer in wachtrij geplaatst:', song.title);
        return;
    }

    if (!song.youtubeId || song.youtubeId.startsWith('PLACEHOLDER')) {
        alert('Dit nummer heeft nog geen geldige YouTube-link, kies een ander nummer.');
        return;
    }

    currentSongIndex = index;

    try {
        player.loadVideoById({
            videoId: song.youtubeId,
            startSeconds: 0,
            suggestedQuality: 'large'
        });
    } catch (error) {
        console.warn('loadVideoById failed, trying cueVideoById', error);
        if (typeof player.cueVideoById === 'function') {
            player.cueVideoById({
                videoId: song.youtubeId,
                startSeconds: 0,
                suggestedQuality: 'large'
            });
        }
    }

    if (typeof player.playVideo === 'function') {
        player.playVideo();
    }

    isPlaying = true;
    document.getElementById('play-pause').textContent = '⏸️';
    updateNowPlaying(song);
    updateActiveTrack(index);
    startProgressUpdate();
}

// Update now playing
function updateNowPlaying(song) {
    document.getElementById('current-track-cover').src = song.cover;
    document.getElementById('current-track-title').textContent = song.title;
    document.getElementById('current-track-artist').textContent = song.artist;
}

// Update active track
function updateActiveTrack(index) {
    const currentSong = songs[index];
    if (!currentSong) return;

    const tracklists = document.querySelectorAll('#album-tracklist, #playlist-tracklist');
    tracklists.forEach(tracklist => {
        const lis = tracklist.querySelectorAll('li');
        lis.forEach(li => {
            li.classList.toggle('active', li.dataset.songId === String(currentSong.id));
        });
    });
}

// Start progress update
function startProgressUpdate() {
    clearInterval(progressInterval);
    progressInterval = setInterval(updateProgress, 1000);
}

// Update progress
function updateProgress() {
    if (player && player.getCurrentTime) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            document.getElementById('progress-bar').value = progress;
            document.getElementById('current-time').textContent = formatTime(currentTime);
            document.getElementById('duration').textContent = formatTime(duration);
        }
    }
}

// Format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Player controls setup
function setupPlayerControls() {
    document.getElementById('play-pause').addEventListener('click', togglePlayPause);
    document.getElementById('next').addEventListener('click', nextSong);
    document.getElementById('prev').addEventListener('click', prevSong);
    document.getElementById('progress-bar').addEventListener('input', seekTo);
    document.getElementById('volume-bar').addEventListener('input', setVolume);
    document.getElementById('shuffle').addEventListener('click', toggleShuffle);
    document.getElementById('repeat').addEventListener('click', toggleRepeat);
}

// Toggle play/pause
function togglePlayPause() {
    if (isPlaying) {
        player.pauseVideo();
        isPlaying = false;
        document.getElementById('play-pause').textContent = '▶️';
        clearInterval(progressInterval);
    } else {
        player.playVideo();
        isPlaying = true;
        document.getElementById('play-pause').textContent = '⏸️';
        startProgressUpdate();
    }
}

// Volgende nummer
function nextSong() {
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= songs.length) nextIndex = 0;
    playSong(nextIndex);
}

// Vorige nummer
function prevSong() {
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = songs.length - 1;
    playSong(prevIndex);
}

// Seek naar positie
function seekTo(e) {
    const duration = player.getDuration();
    const seekTime = (e.target.value / 100) * duration;
    player.seekTo(seekTime);
}

// Stel volume in
function setVolume(e) {
    player.setVolume(e.target.value);
}

// Toggle shuffle
function toggleShuffle() {
    isShuffled = !isShuffled;
    document.getElementById('shuffle').classList.toggle('active');
}

// Toggle repeat
function toggleRepeat() {
    isRepeating = !isRepeating;
    document.getElementById('repeat').classList.toggle('active');
}

// Init
document.addEventListener('DOMContentLoaded', loadData);