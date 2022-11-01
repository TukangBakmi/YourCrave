import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { BasicCharacterController } from './ThirdPersonController.js';
import { ThirdPersonCamera } from './ThirdPersonController.js';
import Stats from 'three/addons/libs/stats.module.js';

let camera, scene, renderer;
let stats, pivot, dirLight;     // Untuk day/night
let mixers, previousRAF;        // Animation update
let controls, thirdPersonCamera;
// Atribut world
const worldWidth = 2048;
const worldLength = 2048;
const rotation = 0.01;
let opcty = 1;

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
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );

    // Membuat Scene dan warna backgroundnya
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0X00316e);

    // Menambahkan kabut
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.001);

    // Menggunakan jenis lighting "Hemisphere Light"
    var hemiLight = new THREE.HemisphereLight(0XCFF7FF, 0xFFFFFF, 0.2);
    hemiLight.position.set(0, 1024, 0);
    scene.add(hemiLight);
    // Menggunakan jenis lighting "Directional Light"
    dirLight = new THREE.DirectionalLight(0xffffff,0.6 );
    dirLight.position.set(0, 0.5 * worldWidth, 0);
    dirLight.target.position.set(0, 0, 0);
    dirLight.castShadow = true;
    dirLight.shadow.bias = -0.001;
    // Jarak kamera agar bisa menghasilkan bayangan
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = worldWidth;
    // Mempertajam bayangan
    dirLight.shadow.mapSize.width = 6 * worldWidth;
    dirLight.shadow.mapSize.height = 6 * worldLength;
    // Offset bayangannya
    dirLight.shadow.camera.left = worldLength/2;
    dirLight.shadow.camera.right = -worldLength/2;
    dirLight.shadow.camera.top = worldLength/2;
    dirLight.shadow.camera.bottom = -worldLength/2;
    scene.add( dirLight );

    const dLightHelper = new THREE.DirectionalLightHelper(dirLight, 5);
    scene.add(dLightHelper);

    const dLightShadowHelper = new THREE.CameraHelper(dirLight.shadow.camera);
    scene.add(dLightShadowHelper);

    // Menambahkan directional light ke pivot agar bisa berotasi
    pivot = new THREE.Group();
    scene.add( pivot );
    pivot.add( dirLight );

    // Shader untuk langit
    SkyDome();

    var onRenderFcts= [];
    var sunAngle = -1/6*Math.PI*2;
    var sunAngle = -3/6*Math.PI*2;
    onRenderFcts.push(function(delta, now){
        var dayDuration	= 10	// nb seconds for a full day cycle
        sunAngle	+= delta/dayDuration * Math.PI*2
    })

    //Ground dari PlaneGeometry
    const loader = new THREE.TextureLoader();
    const GroundGeometry = new THREE.PlaneBufferGeometry(worldWidth,worldLength);
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

function SkyDome(){
    var vertexShaderDay = `
        varying vec3 worldPosition;
        void main() {
            vec4 mPosition = modelMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            worldPosition = mPosition.xyz;
        }`
    var fragmentShaderDay =`
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;

        varying vec3 worldPosition;
        void main() {
            float h = normalize( worldPosition + offset ).y;
            gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ),`+ opcty +`);
        }`
    var uniforms = {
        topColor: { type: "c", value: new THREE.Color(0x0077ff) },
        bottomColor: { type: "c", value: new THREE.Color(0xffffff) },
        offset: { type: "f", value: 33 },
        exponent: { type: "f", value: 0.6 }
    };
    scene.fog.color.copy(uniforms.bottomColor.value);
    // Menambahkan langit
    var skyGeo = new THREE.SphereGeometry(worldWidth/2, worldWidth/10, worldLength/10);
    var skyMat = new THREE.ShaderMaterial({
        vertexShader: vertexShaderDay,
        fragmentShader: fragmentShaderDay,
        uniforms: uniforms,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.5,
    });
    var sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
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
    requestAnimationFrame((t) => {
        if (previousRAF === null) {
            previousRAF = t;
        }
        RAF();
        renderer.render(scene, camera);
        Step(t - previousRAF);
        previousRAF = t;
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
}