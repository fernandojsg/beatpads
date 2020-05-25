import { System, Not } from "ecsy";
import * as THREE from "three";
import {
  VRController,
  Object3D,
  ControllerConnected,
  Missed,
  Collided,
  Element
} from "../Components/components.js";

let worldPosHand = new THREE.Vector3();

// This system detect colissions between `pads` and `vrcontrollers` and add `collided` to the pads if that happens
export class CollisionSystem extends System {
  execute() {
    const pads = this.queries.pads.results;
    const controllers = this.queries.controllers.results;

    for (let i = 0; i < controllers.length; i++) {
      const controller3D = controllers[i].getComponent(Object3D).value;
      controller3D.children[0].getWorldPosition(worldPosHand); // Because how the VR controller is added
      let radiusHand = 0.2; // @todo Move to a Shape

      for (let j = 0; j < pads.length; j++) {
        const pad = pads[j];
        const pad3D = pad.getComponent(Object3D).value;
        let radiusBall = pad3D.geometry.boundingSphere.radius;

        let radiusSum = radiusHand + radiusBall;

        if (
          pad3D.position.distanceToSquared(worldPosHand) <=
          radiusSum * radiusSum
        ) {
          pad.addComponent(Collided);
        }
      }
    }
  }
}

CollisionSystem.queries = {
  pads: {
    components: [Element, Object3D, Not(Missed), Not(Collided)] // @todo Change for Active instead of two Not()
  },
  controllers: {
    components: [VRController, Object3D, ControllerConnected]
  }
};
