import { System, Not } from "ecsy";
import * as THREE from "three";
import { levels } from "../levels.js";
import {
  FTTAnalizable,
  FTTUpdatable,
  Level,
  Active,
  Object3D,
  GameState,
  Moving
} from "../Components/components";

export class AudioGeneratorSystem extends System {
  init() {
    this.source = null;
    this.analyser = null;
    this.prevAvg = 0;
    this.deltaAccum = 0;
    this.level = null;
    this.angleY = 0;
    this.gameState = null;
    this.data = null;
  }

  execute(delta) {
    this.queries.levels.added.forEach(entity => {
      this.level = levels[entity.getComponent(Level).value];
      this.angleY = Math.PI / (this.level.sizeX * 2) / 2;
    });

    this.queries.ftts.added.forEach(entity => {
      const soundComp = entity.getMutableComponent(FTTAnalizable);

      var AudioContext = window.AudioContext || window.webkitAudioContext;
      var audioCtx = new AudioContext();

      var mediaElement = new Audio(this.level.song);
      mediaElement.loop = true;
      mediaElement.listener = this.listener;

      var delay = new DelayNode(audioCtx, {
        delayTime: 1,
        maxDelayTime: 1
      });

      this.source = audioCtx.createMediaElementSource(mediaElement);
      this.analyser = audioCtx.createAnalyser();
      this.analyser.fftSize = soundComp.value;
      this.data = new Uint8Array(this.analyser.frequencyBinCount);
      this.source.loop = true;
      this.source.connect(this.analyser);
      this.source.connect(delay).connect(audioCtx.destination);
    });
    this.queries.ftts.removed.forEach(() => {
      this.analyser = null;
    });

    this.queries.gameState.changed.forEach(entity => {
      this.gameState = entity.getComponent(GameState);
      if (this.gameState.playing) {
        this.source.mediaElement.play();
      } else {
        this.source.mediaElement.pause();
      }
    });

    if (this.gameState && this.gameState.playing) {
      this.analyser.getByteFrequencyData(this.data);
      this.processPass(delta, this.data);
    }
  }

  // Process the FFT data and starts the pads animation.
  // An inactive Pad from the pool is used, we should never hit the pool bottom?
  processPass(delta, data) {
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = sum / data.length || 0;
    if (this.prevAvg > avg && avg > this.level.avgDb) {
      if (this.deltaAccum > 1 / this.level.speed) {
        this.deltaAccum = 0;
        console.log(
          "this.queries.availablePads.results: " +
            this.queries.availablePads.results.length
        );
        var entity = this.queries.availablePads.results[0];
        if (!entity) {
          return;
        }

        entity.addComponent(Active);

        var object = entity.getMutableComponent(Object3D);
        object.value.visible = true;

        var randX = Math.round(Math.random() * this.level.sizeX - 1);
        var randY = Math.round(Math.random() * this.level.sizeY - 1);

        const hue = (randX * randY) / (this.level.sizeX * this.level.sizeY);
        const color = new THREE.Color();
        color.setHSL(hue, 1.0, 0.5);
        object.value.material.color.set(color);

        object.value.position.set(0, 0, 2);
        object.value.rotation.set(0, 0, 0);
        object.value.rotateOnAxis(
          new THREE.Vector3(0, 1, 0),
          this.angleY * (this.level.sizeX / 2) - (randX + 1) * this.angleY
        );
        object.value.translateY(1 + randY * this.level.padSize * 1.5);
        object.value.translateZ(-this.level.speed);
        entity.addComponent(Moving, { value: new THREE.Vector3(0, 0, 0) });
      }
      this.deltaAccum += delta;
    }
    this.prevAvg = avg;
  }
}

AudioGeneratorSystem.queries = {
  ftts: {
    components: [FTTAnalizable],
    listen: {
      added: true,
      removed: true,
      changed: true
    }
  },
  availablePads: {
    components: [FTTUpdatable, Not(Moving), Not(Active)]
  },
  levels: {
    components: [Level],
    listen: {
      added: true
    }
  },
  gameState: {
    components: [GameState],
    listen: {
      changed: true
    }
  }
};
