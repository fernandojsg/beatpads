import * as THREE from "three";
import { TagComponent } from "ecsy";
import { Vector3 } from "three";

export {
  Active,
  Animation,
  Camera,
  CameraRig,
  Colliding,
  CollisionStart,
  CollisionStop,
  Draggable,
  Dragging,
  Environment,
  ControllerConnected,
  Geometry,
  GLTFLoader,
  GLTFModel,
  InputState,
  Material,
  Object3D,
  Parent,
  ParentObject3D,
  Play,
  Position,
  RenderPass,
  Scale,
  Scene,
  Shape,
  Sound,
  Stop,
  TextGeometry,
  Transform,
  Visible,
  VRController,
  WebGLRendererContext
} from "ecsy-three";

export class LevelItem {
  reset() {}
}

export class Level {
  constructor() {
    this.value = 0;
  }

  reset() {
    this.value = 0;
  }
}

export class Cleared extends TagComponent {}

export class Element {
  constructor() {}
  reset() {}
}

export class FTTAnalizable {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.url = null;
    this.size = 128;
    this.sliceSize = 64;
    this.minDb = 100;
  }
}

export class FTTUpdatable {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.mesh = null;
    this.index = 0;
    this.moving = false;
    this.initialPos = new Vector3(0, 0, 0);
  }
}

export class Dissolve {
  constructor() {
    this.value = 1;
    this.speed = 1;
  }

  reset() {
    this.value = 1;
    this.speed = 1;
  }
}

export class GameState {
  constructor() {
    this.reset();
  }
  reset() {
    this.life = 100;
    this.points = 0;
    this.failures = 0;
    this.combo = 1;

    this.playing = false;
    this.prevPlaying = false;
    this.levelFinished = false;

    this.levelStartTime = 0;
    this.gameStartTime = 0;
  }
}

export class UI extends TagComponent {}

export class Button {
  constructor() {}
  reset() {}
}

export class RaycastReceiver {
  constructor() {
    this.reset();
  }

  reset() {
    this.hovering = false;
    this.selecting = false;

    this.onHover = null;
    this.onEnter = null;
    this.onLeave = null;
    this.onSelectStart = null;
    this.onSelect = null;
    this.onSelectEnd = null;

    this.layerMask = 0;
  }
}
export class Raycaster {
  constructor() {
    this.reset();
  }

  reset() {
    this.enabled = true;
    this.currentEntity = null;

    this.layerMask = 0;
  }
}

export class Floor extends TagComponent {}

//-----------------

export class Pad {
  constructor() {}
}

export class Sounds {
  constructor() {
    this.reset();
  }

  reset() {
    this.mappings = {};
  }

  playSound(name) {
    if (this.mappings[name]) {
      this.mappings[name].soundBuffer.play();
    }
  }
}

export class Collided extends TagComponent {}
export class Missed extends TagComponent {}
