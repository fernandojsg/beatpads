import { System } from "ecsy";
import * as THREE from "three";
import { Text, Position } from "ecsy-three";
import {
  Level,
  Target,
  Play,
  Sound,
  Transform,
  GLTFLoader,
  GameState,
  BallGenerator,
  Draggable,
  Active,
  Parent,
  Animation,
  LevelItem,
  Element,
  FTTAnalizable,
  FTTUpdatable
} from "../Components/components.js";
import { levels } from "../levels.js";
import * as Materials from "../materials.js";
import { Vector3 } from "three";

const urlParams = new URLSearchParams(window.location.search);
var editMode = urlParams.has("edit");
var smallCylinder;

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

    let levelLabel = this.world.entityManager.getEntityByName("level");
    if (levelLabel) {
      levelLabel.getMutableComponent(Text).text = levelId;
    }

    let levelGroup = this.world.entityManager.getEntityByName("levelGroup");

    this.clearCurrentLevel();
    var level = levels[levelId];

    // Generators
    let worldSingleton = this.world.entityManager.getEntityByName("singleton");

    const SIZE = 5;
    const ANGLE = Math.PI / 10;
    var index = 0;
    for (var x = 0; x < SIZE; x++) {
      for (var y = 0; y < SIZE; y++) {
        var geometry = new THREE.PlaneGeometry(1.5, 1.5, 1);
        const color = new THREE.Color();
        const h = index / (SIZE * SIZE);
        color.setHSL(h, 1.0, 0.5);
        var material = new THREE.MeshBasicMaterial({
          color: color,
          side: THREE.DoubleSide
        });
        var plane = new THREE.Mesh(geometry, material);
        plane.rotateOnAxis(new THREE.Vector3(0, 1, 0), 2 * ANGLE - x * ANGLE);
        plane.translateY(1 + y * 2);
        plane.translateZ(-10);
        plane.visible = false;
        const pad = this.world.createEntity().addComponent(FTTUpdatable, {
          mesh: plane,
          index: index,
          initialPos: plane.position.clone()
        });
        index++;
      }
    }

    const METAL = 0;
    const RUBBER = 1;
    const WOOD = 2;
    const STATIC = 3;

    let radius = 10;

    let N = 100;
    for (var i = 0; i < N; i++) {
      let w = 2;
      let h = 2;
      let x = w / 2 - Math.random() * w;
      let y = h / 2 - Math.random() * h + 2;

      let element = {
        type: 3, //Math.floor(Math.random() * 4),
        position: new THREE.Vector3(x, y, -radius - Math.random() * 10 - i),
        rotation: new THREE.Vector3(0, 0, 0)
      };

      this.world
        .createEntity()
        .addComponent(Element, {
          type: element.type
        })
        .addComponent(Transform, {
          position: element.position,
          rotation: element.rotation
        })
        .addComponent(LevelItem)
        .addComponent(Parent, { value: levelGroup });
    }
    // Boxes (draggable and fixed)

    /*
    level.generators.forEach(g => {
      let linearVelocity = new THREE.Vector3()
        .copy(g.linearVelocity)
        .normalize();

      // Ball generator
      let ballGenerator = this.world
        .createEntity()
        .addComponent(BallGenerator, {
          position: g.position,
          linearVelocity: g.linearVelocity
        })
        .addComponent(LevelItem)
        .addComponent(GLTFLoader, {
          url: "assets/models/cannon.glb",
          onLoaded: (model, gltf) => {
            //model.scale.multiplyScalar(-1);
            model.lookAt(linearVelocity);
            model.getObjectByName(
              "cannon"
            ).material = new THREE.MeshPhongMaterial({
              map: Materials.textures["cannon.jpg"],
              envMap: Materials.environmentMap,
              reflectivity: 0.2,
              specularMap: Materials.textures["cannon_spec.jpg"],
              shininess: 50,
              specular: new THREE.Color(0x333333)
            });

            var yellowMat = new THREE.MeshBasicMaterial({ color: 0xe7c223 });

            model.getObjectByName("explosion").material = yellowMat;
            model.getObjectByName("sparks").material = yellowMat;

            let mixer = (model.userData.mixer = new THREE.AnimationMixer(
              model
            ));
            const clip = THREE.AnimationClip.findByName(
              gltf.animations,
              "cannonAction"
            );
            const action = mixer.clipAction(clip, model);
            //action.loop = THREE.LoopOnce;
            model.userData.animationClip = action;
          }
        })
        .addComponent(Animation, { duration: 2.35 })
        .addComponent(Sound, { url: "assets/sounds/cannon.ogg" })
        .addComponent(Position, {
          value: new THREE.Vector3().copy(g.position)
        })
        .addComponent(LevelItem)
        .addComponent(Parent, { value: levelGroup });

      if (editMode) {
        ballGenerator.addComponent(Draggable);
      }

      if (worldSingleton.getComponent(GameState).playing) {
        // ballGenerator.addComponent(Active);
        setTimeout(() => {
          ballGenerator.addComponent(Play);

          setTimeout(() => {
            ballGenerator.addComponent(Active);
          }, 1900);
        }, 2000);
      }
    });

    // Targets
    level.targets.forEach(t => {
      let target = this.world
        .createEntity()
        .addComponent(Target)
        .addComponent(GLTFLoader, {
          url: "assets/models/target.glb",
          onLoaded: model => {
            model.children[0].material = new THREE.MeshPhongMaterial({
              map: Materials.textures["target.png"],
              envMap: Materials.environmentMap,
              reflectivity: 0.2
            });
          }
        })
        .addComponent(Transform, {
          position: t.position,
          rotation: t.rotation
        })
        .addComponent(LevelItem)
        .addComponent(Parent, { value: levelGroup })
        .addComponent(Sound, { url: "assets/sounds/target.ogg" });

      if (editMode) {
        target.addComponent(Draggable);
      }
    });

    // Boxes (draggable and fixed)
    level.elements.forEach(element => {
      this.world
        .createEntity()
        .addComponent(Element, { type: element.type })
        .addComponent(Transform, {
          position: element.position,
          rotation: element.rotation
        })
        .addComponent(LevelItem)
        .addComponent(Parent, { value: levelGroup });
    });
    */
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
