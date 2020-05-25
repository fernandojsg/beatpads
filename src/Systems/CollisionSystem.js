import { System } from "ecsy";
import * as THREE from "three";
import {
  VRController,
  Object3D,
  Dissolve,
  Sounds,
  Element
} from "../Components/components.js";

let worldPosHand = new THREE.Vector3();
let worldPosB = new THREE.Vector3();

export class CollisionSystem extends System {
  execute(delta, time) {
    const boxes = this.queries.boxes.results;
    const controllers = this.queries.controllers.results;

    for (let i = 0; i < controllers.length; i++) {
      const controller = controllers[i];


      const controller3D = controller.getComponent(Object3D).value;
      controller3D.children[0].getWorldPosition(worldPosHand);
      let radiusHand = 0.2;

      for (let j = 0; j < boxes.length; j++) {
        const box = boxes[j];
        const element = box.getComponent(Element);
        const box3D = box.getComponent(Object3D).value;
        let radiusBall = box3D.geometry.boundingSphere.radius;

        let radiusSum = radiusHand + radiusBall;

        if (!box.getComponent(Dissolve)) {
          if (
            box3D.position.distanceToSquared(worldPosHand) <=
            radiusSum * radiusSum
          ) {
            box.addComponent(Dissolve, {
              type: 1,
              speed: 2
            });
            let sounds = box.getComponent(Sounds);
            sounds.playSound("hit");
          }
        }

        /*
        let targetObject = object3D.children[0];
        targetObject.getWorldPosition(worldPos);
        if (!targetObject.geometry.boundingSphere) {
          targetObject.geometry.computeBoundingSphere();
        }
*/
/*

        box2.updateMatrixWorld();
        var bounding1 = box1.geometry.boundingBox.clone();
        bounding1.applyMatrix4(box1.matrixWorld);
        var bounding2 = box2.geometry.boundingBox.clone();
        bounding2.applyMatrix4(box2.matrixWorld);

        if(bounding1.intersectsBox(bounding2)){
          console.log("Intersecting!");
        }
*/
      }
    }
  }
}

CollisionSystem.queries = {
  boxes: {
    components: [Element, Object3D],
    listen: {
      added: true,
      removed: true,
      changed: true // [Element]
    }
  },
  controllers: {
    components: [VRController, Object3D],
    listen: {
      added: true,
      removed: true,
      changed: true // [Element]
    }
  }
}
