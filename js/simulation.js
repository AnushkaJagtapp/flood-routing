// FloodRoute Simulation Controller
// Manages the time-lapse progression of flood conditions across the 12-hour disaster cycle.

class FloodSimulation {
  constructor(districtData, onStageChangeCallback) {
    this.data = districtData;
    this.currentStageIndex = 2; // Default to peak/active flood (T+4h)
    this.onStageChange = onStageChangeCallback;
    this.isPlaying = false;
    this.timer = null;
    this.playbackSpeedMs = 4000; // 4 seconds per stage in auto-play
    
    // Apply initial stage state
    this.applyStage(this.currentStageIndex);
  }

  getCurrentStage() {
    return this.data.timelineStages[this.currentStageIndex];
  }

  setStage(index) {
    if (index < 0 || index >= this.data.timelineStages.length) return;
    this.currentStageIndex = index;
    this.applyStage(index);
    if (this.onStageChange) {
      this.onStageChange(this.getCurrentStage(), this.currentStageIndex);
    }
  }

  applyStage(index) {
    const stage = this.data.timelineStages[index];
    this.data.riverLevelCurrent = stage.riverLevel;

    // Update each road segment's current water depth and status
    this.data.roadSegments.forEach(road => {
      const stageState = stage.roadStates[road.id];
      if (stageState) {
        road.currentWaterDepthCm = stageState.depth;
        road.status = stageState.status;
      }
    });
  }

  nextStage() {
    let nextIdx = (this.currentStageIndex + 1);
    if (nextIdx >= this.data.timelineStages.length) {
      nextIdx = 0; // Loop or stop
    }
    this.setStage(nextIdx);
  }

  prevStage() {
    let prevIdx = (this.currentStageIndex - 1);
    if (prevIdx < 0) {
      prevIdx = this.data.timelineStages.length - 1;
    }
    this.setStage(prevIdx);
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.timer = setInterval(() => {
        if (this.currentStageIndex >= this.data.timelineStages.length - 1) {
          this.setStage(0);
        } else {
          this.nextStage();
        }
      }, this.playbackSpeedMs);
    } else {
      clearInterval(this.timer);
      this.timer = null;
    }
    return this.isPlaying;
  }

  stopPlay() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
