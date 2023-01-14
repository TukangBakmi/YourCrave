import * as module from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import Stats from 'three/addons/libs/stats.module.js';
import {
    SunSphere,
    SunLight,
    Skydom,
    StarField,
    currentPhase
} from './threex.daynight.js';
import {
    BasicCharacterController,
    ThirdPersonCamera,
    charPosX,
    charPosY,
    charPosZ
} from './ThirdPersonController.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {NearestFilter} from 'three';

let camera, scene, renderer;
let stats, pivot, dirLight, hemiLight, spotLight, sunAngle; // Untuk day/night
let mixers, previousRAF; // Animation update
let controls, thirdPersonCamera;
let world, timeStamp, charBody, debugRenderer; // Untuk Physics World
var onRenderFcts = [];
// Lebar sudut kamera
const camAngle = 60;
// Intensitas cahaya
const hemiIntensity = 0.5;
const dirIntensity = 1;
// Atribut world
export const worldWidth = 2048; // Lebar world
const dayTime = 6000 // Lama waktu
const objectsToUpdate = []
// Sound
let backgroundSound, listener;
let volume = 1;
export let soundEffectWalk, soundEffectRun, soundEffectJump;


// Untuk loading screen
export const LoadingManager = new THREE.LoadingManager();
const loadingScreen = document.getElementById('loading-screen');
// Jika sudah selesai di-load, display class ring-nya diubah jadi none
LoadingManager.onProgress = function (url, loaded, total) {
    if (loaded == total) {
        loadingScreen.style.display = 'none';
        // optional: remove loader from DOM via event listener
        loadingScreen.addEventListener('transitionend', function (event) {
            event.target.remove();
        });
    }
}

init();
animate();

