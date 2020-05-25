import { System } from "ecsy";
import { Sounds } from "../Components/components.js";
import * as THREE from "three";
import PositionalAudioPolyphonic from "../lib/PositionalAudioPolyphonic.js";

const audioLoader = new THREE.AudioLoader();

/**
 * Handle positional audio loaders for `Sounds` component
 */
export class SoundsSystem extends System {
  init() {
    this.listener = new THREE.AudioListener();
  }
  execute() {
    this.queries.sounds.added.forEach(entity => {
      const component = entity.getMutableComponent(Sounds);

      Object.keys(component.mappings).forEach(name => {
        let data = component.mappings[name];
        const sound = new PositionalAudioPolyphonic(this.listener, 10);
        audioLoader.load(data.url, buffer => {
          sound.setBuffer(buffer);
        });
        if (data.volume) {
          sound.setVolume(data.volume);
        }
        component.mappings[name].soundBuffer = sound;
      });
    });
  }
}

SoundsSystem.queries = {
  sounds: {
    components: [Sounds],
    listen: {
      added: true,
      removed: true,
      changed: true // [Sound]
    }
  }
};
