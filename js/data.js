// FloodRoute Simulation Data - Rivergate District
// Realistic flood-prone neighbourhood model with topological elevations,
// river channel, low-lying underpasses, elevated flyovers, and key emergency infrastructure.

const DISTRICT_DATA = {
  name: "Rivergate & Lakeview Municipal Zone",
  center: [13.0827, 80.2707], // Metropolitan riverine zone
  zoom: 14,
  riverLevelNormal: 1.2, // meters
  riverLevelDanger: 3.5, // meters
  riverLevelCurrent: 3.8, // current flood level
  
  // Landmarks & POIs
  pois: [
    {
      id: "hospital_general",
      name: "City Metropolitan Hospital (Safe Haven)",
      type: "hospital",
      coords: [13.0910, 80.2640],
      elevation: 14.2, // meters above sea level (High ground)
      status: "OPERATIONAL",
      bedsAvailable: 48,
      powerBackup: "Active (Solar/Generator)",
      description: "Designated Critical Emergency Triage Center. High ground elevation, safe from 100-year flood levels."
    },
    {
      id: "relief_camp_north",
      name: "St. Jude Community Relief Shelter",
      type: "shelter",
      coords: [13.0885, 80.2810],
      elevation: 12.8,
      status: "OPEN",
      capacity: "350 / 500 sheltered",
      provisions: "Food, Drinking Water, Medical Aid Available",
      description: "District emergency evacuation facility equipped with clean water distribution and mobile clinics."
    },
    {
      id: "metro_station",
      name: "Rivergate Central Metro & Rail Hub",
      type: "transit",
      coords: [13.0760, 80.2690],
      elevation: 9.5,
      status: "GROUND FLOODED - ELEVATED PLATFORMS ACCESSIBLE",
      description: "Ground-level concourse experiencing 20cm waterlogging. Elevated train platforms dry and running emergency shuttles."
    },
    {
      id: "high_ground_hill",
      name: "Greenridge Ridge Park (High Ground Safe Zone)",
      type: "safezone",
      coords: [13.0960, 80.2730],
      elevation: 18.5,
      status: "SAFE",
      description: "Highest natural elevation in district. Safe assembly area for residents fleeing lowland flood surge."
    },
    {
      id: "river_gauge_main",
      name: "Sensor RG-02: Riverfront Bridge Gauge",
      type: "sensor",
      coords: [13.0805, 80.2760],
      elevation: 4.2,
      status: "DANGER LEVEL BREACHED",
      reading: "3.82 m (+0.32m over danger mark)",
      flowSpeed: "2.4 m/s (Fast torrent)",
      description: "Automated telemetry ultrasonic water-level sensor transmitting live telemetry to Disaster Command."
    },
    {
      id: "food_camp_east",
      name: "Govt Boys High School Relief Camp",
      type: "shelter",
      coords: [13.0715, 80.2785],
      elevation: 11.0,
      status: "OPEN",
      capacity: "180 / 300 sheltered",
      provisions: "Hot meals, clean water, baby supplies",
      description: "Relief camp managed by municipal disaster response team and volunteer groups."
    }
  ],

  // Node graph for routing (coordinates)
  nodes: {
    "N1": { id: "N1", name: "North Ring Flyover (High)", coords: [13.0950, 80.2620], elevation: 15.0 },
    "N2": { id: "N2", name: "Hospital Junction", coords: [13.0905, 80.2645], elevation: 14.0 },
    "N3": { id: "N3", name: "Greenridge Ridge Highway", coords: [13.0945, 80.2735], elevation: 18.0 },
    "N4": { id: "N4", name: "North-East By-pass", coords: [13.0900, 80.2815], elevation: 12.5 },
    "N5": { id: "N5", name: "Central Market Crossroad", coords: [13.0840, 80.2660], elevation: 8.2 },
    "N6": { id: "N6", name: "Rivergate Underpass (Low)", coords: [13.0820, 80.2710], elevation: 3.8 }, // Highly vulnerable underpass
    "N7": { id: "N7", name: "Embankment Road North", coords: [13.0810, 80.2770], elevation: 5.5 },
    "N8": { id: "N8", name: "Shelter Link Crossroad", coords: [13.0850, 80.2820], elevation: 11.5 },
    "N9": { id: "N9", name: "West Residential Colony", coords: [13.0780, 80.2610], elevation: 7.0 },
    "N10": { id: "N10", name: "Metro Terminal Plaza", coords: [13.0765, 80.2685], elevation: 8.5 },
    "N11": { id: "N11", name: "Riverfront Promenade South", coords: [13.0750, 80.2755], elevation: 4.5 },
    "N12": { id: "N12", name: "East Canal Bridge", coords: [13.0730, 80.2820], elevation: 6.0 },
    "N13": { id: "N13", name: "South Relief Link", coords: [13.0695, 80.2760], elevation: 10.5 }
  },

  // Road segments interconnecting nodes with dynamic flood attributes
  roadSegments: [
    {
      id: "R1",
      name: "North Elevated Flyover",
      from: "N1",
      to: "N2",
      path: [[13.0950, 80.2620], [13.0905, 80.2645]],
      distanceKm: 0.6,
      elevationAvg: 14.5,
      type: "elevated_highway",
      baseWaterDepthCm: 0,
      currentWaterDepthCm: 0,
      status: "SAFE",
      hazard: "None - Elevated road 100% dry",
      verifiedBy: "Disaster Mgmt Authority (DDMA)",
      verifiedTime: "12 mins ago"
    },
    {
      id: "R2",
      name: "Ridge Crest Expressway",
      from: "N2",
      to: "N3",
      path: [[13.0905, 80.2645], [13.0925, 80.2690], [13.0945, 80.2735]],
      distanceKm: 1.1,
      elevationAvg: 16.0,
      type: "arterial",
      baseWaterDepthCm: 0,
      currentWaterDepthCm: 2,
      status: "SAFE",
      hazard: "None - Slight surface runoff",
      verifiedBy: "Traffic Police Unit 4",
      verifiedTime: "25 mins ago"
    },
    {
      id: "R3",
      name: "Greenridge East Connector",
      from: "N3",
      to: "N4",
      path: [[13.0945, 80.2735], [13.0920, 80.2780], [13.0900, 80.2815]],
      distanceKm: 1.0,
      elevationAvg: 14.0,
      type: "collector",
      baseWaterDepthCm: 0,
      currentWaterDepthCm: 5,
      status: "SAFE",
      hazard: "Potholes hidden by minor puddle",
      verifiedBy: "Community Volunteer Network",
      verifiedTime: "40 mins ago"
    },
    {
      id: "R4",
      name: "Hospital Avenue",
      from: "N2",
      to: "N5",
      path: [[13.0905, 80.2645], [13.0870, 80.2652], [13.0840, 80.2660]],
      distanceKm: 0.8,
      elevationAvg: 10.5,
      type: "arterial",
      baseWaterDepthCm: 5,
      currentWaterDepthCm: 12,
      status: "CAUTION",
      hazard: "Waterlogged curb lane (12cm). Two-wheelers use center lane.",
      verifiedBy: "Ambulance Driver Dispatch",
      verifiedTime: "10 mins ago"
    },
    {
      id: "R5",
      name: "Central Arterial Link (Underpass Approach)",
      from: "N5",
      to: "N6",
      path: [[13.0840, 80.2660], [13.0830, 80.2685], [13.0820, 80.2710]],
      distanceKm: 0.6,
      elevationAvg: 5.5,
      type: "underpass_link",
      baseWaterDepthCm: 20,
      currentWaterDepthCm: 45,
      status: "BLOCKED",
      hazard: "DEEP WATERLOGGING (45cm). Rapid drainage backflow. Submerged hatchback reported stalled.",
      verifiedBy: "Municipal Flood Control Center",
      verifiedTime: "5 mins ago"
    },
    {
      id: "R6",
      name: "Rivergate Subway / Railway Underpass",
      from: "N6",
      to: "N7",
      path: [[13.0820, 80.2710], [13.0815, 80.2740], [13.0810, 80.2770]],
      distanceKm: 0.7,
      elevationAvg: 3.8, // Low point!
      type: "subway_underpass",
      baseWaterDepthCm: 40,
      currentWaterDepthCm: 85,
      status: "BLOCKED",
      hazard: "CRITICAL DANGER: Underpass submerged to 85cm water! Barricaded by Police. Fatal risk for cars and pedestrians.",
      verifiedBy: "State Police Barricade & Fire Rescue",
      verifiedTime: "2 mins ago"
    },
    {
      id: "R7",
      name: "North Embankment Service Road",
      from: "N7",
      to: "N8",
      path: [[13.0810, 80.2770], [13.0830, 80.2795], [13.0850, 80.2820]],
      distanceKm: 0.7,
      elevationAvg: 7.5,
      type: "local",
      baseWaterDepthCm: 15,
      currentWaterDepthCm: 28,
      status: "CAUTION",
      hazard: "Water depth 28cm. Only SUVs & rescue trucks permitted. Unsafe for bikes and sedans.",
      verifiedBy: "Ward Councillor Volunteer Team",
      verifiedTime: "18 mins ago"
    },
    {
      id: "R8",
      name: "Shelter Access Road",
      from: "N4",
      to: "N8",
      path: [[13.0900, 80.2815], [13.0875, 80.2818], [13.0850, 80.2820]],
      distanceKm: 0.6,
      elevationAvg: 12.0,
      type: "local",
      baseWaterDepthCm: 0,
      currentWaterDepthCm: 4,
      status: "SAFE",
      hazard: "Safe dry route to St. Jude Relief Shelter.",
      verifiedBy: "Disaster Mgmt Authority (DDMA)",
      verifiedTime: "15 mins ago"
    },
    {
      id: "R9",
      name: "West Colony Boulevard",
      from: "N5",
      to: "N9",
      path: [[13.0840, 80.2660], [13.0810, 80.2635], [13.0780, 80.2610]],
      distanceKm: 0.9,
      elevationAvg: 7.8,
      type: "residential_main",
      baseWaterDepthCm: 8,
      currentWaterDepthCm: 18,
      status: "CAUTION",
      hazard: "Water depth 18cm. Pedestrians cannot see open manholes. Drive slow.",
      verifiedBy: "Citizen Report #1042 (3 Confirmations)",
      verifiedTime: "8 mins ago"
    },
    {
      id: "R10",
      name: "Metro Cross Avenue",
      from: "N9",
      to: "N10",
      path: [[13.0780, 80.2610], [13.0772, 80.2650], [13.0765, 80.2685]],
      distanceKm: 0.8,
      elevationAvg: 8.2,
      type: "collector",
      baseWaterDepthCm: 5,
      currentWaterDepthCm: 14,
      status: "CAUTION",
      hazard: "Water depth 14cm. Passable with caution for cars and SUVs.",
      verifiedBy: "Metro Security Dispatch",
      verifiedTime: "22 mins ago"
    },
    {
      id: "R11",
      name: "Riverfront South Promenade",
      from: "N10",
      to: "N11",
      path: [[13.0765, 80.2685], [13.0758, 80.2720], [13.0750, 80.2755]],
      distanceKm: 0.8,
      elevationAvg: 4.8,
      type: "riverfront_arterial",
      baseWaterDepthCm: 25,
      currentWaterDepthCm: 55,
      status: "BLOCKED",
      hazard: "RIVER OVERFLOW: Water overtopping riverbank wall by 55cm. Strong current. Entire road closed.",
      verifiedBy: "Irrigation & River Authority",
      verifiedTime: "4 mins ago"
    },
    {
      id: "R12",
      name: "Canal Link Road",
      from: "N11",
      to: "N12",
      path: [[13.0750, 80.2755], [13.0740, 80.2785], [13.0730, 80.2820]],
      distanceKm: 0.7,
      elevationAvg: 5.8,
      type: "collector",
      baseWaterDepthCm: 20,
      currentWaterDepthCm: 48,
      status: "BLOCKED",
      hazard: "Canal backflow overflow. Fallen electric transformer pole in water. DO NOT ENTER.",
      verifiedBy: "Electricity Board & Rescue Squad",
      verifiedTime: "14 mins ago"
    },
    {
      id: "R13",
      name: "South Relief Corridor (Emergency Only)",
      from: "N10",
      to: "N13",
      path: [[13.0765, 80.2685], [13.0730, 80.2720], [13.0695, 80.2760]],
      distanceKm: 1.1,
      elevationAvg: 10.2,
      type: "emergency_corridor",
      baseWaterDepthCm: 5,
      currentWaterDepthCm: 10,
      status: "EMERGENCY_ONLY",
      hazard: "Priority Lane reserved for NDRF rescue boats, ambulances & military trucks.",
      verifiedBy: "Disaster Mgmt Authority (DDMA)",
      verifiedTime: "7 mins ago"
    },
    {
      id: "R14",
      name: "East Relief Connector",
      from: "N13",
      to: "N12",
      path: [[13.0695, 80.2760], [13.0710, 80.2790], [13.0730, 80.2820]],
      distanceKm: 0.8,
      elevationAvg: 8.5,
      type: "collector",
      baseWaterDepthCm: 10,
      currentWaterDepthCm: 22,
      status: "CAUTION",
      hazard: "Water depth 22cm. High clearance SUVs and trucks can access relief camp.",
      verifiedBy: "Relief Camp Coordinator",
      verifiedTime: "30 mins ago"
    },
    {
      id: "R15",
      name: "St. Jude North-South Link",
      from: "N8",
      to: "N12",
      path: [[13.0850, 80.2820], [13.0790, 80.2825], [13.0730, 80.2820]],
      distanceKm: 1.3,
      elevationAvg: 9.0,
      type: "arterial",
      baseWaterDepthCm: 12,
      currentWaterDepthCm: 26,
      status: "CAUTION",
      hazard: "Water depth 26cm in middle stretch near creek. Caution for standard vehicles.",
      verifiedBy: "Traffic Police Control",
      verifiedTime: "19 mins ago"
    }
  ],

  // Flood Inundation Polygons (visual zones covering low-lying river basins)
  inundationZones: [
    {
      id: "zone_underpass",
      name: "Rivergate Underpass Depression",
      severity: "DEEP_WATER",
      waterDepth: "60-90 cm",
      coords: [
        [13.0835, 80.2690],
        [13.0830, 80.2735],
        [13.0805, 80.2745],
        [13.0805, 80.2695]
      ]
    },
    {
      id: "zone_riverfront",
      name: "South Riverfront Inundation Plain",
      severity: "RIVER_BREACH",
      waterDepth: "50-80 cm",
      coords: [
        [13.0775, 80.2710],
        [13.0760, 80.2800],
        [13.0725, 80.2835],
        [13.0720, 80.2745]
      ]
    }
  ],

  // 5 Realistic Timeline Stages for Flood Evolution Demo
  timelineStages: [
    {
      stage: 0,
      timeLabel: "T+0 hrs (08:00 AM)",
      title: "Heavy Rainfall Alert Issued",
      description: "Monsoon cloudburst over catchment area. 65mm rainfall in 2 hours. Natural drainage functioning, all roads currently passable.",
      riverLevel: 2.1,
      roadStates: {
        "R1": { depth: 0, status: "SAFE" },
        "R2": { depth: 0, status: "SAFE" },
        "R3": { depth: 0, status: "SAFE" },
        "R4": { depth: 2, status: "SAFE" },
        "R5": { depth: 8, status: "SAFE" },
        "R6": { depth: 15, status: "CAUTION" }, // Underpass starts filling
        "R7": { depth: 6, status: "SAFE" },
        "R8": { depth: 0, status: "SAFE" },
        "R9": { depth: 4, status: "SAFE" },
        "R10": { depth: 3, status: "SAFE" },
        "R11": { depth: 12, status: "CAUTION" },
        "R12": { depth: 10, status: "SAFE" },
        "R13": { depth: 2, status: "SAFE" },
        "R14": { depth: 5, status: "SAFE" },
        "R15": { depth: 6, status: "SAFE" }
      }
    },
    {
      stage: 1,
      timeLabel: "T+2 hrs (10:00 AM)",
      title: "Urban Drainage Saturated",
      description: "Runoff exceeds stormwater canal capacity. Water begins pooling in low-lying underpasses and riverfront alleys.",
      riverLevel: 2.9,
      roadStates: {
        "R1": { depth: 0, status: "SAFE" },
        "R2": { depth: 0, status: "SAFE" },
        "R3": { depth: 2, status: "SAFE" },
        "R4": { depth: 8, status: "SAFE" },
        "R5": { depth: 24, status: "CAUTION" },
        "R6": { depth: 48, status: "BLOCKED" }, // Underpass impassable for cars
        "R7": { depth: 16, status: "CAUTION" },
        "R8": { depth: 2, status: "SAFE" },
        "R9": { depth: 12, status: "CAUTION" },
        "R10": { depth: 8, status: "SAFE" },
        "R11": { depth: 32, status: "BLOCKED" },
        "R12": { depth: 22, status: "CAUTION" },
        "R13": { depth: 5, status: "SAFE" },
        "R14": { depth: 12, status: "CAUTION" },
        "R15": { depth: 14, status: "CAUTION" }
      }
    },
    {
      stage: 2,
      timeLabel: "T+4 hrs (12:00 PM - PRESENT)",
      title: "River Crests Over Warning Mark",
      description: "Upstream dam release reaches city. River breaches embankment at South Promenade and inundates Rivergate Underpass.",
      riverLevel: 3.8,
      roadStates: {
        "R1": { depth: 0, status: "SAFE" },
        "R2": { depth: 2, status: "SAFE" },
        "R3": { depth: 5, status: "SAFE" },
        "R4": { depth: 12, status: "CAUTION" },
        "R5": { depth: 45, status: "BLOCKED" },
        "R6": { depth: 85, status: "BLOCKED" },
        "R7": { depth: 28, status: "CAUTION" },
        "R8": { depth: 4, status: "SAFE" },
        "R9": { depth: 18, status: "CAUTION" },
        "R10": { depth: 14, status: "CAUTION" },
        "R11": { depth: 55, status: "BLOCKED" },
        "R12": { depth: 48, status: "BLOCKED" },
        "R13": { depth: 10, status: "EMERGENCY_ONLY" },
        "R14": { depth: 22, status: "CAUTION" },
        "R15": { depth: 26, status: "CAUTION" }
      }
    },
    {
      stage: 3,
      timeLabel: "T+6 hrs (02:00 PM)",
      title: "Peak Flood Surge - Neighbourhood Cut Off Risk",
      description: "Peak water level. East canal overflows. West residential area severed from direct hospital access; routing dynamically reroutes via North High Flyover.",
      riverLevel: 4.2,
      roadStates: {
        "R1": { depth: 0, status: "SAFE" },
        "R2": { depth: 5, status: "SAFE" },
        "R3": { depth: 8, status: "SAFE" },
        "R4": { depth: 22, status: "CAUTION" },
        "R5": { depth: 65, status: "BLOCKED" },
        "R6": { depth: 110, status: "BLOCKED" }, // 1.1m deep!
        "R7": { depth: 42, status: "BLOCKED" },
        "R8": { depth: 8, status: "SAFE" },
        "R9": { depth: 35, status: "BLOCKED" },
        "R10": { depth: 25, status: "CAUTION" },
        "R11": { depth: 75, status: "BLOCKED" },
        "R12": { depth: 65, status: "BLOCKED" },
        "R13": { depth: 18, status: "EMERGENCY_ONLY" },
        "R14": { depth: 38, status: "BLOCKED" },
        "R15": { depth: 35, status: "BLOCKED" }
      }
    },
    {
      stage: 4,
      timeLabel: "T+12 hrs (08:00 PM)",
      title: "Water Receding & Emergency Pumps Active",
      description: "Rain stops; high-capacity dewatering pumps deployed at underpasses. Arterial roads inspect and reopen incrementally.",
      riverLevel: 2.7,
      roadStates: {
        "R1": { depth: 0, status: "SAFE" },
        "R2": { depth: 0, status: "SAFE" },
        "R3": { depth: 0, status: "SAFE" },
        "R4": { depth: 4, status: "SAFE" },
        "R5": { depth: 18, status: "CAUTION" },
        "R6": { depth: 35, status: "CAUTION" }, // Draining
        "R7": { depth: 14, status: "CAUTION" },
        "R8": { depth: 0, status: "SAFE" },
        "R9": { depth: 10, status: "SAFE" },
        "R10": { depth: 5, status: "SAFE" },
        "R11": { depth: 25, status: "CAUTION" },
        "R12": { depth: 20, status: "CAUTION" },
        "R13": { depth: 4, status: "SAFE" },
        "R14": { depth: 8, status: "SAFE" },
        "R15": { depth: 10, status: "SAFE" }
      }
    }
  ]
};

