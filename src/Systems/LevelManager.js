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
  Element
} from "../Components/components.js";
import { levels } from "../levels.js";
import * as Materials from "../materials.js";

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

    analyser.getFrequencyData();
    let s = analyser.getAverageFrequency() / 256;
    smallCylinder.scale.x = s;
    smallCylinder.scale.y = s;
    //console.log(window.analyser.data);
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

    let radius = 9.9;
    let segments = 2;

    let angle = THREE.MathUtils.degToRad(level.angle);
    let height = level.height;
    var geometry = new THREE.CylinderBufferGeometry(
      radius,
      radius,
      height,
      4,
      4,
      true,
      0,
      angle
    );

    geometry.rotateY(Math.PI - angle / 2);

    var material = new THREE.MeshPhongMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
      flatShading: true,
      wireframe: true
    });
    var cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.y = height / 2 + level.top;
    window.scene.add(cylinder);
    smallCylinder = cylinder;

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
