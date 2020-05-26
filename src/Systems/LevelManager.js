import { System } from "ecsy";
import * as THREE from "three";
import { Text, Position, Object3D } from "ecsy-three";
import {
  Level,
  Transform,
  GLTFLoader,
  GameState,
  Active,
  Parent,
  Animation,
  LevelItem,
  Element,
  FFTAnalizable,
  FFTUpdatable,
  FFTVisualizable,
  Pad,
  Mesh,
  Lane
} from "../Components/components.js";
import { levels } from "../levels.js";
import * as Materials from "../materials.js";

/**
 * This system initialize each level and transition between one to another
 * It creates the elements, load the songs and prepare the pads
 */
export class LevelManager extends System {
  execute() {
    this.queries.levels.added.forEach(entity => {
      this.initializeLevel(entity.getComponent(Level).value);
    });

    this.queries.levels.changed.forEach(entity => {
      this.initializeLevel(entity.getComponent(Level).value);
    });
  }

  clearCurrentLevel() {
    var items = this.queries.levelItems.results;
    for (var i = items.length - 1; i >= 0; i--) {
      items[i].remove();
    }
  }

  initializeLevel(levelId) {
    if (levelId > levels.length) {
      levelId = 0;
    }

    let level = levels[levelId];

    let levelLabel = this.world.entityManager.getEntityByName("level");
    if (levelLabel) {
      levelLabel.getMutableComponent(Text).text = levelId;
    }

    let levelGroup = this.world.entityManager.getEntityByName("levelGroup");

    this.clearCurrentLevel();

    this.initializeObjectPools(level, levelGroup);

    // Create the FFT analizable data
    // @todo remove this, can be replace by a global setting
    this.world
      .createEntity("AudioGeneratorSystem")
      .addComponent(FFTAnalizable, {
        value: 256
      });

    this.initializeVisualizer();
  }

  initializeObjectPools(level, parent) {
    // Create the pads pool
    let poolSize = level.sizeX * level.sizeY;
    for (var i = 0; i < poolSize; i++) {
      this.world
        .createEntity()
        .addComponent(Pad)
        .addComponent(FFTUpdatable)
        .addComponent(Element, {
          type: 3
        })
        .addComponent(LevelItem)
        .addComponent(Parent, { value: parent });

      // Create the lanes pool
      var geometry = new THREE.PlaneGeometry(
        level.padSize,
        level.padSize * 10,
        1
      );
      let texture = Materials.textures["arrow.png"];
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 10);
      var material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: texture,
        fog: false,
        transparent: true,
        alphaTest: 0.5
      });
      var mesh = new THREE.Mesh(geometry, material);
      this.world
        .createEntity()
        .addComponent(Lane)
        .addComponent(Object3D, { value: mesh })
        .addComponent(LevelItem)
        .addComponent(Parent, { value: parent });
    }
  }

  // Create a Frequency visualizer
  initializeVisualizer() {
    let radius = 10;
    let height = 7;
    var geometry = new THREE.CylinderBufferGeometry(
      radius,
      radius,
      height,
      30,
      20,
      true,
      0,
      Math.PI
    );
    var canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    var context = canvas.getContext("2d");
    let canvasTexture = new THREE.CanvasTexture(canvas);
    var material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map: canvasTexture,
      fog: false,
      transparent: true
    });
    var mesh = new THREE.Mesh(geometry, material);
    this.world
      .createEntity()
      .addComponent(FFTVisualizable, {
        context: context,
        width: canvas.width,
        height: canvas.height
      })
      .addComponent(Object3D, { value: mesh })
      .addComponent(Transform, {
        position: { x: 0, y: height / 2, z: 0 },
        rotation: { x: 0, y: Math.PI, z: 0 }
      })
      .addComponent(Parent, { value: window.entityScene });
    let mesh2 = mesh.clone();
    mesh2.scale.x = -1;
    this.world
      .createEntity()
      .addComponent(FFTVisualizable, {
        context: context,
        width: canvas.width,
        height: canvas.height
      })
      .addComponent(Object3D, { value: mesh2 })
      .addComponent(Transform, {
        position: { x: 0, y: height / 2, z: 0 },
        rotation: { x: 0, y: Math.PI, z: 0 }
      })
      .addComponent(Parent, { value: window.entityScene });
  }
}

LevelManager.queries = {
  /* @todo singleton */
  levels: {
    components: [Level],
    listen: {
      added: true,
      changed: true
    }
  },
  levelItems: {
    components: [LevelItem]
  }
};
