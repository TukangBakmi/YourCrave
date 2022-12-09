import * as module from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import Stats from 'three/addons/libs/stats.module.js';
import {
    SunSphere,
    SunLight,
    Skydom,
    StarField
} from './threex.daynight.js';
import {
    BasicCharacterController,
    ThirdPersonCamera,
    charPosX, charPosY, charPosZ
} from './ThirdPersonController.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { NearestFilter } from 'three';

let camera, scene, renderer;
let stats, pivot, dirLight;     // Untuk day/night
let mixers, previousRAF;        // Animation update
let controls, thirdPersonCamera;
let world, timeStamp, charBody, debugRenderer;   // Untuk Physics World
var onRenderFcts= [];
// Lebar sudut kamera
const camAngle = 60;
// Intensitas cahaya
const hemiIntensity = 0.2;
const dirIntensity = 1;
// Atribut world
export const worldWidth = 2048; // Lebar world
const dayTime = 6000   // Lama waktu
// Sound
let backgroundSound, listener;
let volume = 1;
export let soundEffectWalk, soundEffectRun, soundEffectJump;
let walkSound = false;
let runSound = false;
let jumpSound = false;


// Untuk loading screen
export const LoadingManager = new THREE.LoadingManager();
const loadingScreen = document.getElementById('loading-screen');
// Jika sudah selesai di-load, display class ring-nya diubah jadi none
LoadingManager.onProgress = function(url, loaded, total){
    if(loaded == total){
        loadingScreen.style.display = 'none';
		// optional: remove loader from DOM via event listener
		loadingScreen.addEventListener( 'transitionend', function(event){event.target.remove();} );
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

    renderer.getContext().canvas.addEventListener("webglcontextlost", function(event) {
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
    camera = new THREE.PerspectiveCamera( camAngle, window.innerWidth / window.innerHeight, 1, 2*worldWidth );
    // Membuat Scene
    scene = new module.Scene();
    // World yang dipengaruhi physics
    world = new CANNON.World();
    world.gravity.set(0,-100,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    timeStamp = 1.0/60.0;

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
    //updateCharBody();
    //debugRenderer.update();
    charBody.position.x = (charPosX);
    charBody.position.y = (charPosY+4);
    charBody.position.z = (charPosZ);

    renderer.render(scene, camera);
    stats.update();     //Update FPS
    pivot.rotation.x -= Math.PI*2/dayTime;

    var lastTimeMsec= null
    requestAnimationFrame(function anim(t, nowMsec){
        if (previousRAF === null) {
            previousRAF = t;
        }
        animate();
        Step(t - previousRAF);
        previousRAF = t;

        // measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
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

function addLights(){
    // Menggunakan jenis lighting "Hemisphere Light"
    var hemiLight = new THREE.HemisphereLight(0XCFF7FF, 0xFFFFFF, hemiIntensity);
    hemiLight.position.set(0, worldWidth/2, 0);
    scene.add(hemiLight);
    // Menggunakan jenis lighting "Directional Light"
    dirLight = new THREE.DirectionalLight(0xffffff,dirIntensity );
    dirLight.position.set(0, 0, -worldWidth/2);
    dirLight.target.position.set(0, 0, 0);
    dirLight.castShadow = true;
    dirLight.shadow.bias = -0.001;
    // Jarak kamera agar bisa menghasilkan bayangan
    dirLight.shadow.camera.near = 0;
    dirLight.shadow.camera.far = worldWidth;
    // Mempertajam bayangan
    dirLight.shadow.mapSize.width = 4 * worldWidth;
    dirLight.shadow.mapSize.height = 4 * worldWidth;
    // Offset bayangannya
    dirLight.shadow.camera.left = worldWidth/2;
    dirLight.shadow.camera.right = -worldWidth/2;
    dirLight.shadow.camera.top = worldWidth/2;
    dirLight.shadow.camera.bottom = -worldWidth/2;
    scene.add( dirLight );

    // Menambahkan directional light ke pivot agar bisa berotasi
    pivot = new THREE.Group();
    scene.add( pivot );
    pivot.add( dirLight );
}

function addBackSound(){
    //Add BackGround Sound
    listener = new THREE.AudioListener();
    camera.add(listener);
    backgroundSound = new THREE.Audio(listener);    
    let main = new THREE.AudioLoader().load('./src/SoundAsset/backsound-main.mp3',
    (hasil)=>{
        backgroundSound.setBuffer(hasil);
        backgroundSound.play();
        backgroundSound.setLoop(true);
        backgroundSound.setVolume(volume);
    });
    soundEffectWalk = new THREE.Audio(listener);    
    let walk = new THREE.AudioLoader().load('./src/SoundAsset/walk.mp3',
    (hasil)=>{
        soundEffectWalk.setBuffer(hasil);
        soundEffectWalk.setLoop(true);
        soundEffectWalk.setVolume(volume*2);
    });
    soundEffectRun = new THREE.Audio(listener);    
    let run = new THREE.AudioLoader().load('./src/SoundAsset/run.mp3',
    (hasil)=>{
        soundEffectRun.setBuffer(hasil);
        soundEffectRun.setLoop(true);
        soundEffectRun.setVolume(volume*2);
    });
    soundEffectJump = new THREE.Audio(listener);    
    let jump = new THREE.AudioLoader().load('./src/SoundAsset/jump.mp3',
    (hasil)=>{
        soundEffectJump.setBuffer(hasil);
        soundEffectJump.setLoop(true);
        soundEffectJump.setVolume(volume/2);
    });
}

function addDNight(){
    // Sun angle untuk membedakan pagi, siang, sore, malam
    var sunAngle = -Math.PI;
    onRenderFcts.push(function(delta, now){
        sunAngle	+= Math.PI*2/dayTime ;
    })
    // night sky
    var starField	= new StarField()
	scene.add(starField.object3d)
	onRenderFcts.push(function(delta, now){
		starField.update(sunAngle)
	})
    // bola matahari
    var sunSphere = new SunSphere();
    scene.add( sunSphere.object3d );
    onRenderFcts.push(function(delta, now){
        sunSphere.update(sunAngle);
    })
    // cahaya matahari
    var sunLight	= new SunLight()
	scene.add( sunLight.object3d )
	onRenderFcts.push(function(delta, now){
		sunLight.update(sunAngle)
	})
    // langit
    var skydom	= new Skydom()
	scene.add( skydom.object3d )
	onRenderFcts.push(function(delta, now){
		skydom.update(sunAngle)
	})
}

function addPlane(){
    // Plane Cannon js
    let plane = new CANNON.Box(new CANNON.Vec3(worldWidth/2,worldWidth/2,0.1));
    let planebody = new CANNON.Body({shape:plane, mass:0});
    planebody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
    world.addBody(planebody);

    // Plane Three js
    const texture = new THREE.TextureLoader(LoadingManager).load('./src/img/map/_map.png');
    texture.magFilter = NearestFilter;
    const GroundGeometry = new THREE.PlaneGeometry(worldWidth,worldWidth);
    const GroundMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(GroundGeometry,GroundMaterial);
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

function addObject(url, x, y, z){
    const assetLoader = new GLTFLoader(LoadingManager);
    assetLoader.load('./src/img/objects/'+url, function(gltf){
        gltf.scene.traverse( function( node ) {
            if ( node.isMesh ) { node.castShadow = true; }
        });
        gltf.scene.position.set(x,y,z);
        scene.add(gltf.scene);
    });
}

function addObjects(){

    let box = new CANNON.Box(new CANNON.Vec3(2,4,2));
    charBody = new CANNON.Body({
        shape:box, 
        mass:60, 
        type: CANNON.Body.STATIC,
        material: new CANNON.Material()});
    charBody.position.set(0,40,576);
    world.addBody(charBody);

    addObject('maple_tree (1).glb',0,0,20);
    addObject('building1.glb',-32,74,344);
    addObject('hospital.glb', -708,78,-96);
}

document.getElementById("mute").addEventListener("click", function(){
    document.getElementById("mute").classList.add("selected");
    document.getElementById("unmute").classList.remove("selected");
    backgroundSound.setVolume(0);
    soundEffectWalk.setVolume(0);
    soundEffectRun.setVolume(0);
    soundEffectJump.setVolume(0);
});
document.getElementById("unmute").addEventListener("click", function(){
    document.getElementById("unmute").classList.add("selected");
    document.getElementById("mute").classList.remove("selected");
    backgroundSound.setVolume(volume);
    soundEffectWalk.setVolume(volume*2);
    soundEffectRun.setVolume(volume*2);
    soundEffectJump.setVolume(volume/2);
});
document.getElementById("backMenu").addEventListener("click", function(){
    window.location.href = "./index.html";
    backgroundSound.stop();
});