function init() {

    renderer = new module.WebGLRenderer({
        canvas: document.querySelector("#bg"),
        antialias: true,
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // Menampilkan fps
    stats = new Stats();
    document.body.appendChild(stats.dom);

    renderer.getContext().canvas.addEventListener("webglcontextlost", function (event) {
        event.preventDefault();
        window.location.href = "./main.html";
    }, false);

    // Membuat halaman menjadi responsive
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    // Menggunakan jenis kamera "Perspective Camera"
    camera = new THREE.PerspectiveCamera(camAngle, window.innerWidth / window.innerHeight, 1, 2 * worldWidth);
    // Membuat Scene
    scene = new module.Scene();
    // World yang dipengaruhi physics
    world = new CANNON.World();
    world.gravity.set(0, -100, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    timeStamp = 1.0 / 60.0;

    addLights();
    addBackSound();
    addDNight();
    addPlane();
    LoadAnimatedModel();
    addObjects();

    //debugRenderer = new THREE.CannonDebugRenderer(scene,world);
    mixers = [];
    previousRAF = null;
}

function animate() {
    // Update physics
    world.step(timeStamp);
    //debugRenderer.update();
    charBody.position.x = (charPosX);
    charBody.position.y = (charPosY + 4);
    charBody.position.z = (charPosZ);
    // Moving object
    for (const object of objectsToUpdate) {
        object.carAndBody.car.position.copy(object.carAndBody.body.position);
        object.carAndBody.car.quaternion.copy(object.carAndBody.body.quaternion);
        object.carAndBody.body.position.y = object.carAndBody.height;
        if (object.carAndBody.face == "up") {
            object.carAndBody.light.position.set(object.carAndBody.body.position.x, 8, object.carAndBody.body.position.z - object.carAndBody.width);
            object.carAndBody.light.target.position.set(object.carAndBody.body.position.x, 8, -1024);
            object.carAndBody.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI * 0 / 2);
            if (
                (object.carAndBody.body.position.z - object.carAndBody.width - 2 < charBody.position.z + 2) &&
                (object.carAndBody.body.position.z - object.carAndBody.width - 2 > charBody.position.z - 2) &&
                (object.carAndBody.body.position.x + object.carAndBody.length > charBody.position.x - 2) &&
                (object.carAndBody.body.position.x - object.carAndBody.length < charBody.position.x + 2)) {} else {
                object.carAndBody.body.position.z -= object.carAndBody.speed;
            }

            if (object.carAndBody.line == 1) {
                object.carAndBody.body.position.x = -792;
                if (object.carAndBody.body.position.z <= -344) {
                    object.carAndBody.face = "right";
                    object.carAndBody.line = 2;
                }
            }
            if (object.carAndBody.line == 3) {
                object.carAndBody.body.position.x = -664;
                if (object.carAndBody.body.position.z <= -408) {
                    object.carAndBody.face = "right";
                    object.carAndBody.line = 4;
                }
            }
            if (object.carAndBody.line == 5) {
                object.carAndBody.body.position.x = -408;
                if (object.carAndBody.body.position.z <= -472) {
                    object.carAndBody.face = "right";
                    object.carAndBody.line = 6;
                }
            }
            if (object.carAndBody.line == 7) {
                object.carAndBody.body.position.x = 296;
                if (object.carAndBody.body.position.z <= -488) {
                    object.carAndBody.face = "left";
                    object.carAndBody.line = 6;
                }
            }
            if (object.carAndBody.line == 9) {
                object.carAndBody.body.position.x = 680;
                if (object.carAndBody.body.position.z <= -168) {
                    object.carAndBody.face = "left";
                    object.carAndBody.line = 8;
                }
            }
            if (object.carAndBody.line == 11) {
                object.carAndBody.body.position.x = 872;
                if (object.carAndBody.body.position.z <= -40) {
                    object.carAndBody.face = "left";
                    object.carAndBody.line = 10;
                }
            }
            if (object.carAndBody.line == 13) {
                object.carAndBody.body.position.x = 744;
                if (object.carAndBody.body.position.z <= 296) {
                    object.carAndBody.face = "right";
                    object.carAndBody.line = 12;
                }
            }
            if (object.carAndBody.line == 15) {
                object.carAndBody.body.position.x = -216;
                if (object.carAndBody.body.position.z <= 408) {
                    object.carAndBody.face = "left";
                    object.carAndBody.line = 16;
                }
            }
        }

        if (object.carAndBody.face == "right") {
            object.carAndBody.light.position.set(object.carAndBody.body.position.x + object.carAndBody.width, 8, object.carAndBody.body.position.z);
            object.carAndBody.light.target.position.set(1024, 8, object.carAndBody.body.position.z);
            object.carAndBody.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI * 1 / 2);
            if (
                (object.carAndBody.body.position.x + object.carAndBody.width + 2 < charBody.position.x + 2) &&
                (object.carAndBody.body.position.x + object.carAndBody.width + 2 > charBody.position.x - 2) &&
                (object.carAndBody.body.position.z + object.carAndBody.length > charBody.position.z - 2) &&
                (object.carAndBody.body.position.z - object.carAndBody.length < charBody.position.z + 2)) {} else {
                object.carAndBody.body.position.x += object.carAndBody.speed;
            }

            if (object.carAndBody.line == 2) {
                object.carAndBody.body.position.z = -344;
                if (object.carAndBody.body.position.x >= -664) {
                    object.carAndBody.face = "up";
                    object.carAndBody.line = 3;
                }
            }
            if (object.carAndBody.line == 4) {
                object.carAndBody.body.position.z = -408;
                if (object.carAndBody.body.position.x >= -408) {
                    object.carAndBody.face = "up";
                    object.carAndBody.line = 5;
                }
            }
            if (object.carAndBody.line == 6) {
                object.carAndBody.body.position.z = -472;
                if (object.carAndBody.body.position.x >= 280) {
                    object.carAndBody.face = "down";
                    object.carAndBody.line = 7;
                }
            }
            if (object.carAndBody.line == 8) {
                object.carAndBody.body.position.z = -152;
                if (object.carAndBody.body.position.x >= 664) {
                    object.carAndBody.face = "down";
                    object.carAndBody.line = 9;
                }
            }
            if (object.carAndBody.line == 10) {
                object.carAndBody.body.position.z = -24;
                if (object.carAndBody.body.position.x >= 856) {
                    object.carAndBody.face = "down";
                    object.carAndBody.line = 11;
                }
            }
            if (object.carAndBody.line == 12) {
                object.carAndBody.body.position.z = 296;
                if (object.carAndBody.body.position.x >= 872) {
                    object.carAndBody.face = "up";
                    object.carAndBody.line = 11;
                }
            }
            if (object.carAndBody.line == 14) {
                object.carAndBody.body.position.z = 552;
                if (object.carAndBody.body.position.x >= 744) {
                    object.carAndBody.face = "up";
                    object.carAndBody.line = 13;
                }
            }
            if (object.carAndBody.line == 16) {
                object.carAndBody.body.position.z = 424;
                if (object.carAndBody.body.position.x >= -232) {
                    object.carAndBody.face = "down";
                    object.carAndBody.line = 15;
                }
            }
        }
        if (object.carAndBody.face == "down") {
            object.carAndBody.light.position.set(object.carAndBody.body.position.x, 8, object.carAndBody.body.position.z + object.carAndBody.width);
            object.carAndBody.light.target.position.set(object.carAndBody.body.position.x, 8, 1024);
            object.carAndBody.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI * 2 / 2);
            if (
                (object.carAndBody.body.position.z + object.carAndBody.width + 2 < charBody.position.z + 2) &&
                (object.carAndBody.body.position.z + object.carAndBody.width + 2 > charBody.position.z - 2) &&
                (object.carAndBody.body.position.x + object.carAndBody.length > charBody.position.x - 2) &&
                (object.carAndBody.body.position.x - object.carAndBody.length < charBody.position.x + 2)) {} else {
                object.carAndBody.body.position.z += object.carAndBody.speed;
            }

            if (object.carAndBody.line == 1) {
                object.carAndBody.body.position.x = -808;
                if (object.carAndBody.body.position.z >= 424) {
                    object.carAndBody.face = "right";
                    object.carAndBody.line = 16;
                }
            }
            if (object.carAndBody.line == 3) {
                object.carAndBody.body.position.x = -680;
                if (object.carAndBody.body.position.z >= -360) {
                    object.carAndBody.face = "left";
                    object.carAndBody.line = 2;
                }
            }
            if (object.carAndBody.line == 5) {
                object.carAndBody.body.position.x = -424;
                if (object.carAndBody.body.position.z >= -424) {
                    object.carAndBody.face = "left";
                    object.carAndBody.line = 4;
                }
            }
            if (object.carAndBody.line == 7) {
                object.carAndBody.body.position.x = 280;
                if (object.carAndBody.body.position.z >= -152) {
                    object.carAndBody.face = "right";
                    object.carAndBody.line = 8;
                }
            }
            if (object.carAndBody.line == 9) {
                object.carAndBody.body.position.x = 664;
                if (object.carAndBody.body.position.z >= -24) {
                    object.carAndBody.face = "right";
                    object.carAndBody.line = 10;
                }
            }
            if (object.carAndBody.line == 11) {
                object.carAndBody.body.position.x = 856;
                if (object.carAndBody.body.position.z >= 280) {
                    object.carAndBody.face = "left";
                    object.carAndBody.line = 12;
                }
            }
            if (object.carAndBody.line == 13) {
                object.carAndBody.body.position.x = 728;
                if (object.carAndBody.body.position.z >= 536) {
                    object.carAndBody.face = "left";
                    object.carAndBody.line = 14;
                }
            }
            if (object.carAndBody.line == 15) {
                object.carAndBody.body.position.x = -232;
                if (object.carAndBody.body.position.z >= 552) {
                    object.carAndBody.face = "right";
                    object.carAndBody.line = 14;
                }
            }
        }
        if (object.carAndBody.face == "left") {
            object.carAndBody.light.position.set(object.carAndBody.body.position.x - object.carAndBody.width, 8, object.carAndBody.body.position.z);
            object.carAndBody.light.target.position.set(-1024, 8, object.carAndBody.body.position.z);
            object.carAndBody.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI * 3 / 2);
            if (
                (object.carAndBody.body.position.x - object.carAndBody.width - 2 < charBody.position.x + 2) &&
                (object.carAndBody.body.position.x - object.carAndBody.width - 2 > charBody.position.x - 2) &&
                (object.carAndBody.body.position.z + object.carAndBody.length > charBody.position.z - 2) &&
                (object.carAndBody.body.position.z - object.carAndBody.length < charBody.position.z + 2)) {} else {
                object.carAndBody.body.position.x -= object.carAndBody.speed;
            }

            if (object.carAndBody.line == 2) {
                object.carAndBody.body.position.z = -360;
                if (object.carAndBody.body.position.x <= -808) {
                    object.carAndBody.face = "down";
                    object.carAndBody.line = 1;
                }
            }
            if (object.carAndBody.line == 4) {
                object.carAndBody.body.position.z = -424;
                if (object.carAndBody.body.position.x <= -680) {
                    object.carAndBody.face = "down";
                    object.carAndBody.line = 3;
                }
            }
            if (object.carAndBody.line == 6) {
                object.carAndBody.body.position.z = -488;
                if (object.carAndBody.body.position.x <= -424) {
                    object.carAndBody.face = "down";
                    object.carAndBody.line = 5;
                }
            }
            if (object.carAndBody.line == 8) {
                object.carAndBody.body.position.z = -168;
                if (object.carAndBody.body.position.x <= 296) {
                    object.carAndBody.face = "up";
                    object.carAndBody.line = 7;
                }
            }
            if (object.carAndBody.line == 10) {
                object.carAndBody.body.position.z = -40;
                if (object.carAndBody.body.position.x <= 680) {
                    object.carAndBody.face = "up";
                    object.carAndBody.line = 9;
                }
            }
            if (object.carAndBody.line == 12) {
                object.carAndBody.body.position.z = 280;
                if (object.carAndBody.body.position.x <= 728) {
                    object.carAndBody.face = "down";
                    object.carAndBody.line = 13;
                }
            }
            if (object.carAndBody.line == 14) {
                object.carAndBody.body.position.z = 536;
                if (object.carAndBody.body.position.x <= -216) {
                    object.carAndBody.face = "up";
                    object.carAndBody.line = 15;
                }
            }
            if (object.carAndBody.line == 16) {
                object.carAndBody.body.position.z = 408;
                if (object.carAndBody.body.position.x <= -792) {
                    object.carAndBody.face = "up";
                    object.carAndBody.line = 1;
                }
            }
        }

    }

    var phase = currentPhase(sunAngle)
    if (phase === 'day') {
        if (hemiLight.intensity < 0.5) {
            hemiLight.intensity += 0.001;
        }
        if (dirLight.intensity < 1) {
            dirLight.intensity += 0.001;
        }
    } else if (phase === 'twilight') {
        if (hemiLight.intensity > 0.2) {
            hemiLight.intensity -= 0.001;
        }
        if (dirLight.intensity > 0.2) {
            dirLight.intensity -= 0.002;
        }
    } else {
        if (hemiLight.intensity > 0.05) {
            hemiLight.intensity -= 0.001;
        }
        if (dirLight.intensity > 0) {
            dirLight.intensity -= 0.001;
        } else {
            dirLight.intensity = 0;
        }
    }

    renderer.render(scene, camera);
    stats.update(); //Update FPS
    pivot.rotation.x -= Math.PI * 2 / dayTime;

    var lastTimeMsec = null
    requestAnimationFrame(function anim(t, nowMsec) {
        if (previousRAF === null) {
            previousRAF = t;
        }
        animate();
        Step(t - previousRAF);
        previousRAF = t;

        // measure time
        lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
        var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
        lastTimeMsec = nowMsec
        // call each update function
        onRenderFcts.forEach(function (onRenderFct) {
            onRenderFct(deltaMsec / 1000, nowMsec / 1000)
        })
    });
}

function Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (mixers) {
        mixers.map(m => m.update(timeElapsedS));
    }
    if (controls) {
        controls.Update(timeElapsedS);
    }
    thirdPersonCamera.Update(timeElapsedS);
}

function addLights() {
    // Menggunakan jenis lighting "Hemisphere Light"
    hemiLight = new THREE.HemisphereLight(0XCFF7FF, 0xFFFFFF, hemiIntensity);
    hemiLight.position.set(0, worldWidth / 2, 0);
    scene.add(hemiLight);
    // Menggunakan jenis lighting "Directional Light"
    dirLight = new THREE.DirectionalLight(0xffffff, dirIntensity);
    dirLight.position.set(0, 0, -worldWidth / 2);
    dirLight.target.position.set(0, 0, 0);
    dirLight.castShadow = true;
    dirLight.shadow.bias = -0.001;
    // Jarak kamera agar bisa menghasilkan bayangan
    dirLight.shadow.camera.near = 0;
    dirLight.shadow.camera.far = worldWidth;
    // Mempertajam bayangan
    dirLight.shadow.mapSize.width = 3 * worldWidth;
    dirLight.shadow.mapSize.height = 3 * worldWidth;
    // Offset bayangannya
    dirLight.shadow.camera.left = worldWidth / 2;
    dirLight.shadow.camera.right = -worldWidth / 2;
    dirLight.shadow.camera.top = worldWidth / 2;
    dirLight.shadow.camera.bottom = -worldWidth / 2;
    scene.add(dirLight);

    // Menambahkan directional light ke pivot agar bisa berotasi
    pivot = new THREE.Group();
    scene.add(pivot);
    pivot.add(dirLight);
}

