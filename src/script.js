import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

import bgTexture1 from '/images/1.jpg';
import bgTexture2 from '/images/2.jpg';
import bgTexture3 from '/images/3.jpg';
import bgTexture4 from '/images/4.jpg';
import sunTexture from '/images/sun.jpg';
import mercuryTexture from '/images/mercurymap.jpg';
import mercuryBump from '/images/mercurybump.jpg';
import venusTexture from '/images/venusmap.jpg';
import venusBump from '/images/venusmap.jpg';
import venusAtmosphere from '/images/venus_atmosphere.jpg';
import earthTexture from '/images/earth_daymap.jpg';
import earthNightTexture from '/images/earth_nightmap.jpg';
import earthAtmosphere from '/images/earth_atmosphere.jpg';
import earthMoonTexture from '/images/moonmap.jpg';
import earthMoonBump from '/images/moonbump.jpg';
import marsTexture from '/images/marsmap.jpg';
import marsBump from '/images/marsbump.jpg';
import jupiterTexture from '/images/jupiter.jpg';
import ioTexture from '/images/jupiterIo.jpg';
import europaTexture from '/images/jupiterEuropa.jpg';
import ganymedeTexture from '/images/jupiterGanymede.jpg';
import callistoTexture from '/images/jupiterCallisto.jpg';
import saturnTexture from '/images/saturnmap.jpg';
import satRingTexture from '/images/saturn_ring.png';
import uranusTexture from '/images/uranus.jpg';
import uraRingTexture from '/images/uranus_ring.png';
import neptuneTexture from '/images/neptune.jpg';
import OpenAI from 'openai';
import plutoTexture from '/images/plutomap.jpg';

// ******  SETUP  ******
console.log("Create the scene");
const scene = new THREE.Scene();

console.log("Create a perspective projection camera");
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.set(-175, 115, 5);

console.log("Create the renderer");
const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const client = new OpenAI({
  apiKey: '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', // This is the default and can be omitted
dangerouslyAllowBrowser: true
});

console.log("Create an orbit control");
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.75;
controls.screenSpacePanning = false;

console.log("Set up texture loader");
const cubeTextureLoader = new THREE.CubeTextureLoader();
const loadTexture = new THREE.TextureLoader();

// ******  POSTPROCESSING setup ******
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// ******  OUTLINE PASS  ******
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x190a05);
composer.addPass(outlinePass);

// ******  BLOOM PASS  ******
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
bloomPass.threshold = 1;
bloomPass.radius = 0.9;
composer.addPass(bloomPass);

// ****** AMBIENT LIGHT ******
console.log("Add the ambient light");
var lightAmbient = new THREE.AmbientLight(0x222222, 6); 
scene.add(lightAmbient);

// ******  Star background  ******
scene.background = cubeTextureLoader.load([

  bgTexture3,
  bgTexture1,
  bgTexture2,
  bgTexture2,
  bgTexture4,
  bgTexture2
]);

// ******  CONTROLS  ******
// const gui = new dat.GUI({ autoPlace: false });
// const customContainer = document.getElementById('gui-container');
// customContainer.appendChild(gui.domElement);

// ****** SETTINGS FOR INTERACTIVE CONTROLS  ******
const settings = {
  accelerationOrbit: 1,
  acceleration: 1,
  sunIntensity: 1.9
};

//GUI
// gui.add(settings, 'accelerationOrbit', 0, 10).onChange(value => {
// });
// gui.add(settings, 'acceleration', 0, 10).onChange(value => {
// });
// gui.add(settings, 'sunIntensity', 1, 10).onChange(value => {
//   sunMat.emissiveIntensity = value;
// });

// mouse movement
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

// ******  SELECT PLANET  ******
let selectedPlanet = null;
let isMovingTowardsPlanet = false;
let targetCameraPosition = new THREE.Vector3();
let offset;

function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(raycastTargets);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    selectedPlanet = identifyPlanet(clickedObject);
    if (selectedPlanet) {
      closeInfoNoZoomOut();
      
      settings.accelerationOrbit = 0; // Stop orbital movement

      // Update camera to look at the selected planet
      const planetPosition = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(planetPosition);
      controls.target.copy(planetPosition);
      camera.lookAt(planetPosition); // Orient the camera towards the planet

      targetCameraPosition.copy(planetPosition).add(camera.position.clone().sub(planetPosition).normalize().multiplyScalar(offset));
      isMovingTowardsPlanet = true;
    }
  }
}

