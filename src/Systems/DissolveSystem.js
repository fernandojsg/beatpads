import { System } from "ecsy";
import {
  Element,
  Dissolve,
  Object3D,
  Active
} from "../Components/components.js";

/**
 * This system interates on `Elements` with the `Disolve` component on them
 * and does a transition from the alpha from 1 to 0. And depending on the type
 * it changes also the color and the scale:
 *     - 0 (Miss): Red and expands the scale
 *     - 1 (Hit): Green and collapses
 */
export class DissolveSystem extends System {
  execute(delta) {
    var entities = this.queries.entities.results;

    for (let i = 0; i < entities.length; i++) {
      var entity = entities[i];
      var dissolve = entity.getMutableComponent(Dissolve);
      var object = entity.getComponent(Object3D).value;
      let material = object.material;
      if (!material) {
        continue;
      }

      let s = 2 - dissolve.value;

      if (dissolve.type === 0) {
        material.emissive.r = dissolve.value;
        object.scale.set(s, s, s);
      } else {
        material.emissive.g = dissolve.value;
        s = 1 / s;
        object.scale.set(s, s, s);
      }

      object.material.opacity = dissolve.value;
      object.material.transparent = true;

      dissolve.value -= delta * dissolve.speed;
      if (dissolve.value <= 0) {
        entity.removeComponent(Dissolve);
        entity.removeComponent(Active);
        object.material.transparent = false;
      }
    }
  }
}

DissolveSystem.queries = {
  entities: {
    components: [Element, Dissolve, Object3D, Active]
  }
};
