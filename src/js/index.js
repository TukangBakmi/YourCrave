import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';      //Buat nampilin FPS
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';    //Supaya bisa masukin file .gltf

let camera, scene, renderer;
let stats, pivot, dirLight, hemiLight;
let listener, backgroundSound;

//Atribut kamera
const cam_speed = 0.001;
const cam_y_position = 300;
//Ini URL world yg udah jadi, formatnya dijadiin gltf, nanti di-load di bawah
const worldWidth = 2048;
const hemiIntensity = 0.5;
const dirIntensity = 1;

// Untuk loading screen
const LoadingManager = new THREE.LoadingManager();
const progressBar = document.getElementById('progress-bar');
LoadingManager.onProgress = function(url, loaded, total){
    progressBar.value = (loaded/total) * 100;
}
const progressBarContainer = document.querySelector('.progress-bar-container');
// Jika sudah selesai di-load, display-nya diubah jadi none
LoadingManager.onLoad = function(){
    progressBarContainer.style.display = 'none';
}

init();     //initialize
animate();  //create animation

function init() {

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#bg"),
        antialias: true,
    });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // Menampilkan fps
    stats = new Stats();
    document.body.appendChild(stats.dom);

    //Menggunakan jenis kamera "Perspective Camera"
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 5000 );
    //Mengatur posisi awal kamera
    camera.position.set(0, cam_y_position, -worldWidth / 2);
    camera.lookAt(new THREE.Vector3(0,0,0));

    //Membuat Scene dan warna backgroundnya
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0XCFF7FF );

    // Add backsound
    listener = new THREE.AudioListener();
    camera.add(listener);
    backgroundSound = new THREE.Audio(listener);    
    let main = new THREE.AudioLoader().load('./src/SoundAsset/backsound-index.mp3',
    (hasil)=>{
        backgroundSound.setBuffer(hasil);
        backgroundSound.setLoop(true);
        backgroundSound.setVolume(1);
    });

    //Pivot untuk rotate object dan directionalLight
    pivot = new THREE.Group();
    scene.add( pivot );
    pivot.add( camera );

    addLights();
    addPlane();
    addObject('building1.glb', 0, 0, 0);
    addObject('building2.glb', 0, 0, 0);
}

function animate() {

    pivot.rotation.y += cam_speed;  //Pergerakan semua object
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    stats.update();     //Update FPS
}

function addLights() {
    // Menggunakan jenis lighting "Hemisphere Light"
    hemiLight = new THREE.HemisphereLight(0XCFF7FF, 0xFFFFFF, hemiIntensity);
    hemiLight.position.set(0, worldWidth / 2, 0);
    scene.add(hemiLight);
    // Menggunakan jenis lighting "Directional Light"
    dirLight = new THREE.DirectionalLight(0xffffff, dirIntensity);
    dirLight.position.set(0, cam_y_position, -worldWidth / 2);
    dirLight.castShadow = true;
    dirLight.shadow.bias = -0.001;
    // Jarak kamera agar bisa menghasilkan bayangan
    dirLight.shadow.camera.near = 0;
    dirLight.shadow.camera.far = worldWidth;
    // Mempertajam bayangan
    dirLight.shadow.mapSize.width = worldWidth;
    dirLight.shadow.mapSize.height = worldWidth;
    // Offset bayangannya
    dirLight.shadow.camera.left = worldWidth / 2;
    dirLight.shadow.camera.right = -worldWidth / 2;
    dirLight.shadow.camera.top = worldWidth / 2;
    dirLight.shadow.camera.bottom = -worldWidth / 2;

    // Menambahkan directional light ke pivot agar bisa berotasi
    pivot.add(dirLight);
}

function addPlane() {
    const texture = new THREE.TextureLoader(LoadingManager).load('./src/img/map/_map.png');
    const GroundGeometry = new THREE.PlaneGeometry(worldWidth, worldWidth);
    const GroundMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(GroundGeometry, GroundMaterial);
    scene.add(ground);
    ground.rotation.x = -0.5 * Math.PI;
    ground.rotation.z = 3/2 * Math.PI;
    ground.castShadow = false;
    ground.receiveShadow = true;
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
        gltf.scene.rotateY(3/2 * Math.PI);
        scene.add(gltf.scene);
    });
}

//Membuat halaman menjadi responsive
window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

document.getElementById("mute").addEventListener("click", function(){
    document.getElementById("mute").classList.add("selected");
    document.getElementById("unmute").classList.remove("selected");
    backgroundSound.setVolume(0);
});
document.getElementById("unmute").addEventListener("click", function(){
    document.getElementById("unmute").classList.add("selected");
    document.getElementById("mute").classList.remove("selected");
    if(!backgroundSound.isPlaying){
        backgroundSound.play();
    }
    backgroundSound.setVolume(1);
});
document.getElementById("play").addEventListener("click", function(){
    window.location.href = "./main.html";
    backgroundSound.stop();
});
document.getElementById("credit").addEventListener("click", function(){
    window.location.href = "./credit.html";
    backgroundSound.stop();
});