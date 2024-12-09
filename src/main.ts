import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

// Constants and configurations
const GRID_STEP = 1e-4; // Granularity of the grid
const CACHE_ZONE_RADIUS = 3; // Radius for cache generation
const SPAWN_PROBABILITY = 0.02; // Probability of spawn per cache
const INITIAL_POSITION = leaflet.latLng(0, 0); // Initial position for the map
const INITIAL_PLAYER_POS = INITIAL_POSITION; // Starting position of the player
const MOVE_DELTA = GRID_STEP; // Step size for player movement

// Player state variables
let totalScore = 0; // Total score for the player
export let collectedCoins = 0; // Coins collected by the player, exported for potential access in other modules
export let playerTrail: leaflet.LatLng[] = []; // Track player's path
export let totalMoves = 0; // Count total moves made by the player

// Map initialization
export const gameMap = leaflet.map("map", {
  center: INITIAL_POSITION,
  zoom: 19,
  zoomControl: true,
  scrollWheelZoom: true,
});

// Setup the tile layer for the map
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(gameMap);

// Initialize player icon on the map
const playerIcon = leaflet.marker(INITIAL_PLAYER_POS, { title: "Player" })
  .addTo(gameMap);

// Initialize trail for the player
const trailLine = leaflet.polyline(playerTrail, { color: "blue" }).addTo(
  gameMap,
);

// Type definition for Coins
export interface Coin {
  x: number;
  y: number;
  id: number;
}

// Factory for optimized memory usage for positions
class PositionFactory {
  private locationCache: Map<string, leaflet.LatLng> = new Map();

  // Get position from cache or compute it
  getPosition(x: number, y: number): leaflet.LatLng {
    const cacheKey = `${x},${y}`;
    if (!this.locationCache.has(cacheKey)) {
      const latLng = leaflet.latLng(
        INITIAL_POSITION.lat + x * GRID_STEP,
        INITIAL_POSITION.lng + y * GRID_STEP,
      );
      this.locationCache.set(cacheKey, latLng);
    }
    return this.locationCache.get(cacheKey)!;
  }
}

const positionFactory = new PositionFactory();

// Cache storage using a map
const caches: Map<string, CacheZone> = new Map();

// UI panels
const statsPanel = document.querySelector("#statusPanel")!;
const inventoryDisplay = document.querySelector("#inventory")!;
const movementTracker = document.createElement("div");
movementTracker.id = "movement";
document.body.appendChild(movementTracker);

// Update player stats on UI
export function refreshStats() {
  statsPanel.innerHTML = `Points: ${totalScore}`;
  inventoryDisplay.innerHTML = `Coins: ${collectedCoins}`;
  movementTracker.innerHTML = `Moves: ${totalMoves}`;
}

// Update the player's trail on the map
export function refreshPlayerTrail() {
  trailLine.setLatLngs(playerTrail);
}

// Player movement tracking class
class PlayerTracking {
  private watchId: number | null = null;

  isTrackingLocation(): boolean {
    return this.watchId !== null; // Check if tracking is active
  }

  startLocationTracking() {
    if (navigator.geolocation) {
      const consent = confirm("Do you want to share your location?");
      if (consent) {
        this.watchId = navigator.geolocation.watchPosition(
          (position) => this.handlePositionUpdate(position),
          (error) => console.error("Geolocation error:", error),
        );
      }
    }
  }

  stopLocationTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private handlePositionUpdate(position: GeolocationPosition) {
    const { latitude, longitude } = position.coords;
    movePlayerTo(latitude, longitude); // Update to new position
  }
}

const playerTracking = new PlayerTracking(); // Correctly instantiate PlayerTracking

// Cache Zone class
class CacheZone {
  private storedCoins: Coin[] = [];

  constructor(public x: number, public y: number) {
    this.storedCoins = generateCoins(x, y, Math.floor(Math.random() * 5) + 1);
  }

  get coins() {
    return this.storedCoins.length;
  }

  retrieveCoins(): number {
    const collected = this.storedCoins.length;
    this.storedCoins = [];
    return collected;
  }

  addCoins(newCoins: Coin[]) {
    this.storedCoins.push(...newCoins);
  }
}

// Generate random coins for a given position
export function generateCoins(x: number, y: number, amount: number): Coin[] {
  return Array.from({ length: amount }, (_, id) => ({ x, y, id }));
}

