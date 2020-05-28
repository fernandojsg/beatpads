import { System } from "ecsy";
import * as THREE from "three";
import {
  Element,
  GLTFLoader,
  Shape,
  Object3DComponent,
  CollisionStart,
  Sounds
} from "../Components/components.js";
import * as Materials from "../materials.js";

const elementTypes = [
  {
    model: "metal",
    restitution: 1.7,
    draggable: true,
    scale: 1,
    sound: "metal.ogg",
    material: new THREE.MeshPhongMaterial({
      map: Materials.textures["metal.jpg"],
      envMap: Materials.environmentMap,
      specularMap: Materials.textures["metal_spec.jpg"],
      shininess: 70,
      specular: new THREE.Color(0x888888),
      reflectivity: 0.7
    })
  },
  {
    model: "rubber",
    restitution: 2.5,
    draggable: true,
    scale: 1,
    sound: "rubber.ogg",
    material: new THREE.MeshPhongMaterial({
      map: Materials.textures["rubber.png"],
      envMap: Materials.environmentMap,
      shininess: 10,
      specular: new THREE.Color(0x061b1f),
      reflectivity: 0.1
    })
  },
  {
    model: "wood",
    restitution: 1,
    draggable: true,
    scale: 1,
    sound: "wood.ogg",
    material: new THREE.MeshPhongMaterial({
      map: Materials.textures["wood.png"],
      envMap: Materials.environmentMap,
      specularMap: Materials.textures["wood_spec.jpg"],
      shininess: 20,
      specular: new THREE.Color(0x666666),
      reflectivity: 0.5
    })
  },
  {
    model: "static",
    restitution: 0.05,
    draggable: false,
    scale: 0.3,
    sound: "",
    material: new THREE.MeshLambertMaterial()
  }
];

/**
 * The system add the components and gltf to the element
 */
export class ElementSystem extends System {
  execute() {
    var entitiesAdded = this.queries.entities.added;
    for (let i = 0; i < entitiesAdded.length; i++) {
      let entity = entitiesAdded[i];
      var component = entity.getComponent(Element);

      const config = elementTypes[component.type];

      //var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );

      entity.addComponent(GLTFLoader, {
        url: "assets/models/" + config.model + ".glb",
        parent: window.data.entities.scene,
        onLoaded: model => {
          let mesh = model.children[0];
          let geometry = mesh.geometry;

          if (config.scale) {
            geometry.scale(config.scale, config.scale, config.scale);
            geometry.computeBoundingBox();
          }

          // Compute the boundingbox size to create the physics shape for it
          let min = geometry.boundingBox.min;
          let max = geometry.boundingBox.max;

          let w = Math.abs(max.x - min.x);
          let h = Math.abs(max.y - min.y);
          let d = Math.abs(max.z - min.z);

          mesh.material = config.material.clone();
          mesh.material.alphTest = 0.5;

          entity.addComponent(Shape, {
            primitive: "box",
            width: w / 2,
            height: h / 2,
            depth: d / 2
          });

          entity.addComponent(Sounds, {
            mappings: {
              hit: {
                url: "assets/sounds/336933__free-rush__coin4.ogg",
                volume: 2
              },
              miss: {
                url: "assets/sounds/miss.ogg",
                volume: 2
              }
            }
          });

          mesh.visible = false;

          // Just to skip the unneeded children group
          entity.getMutableComponent(Object3DComponent).value = mesh;
        }
      });
    }
  }
}

ElementSystem.queries = {
  entities: {
    components: [Element],
    listen: {
      added: true
    }
  },
  colliding: {
    components: [CollisionStart]
  }
};
