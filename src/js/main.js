import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import Stats from 'three/addons/libs/stats.module.js';
import {
    BasicCharacterController,
    ThirdPersonCamera
} from './ThirdPersonController.js';
import {
    SunSphere,
    SunLight,
    Skydom,
    StarField
} from './threex.daynight.js';

let camera, scene, renderer;
let stats, pivot, dirLight;     // Untuk day/night
let mixers, previousRAF;        // Animation update
let controls, thirdPersonCamera;
var onRenderFcts= [];
// Lebar sudut kamera
const camAngle = 60;
// Intensitas cahaya
const hemiIntensity = 0.1;
const dirIntensity = 0.2;
// Atribut world
export const worldWidth = 2048; // Lebar world
const dayTime = 6000;   // Lama waktu

// Untuk loading screen
export const LoadingManager = new THREE.LoadingManager();
const progressBarContainer = document.querySelector('.ring');
// Jika sudah selesai di-load, display class ring-nya diubah jadi none
LoadingManager.onLoad = function(){
    progressBarContainer.style.display = 'none';
}

init();

function init() {

    renderer = new THREE.WebGLRenderer({
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

    // Membuat halaman menjadi responsive
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    // Menggunakan jenis kamera "Perspective Camera"
    camera = new THREE.PerspectiveCamera( camAngle, window.innerWidth / window.innerHeight, 1, 20000 );

    // Membuat Scene
    scene = new THREE.Scene();

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
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = worldWidth;
    // Mempertajam bayangan
    dirLight.shadow.mapSize.width = 6 * worldWidth;
    dirLight.shadow.mapSize.height = 6 * worldWidth;
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

    //Ground dari PlaneGeometry
    const loader = new THREE.TextureLoader(LoadingManager);
    const GroundGeometry = new THREE.PlaneBufferGeometry(worldWidth,worldWidth);
    const GroundMaterial = new THREE.MeshPhongMaterial({
        map: loader.load('./src/img/ground/land.png'),
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(GroundGeometry,GroundMaterial);
    scene.add(ground);
    ground.rotation.x = -0.5 * Math.PI;
    ground.castShadow = false;
    ground.receiveShadow = true;

    mixers = [];
    previousRAF = null;

    LoadAnimatedModel();
    RAF();
}
    
function LoadAnimatedModel() {
    const params = {
        camera: camera,
        scene: scene,
    }
    controls = new BasicCharacterController(params);
    thirdPersonCamera = new ThirdPersonCamera({
        camera: camera,
        target: controls,
    });
}

function RAF() {
    var lastTimeMsec= null
    requestAnimationFrame(function animate(t, nowMsec){
        if (previousRAF === null) {
            previousRAF = t;
        }
        RAF();
        renderer.render(scene, camera);
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
    stats.update();     //Update FPS
    pivot.rotation.x -= Math.PI*2/dayTime ;
}