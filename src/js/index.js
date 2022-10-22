import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let container, stats, pivot;
let directionalLight;
var mousePosition, rayCaster, btnPlay;  //Menggunakan rayCaster untuk hover object

//Kecepatan rotasi kamera
const cam_speed = 0.001;

const world = new URL('../img/scene.gltf', import.meta.url);

init();     //initialize
animate();  //create animation

function init() {

    container = document.getElementById( 'container' );

    //Menggunakan jenis kamera "Perspective Camera"
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 20000 );
    //Mengatur posisi awal kamera
    camera.position.set(0,4000,0);

    //Membuat Scene dan warna backgroundnya
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0XCFF7FF );

    //Menambahkan kabut
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.00007);

    //Menggunakan jenis lighting "Ambient Light" dan "Directional Light"
    const ambientLight = new THREE.AmbientLight( 0xFFFFFF );
    scene.add( ambientLight );
    directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
    directionalLight.position.set(0, 1000, 1000).normalize();
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );
    
    const assetLoader = new GLTFLoader();
    assetLoader.load(world.href, function(gltf){
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0,0,0);
    }, undefined, function(error){
        console.error(error)
    });
    
    // Texture YOURCRAVE
    var loader = new THREE.TextureLoader();
    var plane = new THREE.PlaneGeometry(625, 77);
    var material = new THREE.MeshLambertMaterial({
        map: loader.load('./src/img/yourcrave.png'),
        transparent: true,
        opacity:1,
        side: THREE.DoubleSide
    });
    var yourcrave = new THREE.Mesh(plane, material);
    yourcrave.position.set(0,4100,-300)
    scene.add(yourcrave);

    // Texture BUTTON_PLAY
    var plane = new THREE.PlaneGeometry(91, 29);
    var material = new THREE.MeshLambertMaterial({
        map: loader.load('./src/img/button_play.png'),
        side: THREE.DoubleSide
    });
    btnPlay = new THREE.Mesh(plane, material);
    btnPlay.position.set(0,3960,-100)
    scene.add(btnPlay);

    //Pivot untuk rotate object dan directionalLight
    pivot = new THREE.Group();
    scene.add( pivot );
    pivot.add( yourcrave );
    pivot.add( btnPlay );
    pivot.add( directionalLight );

    //Menggunakan rayCaster untuk hover object
    mousePosition = new THREE.Vector2();
    window.addEventListener('mousemove', function(e) {
        mousePosition.x = (e.clientX/window.innerWidth) * 2 - 1;
        mousePosition.y = - (e.clientY/window.innerHeight) * 2 + 1;
    });
    rayCaster = new THREE.Raycaster();
    
}

function animate() {

    camera.rotateY(cam_speed);      //Pergerakan kamera
    pivot.rotation.y += cam_speed;  //Pergerakan Yourcrave

    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    stats.update();

    //Menggunakan rayCaster untuk hover object
    rayCaster.setFromCamera(mousePosition, camera);
    const intersects = rayCaster.intersectObjects(scene.children);
    if (intersects.length > 0 && intersects[0].object.id === btnPlay.id) {
        btnPlay.material.color.set(0x78ff66);   // warna hover hijau
        window.addEventListener("click", onclick, true);    // menambah event listener
    } else{
        btnPlay.material.color.set(0XFFFFFF);   // warna biasa putih
        window.removeEventListener("click", onclick, true); // menghapus event listener
    }
    
}

//Membuat halaman menjadi responsive
window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

//Mouse on click
function onclick(event) {
    window.location.href = "./main.html";   //pergi ke main.html
}