import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 
                 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import './style.css'
import CANNON from 'cannon';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 25;
camera.position.y = 5;

camera.lookAt(0,0,0);


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true
document.body.appendChild( renderer.domElement );

document.body.appendChild( VRButton.createButton( renderer ) );
renderer.xr.enabled = true;


const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true


//------------------CREAM UN PUNT DE LLUM ENMITJ-------------------------
  //directional light
  const dirlight = new THREE.DirectionalLight(0xffffff);
  dirlight.castShadow= true
  dirlight.position.set(-1, 4, 1);
  scene.add(dirlight);

//Sphere
const material = new THREE.MeshStandardMaterial({ color: 0xf00650 });
const SphereGeometry = new THREE.SphereGeometry();
const sphere = new THREE.Mesh(SphereGeometry, material);
sphere.position.set(0, 3, -5);
sphere.scale.set(1, 1, 1);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

//Sphere2
const Sphere2Geometry = new THREE.SphereGeometry();
const sphere2 = new THREE.Mesh(Sphere2Geometry, material);
sphere2.position.set(0.4, 6, -5);
sphere2.scale.set(1, 1, 1);
sphere2.castShadow = true;
sphere2.receiveShadow = true;
scene.add(sphere2);

//plane
const planeGeo = new THREE.PlaneGeometry(50, 50)
const planeMat = new THREE.MeshStandardMaterial({
 color: 0xffffff
})
const plane = new THREE.Mesh(planeGeo, planeMat)
plane.receiveShadow= true
plane.position.y = -2
plane.rotation.x = Math.PI * -0.5
scene.add(plane)

//controladors
const controller1 = renderer.xr.getController( 0 );
const controller2 = renderer.xr.getController( 1 );

// mètodes escoltadors d'esdeveniments dels controladors
function onSelectStart() {
  this.userData.isSelecting = true;
}

function onSelectEnd() {
  this.userData.isSelecting = false;
}

//mètodes escoltadors als controladors amb addEventListener:
controller1.addEventListener( 'selectstart', onSelectStart);
controller1.addEventListener( 'selectend', onSelectEnd );
controller1.addEventListener( 'connected', function ( event ) {
    this.add( buildController( event.data ) );
} );

controller2.addEventListener( 'selectstart', onSelectStart);
controller2.addEventListener( 'selectend',  onSelectEnd);
controller2.addEventListener( 'connected', function ( event ) {
    this.add( buildController( event.data ) );
} );

controller2.addEventListener( 'disconnected', function () {
  this.remove( this.children[ 0 ] );
} );

scene.add(controller1)
scene.add(controller2)

//Vincular els controladors anteriors amb els models de controladors de fàbrica XRControllerModelFactory:
const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
scene.add( controllerGrip1 );

const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
scene.add( controllerGrip2 );

//------------MON-----------------------//
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)

const sphereShape = new CANNON.Sphere(1)
const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, -5),
    shape: sphereShape
})

world.addBody(sphereBody)

const sphere2Shape = new CANNON.Sphere(1)
const sphere2Body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0.4, 6, -5),
    shape: sphere2Shape
})

world.addBody(sphere2Body)


const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body({
  mass: 0,
  position: new CANNON.Vec3(0, -3, 0),
  shape: floorShape
})


floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5)
world.addBody(floorBody)



//funció per definir la visualització en forma de raig o visor dels controladors:
function buildController( data ) {
  let geometry, material;
  switch ( data.targetRayMode ) {

      case 'tracked-pointer':
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute( 'position', 
                         new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) )
          geometry.setAttribute( 'color', 
                         new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) )
          material = new THREE.LineBasicMaterial( 
                        { 
                          vertexColors: true, 
                          blending: THREE.AdditiveBlending
                        }
           )
          return new THREE.Line( geometry, material )
          case 'gaze':

          geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate(0,0, - 1)
          material = new THREE.MeshBasicMaterial( { 
                      opacity: 0.5, 
                      transparent: true
           } )
          return new THREE.Mesh( geometry, material )
  }
}

//Funció per actuar en cas de prémer el botó de selecció isSelecting del controlador:
function handleController( controller ) {
  if ( controller.userData.isSelecting ) {
      // Acció en prémer el botó de Select del controlador
      console.log('Selecting')
  }
}


//cridam sa funcio tick q mos renderiza
const clock = new THREE.Clock()
let oldElapsedTime = 0






function tick() {
  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - oldElapsedTime
  oldElapsedTime = elapsedTime

  renderer.render(scene, camera)
  renderer.setAnimationLoop(tick);

  // Update physics
  world.step(1 / 60, deltaTime, 3)
  console.log(sphereBody.position.y)
  sphere.position.copy(sphereBody.position)
  sphere2.position.copy(sphere2Body.position)
  plane.position.copy(floorBody.position)

}
tick();