// Spawn a cache at the given coordinates
function createCache(x: number, y: number) {
  const cacheKey = `${x},${y}`;
  let cache = caches.get(cacheKey);
  if (!cache) {
    cache = new CacheZone(x, y);
    caches.set(cacheKey, cache);
  }
  const bounds = leaflet.latLngBounds([
    positionFactory.getPosition(x, y),
    positionFactory.getPosition(x + 1, y + 1),
  ]);
  const cacheRectangle = leaflet.rectangle(bounds).addTo(gameMap);
  cacheRectangle.bindPopup(() => {
    const popupContent = document.createElement("div");
    popupContent.innerHTML = `
      <div style="text-align: center;">Cache at (${x}, ${y})</div>
      <div style="text-align: center;">Coins Available: <span>${cache.coins}</span></div>
      <div style="text-align: center;">
        <button id="collectCoins">Collect Coins</button>
        <button id="depositCoins">Deposit Coins</button>
        <button id="centerCache">Center Map on Cache</button>
      </div>
    `;

    popupContent.querySelector("#collectCoins")!.addEventListener(
      "click",
      () => {
        if (cache.coins > 0) {
          collectedCoins += cache.retrieveCoins();
          refreshStats();
        }
      },
    );

    popupContent.querySelector("#depositCoins")!.addEventListener(
      "click",
      () => {
        if (collectedCoins > 0) {
          cache.addCoins(generateCoins(x, y, collectedCoins));
          totalScore += collectedCoins;
          collectedCoins = 0;
          refreshStats();
        }
      },
    );

    popupContent.querySelector("#centerCache")!.addEventListener(
      "click",
      () => {
        gameMap.panTo(positionFactory.getPosition(x, y));
      },
    );

    return popupContent;
  });
}

// Regenerate caches around the player's position
function regenerateNearbyCaches(playerPosition: leaflet.LatLng) {
  const playerX = Math.floor(
    (playerPosition.lat - INITIAL_POSITION.lat) / GRID_STEP,
  );
  const playerY = Math.floor(
    (playerPosition.lng - INITIAL_POSITION.lng) / GRID_STEP,
  );
  for (
    let x = playerX - CACHE_ZONE_RADIUS;
    x <= playerX + CACHE_ZONE_RADIUS;
    x++
  ) {
    for (
      let y = playerY - CACHE_ZONE_RADIUS;
      y <= playerY + CACHE_ZONE_RADIUS;
      y++
    ) {
      if (Math.random() < SPAWN_PROBABILITY) {
        createCache(x, y);
      }
    }
  }
}

// Move the player to a new position
function movePlayerTo(latitude: number, longitude: number) {
  const newPosition = leaflet.latLng(latitude, longitude);
  playerIcon.setLatLng(newPosition);
  gameMap.panTo(newPosition);
  playerTrail.push(newPosition);
  totalMoves++;
  refreshPlayerTrail();
  regenerateNearbyCaches(newPosition);
  refreshStats();
  saveGameProgress();
}

// Movement control buttons
document.querySelector("#moveNorth")!.addEventListener(
  "click",
  () =>
    movePlayerTo(
      playerIcon.getLatLng().lat + MOVE_DELTA,
      playerIcon.getLatLng().lng,
    ),
);
document.querySelector("#moveSouth")!.addEventListener(
  "click",
  () =>
    movePlayerTo(
      playerIcon.getLatLng().lat - MOVE_DELTA,
      playerIcon.getLatLng().lng,
    ),
);
document.querySelector("#moveWest")!.addEventListener(
  "click",
  () =>
    movePlayerTo(
      playerIcon.getLatLng().lat,
      playerIcon.getLatLng().lng - MOVE_DELTA,
    ),
);
document.querySelector("#moveEast")!.addEventListener(
  "click",
  () =>
    movePlayerTo(
      playerIcon.getLatLng().lat,
      playerIcon.getLatLng().lng + MOVE_DELTA,
    ),
);

// Geolocation tracking button
document.querySelector("#sensor")!.addEventListener("click", () => {
  if (playerTracking.isTrackingLocation()) {
    playerTracking.stopLocationTracking();
  } else {
    playerTracking.startLocationTracking();
  }
});

// Reset game button
document.querySelector("#resetGame")!.addEventListener("click", () => {
  if (confirm("Do you want to reset the game?")) {
    totalScore = 0;
    collectedCoins = 0;
    totalMoves = 0;
    playerTrail = [];
    caches.clear();
    localStorage.removeItem("gameState");
    refreshStats();
    refreshPlayerTrail();
  }
});

// Save game state to localStorage
function saveGameProgress() {
  localStorage.setItem(
    "gameState",
    JSON.stringify({
      totalScore,
      collectedCoins,
      totalMoves,
      playerTrail: playerTrail.map((position) => position.toJSON()),
    }),
  );
}

// Load saved game state
function loadSavedGame() {
  const savedData = localStorage.getItem("gameState");
  if (savedData) {
    const {
      totalScore: savedScore,
      collectedCoins: savedCoins,
      totalMoves: savedMoves,
      playerTrail: savedTrail,
    } = JSON.parse(savedData);
    totalScore = savedScore;
    collectedCoins = savedCoins;
    totalMoves = savedMoves;
    playerTrail = savedTrail.map((position: { lat: number; lng: number }) =>
      leaflet.latLng(position.lat, position.lng)
    );
    refreshPlayerTrail();
    refreshStats();
  }
}

// Load saved game state on startup
loadSavedGame();