// Global function to programmatically select a planet
window.selectPlanet = function(planetName) {
  const planetMap = {
    'Mercury': mercury,
    'Venus': venus,
    'Earth': earth,
    'Mars': mars,
    'Jupiter': jupiter,
    'Saturn': saturn,
    'Uranus': uranus,
    'Neptune': neptune,
    'Pluto': pluto
  };

  const planetToSelect = planetMap[planetName];
  if (planetToSelect) {
    // Mimic the click event logic
    selectedPlanet = identifyPlanet(planetToSelect.planet);
    if (selectedPlanet) {
      closeInfoNoZoomOut();
      settings.accelerationOrbit = 0; // Stop orbital movement

      const planetPosition = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(planetPosition);
      controls.target.copy(planetPosition);
      camera.lookAt(planetPosition);

      targetCameraPosition.copy(planetPosition).add(camera.position.clone().sub(planetPosition).normalize().multiplyScalar(offset));
      isMovingTowardsPlanet = true;
    }
  } else {
    console.warn(`Planet with name "${planetName}" not found.`);
  }
};


function identifyPlanet(clickedObject) {
  let planetDataPrompt = '';
  let selectedPlanetObj = null;

  if (clickedObject.material === mercury.planet.material) {
    offset = 10;
    planetDataPrompt = 'Расскажи короткую историю, интересные факты и где могут жить люди в будущем о Меркурии.';
    selectedPlanetObj = mercury;
  } else if (clickedObject.material === venus.Atmosphere.material || clickedObject.material === venus.planet.material) {
    offset = 25;
    planetDataPrompt = 'Расскажи короткую историю, интересные факты и где могут жить люди в будущем о Венере.';
    selectedPlanetObj = venus;
  } else if (clickedObject.material === earth.Atmosphere.material || clickedObject.material === earth.planet.material) {
    offset = 25;
    planetDataPrompt = 'Расскажи короткие, общие и интересные факты о Земле, которые могут быть новыми для детей. Также упомяни, где люди могут жить в будущем (например, на Луне или Марсе, не обязательно на Земле).';
    selectedPlanetObj = earth;
  } else if (clickedObject.material === mars.planet.material) {
    offset = 15;
    planetDataPrompt = 'Расскажи короткую историю, интересные факты, например о кратерах или горах, и где могут жить люди в будущем о Марсе.';
    selectedPlanetObj = mars;
  } else if (clickedObject.material === jupiter.planet.material) {
    offset = 50;
    planetDataPrompt = 'Расскажи короткую историю, интересные факты о его спутниках, и где могут жить люди в будущем (например, на его спутниках) о Юпитере.';
    selectedPlanetObj = jupiter;
  } else if (clickedObject.material === saturn.planet.material) {
    offset = 50;
    planetDataPrompt = 'Расскажи короткую историю, интересные факты о его кольцах и спутниках, и где могут жить люди в будущем (например, на Титане) о Сатурне.';
    selectedPlanetObj = saturn;
  } else if (clickedObject.material === uranus.planet.material) {
    offset = 25;
    planetDataPrompt = 'Расскажи короткую историю, интересные факты и где могут жить люди в будущем об Уране.';
    selectedPlanetObj = uranus;
  } else if (clickedObject.material === neptune.planet.material) {
    offset = 20;
    planetDataPrompt = 'Расскажи короткую историю, интересные факты и где могут жить люди в будущем о Нептуне.';
    selectedPlanetObj = neptune;
  } else if (clickedObject.material === pluto.planet.material) {
    offset = 10;
    planetDataPrompt = 'Расскажи короткую историю, интересные факты и где могут жить люди в будущем о Плутоне.';
    selectedPlanetObj = pluto;
  }

  if (selectedPlanetObj && planetDataPrompt) {
    (async () => {
      try {
        const response = await client.responses.create({
          model: 'gpt-4o',
          instructions: 'Ты - астрономический гид для детей. Дай краткую, веселую историю планеты, интересные факты и информацию о потенциальных местах для жизни в будущем, ориентируясь на детей. Весь ответ должен быть до 200 слов.',
          input: planetDataPrompt,
        });

        const aiResponseText = response.output[0].content[0].text;
        console.log(`[AI] `, aiResponseText);
        // Display the AI response in the details section
        postToParent({type: 'response', response: aiResponseText})

      } catch (error) {
        console.error('Error fetching AI response:', error);
      }
    })();
  }
  return selectedPlanetObj;
}