function addBackSound() {
    //Add BackGround Sound
    listener = new THREE.AudioListener();
    camera.add(listener);
    backgroundSound = new THREE.Audio(listener);
    let main = new THREE.AudioLoader().load('./src/SoundAsset/backsound-main.mp3',
        (hasil) => {
            backgroundSound.setBuffer(hasil);
            backgroundSound.play();
            backgroundSound.setLoop(true);
            backgroundSound.setVolume(volume);
        });
    soundEffectWalk = new THREE.Audio(listener);
    let walk = new THREE.AudioLoader().load('./src/SoundAsset/walk.mp3',
        (hasil) => {
            soundEffectWalk.setBuffer(hasil);
            soundEffectWalk.setLoop(true);
            soundEffectWalk.setVolume(volume * 2);
        });
    soundEffectRun = new THREE.Audio(listener);
    let run = new THREE.AudioLoader().load('./src/SoundAsset/run.mp3',
        (hasil) => {
            soundEffectRun.setBuffer(hasil);
            soundEffectRun.setLoop(true);
            soundEffectRun.setVolume(volume * 2);
        });
    soundEffectJump = new THREE.Audio(listener);
    let jump = new THREE.AudioLoader().load('./src/SoundAsset/jump.mp3',
        (hasil) => {
            soundEffectJump.setBuffer(hasil);
            soundEffectJump.setLoop(true);
            soundEffectJump.setVolume(volume / 2);
        });
}

