import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

// Constants and configuration
const GRID_SIZE = 1e-4;
const CACHE_RADIUS = 8;
const SPAWN_RATE = 0.1;
const OAKES_CLASSROOM = leaflet.latLng(36.98949379578401, -122.06277128548504);

let totalPoints = 0;
let coinCount = 0;

// Initialize the map
const geoMap = leaflet.map("map", {
  center: OAKES_CLASSROOM,
  zoom: 19,
  zoomControl: true, // Enable zoom control
  scrollWheelZoom: true, // Allow zoom with mouse scroll
});

// Load OpenStreetMap tiles
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(geoMap);

// Add player marker
const playerMarker = leaflet.marker(OAKES_CLASSROOM).addTo(geoMap);

// Update player stats
const statusPanel = document.querySelector("#statusPanel")!;
const inventoryPanel = document.querySelector("#inventory")!;
function updateStats() {
  statusPanel.innerHTML = `Points: ${totalPoints}`;
  inventoryPanel.innerHTML = `Inventory: ${coinCount} coins`;
}

// Function to handle cache interactions
function createCache(x: number, y: number) {
  const bounds = leaflet.latLngBounds([
    [OAKES_CLASSROOM.lat + x * GRID_SIZE, OAKES_CLASSROOM.lng + y * GRID_SIZE],
    [
      OAKES_CLASSROOM.lat + (x + 1) * GRID_SIZE,
      OAKES_CLASSROOM.lng + (y + 1) * GRID_SIZE,
    ],
  ]);

  const cacheRect = leaflet.rectangle(bounds).addTo(geoMap);
  let coinsInCache = Math.floor(Math.random() * 5) + 1;

  cacheRect.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
      <div style="text-align:center;font-weight:bold;">Inventory</div>
      <div>Cache at (${x}, ${y})</div>
      <div>Coins Available: <span id="cacheCoins">${coinsInCache}</span></div>
      <button id="collectBtn">Collect</button>
      <button id="depositBtn">Deposit</button>
    `;

    popupDiv.querySelector("#collectBtn")!.addEventListener("click", () => {
      if (coinsInCache > 0) {
        coinCount += coinsInCache;
        coinsInCache = 0;
        updateStats();
        popupDiv.querySelector("#cacheCoins")!.textContent = "0";
      }
    });

    popupDiv.querySelector("#depositBtn")!.addEventListener("click", () => {
      if (coinCount > 0) {
        coinsInCache += coinCount;
        totalPoints += coinCount;
        coinCount = 0;
        updateStats();
        popupDiv.querySelector("#cacheCoins")!.textContent = `${coinsInCache}`;
      }
    });

    return popupDiv;
  });
}

// Populate caches
for (let i = -CACHE_RADIUS; i <= CACHE_RADIUS; i++) {
  for (let j = -CACHE_RADIUS; j <= CACHE_RADIUS; j++) {
    if (Math.random() < SPAWN_RATE) {
      createCache(i, j);
    }
  }
}

// Player movement controls
const moveStep = 0.0001;
function movePlayer(dx: number, dy: number) {
  const newPosition = leaflet.latLng(
    playerMarker.getLatLng().lat + dx,
    playerMarker.getLatLng().lng + dy,
  );
  playerMarker.setLatLng(newPosition);
  geoMap.panTo(newPosition);
}

document.querySelector("#moveNorth")!.addEventListener(
  "click",
  () => movePlayer(moveStep, 0),
);
document.querySelector("#moveSouth")!.addEventListener(
  "click",
  () => movePlayer(-moveStep, 0),
);
document.querySelector("#moveWest")!.addEventListener(
  "click",
  () => movePlayer(0, -moveStep),
);
document.querySelector("#moveEast")!.addEventListener(
  "click",
  () => movePlayer(0, moveStep),
);

// Reset game functionality
document.querySelector("#resetGame")!.addEventListener("click", () => {
  totalPoints = 0;
  coinCount = 0;
  updateStats();
});
