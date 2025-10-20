import { PresetManager } from './presetManager.js';
import { sounds, defaultPresets } from './soundData.js';
import { SoundManager } from './soundManager.js';
import { UI } from './ui.js';
import { Timer } from './timer.js';

class AmbientMixer {
  //Initialize dependencies nad default state

  constructor() {
    this.soundManager = new SoundManager();
    this.ui = new UI();
    this.presentManager = new PresetManager();
    this.timer = new Timer(
      () => this.onTimerComplete(),
      (minutes, seconds) => this.ui.updateTimerDisplay(minutes, seconds)
    );
    this.currentSoundState = {};
    this.masterVolume = 100;
    this.isInilized = false;
  }

  init() {
    try {
      //Initialize UI
      this.ui.init();

      //render souncard using our sound data

      this.ui.renderSoundCards(sounds);
      this.setEventListners();
      //Load custom presets in UI
      this.loadCustomPresetButtonUI();
      //load all sound files
      this.loadAllSounds();

      // initialize the sound states after loading sound
      sounds.forEach((sound) => {
        this.currentSoundState[sound.id] = 0;
      });

      this.isInilized = true;
    } catch (error) {
      console.error('Failed to initialize app', error);
    }
  }

  //setup all event listners
  setEventListners() {
    //hanlde all clicks with event deligation.
    document.addEventListener('click', async (e) => {
      //check if a play button was clicked.
      if (e.target.closest('.play-btn')) {
        const soundId = e.target.closest('.play-btn').dataset.sound;
        await this.toggleSound(soundId);
      }
      // Check if delete button is clicked
      if (e.target.closest('.delete-preset')) {
        e.stopPropagation();
        const presetId = e.target.closest('.delete-preset').dataset.preset;

        this.deleteCustomPreset(presetId);

        return;
      }
      //check if a preset button was clicked.
      if (e.target.closest('.preset-btn')) {
        const presetKey = e.target.closest('.preset-btn').dataset.preset;
        this.loadPreset(presetKey);
      }
      if (e.target.closest('.custom-preset-btn')) {
        const presetKey = e.target.closest('.custom-preset-btn').dataset.preset;
        this.loadPreset(presetKey, true);
      }
    });

    //Handle volume slider changes
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('volume-slider')) {
        const soundId = e.target.dataset.sound;
        const volume = parseInt(e.target.value);
        this.setSoundVolume(soundId, volume);
        // console.log(soundId, volume);
      }
    });

    //Handle Master Volume slider
    const masterVolumeSlider = document.getElementById('masterVolume');
    if (masterVolumeSlider) {
      masterVolumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        this.setMasterVolume(volume);
      });
    }
    //handle master play/pause button click
    if (this.ui.playPauseButton) {
      this.ui.playPauseButton.addEventListener('click', async () => {
        await this.toggleAllSounds();
      });
    }
    //handle reset button click
    if (this.ui.resetButton) {
      this.ui.resetButton.addEventListener('click', () => {
        this.resetAll();
      });
    }
    // Save preset buttton
    const saveButton = document.getElementById('savePreset');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.showSavePresetModal();
      });
    }

    // Confirm save preset buttton
    const confirmSaveButton = document.getElementById('confirmSave');
    if (confirmSaveButton) {
      confirmSaveButton.addEventListener('click', () => {
        this.saveCurrentPreset();
      });
    }
    // cancel save button
    const cancelSaveButton = document.getElementById('cancelSave');
    if (cancelSaveButton) {
      cancelSaveButton.addEventListener('click', () => {
        this.ui.hideModal();
      });
    }
    // Close modal if backdrop is clicked

    if (this.ui.modal) {
      this.ui.modal.addEventListener('click', (e) => {
        if (e.target === this.ui.modal) {
          this.ui.hideModal();
        }
      });
    }

    // Timer Select
    const timerSelect = document.getElementById('timerSelect');
    if (timerSelect) {
      timerSelect.addEventListener('change', (e) => {
        const minutes = parseInt(e.target.value);
        if (minutes > 0) {
          this.timer.start(minutes);
          console.log(`Timer started for ${minutes} minuted`);
        } else {
          this.timer.stop();
        }
      });
    }

    // Theme toggle
    if (this.ui.themeToggle) {
      this.ui.themeToggle.addEventListener('click', () => {
        this.ui.toggleTheme();
      });
    }
  }

  // Load all sounds
  loadAllSounds() {
    sounds.forEach((sound) => {
      const audioUrl = `audio/${sound.file}`;
      const success = this.soundManager.loadSound(sound.id, audioUrl);
      if (!success) {
        console.warn(`Could not load sound: ${sound.name} from ${audioUrl}`);
      }
    });
  }
  //toggle individual sound
  async toggleSound(soundId) {
    const audio = this.soundManager.audioElement.get(soundId);
    if (!audio) {
      console.error(`Sound ${soundId} not found`);
      return false;
    }
    if (audio.paused) {
      //Get the current slider value
      const card = document.querySelector(`[data-sound="${soundId}"]`);
      const slider = card.querySelector('.volume-slider');
      let volume = parseInt(slider.value);
      //If slider is at 0 then set it to 70
      if (volume === 0) {
        volume = 50;
        slider.value = volume;
        this.ui.updateVolumeDisplay(soundId, volume);
      }
      //set current sound state
      this.currentSoundState[soundId] = volume;
      //Set the volume to off
      this.soundManager.setVolume(soundId, volume);
      await this.soundManager.playSound(soundId);
      // Update play button
      this.currentSoundState[soundId] = 0;
      this.ui.updateSoundPlayButton(soundId, true);
    } else {
      this.soundManager.pauseSound(soundId);
      this.ui.updateSoundPlayButton(soundId, false);

      this.currentSoundState[soundId] = 0;
    }
  }

  //toggle all sounds
  async toggleAllSounds() {
    if (this.soundManager.isPlaying) {
      this.soundManager.pauseAll();
      this.ui.updateMainPlayPauseButton(false);
      sounds.forEach((sound) => {
        this.ui.updateSoundPlayButton(sound.id, false);
      });
    } else {
      // toggle all sounds on
      for (const [soundId, audio] of this.soundManager.audioElement) {
        const card = document.querySelector(`[data-sound="${soundId}"]`);
        const slider = card?.querySelector('.volume-slider');
        if (slider) {
          let volume = parseInt(slider.value);

          if (volume === 0) {
            volume = 70;
            slider.value = 50;
            this.ui.updateVolumeDisplay(soundId, 50);
          }
          this.currentSoundState[soundId] = volume;

          const effectiveVolume = (volume * this.masterVolume) / 100;
          audio.volume = effectiveVolume / 100;
          this.ui.updateSoundPlayButton(soundId, true);
        }
      }
      // Play all sounds
      this.soundManager.playAll();
      this.ui.updateMainPlayPauseButton(true);
      this.updateMainPlayButtonState();
    }

    //update main play button state
    this.updateMainPlayButtonState();
  }

  //Set Sound Volume
  setSoundVolume(soundId, volume) {
    //Set sound volume in state
    this.currentSoundState[soundId] = volume;
    //calculate effective volume by master volume
    const effectiveVolume = (volume * this.masterVolume) / 100;
    //update the sound volume with the scaled volume
    const audio = this.soundManager.audioElement.get(soundId);

    if (audio) {
      audio.volume = effectiveVolume / 100;
    }

    //update visual display
    this.ui.updateVolumeDisplay(soundId, volume);
    //Sync sounds
    this.updateMainPlayButtonState();
  }
  //set Master Volume
  setMasterVolume(volume) {
    this.masterVolume = volume;

    //update the display
    const masterVolumeValue = document.getElementById('masterVolumeValue');
    if (masterVolumeValue) {
      masterVolumeValue.textContent = `${volume}%`;
    }
    //Apply master volume to all currently playing sounds
    this.applyMaterVolumeAll();
  }
  //Apply master volume to all sounds
  applyMaterVolumeAll() {
    for (const [soundId, audio] of this.soundManager.audioElement) {
      if (!audio.paused) {
        const card = document.querySelector(`[data-sound="${soundId}"]`);
        const slider = card?.querySelector('.volume-slider');
        if (slider) {
          const individualVolume = parseInt(slider.value);
          //Calculate effective volume (individial * master /100)

          const effectiveVolume = (individualVolume * this.masterVolume) / 100;
          //Apply to the actual audio Element
          audio.volume = effectiveVolume / 100;
        }
      }
    }
  }
  //Update main play button based on individual sounds state
  updateMainPlayButtonState() {
    const anySoundPlaying = false;
    for (const [soundId, audio] of this.soundManager.audioElement) {
      if (!audio.paused) {
        anySoundPlaying = true;
        break;
      }
    }
    //update the main play button based on the state of any sound playing
    this.soundManager.isPlaying = anySoundPlaying;
    this.ui.updateMainPlayPauseButton(anySoundPlaying);
  }

  resetAll() {
    this.soundManager.stopAll();
    //reset the master volume to 100%
    this.masterVolume = 100;

    // Reset timer
    this.timer.stop();
    if (this.ui.timerSelect) {
      this.ui.timerSelect.value = '0';
    }

    // Reset active preset
    this.ui.setActivePreset(null);

    //reset all sound states to 0
    sounds.forEach((sound) => {
      this.currentSoundState[sound.id] = 0;
    });

    //reset UI
    this.ui.resetUI();
  }
  //  Load a preset configuration
  loadPreset(presetKey, custom = false) {
    let preset;
    if (custom) {
      preset = this.presentManager.loadPreset(presetKey);
    } else {
      preset = defaultPresets[presetKey];
    }

    if (!preset) {
      console.error(`Preset ${presetKey} not found`);
      return;
    }

    //First stop all sounds
    this.soundManager.stopAll();

    //Reset all volume to 0
    sounds.forEach((sound) => {
      this.currentSoundState[sound.id] = 0;
      this.ui.updateVolumeDisplay(sound.id, 0);
      this.ui.updateSoundPlayButton(sound.id, false);
    });
    //Apply the preset volumes

    for (const [soundId, volume] of Object.entries(preset.sounds)) {
      //set  volume in state
      this.currentSoundState[soundId] = volume;
      //set volume in UI
      this.ui.updateVolumeDisplay(soundId, volume);
      //Calculate effective volume by master volume
      const effectiveVolume = (volume * this.masterVolume) / 100;
      //Get the audio element and set the value
      const audio = this.soundManager.audioElement.get(soundId);
      if (audio) {
        audio.volume = effectiveVolume / 100;
        //Play the sound
        audio.play();
        this.ui.updateSoundPlayButton(soundId, true);
      }
    }
    //update main play button state
    this.soundManager.isPlaying = true;
    this.ui.updateMainPlayPauseButton(true);
    // Set Active preset
    if (presetKey) {
      this.ui.setActivePreset(presetKey);
    }
  }

  // show save presetModal
  showSavePresetModal() {
    // Check if any sound is active
    const hasActiveSounds = Object.values(this.currentSoundState).some(
      (v) => v > 0
    );

    if (!hasActiveSounds) {
      alert('No active sounds for preset');
      return;
    }

    this.ui.showModal();
  }
  // Save current preset
  saveCurrentPreset() {
    const nameInput = document.getElementById('presetName');
    const name = nameInput.value.trim();

    if (!name) {
      alert('Please enter a preset name');
      return;
    }
    if (this.presentManager.presetNameExists(name)) {
      alert(`A preset with the name ${name} already exists`);
      return;
    }

    const presetId = this.presentManager.savePreset(
      name,
      this.currentSoundState
    );
    // Add custom preset button to UI
    this.ui.adddCustomPreset(name, presetId);

    this.ui.hideModal();
    console.log(`Preset "${name}" saved successfully with ID: "${presetId}"`);
  }
  // Load custom preset button on UI
  loadCustomPresetButtonUI() {
    const customPresets = this.presentManager.customPresets;

    for (const [presetId, preset] of Object.entries(customPresets)) {
      this.ui.adddCustomPreset(preset.name, presetId);
    }
  }
  // Delete custom preset
  deleteCustomPreset(presetId) {
    if (this.presentManager.deletePreset(presetId)) {
      this.ui.removeCustompreset(presetId);
      console.log(`Preset ${presetId} deleted`);
    }
  }
  // Timer complete callback
  onTimerComplete() {
    // Stop all sounds
    this.soundManager.pauseAll();
    this.ui.updateMainPlayPauseButton(false);

    // update the individual play buttons
    sounds.forEach((sound) => {
      this.ui.updateSoundPlayButton(sound.id, false);
    });
    // reset the timer dropdown
    const timerSelect = document.getElementById('timerSelect');
    if (timerSelect) {
      timerSelect.value = '0';
    }
    // Clear and hide the timer display
    if (this.ui.timerDisplay) {
      this.ui.timerDisplay.textContent = '';
      this.ui.timerDisplay.classList.add('hidden');
    }
  }
}
// Initialize app when app the ready
document.addEventListener('DOMContentLoaded', function () {
  const app = new AmbientMixer();
  app.init();
});