function addDNight() {
    // Sun angle untuk membedakan pagi, siang, sore, malam
    sunAngle = -Math.PI;
    onRenderFcts.push(function (delta, now) {
        sunAngle += Math.PI * 2 / dayTime;
    })
    // night sky
    var starField = new StarField()
    scene.add(starField.object3d)
    onRenderFcts.push(function (delta, now) {
        starField.update(sunAngle)
    })
    // bola matahari
    var sunSphere = new SunSphere();
    scene.add(sunSphere.object3d);
    onRenderFcts.push(function (delta, now) {
        sunSphere.update(sunAngle);
    })
    // cahaya matahari
    var sunLight = new SunLight()
    scene.add(sunLight.object3d)
    onRenderFcts.push(function (delta, now) {
        sunLight.update(sunAngle)
    })
    // langit
    var skydom = new Skydom()
    scene.add(skydom.object3d)
    onRenderFcts.push(function (delta, now) {
        skydom.update(sunAngle)
    })
}

function addPlane() {
    // Plane Cannon js
    let plane = new CANNON.Box(new CANNON.Vec3(worldWidth / 2, worldWidth / 2, 0.1));
    let planebody = new CANNON.Body({
        shape: plane,
        mass: 0
    });
    planebody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(planebody);

    // Plane Three js
    const texture = new THREE.TextureLoader(LoadingManager).load('./src/img/map/_map.png');
    texture.magFilter = NearestFilter;
    const GroundGeometry = new THREE.PlaneGeometry(worldWidth, worldWidth);
    const GroundMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(GroundGeometry, GroundMaterial);
    scene.add(ground);
    ground.rotation.x = -0.5 * Math.PI;
    ground.castShadow = false;
    ground.receiveShadow = true;
}

