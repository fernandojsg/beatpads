import { System } from "ecsy";
import * as THREE from "three";
import {
  Element,
  GLTFLoader,
  Active,
  Floor,
  Shape,
  Object3D,
  Ball,
  Colliding,
  CollisionStart,
  Draggable,
  Sound,
  Sounds
} from "../Components/components.js";
import * as Materials from "../materials.js";

const urlParams = new URLSearchParams(window.location.search);
var editMode = urlParams.has("edit");

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
    draggable: editMode,
    scale: 0.2,
    sound: "",
    material: new THREE.MeshLambertMaterial({
      map: Materials.textures["floor.png"]
    })
  }
];

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

          entity.addComponent(Shape, {
            primitive: "box",
            width: w,
            height: h,
            depth: d
          });

          entity.addComponent(Sounds, {
            mappings: {
              hit: {
                url: "assets/sounds/336933__free-rush__coin4.ogg",
                volume: 2,
              },
              miss: {
                url: "assets/sounds/miss.ogg",
                volume: 2,
              }
            }
          });

          entity.getMutableComponent(Object3D).value = mesh;
        }
      });

      if (config.draggable) {
        entity.addComponent(Draggable);
      }
    }
/*
    this.queries.colliding.results.forEach(entity => {
      let collision = entity.getComponent(Colliding);
      let hasBall = entity.hasComponent(Ball);
      let ball = hasBall ? entity : collision.collidingWith[0];
      let block = !hasBall ? entity : collision.collidingWith[0];

      if (block.hasComponent(Floor)) {
        if (ball.hasComponent(Active)) {
          block.getComponent(Sound).sound.play();
          ball.removeComponent(Active);
          // Wait a bit before spawning a new bullet from the generator
          ball.addComponent(FloorCollided);
        }
      } else {
        if (block.hasComponent(Sound)) {
          block.getComponent(Sound).sound.play();
        }
      }
    });
*/
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