// Function to update planet details with AI response
function updatePlanetDetails(planetName, aiInfo) {
  var details = document.getElementById('planetDetails');
  var name = document.getElementById('planetName');
  name.innerText = planetName;
  details.innerText = `Радиус: ${planetData[planetName].radius}\nНаклон: ${planetData[planetName].tilt}\nВращение: ${planetData[planetName].rotation}\nОрбита: ${planetData[planetName].orbit}\nРасстояние: ${planetData[planetName].distance}\nСпутники: ${planetData[planetName].moons}\n\n${aiInfo}`;
}


// ******  SHOW PLANET INFO AFTER SELECTION  ******
function showPlanetInfo(planet) {
  var info = document.getElementById('planetInfo');
  info.style.display = 'block';
}

let isZoomingOut = false;
let zoomOutTargetPosition = new THREE.Vector3(-175, 115, 5);

// Global function to programmatically close the info panel
window.closePlanetInfo = function() {
  var info = document.getElementById('planetInfo');
  info.style.display = 'none';
  settings.accelerationOrbit = 1;
  isZoomingOut = true;
  controls.target.set(0, 0, 0);
  selectedPlanet = null; // Deselect the planet
};
window.closeInfo = window.closePlanetInfo; // Keep original name for compatibility

// close info when clicking another planet
function closeInfoNoZoomOut() {
  var info = document.getElementById('planetInfo');
  info.style.display = 'none';
  settings.accelerationOrbit = 1;
}

// ******  SUN  ******
let sunMat;

const sunSize = 697/40; // 40 times smaller scale than earth
const sunGeom = new THREE.SphereGeometry(sunSize, 32, 20);
sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xFFF88F,
  emissiveMap: loadTexture.load(sunTexture),
  emissiveIntensity: settings.sunIntensity
});
const sun = new THREE.Mesh(sunGeom, sunMat);
scene.add(sun);

//point light in the sun
const pointLight = new THREE.PointLight(0xFDFFD3 , 1200, 400, 1.4);
scene.add(pointLight);


// ******  PLANET CREATION FUNCTION  ******
function createPlanet(planetName, size, position, tilt, texture, bump, ring, atmosphere, moons){

  let material;
  if (texture instanceof THREE.Material){
    material = texture;
  } 
  else if(bump){
    material = new THREE.MeshPhongMaterial({
    map: loadTexture.load(texture),
    bumpMap: loadTexture.load(bump),
    bumpScale: 0.7
    });
  }
  else {
    material = new THREE.MeshPhongMaterial({
    map: loadTexture.load(texture)
    });
  } 

  const name = planetName;
  const geometry = new THREE.SphereGeometry(size, 32, 20);
  const planet = new THREE.Mesh(geometry, material);
  const planet3d = new THREE.Object3D;
  const planetSystem = new THREE.Group();
  planetSystem.add(planet);
  let Atmosphere;
  let Ring;
  planet.position.x = position;
  planet.rotation.z = tilt * Math.PI / 180;

  // add orbit path
  const orbitPath = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    position, position, // xRadius, yRadius
    0, 2 * Math.PI,   // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
);

  const pathPoints = orbitPath.getPoints(100);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.03 });
  const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  planetSystem.add(orbit);

  //add ring
  if(ring)
  {
    const RingGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius,30);
    const RingMat = new THREE.MeshStandardMaterial({
      map: loadTexture.load(ring.texture),
      side: THREE.DoubleSide
    });
    Ring = new THREE.Mesh(RingGeo, RingMat);
    planetSystem.add(Ring);
    Ring.position.x = position;
    Ring.rotation.x = -0.5 *Math.PI;
    Ring.rotation.y = -tilt * Math.PI / 180;
  }
  
  //add atmosphere
  if(atmosphere){
    const atmosphereGeom = new THREE.SphereGeometry(size+0.1, 32, 20);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      map:loadTexture.load(atmosphere),
      transparent: true,
      opacity: 0.4,
      depthTest: true,
      depthWrite: false
    })
    Atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial)
    
    Atmosphere.rotation.z = 0.41;
    planet.add(Atmosphere);
  }

  //add moons
  if(moons){
    moons.forEach(moon => {
      let moonMaterial;
      
      if(moon.bump){
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture.load(moon.texture),
          bumpMap: loadTexture.load(moon.bump),
          bumpScale: 0.5
        });
      } else{
        moonMaterial = new THREE.MeshStandardMaterial({
          map: loadTexture.load(moon.texture)
        });
      }
      const moonGeometry = new THREE.SphereGeometry(moon.size, 32, 20);
      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      const moonOrbitDistance = size * 1.5;
      moonMesh.position.set(moonOrbitDistance, 0, 0);
      planetSystem.add(moonMesh);
      moon.mesh = moonMesh;
    });
  }
  //add planet system to planet3d object and to the scene
  planet3d.add(planetSystem);
  scene.add(planet3d);
  return {name, planet, planet3d, Atmosphere, moons, planetSystem, Ring};
}


