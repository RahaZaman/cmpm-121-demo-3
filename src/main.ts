// Import necessary modules and styles
import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

// Configuration constants for the map and game
const GRID_SIZE = 1e-4; // Grid cell size in degrees
const CACHE_RADIUS = 8; // Number of cells around the player to check for caches
const SPAWN_RATE = 0.1; // Probability of a cache spawning in a cell
const START_POSITION = leaflet.latLng(36.9895, -122.0628); // Initial player coordinates (Oakes Classroom)

// Initialize player stats
let totalPoints = 0; // Player's score
let coinCount = 0; // Player's coin inventory

// Initialize the map
const geoMap = leaflet.map("map", {
  center: START_POSITION,
  zoom: 19,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Load and display the OpenStreetMap tiles
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(geoMap);

// Select HTML elements for displaying player status
const scoreDisplay = document.querySelector("#statusPanel")!;
const inventoryDisplay = document.querySelector("#inventory")!;

// Function to refresh player stats on the UI
function refreshStats() {
  scoreDisplay.innerHTML = `Points: ${totalPoints}`;
  inventoryDisplay.innerHTML = `Inventory: ${coinCount} coins`;
}

// Function to create a cache at the specified grid coordinates
function createCache(x: number, y: number) {
  // Calculate the bounds of the cache on the map
  const basePosition = START_POSITION;
  const cacheArea = leaflet.latLngBounds([
    [basePosition.lat + x * GRID_SIZE, basePosition.lng + y * GRID_SIZE],
    [
      basePosition.lat + (x + 1) * GRID_SIZE,
      basePosition.lng + (y + 1) * GRID_SIZE,
    ],
  ]);

  // Add a rectangle to represent the cache
  const cacheRect = leaflet.rectangle(cacheArea).addTo(geoMap);
  let coinsInCache = Math.floor(Math.random() * 5) + 1; // Randomly assign between 1 and 5 coins to the cache

  // Create an interactive popup for the cache
  cacheRect.bindPopup(() => {
    const popupContent = document.createElement("div");
    popupContent.innerHTML = `
      <div>Cache Location: (${x}, ${y})</div>
      <div>Coins Available: <span id="cacheCoins">${coinsInCache}</span></div>
      <button id="collectBtn">Collect</button>
      <button id="depositBtn">Deposit</button>
    `;

    // Add functionality to collect coins from the cache
    popupContent.querySelector("#collectBtn")!.addEventListener("click", () => {
      if (coinsInCache > 0) {
        coinCount += coinsInCache;
        coinsInCache = 0;
        refreshStats();
        popupContent.querySelector("#cacheCoins")!.textContent = "0";
      }
    });

    // Add functionality to deposit coins into the cache
    popupContent.querySelector("#depositBtn")!.addEventListener("click", () => {
      if (coinCount > 0) {
        coinsInCache += coinCount;
        totalPoints += coinCount;
        coinCount = 0;
        refreshStats();
        popupContent.querySelector("#cacheCoins")!.textContent =
          `${coinsInCache}`;
      }
    });

    return popupContent;
  });
}

// Populate the neighborhood with caches based on the spawn probability
for (let xOffset = -CACHE_RADIUS; xOffset <= CACHE_RADIUS; xOffset++) {
  for (let yOffset = -CACHE_RADIUS; yOffset <= CACHE_RADIUS; yOffset++) {
    if (Math.random() < SPAWN_RATE) {
      createCache(xOffset, yOffset); // Generate a cache if the probability condition is met
    }
  }
}

// Event listener to reset the game state when the "resetGame" button is clicked
document.querySelector("#resetGame")!.addEventListener("click", () => {
  totalPoints = 0; // Reset the player's points
  coinCount = 0; // Reset the player's coin inventory
  refreshStats(); // Update the UI to reflect the reset state
});
