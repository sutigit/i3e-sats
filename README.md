The **i3e-sats** project is a React-based application that visualizes the orbits and visibility of ICEYE synthetic aperture radar (SAR) satellites. It provides a 3D globe view, a 2D minimap, and detailed pass predictions for a user-defined ground station.

### **Features**

- **Real-time Tracking:** Visualizes satellite positions using TLE data and the **SGP4** propagation algorithm.
- **Dual Visualization:** Synchronized **3D Globe** (CesiumJS) and **2D Minimap** for situational awareness.
- **Visibility Analysis:** Calculates precise "contact windows" (flyovers) for a specific ground observer.
- **Pass Predictions:** Displays upcoming satellite passes with countdowns, duration, and look angles (Azimuth/Elevation).

### **Tech Stack**

- **Frontend:** React, TypeScript, Vite
- **Geospatial Engine:** CesiumJS
- **Math & Physics:** `satellite.js` (SGP4 propagation), coordinate system transformations (ECI to ECF/Geodetic).
- **Build Tooling:** Vite

---

### **For Reviewers: How to Navigate the Code**

If you are reviewing this project for a technical role, here is a quick map of the most interesting parts:

#### **1. Calculations (`src/utils/`)**

This is where the "heavy lifting" happens. It handles orbital mechanics without relying on external APIs for position data.

- **`getSatVisibilityData.ts`**: The core logic. It iterates through time to find interception windows between the observer and the satellite.
- **`sortNearestSat.ts`**: Utility to filter the constellation for the most relevant satellites.

#### **2. The Visualization (`src/cesium/`)**

- **`CesiumGlobeView.tsx`**: The main entry point for the 3D scene.
- **`entities/`**: Contains the custom classes for drawing all entities on round and orbit.

#### **3. Main React component**

- **`SatMainView.tsx`**: Manages the data flow to ensure the UI remains responsive while performing heavy SGP4 calculations in the background.
