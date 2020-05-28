import { System, Not } from "ecsy";
import * as THREE from "three";
import {
  VRController,
  Object3DComponent,
  ControllerConnected,
  Missed,
  Collided,
  Element,
  Moving
} from "../Components/components.js";

let worldPosHand = new THREE.Vector3();

// This system detect colissions between `pads` and `vrcontrollers` and add `collided` to the pads if that happens
export class CollisionSystem extends System {
  execute() {
    const pads = this.queries.pads.results;
    const controllers = this.queries.controllers.results;

    for (let i = 0; i < controllers.length; i++) {
      const controller3D = controllers[i].getComponent(Object3DComponent).value;
      controller3D.children[0].getWorldPosition(worldPosHand); // Because how the VR controller is added

      for (let j = 0; j < pads.length; j++) {
        const pad = pads[j];
        const pad3D = pad.getComponent(Object3DComponent).value;
        let radiusBall = pad3D.geometry.boundingSphere.radius;
        if (pad3D.position.distanceToSquared(worldPosHand) <= radiusBall / 4) {
          pad.addComponent(Collided);
          pad.removeComponent(Moving);
        }
      }
    }
  }
}

CollisionSystem.queries = {
  pads: {
    components: [Element, Object3DComponent, Not(Missed), Not(Collided), Moving] // @todo Change for Active instead of two Not()
  },
  controllers: {
    components: [VRController, Object3DComponent, ControllerConnected]
  }
};
