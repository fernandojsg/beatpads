/* global Ammo */
import * as THREE from "three";
import { World } from "ecsy";
import {
  GameState,
  Geometry,
  Sound,
  Level,
  Object3D,
  Parent,
  Floor,
  Scene,
  Position,
  Shape,
  GLTFLoader,
  Transform,
  Visible,
  WebGLRendererContext
} from "./Components/components.js";

//import WebXRPolyfill from "webxr-polyfill";
//const polyfill = new WebXRPolyfill();

// For debugging
import * as Components from "./Components/components.js";
window.Components = Components;
import * as Systems from "./Systems/systems.mjs";
window.Systems = Systems;
window.THREE = THREE;

import {
  AudioGeneratorSystem,
  CameraRigSystem,
  DissolveSystem,
  ElementSystem,
  GameStateSystem,
  LevelManager,
  CollisionSystem,
  RaycasterSystem,
  UISystem,
  SoundsSystem,
  GameplaySystem,
  LaneSystem
} from "./Systems/systems.mjs";

import {
  GeometrySystem,
  GLTFLoaderSystem,
  TextGeometrySystem,
  VRControllerSystem,
  VisibilitySystem,
  SDFTextSystem,
  AnimationSystem,
  SoundSystem,
  InputSystem,
  Text,
  initialize
} from "ecsy-three";
import { Vector3 } from "three";

var world;

const urlParams = new URLSearchParams(window.location.search);

function detectWebXR() {
  if ("xr" in navigator) {
    navigator.xr.isSessionSupported("immersive-vr").then(supported => {
      if (!supported)
        document.getElementById("no-webxr").classList.remove("hidden");
    });
  } else {
    document.getElementById("no-webxr").classList.remove("hidden");
  }
}