function LoadAnimatedModel() {
    controls = new BasicCharacterController({
        camera: camera,
        scene: scene,
    });
    thirdPersonCamera = new ThirdPersonCamera({
        camera: camera,
        target: controls,
    });
}

function addObject(url, x, y, z) {
    const assetLoader = new GLTFLoader(LoadingManager);
    assetLoader.load('./src/img/objects/' + url, function (gltf) {
        gltf.scene.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
            }
        });
        gltf.scene.position.set(x, y, z);
        scene.add(gltf.scene);
    });
}

function addMovingObject(url, length, height, width, face, speed, line, x, z) {
    const assetLoader = new GLTFLoader(LoadingManager);
    assetLoader.load('./src/img/objects/' + url, (gltf) => {
        const meshCar = gltf.scene;
        meshCar.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
            }
        });
        scene.add(meshCar);

        const light = new THREE.SpotLight(0xffffff, 0.5, 192, 0.5);
        scene.add(light);
        scene.add(light.target);

        // Cannon.js bodyconst
        let shape = new CANNON.Box(new CANNON.Vec3(length, height, width));
        const body = new CANNON.Body({
            shape: shape,
            mass: 1,
            material: new CANNON.Material(),
            position: new CANNON.Vec3(x, height, z)
        })
        world.addBody(body)
        // Save in objects to update
        objectsToUpdate.push({
            carAndBody: {
                car: meshCar,
                body: body,
                light: light,
                length: length,
                width: width,
                height: height,
                face: face,
                speed: speed,
                line: line
            }
        })
    })
}

