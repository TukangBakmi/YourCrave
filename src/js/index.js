import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';      //Buat nampilin FPS
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';    //Supaya bisa masukin file .gltf

let camera, scene, renderer;
let stats, pivot, dirLight;
var mousePosition, rayCaster, btnPlay;  //Menggunakan rayCaster untuk hover object

//Atribut kamera
const cam_speed = 0.001;
const cam_x_position = 0;
const cam_y_position = 5000;
const cam_z_position = 0;
const cam_a = 200-(100*Math.sqrt(3));
//Ini URL world yg udah jadi, formatnya dijadiin gltf, nanti di-load di bawah
const world = new URL('../img/landingPage/scene.gltf', import.meta.url);

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
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    //Mengatur posisi awal kamera
    camera.position.set(cam_x_position,cam_y_position,cam_z_position);
    camera.lookAt(new THREE.Vector3(cam_x_position,0,-(cam_y_position*(2+Math.sqrt(3)))+cam_z_position));

    //Membuat Scene dan warna backgroundnya
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0XCFF7FF );

    //Menambahkan kabut
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.00007);

    //Menggunakan jenis lighting "Ambient Light" dan "Directional Light"
    const ambientLight = new THREE.AmbientLight( 0xFFFFFF );
    scene.add( ambientLight );
    dirLight = new THREE.DirectionalLight( 0xFFFFFF,0.7 );
    dirLight.position.set(cam_x_position, cam_y_position, cam_z_position+2800).normalize();
    scene.add( dirLight );
    
    //Load gltf-nya, trus dimasukin ke scene
    const assetLoader = new GLTFLoader();
    assetLoader.load(world.href, function(gltf){
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0,0,0);
    });
    
    // Texture YOURCRAVE
    var loader = new THREE.TextureLoader();
    var plane = new THREE.PlaneGeometry(700, 70);
    var material = new THREE.MeshLambertMaterial({
        map: loader.load('./src/img/yourcrave.png'),
        transparent: true,
        opacity:1,
        side: THREE.DoubleSide
    });
    var yourcrave = new THREE.Mesh(plane, material);
    yourcrave.position.set(cam_x_position,cam_y_position,cam_z_position-400)
    scene.add(yourcrave);
    yourcrave.lookAt(cam_x_position,cam_y_position+cam_a,cam_z_position);

    // Texture BUTTON_PLAY
    var plane = new THREE.PlaneGeometry(280, 84);
    var material = new THREE.MeshBasicMaterial({
        map: loader.load('./src/img/button_play.png'),
        side: THREE.DoubleSide
    });
    btnPlay = new THREE.Mesh(plane, material);
    btnPlay.position.set(cam_x_position,cam_y_position-(7*cam_a),cam_z_position-400+cam_a)
    scene.add(btnPlay);
    btnPlay.lookAt(cam_x_position,cam_y_position-3*cam_a,cam_z_position);

    //Pivot untuk rotate object dan directionalLight
    pivot = new THREE.Group();
    scene.add( pivot );
    pivot.add( yourcrave );
    pivot.add( btnPlay );
    pivot.add( dirLight );
    pivot.add( camera )

    //Menggunakan rayCaster untuk hover object
    mousePosition = new THREE.Vector2();
    window.addEventListener('mousemove', function(e) {
        mousePosition.x = (e.clientX/window.innerWidth) * 2 - 1;
        mousePosition.y = - (e.clientY/window.innerHeight) * 2 + 1;
    });
    rayCaster = new THREE.Raycaster();
    
}

function animate() {

    pivot.rotation.y += cam_speed;  //Pergerakan semua object

    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    stats.update();     //Update FPS

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