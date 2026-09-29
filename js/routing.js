// FloodRoute Flood-Aware Routing Engine
// Solves optimal path based on vehicle ground clearance, real-time road inundation,
// hazard penalties, and demonstrates the life-saving difference vs naive standard GPS routing.

class FloodRouter {
  constructor(districtData) {
    this.data = districtData;
    this.buildGraph();
  }

  // Build bidirectional graph from road segments
  buildGraph() {
    this.graph = {};
    for (const nodeId in this.data.nodes) {
      this.graph[nodeId] = [];
    }

    this.data.roadSegments.forEach(segment => {
      this.graph[segment.from].push({
        to: segment.to,
        roadId: segment.id,
        segment: segment
      });
      this.graph[segment.to].push({
        to: segment.from,
        roadId: segment.id,
        segment: segment
      });
    });
  }

  // Find Safe Flood-Aware Route
  findSafeRoute(startNodeId, endNodeId, vehicleTypeKey = 'sedan') {
    const vehicle = VEHICLE_CLEARANCES[vehicleTypeKey] || VEHICLE_CLEARANCES.sedan;
    const maxClearance = vehicle.maxClearanceCm;
    const isEmergency = vehicleTypeKey === 'emergency';

    const distances = {};
    const previous = {};
    const roadUsed = {};
    const unvisited = new Set(Object.keys(this.data.nodes));

    for (const nodeId of unvisited) {
      distances[nodeId] = Infinity;
      previous[nodeId] = null;
      roadUsed[nodeId] = null;
    }
    distances[startNodeId] = 0;

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let current = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      }

      if (current === null || distances[current] === Infinity) {
        break; // No reachable remaining nodes
      }

      if (current === endNodeId) {
        break; // Reached destination
      }

      unvisited.delete(current);

      const neighbors = this.graph[current] || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;

        const road = edge.segment;
        const depth = road.currentWaterDepthCm;
        const status = road.status;

        // Impassability check based on real-time flood status
        let isPassable = true;
        let weightPenalty = 1.0;

        if (status === 'BLOCKED') {
          // If vehicle is emergency boat/heavy rescue, can cross up to 90cm
          if (!isEmergency || depth > maxClearance) {
            isPassable = false;
          } else {
            weightPenalty = 4.0;
          }
        } else if (status === 'EMERGENCY_ONLY' && !isEmergency) {
          isPassable = false; // Restricted to civilian vehicles
        } else if (depth > maxClearance) {
          isPassable = false; // Exceeds safe clearance
        } else if (status === 'CAUTION' || depth > 10) {
          // Add heavy penalty to avoid waterlogged roads if a dry alternative exists
          weightPenalty = 2.8 + (depth / 10);
        }

        if (!isPassable) {
          continue; // Skip impassable road segment
        }

        const edgeWeight = road.distanceKm * weightPenalty;
        const alt = distances[current] + edgeWeight;