// ******  LOADING OBJECTS METHOD  ******
function loadObject(path, position, scale, callback) {
  const loader = new GLTFLoader();

  loader.load(path, function (gltf) {
      const obj = gltf.scene;
      obj.position.set(position, 0, 0);
      obj.scale.set(scale, scale, scale);
      scene.add(obj);
      if (callback) {
        callback(obj);
      }
  }, undefined, function (error) {
      console.error('An error happened', error);
  });
}

// ******  ASTEROIDS  ******
const asteroids = [];
function loadAsteroids(path, numberOfAsteroids, minOrbitRadius, maxOrbitRadius) {
  const loader = new GLTFLoader();
  loader.load(path, function (gltf) {
      gltf.scene.traverse(function (child) {
          if (child.isMesh) {
              for (let i = 0; i < numberOfAsteroids / 12; i++) { // Divide by 12 because there are 12 asteroids in the pack
                  const asteroid = child.clone();
                  const orbitRadius = THREE.MathUtils.randFloat(minOrbitRadius, maxOrbitRadius);
                  const angle = Math.random() * Math.PI * 2;
                  const x = orbitRadius * Math.cos(angle);
                  const y = 0;
                  const z = orbitRadius * Math.sin(angle);
                  child.receiveShadow = true;
                  asteroid.position.set(x, y, z);
                  asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
                  scene.add(asteroid);
                  asteroids.push(asteroid);
              }
          }
      });
  }, undefined, function (error) {
      console.error('An error happened', error);
  });
}


