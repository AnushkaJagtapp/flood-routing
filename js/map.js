// FloodRoute Interactive Map Controller
// Renders dynamic road networks, flood inundation zones, hazard markers, and routes using Leaflet.js

class FloodMap {
  constructor(mapContainerId, districtData, onRoadClickCallback, onPoiClickCallback) {
    this.containerId = mapContainerId;
    this.data = districtData;
    this.onRoadClick = onRoadClickCallback;
    this.onPoiClick = onPoiClickCallback;

    this.map = null;
    this.roadPolylines = {};
    this.zoneLayers = [];
    this.poiMarkers = [];
    this.routeLayers = [];
    this.comparisonLayers = [];
    this.selectedRoadId = null;

    this.initMap();
  }

  initMap() {
    // Initialize Leaflet map
    this.map = L.map(this.containerId, {
      center: this.data.center,
      zoom: this.data.zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Mapbox Access Token
    const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW51c2hrYWphZ3RhcCIsImEiOiJjbXVtcXh0cGgwMmRqMnpxdmI4MW55dmtwIn0.RCFIGpZmNGHXQUrUexO-AQ';

    // Mapbox Tile Layers (Dark, Satellite, and Streets)
    const mapboxDark = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 19,
      attribution: '© Mapbox © OpenStreetMap'
    });

    const mapboxSatellite = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 19,
      attribution: '© Mapbox © Maxar'
    });

    const mapboxStreets = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 19,
      attribution: '© Mapbox © OpenStreetMap'
    });

    // Default to Mapbox Dark
    mapboxDark.addTo(this.map);

    // Layer switcher control on top right
    const baseMaps = {
      "🌙 Mapbox Dark": mapboxDark,
      "🛰️ Satellite Streets": mapboxSatellite,
      "🗺️ Mapbox Streets": mapboxStreets
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(this.map);

    // Zoom control at top right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Render layers
    this.renderInundationZones();
    this.renderRoads();
    this.renderPOIs();
  }

  // Render Flood Inundation Water Bodies
  renderInundationZones() {
    this.zoneLayers.forEach(l => this.map.removeLayer(l));
    this.zoneLayers = [];

    this.data.inundationZones.forEach(zone => {
      const polygon = L.polygon(zone.coords, {
        color: '#0284c7',
        weight: 2,
        fillColor: '#0369a1',
        fillOpacity: 0.35,
        dashArray: '4, 6',
        className: 'flood-water-inundation'
      }).addTo(this.map);

      polygon.bindTooltip(`<strong>${zone.name}</strong><br>Inundation Depth: ${zone.waterDepth}`, {
        className: 'custom-map-tooltip',
        sticky: true
      });

      this.zoneLayers.push(polygon);
    });
  }

  // Render or Update Road Segments
  renderRoads() {
    // Clear existing
    Object.values(this.roadPolylines).forEach(p => this.map.removeLayer(p));
    this.roadPolylines = {};

    this.data.roadSegments.forEach(road => {
      const style = this.getRoadStyle(road);
      const polyline = L.polyline(road.path, style).addTo(this.map);

      // Tooltip
      polyline.bindTooltip(`
        <div class="road-tooltip-card">
          <div class="tooltip-header">
            <strong>${road.name}</strong>
            <span class="status-pill status-${road.status.toLowerCase()}">${road.status.replace('_', ' ')}</span>
          </div>
          <div class="tooltip-body">
            <span>Water Depth: <strong>${road.currentWaterDepthCm} cm</strong></span>
            <span>Elevation: <strong>${road.elevationAvg}m</strong></span>
          </div>
        </div>
      `, { className: 'custom-map-tooltip', sticky: true });

      // Click event
      polyline.on('click', () => {
        this.selectRoad(road.id);
        if (this.onRoadClick) {
          this.onRoadClick(road);
        }
      });

      this.roadPolylines[road.id] = polyline;
    });
  }

  // Get Road Polyline Style based on status and depth
  getRoadStyle(road) {
    let color = '#10b981'; // Green (Safe)
    let weight = 6;
    let dashArray = null;
    let opacity = 0.85;

    if (road.status === 'BLOCKED') {
      color = '#ef4444'; // Red
      dashArray = '8, 6';
      weight = 7;
      opacity = 0.95;
    } else if (road.status === 'CAUTION') {
      color = '#f59e0b'; // Amber
      weight = 6;
      opacity = 0.9;
    } else if (road.status === 'EMERGENCY_ONLY') {
      color = '#38bdf8'; // Electric Sky Blue
      dashArray = '5, 5';
      weight = 6;
    }

    if (this.selectedRoadId === road.id) {
      weight = 10;
      opacity = 1.0;
    }

    return {
      color,
      weight,
      opacity,
      dashArray,
      lineCap: 'round',
      lineJoin: 'round',
      className: `road-line road-${road.status.toLowerCase()}`
    };
  }

  // Highlight selected road
  selectRoad(roadId) {
    this.selectedRoadId = roadId;
    this.data.roadSegments.forEach(road => {
      const poly = this.roadPolylines[road.id];
      if (poly) {
        poly.setStyle(this.getRoadStyle(road));
        if (road.id === roadId) {
          poly.bringToFront();
        }
      }
    });
  }

  // Render POIs (Hospital, Relief Shelters, River Gauge)
  renderPOIs() {
    this.poiMarkers.forEach(m => this.map.removeLayer(m));
    this.poiMarkers = [];

    this.data.pois.forEach(poi => {
      let iconHtml = '';
      let badgeClass = 'poi-general';

      switch (poi.type) {
        case 'hospital':
          badgeClass = 'poi-hospital';
          iconHtml = `<div class="poi-icon-pulse ${badgeClass}"><span class="emoji">🏥</span><span class="poi-tag">HOSPITAL</span></div>`;
          break;
        case 'shelter':
          badgeClass = 'poi-shelter';
          iconHtml = `<div class="poi-icon-pulse ${badgeClass}"><span class="emoji">⛺</span><span class="poi-tag">SHELTER</span></div>`;
          break;
        case 'transit':
          badgeClass = 'poi-transit';
          iconHtml = `<div class="poi-icon-pulse ${badgeClass}"><span class="emoji">🚉</span><span class="poi-tag">METRO</span></div>`;
          break;
        case 'safezone':
          badgeClass = 'poi-safezone';
          iconHtml = `<div class="poi-icon-pulse ${badgeClass}"><span class="emoji">⛰️</span><span class="poi-tag">HIGH GROUND</span></div>`;
          break;
        case 'sensor':
          badgeClass = 'poi-sensor';
          iconHtml = `<div class="poi-icon-pulse ${badgeClass}"><span class="emoji">🌊</span><span class="poi-tag">GAUGE</span></div>`;
          break;
        default:
          iconHtml = `<div class="poi-icon-pulse"><span class="emoji">📍</span></div>`;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-poi-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker(poi.coords, { icon: customIcon }).addTo(this.map);

      // Popup card
      const popupHtml = `
        <div class="poi-popup-card">
          <div class="poi-popup-title">${poi.name}</div>
          <div class="poi-popup-meta">
            <span class="meta-item">Elevation: <strong>${poi.elevation}m</strong></span>
            <span class="meta-item status-${poi.status.includes('SAFE') || poi.status.includes('OPEN') || poi.status.includes('OPERATIONAL') ? 'safe' : 'danger'}">
              ${poi.status}
            </span>
          </div>
          <p class="poi-popup-desc">${poi.description}</p>
          ${poi.bedsAvailable ? `<div class="poi-stat-row">Beds Free: <strong>${poi.bedsAvailable}</strong> | Power: ${poi.powerBackup}</div>` : ''}
          ${poi.provisions ? `<div class="poi-stat-row">Provisions: <strong>${poi.provisions}</strong></div>` : ''}
          ${poi.reading ? `<div class="poi-stat-row alert-water">Level: <strong>${poi.reading}</strong> (${poi.flowSpeed})</div>` : ''}
          <div class="poi-popup-actions">
            <button class="btn btn-sm btn-primary" onclick="window.FloodRouteApp.setRouteDestination('${poi.id}')">
              Route Here
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'flood-custom-popup', maxWidth: 320 });
      marker.on('click', () => {
        if (this.onPoiClick) this.onPoiClick(poi);
      });

      this.poiMarkers.push(marker);
    });
  }

  // Draw Computed Safe Route
  drawSafeRoute(routeResult) {
    this.clearRoutes();

    if (!routeResult || !routeResult.success || !routeResult.pathRoads.length) {
      return;
    }

    // Connect coordinate paths
    const fullCoordinates = [];
    routeResult.pathRoads.forEach(road => {
      road.path.forEach(pt => fullCoordinates.push(pt));
    });

    // Glowing cyan/emerald path backing
    const routeGlow = L.polyline(fullCoordinates, {
      color: '#06b6d4',
      weight: 12,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    // Dynamic animated dashed line
    const routeMain = L.polyline(fullCoordinates, {
      color: '#10b981',
      weight: 6,
      opacity: 1.0,
      dashArray: '10, 8',
      className: 'animated-safe-route-line',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    this.routeLayers.push(routeGlow, routeMain);

    // Add Start and End Pins
    const startCoord = fullCoordinates[0];
    const endCoord = fullCoordinates[fullCoordinates.length - 1];

    const startMarker = L.circleMarker(startCoord, {
      radius: 9,
      color: '#ffffff',
      fillColor: '#10b981',
      fillOpacity: 1,
      weight: 3
    }).addTo(this.map).bindTooltip("Your Location (Origin)", { permanent: true, direction: 'top', className: 'route-tag' });

    const endMarker = L.circleMarker(endCoord, {
      radius: 9,
      color: '#ffffff',
      fillColor: '#06b6d4',
      fillOpacity: 1,
      weight: 3
    }).addTo(this.map).bindTooltip("Safe Destination", { permanent: true, direction: 'top', className: 'route-tag' });

    this.routeLayers.push(startMarker, endMarker);

    // Zoom map to fit route nicely
    this.map.fitBounds(routeMain.getBounds(), { padding: [50, 50] });
  }

  // Draw Comparison Standard GPS Route (showing where it fails)
  drawStandardComparison(standardResult) {
    this.clearComparison();

    if (!standardResult || !standardResult.pathRoads) return;

    const coords = [];
    standardResult.pathRoads.forEach(r => r.path.forEach(pt => coords.push(pt)));

    const standardLine = L.polyline(coords, {
      color: '#f43f5e',
      weight: 4,
      opacity: 0.65,
      dashArray: '4, 8'
    }).addTo(this.map);

    this.comparisonLayers.push(standardLine);

    // Add danger markers at blocked intersections
    standardResult.blockedRoads.forEach(road => {
      const midPoint = road.path[Math.floor(road.path.length / 2)];
      const dangerMarker = L.marker(midPoint, {
        icon: L.divIcon({
          html: `<div class="submerged-trap-marker">⚠️ SUBMERGED TRAP (${road.currentWaterDepthCm}cm)</div>`,
          className: 'trap-label',
          iconSize: [160, 26]
        })
      }).addTo(this.map);
      this.comparisonLayers.push(dangerMarker);
    });
  }

  clearRoutes() {
    this.routeLayers.forEach(l => this.map.removeLayer(l));
    this.routeLayers = [];
  }

  clearComparison() {
    this.comparisonLayers.forEach(l => this.map.removeLayer(l));
    this.comparisonLayers = [];
  }

  updateRoadsAfterSimulation() {
    this.renderRoads();
    if (this.selectedRoadId) {
      const road = this.data.roadSegments.find(r => r.id === this.selectedRoadId);
      if (road && this.onRoadClick) {
        this.onRoadClick(road);
      }
    }
  }
}