function addStreetLights(x, height, z, face) {
    const assetLoader = new GLTFLoader(LoadingManager);
    assetLoader.load('./src/img/objects/streetLight.glb', function (gltf) {
        gltf.scene.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
            }
        });
        gltf.scene.position.set(x, height, z);
        scene.add(gltf.scene);
        // spotLight = new THREE.SpotLight(0xffffff, 0.4, 128, 1.3);
        // spotLight.castShadow = true;
        // spotLight.shadow.mapSize.width = 256;
        // spotLight.shadow.mapSize.height = 256;

        // if (face == 'left') {
        //     spotLight.position.set(x - 8, 2 * height - 1, z);
        //     spotLight.target.position.set(x - 8, 0 * height, z);
        //     gltf.scene.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI * 2 / 2);
        // }
        // if (face == 'right') {
        //     spotLight.position.set(x + 8, 2 * height - 1, z);
        //     spotLight.target.position.set(x + 8, 0 * height, z);
        //     gltf.scene.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI * 0 / 2);
        // }
        // if (face == 'up') {
        //     spotLight.position.set(x, 2 * height - 1, z - 8);
        //     spotLight.target.position.set(x, 0 * height, z - 8);
        //     gltf.scene.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI * 3 / 2);
        // }
        // if (face == 'down') {
        //     spotLight.position.set(x, 2 * height - 1, z + 8);
        //     spotLight.target.position.set(x - 8, 0 * height, z + 8);
        //     gltf.scene.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI * 1 / 2);
        // }
        // scene.add(spotLight);
        // scene.add(spotLight.target);
    });
}

function addObjects() {

    let box = new CANNON.Box(new CANNON.Vec3(2, 4, 2));
    charBody = new CANNON.Body({
        shape: box,
        mass: 60,
        type: CANNON.Body.STATIC,
        material: new CANNON.Material()
    });
    charBody.position.set(0, 40, 576);
    world.addBody(charBody);

    addObject('building1.glb', 0, 0, 0);
    addObject('building2.glb', 0, 0, 0);
    addMovingObject('carOrange.glb', 6, 4, 8, 'down', 1.5, 1, -808, 0);
    addMovingObject('carBlue.glb', 6, 4, 8, 'left', 1.5, 8, 384, -168);
    addMovingObject('carPink.glb', 6, 4, 8, 'right', 1.5, 2, -704, -344);
    addMovingObject('truckWhite.glb', 6, 8, 16, 'right', 1.5, 6, 0, -472);
    addMovingObject('truckBlack.glb', 6, 8, 16, 'left', 1.5, 14, 448, 536);
    addMovingObject('busGreen.glb', 6, 8, 18, 'left', 1.5, 6, -384, -488);
    addMovingObject('busGrey.glb', 6, 8, 18, 'down', 1.5, 9, 664, -64);
    addMovingObject('schoolbusYellow.glb', 6, 8, 20, 'left', 1.5, 16, -704, 408);
    addMovingObject('vehicle_policeCar.glb', 6, 4, 8, 'up', 1.5, 11, 872, 192);
    addMovingObject('vehicle_fireTruck.glb', 6, 7, 18, 'down', 1.5, 15, -232, 480);
    for (let i = 352; i >= -288; i -= 256) {
        addStreetLights(-820, 16, i, "right");
    }
    addStreetLights(-640, 16, -436, "down");
    for (let i = -256; i <= 256; i += 256) {
        addStreetLights(i, 16, -500, "down");
    }
    addStreetLights(448, 16, -180, "down");
    addStreetLights(884, 16, 0, "left");
    addStreetLights(756, 16, 384, "left");
    for (let i = 512; i >= 0; i -= 256) {
        addStreetLights(i, 16, 564, "up");
    }
    addStreetLights(-320, 16, 436, "up");
}

document.getElementById("mute").addEventListener("click", function () {
    document.getElementById("mute").classList.add("selected");
    document.getElementById("unmute").classList.remove("selected");
    backgroundSound.setVolume(0);
    soundEffectWalk.setVolume(0);
    soundEffectRun.setVolume(0);
    soundEffectJump.setVolume(0);
});
document.getElementById("unmute").addEventListener("click", function () {
    document.getElementById("unmute").classList.add("selected");
    document.getElementById("mute").classList.remove("selected");
    backgroundSound.setVolume(volume);
    soundEffectWalk.setVolume(volume * 2);
    soundEffectRun.setVolume(volume * 2);
    soundEffectJump.setVolume(volume / 2);
});
document.getElementById("backMenu").addEventListener("click", function () {
    window.location.href = "./index.html";
    backgroundSound.stop();
});