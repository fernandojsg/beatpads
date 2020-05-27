import { System, Not } from "ecsy";
import * as THREE from "three";
import { levels } from "../levels.js";
import {
  FFTAnalizable,
  FFTUpdatable,
  FFTVisualizable,
  Level,
  Active,
  Object3D,
  GameState,
  Moving,
  Lane,
  Pad
} from "../Components/components";

export class AudioGeneratorSystem extends System {
  init() {
    this.source = null;
    this.analyser = null;
    this.visualAnalyser = null;
    this.prevAvg = 0;
    this.deltaAccum = 0;
    this.level = null;
    this.angleY = 0;
    this.playing = false;
    this.data = null;
    this.fft = null;
    this.laneAvailable = null;
  }

  execute(delta) {
    this.queries.levels.added.forEach(entity => {
      this.level = levels[entity.getComponent(Level).value];
      this.angleY = Math.PI / (this.level.sizeX * 2) / 2;
      this.laneAvailable = new Array(this.level.sizeX)
        .fill(true)
        .map(() => new Array(this.level.sizeY).fill(true));
    });

    this.queries.ffts.added.forEach(entity => {
      this.fft = entity.getMutableComponent(FFTAnalizable);
    });
    this.queries.ffts.removed.forEach(() => {
      this.analyser = null;
    });

    this.queries.gameState.changed.forEach(entity => {
      let gameState = entity.getComponent(GameState);
      if (!this.playing && gameState.playing && this.fft) {
        this.playing = true;

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
        this.analyser.fftSize = this.fft.value;
        this.visualAnalyser = audioCtx.createAnalyser();
        this.visualAnalyser.fftSize = this.fft.value;
        this.data = new Uint8Array(this.analyser.frequencyBinCount);
        this.visualData = new Uint8Array(this.analyser.frequencyBinCount);
        this.source.loop = true;
        this.source.connect(this.analyser);
        this.source
          .connect(delay)
          .connect(this.visualAnalyser)
          .connect(audioCtx.destination);
        this.source.mediaElement.play();
      } else if (!gameState.playing) {
        this.playing = false;
        this.source.mediaElement.pause();
      }
    });

    if (this.playing) {
      this.processPass(delta);
      this.updateVisualiser(delta);
    }

    this.queries.availableLanes.added.forEach(entity => {
      var lane = entity.getComponent(Lane);
      this.laneAvailable[lane.x][lane.y] = true;
    });
    // Not working
    this.queries.unavailableLanes.added.forEach(entity => {
      var lane = entity.getComponent(Lane);
      this.laneAvailable[lane.x][lane.y] = false;
    });
  }

  findAvailableLane() {
    var randX = 0;
    var randY = 0;
    if (this.laneAvailable.some(row => row.includes(true))) {
      let found = false;
      while (!found) {
        randX = Math.round(Math.random() * (this.level.sizeX - 1));
        randY = Math.round(Math.random() * (this.level.sizeY - 1));
        if (this.laneAvailable[randX][randY]) {
          found = true;
        }
      }
    }

    return new THREE.Vector2(randX, randY);
  }

  // Process the FFT data and starts the pads animation.
  // An inactive Pad from the pool is used, we should never hit the pool bottom?
  processPass(delta) {
    this.analyser.getByteFrequencyData(this.data);
    const sum = this.data.reduce((a, b) => a + b, 0);
    const avg = sum / this.data.length || 0;
    if (this.prevAvg > avg && avg > this.level.avgDb) {
      if (this.deltaAccum > 1 / this.level.speed) {
        this.deltaAccum = 0;
        console.log(
          "Pads pool size: " + this.queries.availablePads.results.length
        );
        var entity = this.queries.availablePads.results[0];
        console.log(
          "Available lanes pool size: " + this.queries.availableLanes.results.length
        );
        var laneEntity = this.queries.availableLanes.results[0];
        if (!entity || !laneEntity) {
          return;
        }

        entity.addComponent(Active);
        laneEntity.addComponent(Active);

        var laneObject = laneEntity.getMutableComponent(Object3D);
        // laneObject.value.visible = true;

        var object = entity.getMutableComponent(Object3D);
        object.value.visible = true;

        var lanePos = this.findAvailableLane();

        var lane = laneEntity.getMutableComponent(Lane);
        lane.x = lanePos.x;
        lane.y = lanePos.y;

        const hue = Math.random();
        const color = new THREE.Color();
        color.setHSL(hue, 1.0, 0.5);
        object.value.material.color.set(color);
        object.value.material.emissive.set(color);
        laneObject.value.material.color.set(color);

        const posY = 1 + lanePos.y * this.level.padSize * 2;
        const posZ = -this.level.speed;
        const rotY =
          this.angleY * (this.level.sizeX / 2) -
          (lanePos.x + 0.5) * this.angleY;

        object.value.position.set(0, 0, 2);
        object.value.rotation.set(0, 0, 0);
        object.value.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotY);
        object.value.translateY(posY);
        object.value.translateZ(posZ);
        entity.addComponent(Moving, { value: new THREE.Vector3(0, 0, 0) });

        laneObject.value.position.set(0, 0, 2);
        laneObject.value.rotation.set(0, 0, 0);
        laneObject.value.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotY);
        laneObject.value.translateY(this.level.padSize / 2);
        laneObject.value.translateZ(posZ);
        laneObject.value.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

        var pad = entity.getMutableComponent(Pad);
        pad.lane = laneEntity;
      }
      this.deltaAccum += delta;
    }
    this.prevAvg = avg;
  }

  updateVisualiser(delta) {
    this.visualAnalyser.getByteFrequencyData(this.data);
    this.queries.visualizer.results.forEach(entity => {
      let visualizer = entity.getComponent(FFTVisualizable);
      let object = entity.getComponent(Object3D);
      const context = visualizer.context;
      const width = visualizer.width;
      const height = visualizer.height;
      context.clearRect(0, 0, width, height);
      const barWidth = width / this.data.length;
      for (let i = 0; i < this.data.length; i++) {
        const barHeight = (this.data[i] / 255) * height;
        const hue = Math.round((i / this.data.length) * 360);
        context.globalAlpha = 1;
        context.fillStyle = `hsl(${hue}, 100%, 50%)`;
        context.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
      }
      object.value.material.map.needsUpdate = true;
    });
  }
}

AudioGeneratorSystem.queries = {
  ffts: {
    components: [FFTAnalizable],
    listen: {
      added: true,
      removed: true,
      changed: true
    }
  },
  availablePads: {
    components: [FFTUpdatable, Not(Moving), Not(Active)]
  },
  availableLanes: {
    components: [Lane, Not(Active)],
    listen: {
      added: true
    }
  },
  unavailableLanes: {
    components: [Lane, Active],
    listen: {
      added: true
    }
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
  },
  visualizer: {
    components: [FFTVisualizable],
    listen: {
      added: true,
      removed: true,
      changed: true
    }
  },
};
