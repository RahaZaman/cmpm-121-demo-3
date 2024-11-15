import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

// Constants and configuration
const GRID_SIZE = 1e-4; // Size of each grid cell in degrees
const CACHE_RADIUS = 8; // Grid radius around the player for cache generation
const SPAWN_RATE = 0.1; // Probability of spawning a cache
const NULL_ISLAND = leaflet.latLng(0, 0); // Center of the geodetic datum
const PLAYER_START = NULL_ISLAND;

// Player stats
let totalPoints = 0;
let coinCount = 0;

// Initialize map centered on Null Island
const geoMap = leaflet.map("map", {
  center: NULL_ISLAND,
  zoom: 19,
  zoomControl: true,
  scrollWheelZoom: true,
});

// Load OpenStreetMap tiles
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(geoMap);

// Add player marker
const playerMarker = leaflet.marker(PLAYER_START, { title: "Player" }).addTo(
  geoMap,
);

// Update player stats
const statusPanel = document.querySelector("#statusPanel")!;
const inventoryPanel = document.querySelector("#inventory")!;
function updateStats() {
  statusPanel.innerHTML = `Points: ${totalPoints}`;
  inventoryPanel.innerHTML = `Inventory: ${coinCount} coins`;
}

// Flyweight Pattern - Location Factory
class LocationFactory {
  private locationCache: Map<string, leaflet.LatLng> = new Map();

  getLocation(i: number, j: number): leaflet.LatLng {
    const key = `${i},${j}`;
    if (!this.locationCache.has(key)) {
      const latLng = leaflet.latLng(
        NULL_ISLAND.lat + i * GRID_SIZE,
        NULL_ISLAND.lng + j * GRID_SIZE,
      );
      this.locationCache.set(key, latLng);
    }
    return this.locationCache.get(key)!;
  }
}
const locationFactory = new LocationFactory();

// Unique Coin Representation as NFTs
type Coin = { i: number; j: number; serial: number };
let coinIdCounter = 0; // Global counter for unique serial numbers

// Function to create unique coins based on cache location
function createCoins(i: number, j: number, count: number): Coin[] {
  return Array.from({ length: count }, (_, _idx) => ({
    i,
    j,
    serial: coinIdCounter++,
  }));
}

// Function to handle cache interactions
function createCache(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    locationFactory.getLocation(i, j),
    locationFactory.getLocation(i + 1, j + 1),
  ]);

  const cacheRect = leaflet.rectangle(bounds).addTo(geoMap);
  let coinsInCache: Coin[] = createCoins(
    i,
    j,
    Math.floor(Math.random() * 5) + 1,
  );

  // Create the popup content with coin details
  cacheRect.bindPopup(() => {
    const popupDiv = document.createElement("div");

    // Compact representation of coins as "i:j#serial"
    const coinDisplay = coinsInCache
      .map((coin) => `${coin.i}:${coin.j}#${coin.serial}`)
      .join(", ");

    popupDiv.innerHTML = `
      <div style="text-align:center;font-weight:bold;">Inventory</div>
      <div>Cache at (${i}, ${j})</div>
      <div>Coins Available: <span id="cacheCoins">${coinsInCache.length}</span></div>
      <div>Coin IDs: ${coinDisplay}</div>
      <button id="collectBtn">Collect</button>
      <button id="depositBtn">Deposit</button>
    `;

    // Event listener for collecting coins
    popupDiv.querySelector("#collectBtn")!.addEventListener("click", () => {
      if (coinsInCache.length > 0) {
        coinCount += coinsInCache.length;
        coinsInCache = []; // Remove all coins from cache
        updateStats();
        popupDiv.querySelector("#cacheCoins")!.textContent = "0";
      }
    });

    // Event listener for depositing coins
    popupDiv.querySelector("#depositBtn")!.addEventListener("click", () => {
      if (coinCount > 0) {
        const newCoins = createCoins(i, j, coinCount);
        coinsInCache.push(...newCoins);
        totalPoints += coinCount;
        coinCount = 0; // Reset player's coin count
        updateStats();
        popupDiv.querySelector("#cacheCoins")!.textContent =
          `${coinsInCache.length}`;
      }
    });

    return popupDiv;
  });
}

// Populate caches around Null Island using the Flyweight pattern
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
