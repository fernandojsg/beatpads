import * as THREE from "three";
import { TagComponent } from "ecsy";
export * from "ecsy-three";

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

export class FFTAnalizable {
  constructor() {
    this.reset();
  }

  reset() {
    this.value = 128;
  }
}

export class FFTUpdatable {
  constructor() {
    this.reset();
  }

  reset() {
    this.value = false;
  }
}

export class FFTVisualizable {
  constructor() {
    this.reset();
  }

  reset() {
    this.width = 0;
    this.height = 0;
    this.context = null;
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
  constructor() {
    this.reset();
  }

  reset() {
    this.lane = null;
  }
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

export class Moving {
  constructor() {
    this.reset();
  }

  reset() {
    this.value = new THREE.Vector3(0, 0, 0);
  }
}
export class Lane {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }
}
export class Collided extends TagComponent {}
export class Missed extends TagComponent {}
