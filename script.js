const container = document.getElementById('container');
const zoneViewer = document.getElementById('zoneViewer');
let zoneFrame = document.getElementById('zoneFrame');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');

// URLs remain the same
const zonesURL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

let zones = [];
let popularityData = {};

/**
 * Fetches the main zones list and popularity data, then initializes the app.
 */
async function listZones() {
    try {
        const response = await fetch(zonesURL);
        const json = await response.json();
        zones = json;
        await fetchPopularity();
        sortZones();
        
        // Handle direct ID link (if any)
        const search = new URLSearchParams(window.location.search);
        const id = search.get('id');
        if (id) {
            const zone = zones.find(zone => zone.id + '' == id + '');
            if (zone) {
                openZone(zone);
            }
        }
    } catch (error) {
        container.innerHTML = `Error loading zones: ${error}`;
    }
}

/**
 * Fetches popularity data for sorting.
 */
async function fetchPopularity() {
    try {
        const response = await fetch("https://data.jsdelivr.com/v1/stats/packages/gh/gn-math/html@main");
        const data = await response.json();
        // Popularity data is structured differently, extract total downloads by file name
        data.files.forEach(file => {
            // Converts 'zone-123.html' to just '123' and stores its total downloads
            const match = file.name.match(/zone-(\d+)\.html/);
            if (match) {
                popularityData[match[1]] = file.total;
            }
        });
    } catch (error) {
        console.warn("Could not fetch popularity data. Sorting by popularity will use 0 for all zones.", error);
    }
}

/**
 * Creates the HTML element for a single, visually enhanced zone card.
 * @param {object} zone - The zone data object.
 * @returns {HTMLElement} - The fully constructed card element.
 */
function createZoneCard(zone) {
    const card = document.createElement('div');
    // Class for the new grid layout and styling
    card.className = 'zone-card';
    card.onclick = () => openZone(zone);

    // Image element for the game cover
    const image = document.createElement('img');
    image.className = 'zone-card-image';
    image.src = `${coverURL}/${zone.id}.png`;
    image.alt = `Cover for ${zone.name}`;
    image.loading = 'lazy'; // Improve performance
    image.onerror = function() {
        // Fallback to the uploaded image if the primary cover doesn't load
        this.src = 'image_ab22d6.jpg'; 
    };

    // Info container
    const info = document.createElement('div');
    info.className = 'zone-card-info';

    // Name (Title)
    const name = document.createElement('div');
    name.className = 'zone-card-name';
    name.textContent = zone.name;

    // ID (Metadata)
    const id = document.createElement('div');
    id.className = 'zone-card-id';
    // Display popularity if available, otherwise just ID
    const popularity = popularityData[zone.id] || 0;
    id.textContent = `ID: #${zone.id} | Downloads: ${popularity.toLocaleString()}`;

    // Assemble the card
    info.appendChild(name);
    info.appendChild(id);
    card.appendChild(image);
    card.appendChild(info);

    return card;
}

/**
 * Clears the container and renders the list of zones.
 * @param {Array} zonesToDisplay - The list of zones to render.
 */
function displayZones(zonesToDisplay) {
    container.innerHTML = '';
    
    // Update the count element
    const zoneCount = document.getElementById('zoneCount');
    if (zoneCount) {
        zoneCount.textContent = `Displaying ${zonesToDisplay.length} games.`;
    }

    zonesToDisplay.forEach(zone => {
        container.appendChild(createZoneCard(zone));
    });
}

/**
 * Sorts the zones based on the selected option and re-renders the list.
 */
function sortZones() {
    const sortBy = sortOptions.value;

    zones.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'id') {
            return a.id - b.id;
        } else if (sortBy === 'popular') {
            // Use fetched popularity data, default to 0 if not found
            const popA = popularityData[a.id] || 0;
            const popB = popularityData[b.id] || 0;
            return popB - popA; // Sort descending (most popular first)
        }
        return 0;
    });

    // After sorting, display the full (but sorted) list
    filterZones(); // Re-apply the current search filter
}

/**
 * Filters zones based on the search bar input and re-renders the list.
 */
function filterZones() {
    const filter = searchBar.value.toLowerCase();
    
    const filteredZones = zones.filter(zone => 
        // Filter by name or ID
        zone.name.toLowerCase().includes(filter) || 
        zone.id.toString().includes(filter)
    );
    
    displayZones(filteredZones);
}

/**
 * Opens the zone viewer modal with the selected game.
 * @param {object} zone - The zone data object.
 */
function openZone(zone) {
    const zoneNameSpan = document.getElementById('zoneName');
    const zoneIdSpan = document.getElementById('zoneId');
    
    zoneNameSpan.textContent = zone.name;
    zoneIdSpan.textContent = `(#${zone.id})`;
    
    zoneFrame.src = `${htmlURL}/zone-${zone.id}.html`;
    zoneViewer.style.display = 'flex'; // Use flex to center it
    document.body.style.overflow = 'hidden'; // Prevent scrolling underneath
}

/**
 * Closes the zone viewer modal.
 */
function closeZone() {
    zoneViewer.style.display = 'none';
    zoneFrame.src = 'about:blank'; // Stop audio/video
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

/**
 * Opens the current zone frame in fullscreen.
 */
function fullscreenZone() {
    if (zoneFrame.requestFullscreen) {
        zoneFrame.requestFullscreen();
    } else if (zoneFrame.webkitRequestFullscreen) {
        zoneFrame.webkitRequestFullscreen();
    } else if (zoneFrame.msRequestFullscreen) {
        zoneFrame.msRequestFullscreen();
    }
}

/**
 * Sets the zone frame to about:blank as a fallback for broken embeds.
 */
function aboutBlank() {
    zoneFrame.src = 'about:blank';
}

/**
 * Saves all localStorage and cookies to a downloadable file.
 */
function saveData() {
    let data = JSON.stringify(localStorage) + "\n\n|\n\n" + document.cookie;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], {
        type: "text/plain"
    }));
    link.download = `${Date.now()}.data`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Loads data from a user-selected file into localStorage and cookies.
 * @param {Event} event - The file input change event.
 */
function loadData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        const [localStorageData, cookieData] = content.split("\n\n|\n\n");
        try {
            // Restore localStorage
            const parsedData = JSON.parse(localStorageData);
            for (let key in parsedData) {
                localStorage.setItem(key, parsedData[key]);
            }
        } catch (error) {
            console.error("Error parsing localStorage data:", error);
            alert("Warning: Could not restore all data. Check console for details.");
        }
        if (cookieData) {
            // Restore cookies
            const cookies = cookieData.split("; ");
            cookies.forEach(cookie => {
                // Simplistic cookie setting, may not fully restore domain/path but is a start
                document.cookie = cookie; 
            });
        }
        alert("Data loaded! Refreshing the page is recommended.");
        // Optional: window.location.reload(); 
    };
    reader.readAsText(file);
}

// === DARK MODE TOGGLE LOGIC (for the new floating button) ===
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        // You would need to add a .dark-mode selector to your CSS 
        // to switch the theme if you want a lighter version. 
        // Currently, your CSS is already a dark theme.
    });
}


// Start the application when the script loads (or HTML body loads)
listZones();