// Vehicle capabilities with maximum safe water clearance thresholds (in cm)
const VEHICLE_CLEARANCES = {
  pedestrian: {
    label: "Walking / Pedestrian",
    maxClearanceCm: 15,
    icon: "🚶",
    cautionRisk: "Open drain hazards, swift current can sweep away walking adults (>15cm)",
    speedKmh: 4.5
  },
  two_wheeler: {
    label: "2-Wheeler (Motorcycle / Scooter)",
    maxClearanceCm: 18,
    icon: "🛵",
    cautionRisk: "Exhaust silencer flooding, slipping on silt / oil film",
    speedKmh: 20
  },
  sedan: {
    label: "Sedan / Hatchback (Low Clearance)",
    maxClearanceCm: 22,
    icon: "🚗",
    cautionRisk: "Air intake hydrostatic lock risk above 20cm, loss of traction",
    speedKmh: 35
  },
  suv: {
    label: "SUV / 4x4 (High Clearance)",
    maxClearanceCm: 40,
    icon: "🚙",
    cautionRisk: "Can cross shallow waterlogged stretches, caution on unknown depths",
    speedKmh: 40
  },
  emergency: {
    label: "Emergency Response / Rescue Truck / Boat",
    maxClearanceCm: 90,
    icon: "🚒",
    cautionRisk: "Designated for official rescue convoys and disaster relief teams",
    speedKmh: 30
  }
};
