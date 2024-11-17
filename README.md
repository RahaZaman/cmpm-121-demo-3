# Geocoin Carrier 🌍

Geocoin Carrier is an interactive web-based geolocation game where players navigate a map to collect and deposit virtual coins. Using real-time geolocation data, players can explore the map, collect coins from various cache zones, and contribute coins to these caches. The game leverages modern front-end technologies and design patterns to provide a dynamic and engaging experience.

This project is built with TypeScript, Leaflet.js for map rendering, and utilizes several design patterns for efficient data management and interaction. The game includes various features like location-based tracking, cache zone generation, and a coin collection system, all of which contribute to an immersive experience.

## Features ✨

- **Geolocation Tracking:** The game tracks your real-world location in real-time using the browser's geolocation API and allows you to interact with the map accordingly.
- **Map Navigation:** Players can move across a map that uses Leaflet.js and OpenStreetMap to visualize and navigate the world.
- **Cache Zones:** Dynamic cache zones are generated around the player, each containing collectible virtual coins.
- **Coin Collection and Deposit:** Players can collect coins from caches and deposit them into new caches to earn points.
- **Player Trail:** As the player moves, a trail is recorded and visualized on the map.
- **LocalStorage Save/Load:** The game progress is saved using `localStorage`, allowing players to resume where they left off.
- **Multiple Movement Controls:** Players can move north, south, east, or west using button controls or track their movement automatically with geolocation.

## Demo 🎥

Check out the live demo of **Geocoin Carrier** [here](https://rahazaman.github.io/cmpm-121-demo-3/).

## Usage 🖊️

- **Move Player:** Click the movement buttons (North, South, East, West) to navigate the map.
- **Geolocation Tracking:** Click the sensor button to track your location and move the player automatically based on real-world geolocation.
- **Cache Interaction:** Visit the cache zones to collect or deposit coins. Each cache has a button for interacting with the coins.
- **Game Reset:** Reset the game progress using the reset button to start fresh.

## Technologies Used 🛠️

- **TypeScript:** Provides a strongly typed programming environment for robust and scalable code.
- **Leaflet.js:** A powerful library for interactive maps, used for rendering the game’s world map.
- **HTML5/CSS3:** For structuring and styling the web page and game interface.
- **LocalStorage:** Used to save and load the game state, so players can resume their progress.
- **OpenStreetMap:** A free and open-source map that serves as the base map for the game world.
- **Geolocation API:** Tracks the player’s real-world location for immersive map interaction.
- **GitHub Pages:** Hosts the live demo of the game.

## Design Patterns Implemented 🧠

- **Flyweight Pattern:** Used for optimizing memory usage when managing player positions on the map. This pattern ensures that identical objects (such as coordinates) are shared rather than created multiple times.
- **Memento Pattern:** Utilized to store and retrieve the state of the game (such as collected coins and player movements) to support game saving and loading functionality.
- **Factory Pattern:** A position factory is implemented to generate new geospatial coordinates on-demand and cache them efficiently.
- **Facade Pattern:** This pattern simplifies interactions between different components of the game, providing a unified interface for operations such as movement, score tracking, and cache management.

## Installation & Setup 🔧

1. Clone the repository:
   ```bash
   git clone https://github.com/RahaZaman/cmpm-121-demo-3.git