// Earth day/night effect shader material
const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { type: "t", value: loadTexture.load(earthTexture) },
    nightTexture: { type: "t", value: loadTexture.load(earthNightTexture) },
    sunPosition: { type: "v3", value: sun.position }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;

    uniform vec3 sunPosition;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vSunDirection = normalize(sunPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;

    void main() {
      float intensity = max(dot(vNormal, vSunDirection), 0.0);
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv)* 0.2;
      gl_FragColor = mix(nightColor, dayColor, intensity);
    }
  `
});


// ******  MOONS  ******
// Earth
const earthMoon = [{
  size: 1.6,
  texture: earthMoonTexture,
  bump: earthMoonBump,
  orbitSpeed: 0.001 * settings.accelerationOrbit,
  orbitRadius: 10
}]

// Mars' moons with path to 3D models (phobos & deimos)
const marsMoons = [
  {
    modelPath: '/images/mars/phobos.glb',
    scale: 0.1,
    orbitRadius: 5,
    orbitSpeed: 0.002 * settings.accelerationOrbit,
    position: 100,
    mesh: null
  },
  {
    modelPath: '/images/mars/deimos.glb',
    scale: 0.1,
    orbitRadius: 9,
    orbitSpeed: 0.0005 * settings.accelerationOrbit,
    position: 120,
    mesh: null
  }
];

// Jupiter
const jupiterMoons = [
  {
    size: 1.6,
    texture: ioTexture,
    orbitRadius: 20,
    orbitSpeed: 0.0005 * settings.accelerationOrbit
  },
  {
    size: 1.4,
    texture: europaTexture,
    orbitRadius: 24,
    orbitSpeed: 0.00025 * settings.accelerationOrbit
  },
  {
    size: 2,
    texture: ganymedeTexture,
    orbitRadius: 28,
    orbitSpeed: 0.000125 * settings.accelerationOrbit
  },
  {
    size: 1.7,
    texture: callistoTexture,
    orbitRadius: 32,
    orbitSpeed: 0.00006 * settings.accelerationOrbit
  }
];

// ******  PLANET CREATIONS  ******
const mercury = new createPlanet('Mercury', 2.4, 40, 0, mercuryTexture, mercuryBump);
const venus = new createPlanet('Venus', 6.1, 65, 3, venusTexture, venusBump, null, venusAtmosphere);
const earth = new createPlanet('Earth', 6.4, 90, 23, earthMaterial, null, null, earthAtmosphere, earthMoon);
const mars = new createPlanet('Mars', 3.4, 115, 25, marsTexture, marsBump)
// Load Mars moons
marsMoons.forEach(moon => {
  loadObject(moon.modelPath, moon.position, moon.scale, function(loadedModel) {
    moon.mesh = loadedModel;
    mars.planetSystem.add(moon.mesh);
    moon.mesh.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  });
});

const jupiter = new createPlanet('Jupiter', 69/4, 200, 3, jupiterTexture, null, null, null, jupiterMoons);
const saturn = new createPlanet('Saturn', 58/4, 270, 26, saturnTexture, null, {
  innerRadius: 18, 
  outerRadius: 29, 
  texture: satRingTexture
});
const uranus = new createPlanet('Uranus', 25/4, 320, 82, uranusTexture, null, {
  innerRadius: 6, 
  outerRadius: 8, 
  texture: uraRingTexture
});
const neptune = new createPlanet('Neptune', 24/4, 340, 28, neptuneTexture);
const pluto = new createPlanet('Pluto', 1, 350, 57, plutoTexture)

  // ******  PLANETS DATA  ******
  const planetData = {
    'Mercury': {
        radius: '2,439.7 км',
        tilt: '0.034°',
        rotation: '58.6 земных дней',
        orbit: '88 земных дней',
        distance: '57.9 млн км',
        moons: '0',
        info: 'Самая маленькая планета в нашей солнечной системе и ближайшая к Солнцу.'
    },
    'Venus': {
        radius: '6,051.8 км',
        tilt: '177.4°',
        rotation: '243 земных дня',
        orbit: '225 земных дней',
        distance: '108.2 млн км',
        moons: '0',
        info: 'Вторая планета от Солнца, известная своими экстремальными температурами и плотной атмосферой.'
    },
    'Earth': {
        radius: '6,371 км',
        tilt: '23.5°',
        rotation: '24 часа',
        orbit: '365 дней',
        distance: '150 млн км',
        moons: '1 (Луна)',
        info: 'Третья планета от Солнца и единственная известная планета, на которой есть жизнь.'
    },
    'Mars': {
        radius: '3,389.5 км',
        tilt: '25.19°',
        rotation: '1.03 земных дня',
        orbit: '687 земных дней',
        distance: '227.9 млн км',
        moons: '2 (Фобос и Деймос)',
        info: 'Известна как Красная планета, славится своим красноватым видом и потенциалом для колонизации человеком.'
    },
    'Jupiter': {
        radius: '69,911 км',
        tilt: '3.13°',
        rotation: '9.9 часов',
        orbit: '12 земных лет',
        distance: '778.5 млн км',
        moons: '95 известных спутников (Ганимед, Каллисто, Европа, Ио - 4 крупнейших)',
        info: 'Крупнейшая планета в нашей солнечной системе, известная своим Большим Красным Пятном.'
    },
    'Saturn': {
        radius: '58,232 км',
        tilt: '26.73°',
        rotation: '10.7 часов',
        orbit: '29.5 земных лет',
        distance: '1.4 млрд км',
        moons: '146 известных спутников',
        info: 'Отличается своей обширной системой колец, вторая по величине планета в нашей солнечной системе.'
    },
    'Uranus': {
        radius: '25,362 км',
        tilt: '97.77°',
        rotation: '17.2 часов',
        orbit: '84 земных года',
        distance: '2.9 млрд км',
        moons: '27 известных спутников',
        info: 'Известна своим уникальным боковым вращением и бледно-голубым цветом.'
    },
    'Neptune': {
        radius: '24,622 км',
        tilt: '28.32°',
        rotation: '16.1 часов',
        orbit: '165 земных лет',
        distance: '4.5 млрд км',
        moons: '14 известных спутников',
        info: 'Самая дальняя планета от Солнца в нашей солнечной системе, известная своим глубоким синим цветом.'
    },
    'Pluto': {
        radius: '1,188.3 км',
        tilt: '122.53°',
        rotation: '6.4 земных дня',
        orbit: '248 земных лет',
        distance: '5.9 млрд км',
        moons: '5 (Харон, Стикс, Никта, Кербер, Гидра)',
        info: 'Первоначально классифицировался как девятая планета, теперь Плутон считается карликовой планетой.'
    }
};


// Array of planets and atmospheres for raycasting
const raycastTargets = [
  mercury.planet, venus.planet, venus.Atmosphere, earth.planet, earth.Atmosphere, 
  mars.planet, jupiter.planet, saturn.planet, uranus.planet, neptune.planet, pluto.planet
];

// ******  SHADOWS  ******
renderer.shadowMap.enabled = true;
pointLight.castShadow = true;

//properties for the point light
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 20;

//casting and receiving shadows
earth.planet.castShadow = true;
earth.planet.receiveShadow = true;
earth.Atmosphere.castShadow = true;
earth.Atmosphere.receiveShadow = true;
if (earth.moons) { // Check if moons exist before iterating
  earth.moons.forEach(moon => {
    if (moon.mesh) { // Check if moon.mesh exists
      moon.mesh.castShadow = true;
      moon.mesh.receiveShadow = true;
    }
  });
}
mercury.planet.castShadow = true;
mercury.planet.receiveShadow = true;
venus.planet.castShadow = true;
venus.planet.receiveShadow = true;
if (venus.Atmosphere) { // Check if atmosphere exists
  venus.Atmosphere.receiveShadow = true;
}
mars.planet.castShadow = true;
mars.planet.receiveShadow = true;
jupiter.planet.castShadow = true;
jupiter.planet.receiveShadow = true;
if (jupiter.moons) { // Check if moons exist before iterating
  jupiter.moons.forEach(moon => {
    if (moon.mesh) { // Check if moon.mesh exists
      moon.mesh.castShadow = true;
      moon.mesh.receiveShadow = true;
    }
  });
}
saturn.planet.castShadow = true;
saturn.planet.receiveShadow = true;
if (saturn.Ring) { // Check if ring exists
  saturn.Ring.receiveShadow = true;
}
uranus.planet.receiveShadow = true;
neptune.planet.receiveShadow = true;
pluto.planet.receiveShadow = true;




function animate(){

  //rotating planets around the sun and itself
  sun.rotateY(0.001 * settings.acceleration);
  mercury.planet.rotateY(0.001 * settings.acceleration);
  mercury.planet3d.rotateY(0.004 * settings.accelerationOrbit);
  venus.planet.rotateY(0.0005 * settings.acceleration)
  venus.Atmosphere.rotateY(0.0005 * settings.acceleration);
  venus.planet3d.rotateY(0.0006 * settings.accelerationOrbit);
  earth.planet.rotateY(0.005 * settings.acceleration);
  earth.Atmosphere.rotateY(0.001 * settings.acceleration);
  earth.planet3d.rotateY(0.001 * settings.accelerationOrbit);
  mars.planet.rotateY(0.01 * settings.acceleration);
  mars.planet3d.rotateY(0.0007 * settings.accelerationOrbit);
  jupiter.planet.rotateY(0.005 * settings.acceleration);
  jupiter.planet3d.rotateY(0.0003 * settings.accelerationOrbit);
  saturn.planet.rotateY(0.01 * settings.acceleration);
  saturn.planet3d.rotateY(0.0002 * settings.accelerationOrbit);
  uranus.planet.rotateY(0.005 * settings.acceleration);
  uranus.planet3d.rotateY(0.0001 * settings.accelerationOrbit);
  neptune.planet.rotateY(0.005 * settings.acceleration);
  neptune.planet3d.rotateY(0.00008 * settings.accelerationOrbit);
  pluto.planet.rotateY(0.001 * settings.acceleration)
  pluto.planet3d.rotateY(0.00006 * settings.accelerationOrbit)

// Animate Earth's moon
if (earth.moons) {
  earth.moons.forEach(moon => {
    const time = performance.now();
    const tiltAngle = 5 * Math.PI / 180;

    const moonX = earth.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.sin(tiltAngle);
    const moonZ = earth.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.cos(tiltAngle);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.01);
  });
}
// Animate Mars' moons
if (marsMoons){
marsMoons.forEach(moon => {
  if (moon.mesh) {
    const time = performance.now();

    const moonX = mars.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
    const moonZ = mars.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.001);
  }
});
}

// Animate Jupiter's moons
if (jupiter.moons) {
  jupiter.moons.forEach(moon => {
    const time = performance.now();
    const moonX = jupiter.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
    const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
    const moonZ = jupiter.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);

    moon.mesh.position.set(moonX, moonY, moonZ);
    moon.mesh.rotateY(0.01);
  });
}

// Rotate asteroids
asteroids.forEach(asteroid => {
  asteroid.rotation.y += 0.0001;
  asteroid.position.x = asteroid.position.x * Math.cos(0.0001 * settings.accelerationOrbit) + asteroid.position.z * Math.sin(0.0001 * settings.accelerationOrbit);
  asteroid.position.z = asteroid.position.z * Math.cos(0.0001 * settings.accelerationOrbit) - asteroid.position.x * Math.sin(0.0001 * settings.accelerationOrbit);
});

// ****** OUTLINES ON PLANETS ******
raycaster.setFromCamera(mouse, camera);

// Check for intersections
var intersects = raycaster.intersectObjects(raycastTargets);

// Reset all outlines
outlinePass.selectedObjects = [];

if (intersects.length > 0) {
  const intersectedObject = intersects[0].object;

  // If the intersected object is an atmosphere, find the corresponding planet
  if (intersectedObject === earth.Atmosphere) {
    outlinePass.selectedObjects = [earth.planet];
  } else if (intersectedObject === venus.Atmosphere) {
    outlinePass.selectedObjects = [venus.planet];
  } else {
    // For other planets, outline the intersected object itself
    outlinePass.selectedObjects = [intersectedObject];
  }
}
// ******  ZOOM IN/OUT  ******
if (isMovingTowardsPlanet) {
  // Smoothly move the camera towards the target position
  camera.position.lerp(targetCameraPosition, 0.03);

  // Check if the camera is close to the target position
  if (camera.position.distanceTo(targetCameraPosition) < 1) {
      isMovingTowardsPlanet = false;
      showPlanetInfo(selectedPlanet.name);

  }
} else if (isZoomingOut) {
  camera.position.lerp(zoomOutTargetPosition, 0.05);

  if (camera.position.distanceTo(zoomOutTargetPosition) < 1) {
      isZoomingOut = false;
  }
}

  controls.update();
  requestAnimationFrame(animate);
  composer.render();
}
loadAsteroids('/asteroids/asteroidPack.glb', 1000, 130, 160);
loadAsteroids('/asteroids/asteroidPack.glb', 3000, 352, 370);


//HERE
// Глобальная функция для программного выбора планеты
window.selectPlanet = function(planetName) {
  const planetMap = {
    'Mercury': mercury,
    'Venus': venus,
    'Earth': earth,
    'Mars': mars,
    'Jupiter': jupiter,
    'Saturn': saturn,
    'Uranus': uranus,
    'Neptune': neptune,
    'Pluto': pluto
  };

  const planetToSelect = planetMap[planetName];
  if (planetToSelect) {
    // Имитируем логику события клика
    selectedPlanet = identifyPlanet(planetToSelect.planet);
    if (selectedPlanet) {
      closeInfoNoZoomOut(); // Закрываем текущую информацию без полного зума
      settings.accelerationOrbit = 0; // Останавливаем орбитальное движение

      const planetPosition = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(planetPosition);
      controls.target.copy(planetPosition);
      camera.lookAt(planetPosition);

      // Устанавливаем целевую позицию камеры с учетом смещения (offset)
      targetCameraPosition.copy(planetPosition).add(camera.position.clone().sub(planetPosition).normalize().multiplyScalar(offset));
      isMovingTowardsPlanet = true; // Запускаем анимацию приближения камеры
    }
  } else {
    console.warn(`Планета с названием "${planetName}" не найдена.`);
  }
};

// Глобальная функция для программного закрытия информационной панели
window.closePlanetInfo = function() {
  var info = document.getElementById('planetInfo');
  info.style.display = 'none'; // Скрываем элемент с информацией
  settings.accelerationOrbit = 1; // Возобновляем орбитальное движение
  isZoomingOut = true; // Запускаем анимацию отъезда камеры
  controls.target.set(0, 0, 0); // Сбрасываем цель управления камерой на центр
  selectedPlanet = null; // Сбрасываем выбранную планету
};


//HERE 2

// --- Конфигурация безопасности: список дозволенных origin'ов родителя
const ALLOWED_PARENT_ORIGINS = ['*']; 
let lastParentOrigin = '*'; // запасной вариант для ответов

function postToParent(payload) {
  const target = lastParentOrigin || '*';
  try {
    window.parent.postMessage(payload, target);
  } catch (err) {
    console.warn('postToParent failed', err);
  }
}

/* ---------- Приём команд от родителя ---------- */
window.addEventListener('message', (event) => {
  // защита: принимаем только от разрешённых origin'ов
  if (!ALLOWED_PARENT_ORIGINS.includes(event.origin)) {
    console.warn('Rejected message from origin', event.origin);
    return;
  }
  lastParentOrigin = event.origin; // запомним, куда отвечать

  const data = event.data || {};
  const type = data.type || 'command';

  if (type === 'command') {
    const action = data.action;
    const payload = data.payload;

    if (action === 'selectPlanet' && payload?.name) {
      // вызов локальной функции
      try {
        window.selectPlanet(payload.name);
        postToParent({ type: 'response', action: 'selectPlanet', status: 'ok', name: payload.name });
      } catch (e) {
        postToParent({ type: 'response', action: 'selectPlanet', status: 'error', message: e?.message });
      }
      return;
    }

    if (action === 'closePlanetInfo') {
      try {
        window.closePlanetInfo();
        postToParent({ type: 'response', action: 'closePlanetInfo', status: 'ok' });
      } catch (e) {
        postToParent({ type: 'response', action: 'closePlanetInfo', status: 'error', message: e?.message });
      }
      return;
    }

    // поддержка ping/debug
    if (action === 'ping') {
      postToParent({ type: 'pong' });
      return;
    }

    // неизвестная команда
    postToParent({ type: 'response', action, status: 'unknown_command' });
  }
});

/* ---------- Уведомления родителю из iframe (встраиваем внутрь функций) ---------- */
/* Вариант A — обернуть существующие глобальные функции (если они уже определены) */

if (typeof window.selectPlanet === 'function') {
  const _origSelect = window.selectPlanet;
  window.selectPlanet = function(planetName) {
    _origSelect.call(this, planetName); // выполняем старую логику
    // уведомляем родителя, что выбор начался
    postToParent({ type: 'event', event: 'planetSelectStarted', name: planetName });
    // при необходимости отправлять окончание — см. примечание ниже
  };
}

if (typeof window.closePlanetInfo === 'function') {
  const _origClose = window.closePlanetInfo;
  window.closePlanetInfo = function() {
    _origClose.call(this);
    postToParent({ type: 'event', event: 'planetInfoClosed' });
  };
}

/* Вариант B — альтернативно: прямо добавить postToParent(...) в конец тела
   твоих функций selectPlanet и closePlanetInfo (если удобнее редактировать их напрямую).
*/

/* ---------- Отправить "iframe готов" при загрузке ---------- */
window.addEventListener('DOMContentLoaded', () => {
  postToParent({ type: 'event', event: 'iframeReady' });
});


animate();

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onDocumentMouseDown, false);
window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
  composer.setSize(window.innerWidth,window.innerHeight);
});