function initGame() {
  detectWebXR();

  world = new World();

  world
    .registerSystem(InputSystem)
    .registerSystem(LevelManager)
    .registerSystem(AnimationSystem)
    .registerSystem(RaycasterSystem)
    .registerSystem(UISystem)
    .registerSystem(DissolveSystem)
    .registerSystem(VRControllerSystem)
    .registerSystem(CameraRigSystem)
    .registerSystem(ElementSystem)
    .registerSystem(CollisionSystem)
    .registerSystem(GameStateSystem)
    .registerSystem(SoundSystem)
    .registerSystem(SoundsSystem)
    .registerSystem(VisibilitySystem)
    .registerSystem(SDFTextSystem)
    .registerSystem(TextGeometrySystem)
    .registerSystem(GameplaySystem)
    .registerSystem(GeometrySystem)
    .registerSystem(GLTFLoaderSystem)
    .registerSystem(LaneSystem)
    .registerSystem(AudioGeneratorSystem);

  let data = initialize(world, { vr: true });

  var scene = data.entities.scene.getComponent(Object3D).value;
  window.entityScene = data.entities.scene;

  let level = urlParams.has("level") ? parseInt(urlParams.get("level")) : 0;

  // Singleton entity
  world
    .createEntity("singleton")
    .addComponent(Scene, { value: data.entities.scene })
    .addComponent(GameState, {
      levelStartTime: performance.now(),
      gameStartTime: performance.now()
    })
    .addComponent(Level, { value: level });

  init(data);

  function init(data) {
    // scene.fog = new THREE.FogExp2(new THREE.Color(0x5ac5dc), 0.05);

    scene.add(new THREE.HemisphereLight(0xcccccc, 0x707070));

    var light = new THREE.DirectionalLight(0xaaaaaa);
    light.position.set(0.2, 1.7, -0.7);
    light.castShadow = true;
    light.shadow.camera.top = 1;
    light.shadow.camera.bottom = -1;
    light.shadow.camera.right = 10;
    light.shadow.camera.left = -10;
    light.shadow.mapSize.set(4096, 4096);
    scene.add(light);

    //scene.add( new THREE.CameraHelper( light.shadow.camera ) );

    window.world = world;

    createScene(data);

    document.body.addEventListener("click", () => {
      world.getSystem(GameStateSystem).playGame();
    });

    // let startButton = world
    //   .createEntity("startbutton")
    //   .addComponent(UI)
    //   .addComponent(GLTFLoader, {
    //     url: "assets/models/startbutton.glb",
    //     append: true,
    //     onLoaded: model => {
    //       model.children[0].material = Materials.UIMaterial;
    //       model.children[0].material.color.setRGB(0.7, 0.7, 0.7);
    //     }
    //   })
    //   .addComponent(Button, {
    //     text: "START",
    //     onClick: () => {
    //       //startButton.removeComponent(Button);
    //       mediaElement.play();

    //       world.getSystem(GameStateSystem).playGame();
    //       setTimeout(() => {
    //         startButton.addComponent(Visible, { value: false });
    //       }, 300);
    //       //this.world.entityManager.getEntityByName("singleton").getMutableComponent(GameState).playing = true;
    //     }
    //   })
    //   .addComponent(Parent, { value: data.entities.scene })
    //   .addComponent(Position, { value: new Vector3(0, 0.6, -1.5) })
    //   .addComponent(Sound, { url: "assets/sounds/click.ogg" })
    //   .addComponent(Visible, { value: !urlParams.has("autostart") });

    if (urlParams.has("autostart")) {
      world.getSystem(GameStateSystem).playGame();
    }

    // @todo This first one remove
    world.execute(0.016, 0);

    data.entities.renderer.getComponent(
      WebGLRendererContext
    ).value.outputEncoding = THREE.sRGBEncoding;
  }

  function createScene(data) {
    createFloor(data);

    let playingGroup = world
      .createEntity("playingGroup")
      .addComponent(Object3D, { value: new THREE.Group() })
      .addComponent(Parent, { value: data.entities.scene })
      .addComponent(Visible, { value: true });

    // Scene
    world
      .createEntity("levelGroup")
      .addComponent(Object3D, { value: new THREE.Group() })
      .addComponent(Parent, { value: playingGroup })
      .addComponent(Visible, { value: true });

    world
      .createEntity()
      .addComponent(GLTFLoader, {
        url: "assets/models/set1.glb",
        onLoaded: model => {
          const skyMaterial = model.getObjectByName("sky").material;
          skyMaterial.fog = false;
          model.getObjectByName("floor").receiveShadow = true;
          const floorMaterial = model.getObjectByName("floor").material;
          floorMaterial.fog = false;
        }
      })
      .addComponent(Parent, { value: data.entities.scene });

    // world
    //   .createEntity("help")
    //   .addComponent(GLTFLoader, {
    //     url: "assets/models/help.glb",
    //     onLoaded: model => {
    //       model.children[0].material.transparent = true;
    //       model.children[0].material.map.magFilter = THREE.LinearFilter;
    //       model.children[0].material.map.minFilter =
    //         THREE.LinearMipmapLinearFilter;
    //     }
    //   })
    //   .addComponent(Position, { value: new THREE.Vector3(0, 1.6, -2) })
    //   .addComponent(Parent, { value: data.entities.scene })
    //   .addComponent(Visible, { value: true });

    world
      .createEntity("stats")
      .addComponent(Text, getTextParameters("", "#000000", 0.5, "center"))
      .addComponent(Parent, { value: data.entities.scene })
      .addComponent(Position, { value: new Vector3(3, 5, -6) })
      .addComponent(Visible, { value: true });

    /*
    const panelLevel = world
      .createEntity("panelLevel")
      .addComponent(GLTFLoader, {
        url: "assets/models/panellevel.glb",
        onLoaded: model => {
          model.children[0].material = Materials.UIMaterial;
          model.children[0].renderOrder = 1;
          world
            .createEntity("levelLabel")
            .addComponent(
              Text,
              getTextParameters("Level", "#20b4d6", 0.12, "center")
            )
            .addComponent(ParentObject3D, { value: model.children[0] })
            .addComponent(Position, { value: new Vector3(0, 0.2, 0.01) });

          world
            .createEntity("level")
            .addComponent(
              Text,
              getTextParameters("1", "#90cdeb", 0.3, "center")
            )
            .addComponent(ParentObject3D, { value: model.children[0] })
            .addComponent(Position, { value: new Vector3(0, 0, 0.01) });

          //model.children[0].lookAt(data.entities.camera.getComponent(Object3D).value);
        }
      })
      .addComponent(Parent, { value: playingGroup })
      .addComponent(Position, { value: new Vector3(0, 3.2, -6) });

    const panelInfo = world
      .createEntity("panelInfo")
      .addComponent(GLTFLoader, {
        url: "assets/models/panelinfo.glb",
        onLoaded: model => {
          model.children[0].material = Materials.UIMaterial;
          model.children[0].children[0].material = Materials.UIMaterial;
          model.children[0].children[0].renderOrder = 1;
          model.children[0].renderOrder = 2;

          // panels
          let finishedPanel = model.children[0].children[0];
          world
            .createEntity("finished")
            .addComponent(
              Text,
              getTextParameters("Finished!", "#ffffff", 0.2, "center")
            )
            .addComponent(ParentObject3D, { value: finishedPanel })
            .addComponent(Position, { value: new Vector3(0, 0.1, -0.1) })
            .addComponent(Visible, { value: true });

          world
            .createEntity("numberBallsLabel")
            .addComponent(
              Text,
              getTextParameters("Balls", "#c0095d", 0.2, "center")
            )
            .addComponent(ParentObject3D, { value: model.children[0] })
            .addComponent(Position, { value: new Vector3(-0.4, 0.26, 0.01) });

          world
            .createEntity("numberBalls")
            .addComponent(
              Text,
              getTextParameters("0", "#f9258b", 0.2, "center")
            )
            .addComponent(ParentObject3D, { value: model.children[0] })
            .addComponent(Position, { value: new Vector3(-0.4, 0, 0.01) });

          world
            .createEntity("timeLabel")
            .addComponent(
              Text,
              getTextParameters("Time", "#836000", 0.2, "center")
            )
            .addComponent(ParentObject3D, { value: model.children[0] })
            .addComponent(Position, { value: new Vector3(0.4, 0.28, 0.01) });

          world
            .createEntity("totalTimeLabel")
            .addComponent(
              Text,
              getTextParameters("Total", "#836000", 0.095, "center")
            )
            .addComponent(ParentObject3D, { value: model.children[0] })
            .addComponent(Position, { value: new Vector3(0.16, -0.21, 0.01) });

          world
            .createEntity("timer")
            .addComponent(
              Text,
              getTextParameters("00:00", "#ebb808", 0.22, "center")
            )
            .addComponent(ParentObject3D, { value: model.children[0] })
            .addComponent(Position, { value: new Vector3(0.4, 0.04, 0.01) });

          world
            .createEntity("timerTotal")
            .addComponent(
              Text,
              getTextParameters("00:00", "#ebb808", 0.12, "left")
            )
            .addComponent(ParentObject3D, { value: model.children[0] })
            .addComponent(Position, { value: new Vector3(0.36, -0.13, 0.01) });

          //model.children[0].lookAt(data.entities.camera.getComponent(Object3D).value);
        }
      })
      .addComponent(Parent, { value: data.entities.scene })
      .addComponent(Animation, { duration: 2.35 })
      .addComponent(Position, { value: new Vector3(0, 2, -6) })
      .addComponent(Visible, { value: true });
      */
  }

  function createFloor(data) {
    world
      .createEntity()
      .addComponent(Geometry, {
        primitive: "box",
        width: 100,
        height: 0.1,
        depth: 100
      })
      .addComponent(Shape, {
        primitive: "box",
        width: 100,
        height: 0.1,
        depth: 100
      })
      .addComponent(Visible, { value: false })
      .addComponent(Transform, {
        position: { x: 0, y: -0.05, z: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      })
      .addComponent(Floor)
      .addComponent(Sound, { url: "assets/sounds/miss.ogg" })
      .addComponent(Parent, { value: data.entities.scene });
  }

  function getTextParameters(text, color, size, align) {
    return {
      color: color || "0xFFFFFF",
      fontSize: size || 0.5,
      anchor: align || "center",
      textAlign: align || "center",
      baseline: align || "center",
      font: "assets/fonts/WetinCaroWant.ttf",
      maxWidth: 10,
      lineHeight: 1.3,
      text: text || "LOREM IPSUM"
    };
  }
}

initGame();
