// FloodRoute Master Application Orchestrator
// Ties together Map, Routing, Simulation, Reporting, and Low-Bandwidth modules.

class FloodRouteApplication {
  constructor() {
    this.data = DISTRICT_DATA;
    this.router = new FloodRouter(this.data);
    this.offline = new EmergencyOfflineModule(this.data);
    this.userRole = 'citizen'; // 'citizen' or 'authority'
    this.activeVehicle = 'sedan';
    this.currentRouteResult = null;

    // Initialize modules
    this.initSimulation();
    this.initReporting();
    this.initMap();
    this.initUI();
    this.updateDistrictStats();

    // Default sample calculation for instant WOW effect
    setTimeout(() => {
      this.calculateRoute('N9', 'N2', 'sedan'); // From West Residential to Metro Hospital
    }, 600);
  }

  initSimulation() {
    this.sim = new FloodSimulation(this.data, (stage, stageIndex) => {
      this.handleStageChanged(stage, stageIndex);
    });
  }

  initReporting() {
    this.reporting = new IncidentReporting(this.data, (report, allReports) => {
      this.renderReportFeed();
      this.map.updateRoadsAfterSimulation();
      this.updateDistrictStats();
      this.showToast(`Incident update: ${report.roadName} - ${report.statusApplied}`, 'info');
    });
  }

  initMap() {
    this.map = new FloodMap(
      'map',
      this.data,
      (road) => this.showRoadDetails(road),
      (poi) => this.handlePoiClicked(poi)
    );
  }

  initUI() {
    this.bindSidebarTabs();
    this.bindVehicleSelectors();
    this.bindRoutingActions();
    this.bindSimulationControls();
    this.bindModals();
    this.bindAuthorityControls();
    this.renderRoadDirectory();
    this.renderReportFeed();
    this.populateLocationDropdowns();
  }