        if (alt < distances[edge.to]) {
          distances[edge.to] = alt;
          previous[edge.to] = current;
          roadUsed[edge.to] = road;
        }
      }
    }

    // Reconstruct path
    const pathNodes = [];
    const pathRoads = [];
    let curr = endNodeId;

    if (distances[endNodeId] === Infinity) {
      return {
        success: false,
        message: `No safe accessible route found for ${vehicle.label}. All connecting corridors are submerged or blocked!`,
        pathNodes: [],
        pathRoads: [],
        totalDistanceKm: 0,
        estimatedTimeMinutes: 0
      };
    }

    while (curr) {
      pathNodes.unshift(curr);
      if (roadUsed[curr]) {
        pathRoads.unshift(roadUsed[curr]);
      }
      curr = previous[curr];
    }

    // Calculate actual travel distance (without artificial penalties)
    const actualDistanceKm = pathRoads.reduce((sum, r) => sum + r.distanceKm, 0);
    const speed = vehicle.speedKmh;
    // Base travel time + cautious slowing in wet conditions
    const cautiousSpeed = speed * 0.75;
    const estimatedTimeMinutes = Math.round((actualDistanceKm / cautiousSpeed) * 60) + (pathRoads.length * 2);

    const maxWaterEncountered = pathRoads.reduce((max, r) => Math.max(max, r.currentWaterDepthCm), 0);
    let routeSafety = "100% DRY & SAFE";
    if (maxWaterEncountered > 15) {
      routeSafety = "CAUTION (Shallow Water)";
    } else if (maxWaterEncountered > 0) {
      routeSafety = "MINOR WATERLOGGING (Safe)";
    }

    const turnByTurn = this.generateDirections(pathNodes, pathRoads, vehicle);

    return {
      success: true,
      vehicle: vehicle,
      pathNodes,
      pathRoads,
      totalDistanceKm: parseFloat(actualDistanceKm.toFixed(2)),
      estimatedTimeMinutes,
      maxWaterDepthCm: maxWaterEncountered,
      routeSafety,
      turnByTurn
    };
  }

  // Find Naive Standard Route (ignores flood water, like un-updated GPS)
  findStandardRoute(startNodeId, endNodeId) {
    const distances = {};
    const previous = {};
    const roadUsed = {};
    const unvisited = new Set(Object.keys(this.data.nodes));

    for (const nodeId of unvisited) {
      distances[nodeId] = Infinity;
      previous[nodeId] = null;
      roadUsed[nodeId] = null;
    }
    distances[startNodeId] = 0;

    while (unvisited.size > 0) {
      let current = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      }

      if (current === null || distances[current] === Infinity || current === endNodeId) {
        break;
      }

      unvisited.delete(current);

      const neighbors = this.graph[current] || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;

        const alt = distances[current] + edge.segment.distanceKm;
        if (alt < distances[edge.to]) {
          distances[edge.to] = alt;
          previous[edge.to] = current;
          roadUsed[edge.to] = edge.segment;
        }
      }
    }

    const pathNodes = [];
    const pathRoads = [];
    let curr = endNodeId;

    if (distances[endNodeId] === Infinity) {
      return { success: false };
    }

    while (curr) {
      pathNodes.unshift(curr);
      if (roadUsed[curr]) {
        pathRoads.unshift(roadUsed[curr]);
      }
      curr = previous[curr];
    }

    const distanceKm = pathRoads.reduce((sum, r) => sum + r.distanceKm, 0);
    const blockedRoads = pathRoads.filter(r => r.status === 'BLOCKED' || r.currentWaterDepthCm > 30);

    return {
      success: true,
      pathNodes,
      pathRoads,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      hasBlockedRoads: blockedRoads.length > 0,
      blockedRoads
    };
  }

  // Generate Turn-by-Turn Safe Navigation Steps with Elevation and Hazards
  generateDirections(nodes, roads, vehicle) {
    const steps = [];
    for (let i = 0; i < roads.length; i++) {
      const road = roads[i];
      const fromNode = this.data.nodes[nodes[i]];
      const toNode = this.data.nodes[nodes[i + 1]];

      let cautionNote = "";
      if (road.status === 'SAFE') {
        cautionNote = "✅ Road is fully passable and above flood line.";
      } else if (road.status === 'CAUTION') {
        cautionNote = `⚠️ Pass with caution: ~${road.currentWaterDepthCm}cm standing water. Stay centered, avoid road shoulders.`;
      } else if (road.status === 'EMERGENCY_ONLY') {
        cautionNote = `ℹ️ Priority emergency lane. Follow emergency warden instructions.`;
      }

      steps.push({
        stepNumber: i + 1,
        instruction: `Proceed along ${road.name} toward ${toNode.name}`,
        distance: `${(road.distanceKm * 1000).toFixed(0)} meters`,
        elevation: `Avg. Elevation ${road.elevationAvg}m`,
        waterDepth: `${road.currentWaterDepthCm} cm water`,
        status: road.status,
        hazard: road.hazard,
        note: cautionNote
      });
    }
    return steps;
  }
}
