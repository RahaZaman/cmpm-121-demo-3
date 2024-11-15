import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

// Constants and configuration
const GRID_SIZE = 1e-4; // Size of each grid cell in degrees
const CACHE_RADIUS = 8; // Grid radius around the player for cache generation
const SPAWN_RATE = 0.1; // Probability of spawning a cache
const NULL_ISLAND = leaflet.latLng(0, 0); // Center of the geodetic datum
const PLAYER_START = NULL_ISLAND;
const moveStep = GRID_SIZE; // Discrete step size for player movement

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
let coinIdCounter = 0;

// Cache Memento Pattern
interface Memento {
  toMemento(): string;
  fromMemento(memento: string): void;
}

class Cache implements Memento {
  private coins: Coin[] = [];
  public memento?: string;

  constructor(public i: number, public j: number) {
    this.coins = createCoins(i, j, Math.floor(Math.random() * 5) + 1);
  }

  // Save the current state into a memento
  toMemento(): string {
    return JSON.stringify(this.coins);
  }

  // Restore the state from a memento
  fromMemento(memento: string) {
    this.coins = JSON.parse(memento);
  }

  get coinCount() {
    return this.coins.length;
  }

  collectCoins(): number {
    const collectedCoins = this.coins.length;
    this.coins = [];
    return collectedCoins;
  }

  addCoins(newCoins: Coin[]) {
    this.coins.push(...newCoins);
  }

  getCoinsDisplay(): string {
    return this.coins.map((coin) => `${coin.i}:${coin.j}#${coin.serial}`).join(
      ", ",
    );
  }
}

// Cache storage
const cacheMap: Map<string, Cache> = new Map();

// Function to create unique coins based on cache location
function createCoins(i: number, j: number, count: number): Coin[] {
  return Array.from(
    { length: count },
    (_, _idx) => ({ i, j, serial: coinIdCounter++ }),
  );
}

// Function to handle cache interactions
function spawnCache(i: number, j: number) {
  const key = `${i},${j}`;
  const cache = cacheMap.get(key) ?? new Cache(i, j);
  cacheMap.set(key, cache);

  const bounds = leaflet.latLngBounds([
    locationFactory.getLocation(i, j),
    locationFactory.getLocation(i + 1, j + 1),
  ]);

  const cacheRect = leaflet.rectangle(bounds).addTo(geoMap);
  cacheRect.bindPopup(() => {
    const popupDiv = document.createElement("div");

    popupDiv.innerHTML = `
      <div style="text-align:center;font-weight:bold;">Inventory</div>
      <div>Cache at (${i}, ${j})</div>
      <div>Coins Available: <span id="coinCount">${cache.coinCount}</span></div>
      <div>Coin IDs: ${cache.getCoinsDisplay()}</div>
      <button id="collectBtn">Collect</button>
      <button id="depositBtn">Deposit</button>
    `;

    // Collect coins
    popupDiv.querySelector("#collectBtn")!.addEventListener("click", () => {
      if (cache.coinCount > 0) {
        coinCount += cache.collectCoins();
        updateStats();
        popupDiv.querySelector("#coinCount")!.textContent = "0";
        cache.memento = cache.toMemento();
      }
    });

    // Deposit coins
    popupDiv.querySelector("#depositBtn")!.addEventListener("click", () => {
      if (coinCount > 0) {
        const newCoins = createCoins(i, j, coinCount);
        cache.addCoins(newCoins);
        totalPoints += coinCount;
        coinCount = 0;
        updateStats();
        popupDiv.querySelector("#coinCount")!.textContent =
          `${cache.coinCount}`;
        cache.memento = cache.toMemento();
      }
    });

    return popupDiv;
  });
}

// Regenerate caches based on player's new position
function regenerateCachesAround(playerPos: leaflet.LatLng) {
  geoMap.eachLayer((layer: leaflet.layer) => {
    if (layer instanceof leaflet.Rectangle) {
      geoMap.removeLayer(layer);
    }
  });

  const playerI = Math.floor((playerPos.lat - NULL_ISLAND.lat) / GRID_SIZE);
  const playerJ = Math.floor((playerPos.lng - NULL_ISLAND.lng) / GRID_SIZE);

  for (let i = playerI - CACHE_RADIUS; i <= playerI + CACHE_RADIUS; i++) {
    for (let j = playerJ - CACHE_RADIUS; j <= playerJ + CACHE_RADIUS; j++) {
      if (Math.random() < SPAWN_RATE) {
        spawnCache(i, j);
      }
    }
  }
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

function movePlayer(dx: number, dy: number) {
  const newPosition = leaflet.latLng(
    playerMarker.getLatLng().lat + dx,
    playerMarker.getLatLng().lng + dy,
  );
  playerMarker.setLatLng(newPosition);
  geoMap.panTo(newPosition);
  regenerateCachesAround(newPosition);
}

document.querySelector("#resetGame")!.addEventListener("click", () => {
  totalPoints = 0;
  coinCount = 0;
  updateStats();
});
