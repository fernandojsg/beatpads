import { System, Not } from "ecsy";
import {
  Element,
  Collided,
  GLTFModel,
  Missed,
  Moving,
  Object3DComponent,
  Level,
  FFTUpdatable,
  Active,
  Dissolve
} from "../Components/components.js";
import { levels } from "../levels.js";

/**
 * @todo Move it to ElementSystem ?
 */
export class GameplaySystem extends System {
  init() {
    this.speed = 1;
  }

  execute(delta) {
    this.queries.levels.added.forEach(entity => {
      let level = levels[entity.getComponent(Level).value];
      this.speed = level.speed;
    });

    // Update moving Pads
    const entities = this.queries.entities.results;
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const object = entity.getMutableComponent(Object3DComponent);

      object.value.translateZ(delta * this.speed);
      if (object.value.position.z > 1) {
        entity.addComponent(Missed);
        entity.removeComponent(Moving);
      }
    }

    // Reset Pads when inactive
    this.queries.inactivePads.added.forEach(entity => {
      if (!entity.getComponent(Object3DComponent)) {
        return;
      }
      var object = entity.getComponent(Object3DComponent).value;
      object.position.set(1, 1, 1);
      object.rotation.set(1, 1, 1);
      object.scale.set(1, 1, 1);
      object.visible = false;
      entity.removeComponent(Missed);
      entity.removeComponent(Dissolve);
      entity.removeComponent(Collided);
    });

    // Animate the dissolving Pads
    this.queries.dissolvingPads.results.forEach(entity => {
      const object = entity.getComponent(Object3DComponent).value;
      object.translateZ(-delta * this.speed);
    });
  }
}

GameplaySystem.queries = {
  entities: {
    components: [
      Element,
      Object3DComponent,
      GLTFModel,
      Not(Missed),
      Not(Collided),
      Moving,
      Active
    ]
  },
  levels: {
    components: [Level],
    listen: {
      added: true
    }
  },
  inactivePads: {
    components: [FFTUpdatable, Object3DComponent, Not(Active)],
    listen: {
      added: true
    }
  },
  dissolvingPads: {
    components: [FFTUpdatable, Object3DComponent, Dissolve, Not(Missed)],
    listen: {
      added: true
    }
  }
};
