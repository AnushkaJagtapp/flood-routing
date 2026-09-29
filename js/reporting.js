// FloodRoute Citizen Ground-Truth & Authority Verification Engine
// Enables real-time crowdsourcing of road hazards, community confirmations,
// and municipal authority verification badges.

class IncidentReporting {
  constructor(districtData, onReportUpdateCallback) {
    this.data = districtData;
    this.onReportUpdate = onReportUpdateCallback;
    
    // Initial realistic incident feed
    this.reports = [
      {
        id: "rep-101",
        roadId: "R6",
        roadName: "Rivergate Subway / Railway Underpass",
        waterDepthCm: 85,
        waterDepthLabel: "Waist-deep (85 cm)",
        currentSpeed: "Swift torrent",
        hazardType: "Submerged Vehicle & Electrical Hazard",
        description: "Hatchback stalled halfway under bridge. Water rising rapidly. Live street light wire touching water at north exit.",
        reportedBy: "Resident (Suresh K.)",
        reporterType: "Resident",
        timeAgo: "4 mins ago",
        upvotes: 14,
        isVerified: true,
        verifiedBy: "Disaster Mgmt Authority (DDMA)",
        statusApplied: "BLOCKED",
        photoUrl: "submerged_underpass"
      },
      {
        id: "rep-102",
        roadId: "R11",
        roadName: "Riverfront South Promenade",
        waterDepthCm: 55,
        waterDepthLabel: "Knee-to-Waist (55 cm)",
        currentSpeed: "Violent river overflow",
        hazardType: "Riverbank Embankment Breach",
        description: "River has overtopped concrete embankment by half a meter. Strong current carrying tree branches. Completely impassable.",
        reportedBy: "Ward 12 Volunteer Group",
        reporterType: "Volunteer",
        timeAgo: "12 mins ago",
        upvotes: 21,
        isVerified: true,
        verifiedBy: "Traffic Police Command",
        statusApplied: "BLOCKED",
        photoUrl: "river_overflow"
      },
      {
        id: "rep-103",
        roadId: "R4",
        roadName: "Hospital Avenue",
        waterDepthCm: 12,
        waterDepthLabel: "Ankle-deep (12 cm)",
        currentSpeed: "Slow drainage runoff",
        hazardType: "Open stormwater grating",
        description: "Drain cover dislodged near Metro Pillar 42. Marked with a red flag. Central lane is clear and passable for ambulances.",
        reportedBy: "Ambulance Driver #04",
        reporterType: "First Responder",
        timeAgo: "22 mins ago",
        upvotes: 9,
        isVerified: true,
        verifiedBy: "Civil Hospital Ambulance Hub",
        statusApplied: "CAUTION",
        photoUrl: "caution_road"
      }
    ];
  }

  getReports() {
    return this.reports;
  }

  getReportsForRoad(roadId) {
    return this.reports.filter(r => r.roadId === roadId);
  }

  addReport(newReportData) {
    const report = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      roadId: newReportData.roadId,
      roadName: newReportData.roadName,
      waterDepthCm: parseInt(newReportData.waterDepthCm) || 20,
      waterDepthLabel: newReportData.waterDepthLabel || `${newReportData.waterDepthCm} cm`,
      currentSpeed: newReportData.currentSpeed || "Moderate",
      hazardType: newReportData.hazardType || "Water accumulation",
      description: newReportData.description,
      reportedBy: newReportData.reportedBy || "Citizen Reporter",
      reporterType: newReportData.reporterType || "Resident",
      timeAgo: "Just now",
      upvotes: 1,
      isVerified: newReportData.autoVerify || false,
      verifiedBy: newReportData.autoVerify ? "Disaster Mgmt Authority (DDMA)" : null,
      statusApplied: newReportData.suggestedStatus || "CAUTION",
      photoUrl: "user_upload"
    };

    this.reports.unshift(report);

    // If verified or high depth, update road segment immediately
    const road = this.data.roadSegments.find(r => r.id === report.roadId);
    if (road) {
      if (report.waterDepthCm > 35) {
        road.status = "BLOCKED";
        road.currentWaterDepthCm = Math.max(road.currentWaterDepthCm, report.waterDepthCm);
        road.hazard = `COMMUNITY ALERT: ${report.hazardType} (${report.waterDepthCm}cm) - ${report.description}`;
      } else if (report.waterDepthCm > 10) {
        if (road.status !== "BLOCKED") road.status = "CAUTION";
        road.currentWaterDepthCm = Math.max(road.currentWaterDepthCm, report.waterDepthCm);
      }
      road.verifiedBy = report.isVerified ? report.verifiedBy : "Pending Authority Review";
      road.verifiedTime = "Just now";
    }

    if (this.onReportUpdate) {
      this.onReportUpdate(report, this.reports);
    }

    return report;
  }

  upvoteReport(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (report) {
      report.upvotes += 1;
      // Auto-escalate if community consensus reaches 5+ upvotes
      if (report.upvotes >= 5 && !report.isVerified) {
        report.isVerified = true;
        report.verifiedBy = "Community Verified (5+ Residents Consensus)";
      }
      if (this.onReportUpdate) {
        this.onReportUpdate(report, this.reports);
      }
    }
  }

  verifyReportByAuthority(reportId, officialAuthorityName = "Disaster Mgmt Authority (DDMA)") {
    const report = this.reports.find(r => r.id === reportId);
    if (report) {
      report.isVerified = true;
      report.verifiedBy = officialAuthorityName;
      
      const road = this.data.roadSegments.find(r => r.id === report.roadId);
      if (road) {
        road.verifiedBy = officialAuthorityName;
        road.verifiedTime = "Just now";
      }

      if (this.onReportUpdate) {
        this.onReportUpdate(report, this.reports);
      }
    }
  }
}
