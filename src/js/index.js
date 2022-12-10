import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';      //Buat nampilin FPS
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';    //Supaya bisa masukin file .gltf

let camera, scene, renderer;
let stats, pivot, dirLight;
let listener, backgroundSound;

//Atribut kamera
const cam_speed = 0.001;
const cam_x_position = 0;
const cam_y_position = 5000;
const cam_z_position = 0;
//Ini URL world yg udah jadi, formatnya dijadiin gltf, nanti di-load di bawah
const world = new URL('../img/landingPage/minecraft_village.glb', import.meta.url);

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
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    // Menampilkan fps
    stats = new Stats();
    document.body.appendChild(stats.dom);

    //Menggunakan jenis kamera "Perspective Camera"
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 18000 );
    //Mengatur posisi awal kamera
    camera.position.set(cam_x_position,cam_y_position,cam_z_position);
    camera.lookAt(new THREE.Vector3(cam_x_position,0,-(cam_y_position*(2+Math.sqrt(3)))+cam_z_position));

    //Membuat Scene dan warna backgroundnya
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0XCFF7FF );

    //Menggunakan jenis lighting "Ambient Light" dan "Directional Light"
    const ambientLight = new THREE.AmbientLight( 0xFFFFFF );
    scene.add( ambientLight );
    dirLight = new THREE.DirectionalLight( 0xFFFFFF,0.7 );
    dirLight.position.set(cam_x_position, cam_y_position, cam_z_position+2800).normalize();
    scene.add( dirLight );
    
    //Load gltf-nya, trus dimasukin ke scene
    const assetLoader = new GLTFLoader(LoadingManager);
    assetLoader.load(world.href, function(gltf){
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0,0,0);
    });

    // Add backsound
    listener = new THREE.AudioListener();
    camera.add(listener);
    backgroundSound = new THREE.Audio(listener);    
    let main = new THREE.AudioLoader().load('./src/SoundAsset/backsound-index.mp3',
    (hasil)=>{
        backgroundSound.setBuffer(hasil);
        if(!backgroundSound.isPlaying){
            backgroundSound.play();
        }
        backgroundSound.setLoop(true);
        backgroundSound.setVolume(1);
    });

    //Pivot untuk rotate object dan directionalLight
    pivot = new THREE.Group();
    scene.add( pivot );
    pivot.add( dirLight );
    pivot.add( camera )
}

function animate() {

    pivot.rotation.y += cam_speed;  //Pergerakan semua object
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    stats.update();     //Update FPS
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