export class PresetManager {
  constructor() {
    this.customPresets = this.loadCustomPresets();
  }

  loadCustomPresets() {
    const stored = localStorage.getItem('ambientMixerPresets');
    return stored ? JSON.parse(stored) : {};
  }

  // load custom preset by ID
  loadPreset(presetId) {
    return this.customPresets[presetId] || null;
  }

  //Save custom presets to localStorage
  saveCustompresets() {
    localStorage.setItem(
      'ambientMixerPresets',
      JSON.stringify(this.customPresets)
    );
  }
  //save current mix as preset
  savePreset(name, soundStates) {
    const presetId = `custom_${Date.now()}`;

    //create new preset object
    const preset = {
      name,
      sounds: {},
    };

    for (const [soudId, volume] of Object.entries(soundStates)) {
      if (volume > 0) {
        preset.sounds[soudId] = volume;
      }
    }

    this.customPresets[presetId] = preset;
    this.saveCustompresets();
    return presetId;
  }
  // check if preset name already exists
  presetNameExists(name) {
    return Object.values(this.customPresets).some(
      (preset) => preset.name === name
    );
  }
  // Delete a custom preset
  deletePreset(presetId) {
    if (this.customPresets[presetId]) {
      delete this.customPresets[presetId];
      this.saveCustompresets();
      return true;
    }
    return false;
  }
}