  // Bind Sidebar Navigation Tabs
  bindSidebarTabs() {
    const tabs = document.querySelectorAll('.sidebar-nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabTarget = tab.dataset.tab;
        document.querySelectorAll('.tab-content-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        const activePanel = document.getElementById(`panel-${tabTarget}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });
  }

  // Populate Dropdown Options
  populateLocationDropdowns() {
    const startSelect = document.getElementById('route-start-select');
    const endSelect = document.getElementById('route-end-select');
    const reportRoadSelect = document.getElementById('report-road-select');

    if (startSelect && endSelect) {
      startSelect.innerHTML = '';
      endSelect.innerHTML = '';

      Object.values(this.data.nodes).forEach(node => {
        const opt1 = document.createElement('option');
        opt1.value = node.id;
        opt1.textContent = `${node.name} (${node.elevation}m)`;
        startSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = node.id;
        opt2.textContent = `${node.name} (${node.elevation}m)`;
        endSelect.appendChild(opt2);
      });

      // Default selections: West Colony to Hospital
      startSelect.value = 'N9'; // West Residential Colony
      endSelect.value = 'N2';   // Hospital Junction
    }

    if (reportRoadSelect) {
      reportRoadSelect.innerHTML = '';
      this.data.roadSegments.forEach(road => {
        const opt = document.createElement('option');
        opt.value = road.id;
        opt.textContent = `${road.name} (Current: ${road.currentWaterDepthCm}cm)`;
        reportRoadSelect.appendChild(opt);
      });
    }
  }

  // Bind Vehicle Type Selector
  bindVehicleSelectors() {
    const buttons = document.querySelectorAll('.vehicle-card-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.activeVehicle = btn.dataset.vehicle;

        const info = VEHICLE_CLEARANCES[this.activeVehicle];
        const clearanceLabel = document.getElementById('vehicle-clearance-info');
        if (clearanceLabel && info) {
          clearanceLabel.innerHTML = `<strong>${info.label}</strong>: Safe max water clearance <strong>${info.maxClearanceCm} cm</strong>. <span class="note">${info.cautionRisk}</span>`;
        }

        // Re-calculate active route if already showing
        this.recalculateCurrentRoute();
      });
    });
  }

  // Bind Routing Actions
  bindRoutingActions() {
    const btnFindRoute = document.getElementById('btn-find-safe-route');
    if (btnFindRoute) {
      btnFindRoute.addEventListener('click', () => {
        const startId = document.getElementById('route-start-select').value;
        const endId = document.getElementById('route-end-select').value;
        this.calculateRoute(startId, endId, this.activeVehicle);
      });
    }

    // Quick preset destination chips (Hospital, St Jude Shelter, Metro)
    const presetChips = document.querySelectorAll('.destination-preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const targetNodeId = chip.dataset.targetNode;
        const endSelect = document.getElementById('route-end-select');
        if (endSelect) endSelect.value = targetNodeId;

        const startId = document.getElementById('route-start-select').value;
        this.calculateRoute(startId, targetNodeId, this.activeVehicle);
      });
    });
  }

  // Core Route Calculation & Display
  calculateRoute(startNodeId, endNodeId, vehicleKey) {
    if (startNodeId === endNodeId) {
      this.showToast("Origin and destination cannot be identical!", "warning");
      return;
    }

    const safeResult = this.router.findSafeRoute(startNodeId, endNodeId, vehicleKey);
    const standardResult = this.router.findStandardRoute(startNodeId, endNodeId);
    this.currentRouteResult = safeResult;

    if (!safeResult.success) {
      this.map.clearRoutes();
      this.offline.playHazardWarning();
      this.renderRouteFailure(safeResult, standardResult);
      return;
    }

    // Success! Play gentle chime and draw route
    this.offline.playSafeChime();
    this.map.drawSafeRoute(safeResult);
    if (standardResult && standardResult.hasBlockedRoads) {
      this.map.drawStandardComparison(standardResult);
    } else {
      this.map.clearComparison();
    }

    this.renderRouteSuccess(safeResult, standardResult);
  }

  recalculateCurrentRoute() {
    const startSelect = document.getElementById('route-start-select');
    const endSelect = document.getElementById('route-end-select');
    if (startSelect && endSelect) {
      this.calculateRoute(startSelect.value, endSelect.value, this.activeVehicle);
    }
  }

  renderRouteSuccess(safe, standard) {
    const container = document.getElementById('route-result-container');
    if (!container) return;

    let standardComparisonHtml = '';
    if (standard && standard.hasBlockedRoads) {
      const blockedNames = standard.blockedRoads.map(r => `<strong>${r.name} (${r.currentWaterDepthCm}cm)</strong>`).join(', ');
      standardComparisonHtml = `
        <div class="comparison-danger-box">
          <div class="comp-header">
            <span class="danger-icon">❌</span>
            <strong>Standard GPS Warning: Hazardous!</strong>
          </div>
          <p>Regular shortest-path routing directs drivers into submerged hazard zones: ${blockedNames}.</p>
          <div class="comp-badge">Saved from drowning/damage trap by FloodRoute Intelligence</div>
        </div>
      `;
    }

    let directionsHtml = safe.turnByTurn.map(step => `
      <div class="step-card status-border-${step.status.toLowerCase()}">
        <div class="step-num">${step.stepNumber}</div>
        <div class="step-details">
          <div class="step-title">${step.instruction}</div>
          <div class="step-meta">
            <span>${step.distance}</span> • <span>${step.elevation}</span> • 
            <span class="water-tag water-${step.status.toLowerCase()}">${step.waterDepth}</span>
          </div>
          <div class="step-note">${step.note}</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="route-summary-card">
        <div class="route-summary-top">
          <div>
            <div class="safe-badge-pill">✅ 100% USABLE SAFE PATH</div>
            <h3 class="route-metric-dist">${safe.totalDistanceKm} km <span class="route-metric-time">~${safe.estimatedTimeMinutes} min</span></h3>
          </div>
          <button class="btn btn-sm btn-outline-cyan" onclick="window.FloodRouteApp.openSmsModal()">
            📱 SMS / Offline View
          </button>
        </div>
        <div class="route-quick-stats">
          <div class="stat-cell">
            <span class="label">Vehicle Mode</span>
            <span class="val">${safe.vehicle.label.split(' ')[0]} ${safe.vehicle.label.split(' ')[1] || ''}</span>
          </div>
          <div class="stat-cell">
            <span class="label">Max Water Depth</span>
            <span class="val">${safe.maxWaterDepthCm} cm</span>
          </div>
          <div class="stat-cell">
            <span class="label">Safety Status</span>
            <span class="val color-emerald">${safe.routeSafety}</span>
          </div>
        </div>
        ${standardComparisonHtml}
        <div class="turn-by-turn-list">
          <div class="directions-header">Turn-by-Turn Flood Advisories:</div>
          ${directionsHtml}
        </div>
      </div>
    `;
  }

  renderRouteFailure(safe, standard) {
    const container = document.getElementById('route-result-container');
    if (!container) return;

    container.innerHTML = `
      <div class="route-summary-card route-blocked-card">
        <div class="safe-badge-pill danger-pill">⚠️ NO SAFE ACCESS FOR ${this.activeVehicle.toUpperCase()}</div>
        <h3>All Connecting Corridors Are Submerged</h3>
        <p class="blocked-message">${safe.message}</p>
        <div class="emergency-advice-box">
          <strong>Recommended Emergency Actions:</strong>
          <ul>
            <li>Remain on high ground or upper storeys of buildings.</li>
            <li>Switch vehicle mode to <strong>SUV / Rescue Boat</strong> if available.</li>
            <li>Request Emergency Evacuation via the SOS portal or Municipal Control (1077).</li>
          </ul>
        </div>
        <button class="btn btn-danger btn-block" onclick="window.FloodRouteApp.triggerEmergencySOS()">
          🚨 Trigger Emergency Evacuation SOS
        </button>
      </div>
    `;
  }

  // Bind Simulation Controls
  bindSimulationControls() {
    const btnPlay = document.getElementById('sim-play-btn');
    const btnPrev = document.getElementById('sim-prev-btn');
    const btnNext = document.getElementById('sim-next-btn');
    const slider = document.getElementById('sim-timeline-slider');

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        const isPlaying = this.sim.togglePlay();
        btnPlay.innerHTML = isPlaying ? '⏸️ Pause' : '▶️ Play Demo';
        btnPlay.classList.toggle('playing', isPlaying);
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.sim.prevStage());
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => this.sim.nextStage());
    }

    if (slider) {
      slider.addEventListener('input', (e) => {
        this.sim.setStage(parseInt(e.target.value));
      });
    }

    // Audio mute button
    const btnAudio = document.getElementById('btn-audio-toggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const isMuted = this.offline.toggleMute();
        btnAudio.innerHTML = isMuted ? '🔇 Audio Off' : '🔊 Audio On';
        btnAudio.classList.toggle('muted', isMuted);
      });
    }

    // Low bandwidth button
    const btnLowBw = document.getElementById('btn-low-bandwidth');
    if (btnLowBw) {
      btnLowBw.addEventListener('click', () => this.openSmsModal());
    }

    // Role switcher (Citizen vs Authority Command)
    const roleToggle = document.getElementById('role-mode-selector');
    if (roleToggle) {
      roleToggle.addEventListener('change', (e) => {
        this.setUserRole(e.target.value);
      });
    }
  }

  handleStageChanged(stage, index) {
    const slider = document.getElementById('sim-timeline-slider');
    if (slider) slider.value = index;

    const labelTime = document.getElementById('sim-time-label');
    const labelTitle = document.getElementById('sim-stage-title');
    const labelDesc = document.getElementById('sim-stage-desc');
    const riverGauge = document.getElementById('river-gauge-display');

    if (labelTime) labelTime.textContent = stage.timeLabel;
    if (labelTitle) labelTitle.textContent = stage.title;
    if (labelDesc) labelDesc.textContent = stage.description;
    if (riverGauge) {
      riverGauge.innerHTML = `🌊 River Level: <strong>${stage.riverLevel}m</strong> <span class="danger-tag">${stage.riverLevel > 3.5 ? 'DANGER BREACH' : 'NORMAL'}</span>`;
    }

    // Refresh Map Layers
    this.map.updateRoadsAfterSimulation();
    this.renderRoadDirectory();
    this.updateDistrictStats();

    // Recalculate route if user was viewing one
    this.recalculateCurrentRoute();

    this.showToast(`Simulation Updated: ${stage.timeLabel} - ${stage.title}`, 'info');
  }

  // Update Top Stats Bar
  updateDistrictStats() {
    const total = this.data.roadSegments.length;
    const safeCount = this.data.roadSegments.filter(r => r.status === 'SAFE').length;
    const cautionCount = this.data.roadSegments.filter(r => r.status === 'CAUTION').length;
    const blockedCount = this.data.roadSegments.filter(r => r.status === 'BLOCKED').length;

    const safePct = Math.round((safeCount / total) * 100);
    const blockedPct = Math.round((blockedCount / total) * 100);

    const statPassable = document.getElementById('stat-passable-pct');
    const statBlocked = document.getElementById('stat-blocked-count');
    const statRiver = document.getElementById('stat-river-level');

    if (statPassable) statPassable.textContent = `${safePct}% Passable (${safeCount}/${total})`;
    if (statBlocked) statBlocked.textContent = `${blockedCount} Roads Blocked`;
    if (statRiver) statRiver.textContent = `${this.data.riverLevelCurrent}m (Danger: ${this.data.riverLevelDanger}m)`;
  }

  // Render Searchable Road Directory
  renderRoadDirectory(filter = 'ALL') {
    const listContainer = document.getElementById('road-directory-list');
    if (!listContainer) return;

    let roads = this.data.roadSegments;
    if (filter !== 'ALL') {
      roads = roads.filter(r => r.status === filter);
    }

    listContainer.innerHTML = roads.map(road => `
      <div class="road-directory-card status-border-${road.status.toLowerCase()}" onclick="window.FloodRouteApp.selectAndInspectRoad('${road.id}')">
        <div class="rd-header">
          <div class="rd-name">${road.name}</div>
          <span class="status-pill status-${road.status.toLowerCase()}">${road.status.replace('_', ' ')}</span>
        </div>
        <div class="rd-depth-row">
          <div class="depth-bar-container">
            <div class="depth-bar-fill depth-fill-${road.status.toLowerCase()}" style="width: ${Math.min(100, (road.currentWaterDepthCm / 90) * 100)}%"></div>
          </div>
          <span class="depth-val">${road.currentWaterDepthCm} cm water</span>
        </div>
        <div class="rd-meta-row">
          <span>Avg Elev: ${road.elevationAvg}m</span>
          <span>Verified: ${road.verifiedTime}</span>
        </div>
      </div>
    `).join('');
  }

  // Road Inspector Panel
  showRoadDetails(road) {
    const card = document.getElementById('floating-road-inspector');
    if (!card) return;

    card.classList.remove('hidden');
    card.classList.add('visible');

    const clearanceCheck = (max) => road.currentWaterDepthCm <= max ? '✅ Passable' : '❌ Submerged';

    card.innerHTML = `
      <div class="inspector-card">
        <div class="inspector-header">
          <div>
            <div class="inspector-category">ROAD TELEMETRY INSPECTOR</div>
            <h3 class="inspector-title">${road.name}</h3>
          </div>
          <button class="btn-close-inspector" onclick="window.FloodRouteApp.closeRoadInspector()">✕</button>
        </div>

        <div class="inspector-grid">
          <div class="insp-stat">
            <span class="insp-stat-label">Current Status</span>
            <span class="status-pill status-${road.status.toLowerCase()}">${road.status.replace('_', ' ')}</span>
          </div>
          <div class="insp-stat">
            <span class="insp-stat-label">Water Depth</span>
            <span class="insp-stat-val ${road.currentWaterDepthCm > 25 ? 'color-crimson' : 'color-emerald'}">${road.currentWaterDepthCm} cm</span>
          </div>
          <div class="insp-stat">
            <span class="insp-stat-label">Road Elevation</span>
            <span class="insp-stat-val">${road.elevationAvg} meters</span>
          </div>
          <div class="insp-stat">
            <span class="insp-stat-label">Verified By</span>
            <span class="insp-stat-val">${road.verifiedBy}</span>
          </div>
        </div>

        <div class="hazard-description-box">
          <strong>⚠️ Active Hazard Condition:</strong>
          <p>${road.hazard}</p>
        </div>

        <div class="passability-matrix">
          <div class="matrix-title">Passability by Vehicle Type:</div>
          <div class="matrix-chips">
            <span class="matrix-chip ${road.currentWaterDepthCm <= 15 ? 'chip-safe' : 'chip-blocked'}">🚶 Walking: ${clearanceCheck(15)}</span>
            <span class="matrix-chip ${road.currentWaterDepthCm <= 18 ? 'chip-safe' : 'chip-blocked'}">🛵 2-Wheeler: ${clearanceCheck(18)}</span>
            <span class="matrix-chip ${road.currentWaterDepthCm <= 22 ? 'chip-safe' : 'chip-blocked'}">🚗 Sedan: ${clearanceCheck(22)}</span>
            <span class="matrix-chip ${road.currentWaterDepthCm <= 40 ? 'chip-safe' : 'chip-blocked'}">🚙 SUV (4x4): ${clearanceCheck(40)}</span>
            <span class="matrix-chip ${road.currentWaterDepthCm <= 90 ? 'chip-safe' : 'chip-blocked'}">🚒 Emergency Boat/Truck: ${clearanceCheck(90)}</span>
          </div>
        </div>

        <div class="inspector-actions">
          <button class="btn btn-sm btn-primary" onclick="window.FloodRouteApp.setRouteDestination('${road.to}')">
            Route To Here
          </button>
          <button class="btn btn-sm btn-outline-cyan" onclick="window.FloodRouteApp.openReportModalForRoad('${road.id}')">
            📢 Report Water Update
          </button>
          ${this.userRole === 'authority' ? `
            <button class="btn btn-sm btn-warning" onclick="window.FloodRouteApp.toggleRoadBlockAuthority('${road.id}')">
              🚧 ${road.status === 'BLOCKED' ? 'Re-open Road' : 'Place Barricade (Close)'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  closeRoadInspector() {
    const card = document.getElementById('floating-road-inspector');
    if (card) card.classList.add('hidden');
    this.map.selectRoad(null);
  }

  selectAndInspectRoad(roadId) {
    const road = this.data.roadSegments.find(r => r.id === roadId);
    if (road) {
      this.map.selectRoad(roadId);
      this.showRoadDetails(road);
    }
  }

  handlePoiClicked(poi) {
    this.showToast(`Selected destination: ${poi.name}`, 'info');
  }

  setRouteDestination(nodeOrPoiId) {
    // Check if it's a POI or Node
    let targetNodeId = nodeOrPoiId;
    if (nodeOrPoiId === 'hospital_general') targetNodeId = 'N2';
    else if (nodeOrPoiId === 'relief_camp_north') targetNodeId = 'N8';
    else if (nodeOrPoiId === 'metro_station') targetNodeId = 'N10';
    else if (nodeOrPoiId === 'high_ground_hill') targetNodeId = 'N3';
    else if (nodeOrPoiId === 'food_camp_east') targetNodeId = 'N12';

    const endSelect = document.getElementById('route-end-select');
    if (endSelect) endSelect.value = targetNodeId;

    const startSelect = document.getElementById('route-start-select');
    this.calculateRoute(startSelect.value, targetNodeId, this.activeVehicle);

    // Switch to route tab
    const tabRoute = document.querySelector('[data-tab="routing"]');
    if (tabRoute) tabRoute.click();
  }

  // Render Crowdsourced Reports Feed
  renderReportFeed() {
    const feedContainer = document.getElementById('reports-feed-container');
    if (!feedContainer) return;

    const reports = this.reporting.getReports();

    feedContainer.innerHTML = reports.map(r => `
      <div class="incident-feed-card ${r.isVerified ? 'verified-incident' : 'community-incident'}">
        <div class="incident-top">
          <div>
            <div class="incident-road">${r.roadName}</div>
            <div class="incident-sub">Reported by ${r.reportedBy} • ${r.timeAgo}</div>
          </div>
          <span class="status-pill status-${r.statusApplied.toLowerCase()}">${r.statusApplied}</span>
        </div>

        <div class="incident-depth-badge">
          <span>Water Depth: <strong>${r.waterDepthLabel}</strong></span>
          <span>Flow: <strong>${r.currentSpeed}</strong></span>
        </div>

        <p class="incident-desc">${r.description}</p>

        <div class="incident-footer">
          <div class="verification-badge">
            ${r.isVerified 
              ? `<span class="badge-verified">🛡️ Official: ${r.verifiedBy}</span>` 
              : `<span class="badge-pending">⏳ Community Report (${r.upvotes} Confirmations)</span>`
            }
          </div>
          <div class="incident-actions">
            <button class="btn btn-xs btn-outline-cyan" onclick="window.FloodRouteApp.upvoteReport('${r.id}')">
              👍 Confirm (+1)
            </button>
            ${this.userRole === 'authority' && !r.isVerified ? `
              <button class="btn btn-xs btn-primary" onclick="window.FloodRouteApp.verifyReportAuthority('${r.id}')">
                🛡️ Verify & Enforce
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  upvoteReport(reportId) {
    this.reporting.upvoteReport(reportId);
    this.showToast("Thank you for confirming road conditions!", "success");
  }

  verifyReportAuthority(reportId) {
    this.reporting.verifyReportByAuthority(reportId);
    this.showToast("Incident officially verified and marked in Disaster Registry", "success");
  }

  toggleRoadBlockAuthority(roadId) {
    const road = this.data.roadSegments.find(r => r.id === roadId);
    if (road) {
      if (road.status === 'BLOCKED') {
        road.status = 'CAUTION';
        road.hazard = 'Barricades cleared by Disaster Response Team.';
        this.showToast(`Barricade cleared on ${road.name}. Status set to CAUTION.`, 'success');
      } else {
        road.status = 'BLOCKED';
        road.hazard = 'OFFICIAL BARRICADE: Road closed by Police & Disaster Management.';
        this.showToast(`Barricade placed on ${road.name}. Road closed to civilians.`, 'warning');
      }
      this.map.updateRoadsAfterSimulation();
      this.showRoadDetails(road);
      this.updateDistrictStats();
      this.recalculateCurrentRoute();
    }
  }

  setUserRole(role) {
    this.userRole = role;
    document.body.classList.toggle('authority-mode-active', role === 'authority');
    const badge = document.getElementById('user-role-badge');
    if (badge) {
      badge.textContent = role === 'authority' ? 'MUNICIPAL COMMAND MODE' : 'CITIZEN RESIDENT VIEW';
      badge.className = `role-badge ${role === 'authority' ? 'role-auth' : 'role-cit'}`;
    }
    this.renderReportFeed();
    if (this.map.selectedRoadId) {
      this.selectAndInspectRoad(this.map.selectedRoadId);
    }
    this.showToast(`Switched to ${role === 'authority' ? 'Emergency Dispatcher & Authority View' : 'Citizen Resident View'}`, 'info');
  }

  // Modals & Triggers
  bindModals() {
    // Open Citizen Report Modal
    const btnReport = document.getElementById('btn-open-report-modal');
    if (btnReport) {
      btnReport.addEventListener('click', () => this.openReportModal());
    }

    const reportForm = document.getElementById('citizen-report-form');
    if (reportForm) {
      reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitCitizenReport();
      });
    }

    // SOS Modal
    const btnSos = document.getElementById('btn-trigger-sos');
    if (btnSos) {
      btnSos.addEventListener('click', () => this.triggerEmergencySOS());
    }
  }

  openReportModal() {
    const modal = document.getElementById('modal-report-condition');
    if (modal) modal.classList.add('open');
  }

  openReportModalForRoad(roadId) {
    this.openReportModal();
    const select = document.getElementById('report-road-select');
    if (select) select.value = roadId;
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  submitCitizenReport() {
    const roadSelect = document.getElementById('report-road-select');
    const road = this.data.roadSegments.find(r => r.id === roadSelect.value);
    const depthCm = document.getElementById('report-depth-input').value;
    const currentSpeed = document.getElementById('report-flow-input').value;
    const hazardType = document.getElementById('report-hazard-type').value;
    const description = document.getElementById('report-desc-input').value;
    const reporterName = document.getElementById('report-name-input').value || 'Resident';

    this.reporting.addReport({
      roadId: road.id,
      roadName: road.name,
      waterDepthCm: depthCm,
      waterDepthLabel: `${depthCm} cm`,
      currentSpeed: currentSpeed,
      hazardType: hazardType,
      description: description,
      reportedBy: reporterName,
      reporterType: 'Resident',
      autoVerify: this.userRole === 'authority',
      suggestedStatus: parseInt(depthCm) > 30 ? 'BLOCKED' : (parseInt(depthCm) > 10 ? 'CAUTION' : 'SAFE')
    });

    this.closeModal('modal-report-condition');
    this.showToast('Citizen report published! Thank you for protecting the neighbourhood.', 'success');
  }

  openSmsModal() {
    const modal = document.getElementById('modal-sms-offline');
    if (!modal) return;

    const smsText = this.offline.generateEmergencySMS();
    const turnText = this.offline.generateTurnByTurnText(this.currentRouteResult);

    document.getElementById('sms-condensed-output').textContent = smsText;
    document.getElementById('sms-turnbyturn-output').textContent = turnText;
    modal.classList.add('open');
  }

  triggerEmergencySOS() {
    const modal = document.getElementById('modal-sos-active');
    if (modal) modal.classList.add('open');
    this.offline.playHazardWarning();
  }

  bindAuthorityControls() {
    const btnBroadcast = document.getElementById('btn-auth-broadcast');
    if (btnBroadcast) {
      btnBroadcast.addEventListener('click', () => {
        this.showToast("EMERGENCY BROADCAST SENT: Neighborhood siren activated. Evacuate low-lying streets via North Ring Flyover.", "warning");
        this.offline.playHazardWarning();
      });
    }

    const btnDispatchBoat = document.getElementById('btn-auth-dispatch-boat');
    if (btnDispatchBoat) {
      btnDispatchBoat.addEventListener('click', () => {
        this.showToast("RESCUE BOAT SQUAD DISPATCHED: 2 NDRF zodiac inflatables deployed to Rivergate Underpass.", "info");
      });
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `flood-toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
}

// Global hook
document.addEventListener('DOMContentLoaded', () => {
  window.FloodRouteApp = new FloodRouteApplication();
});
