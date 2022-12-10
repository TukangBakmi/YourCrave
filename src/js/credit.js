import * as THREE from 'three';

let camera, scene, renderer;
let listener, backgroundSound, creditText, creditBg, creditCover;

let back = false;
//Atribut kamera
const cam_x_position = 0;
const cam_y_position = 0;
const cam_z_position = 0;
//Atribut credit.png
const width = 3335;
const height = 10554;

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

    //Menggunakan jenis kamera "Perspective Camera"
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 18000 );
    //Mengatur posisi awal kamera
    camera.position.set(cam_x_position,cam_y_position,cam_z_position);
    camera.lookAt(new THREE.Vector3(cam_x_position,0,-(cam_y_position*(2+Math.sqrt(3)))+cam_z_position));

    //Membuat Scene dan warna backgroundnya
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0XCFF7FF );

    //Menggunakan jenis lighting "Ambient Light"
    const ambientLight = new THREE.AmbientLight( 0xFFFFFF );
    scene.add( ambientLight );

    var loader = new THREE.TextureLoader();
    var creditBgPlane = new THREE.PlaneGeometry(2*width, height);
    var creditBgMaterial = new THREE.MeshLambertMaterial({
        color: 0X000000,
        transparent: true,
        opacity:0.6,
        side: THREE.DoubleSide
    });
    creditBg = new THREE.Mesh(creditBgPlane, creditBgMaterial);
    creditBg.position.set(cam_x_position,cam_y_position,cam_z_position-width*2/3)
    scene.add(creditBg);

    var loader = new THREE.TextureLoader();
    var creditTextPlane = new THREE.PlaneGeometry(width, height);
    var creditTextMaterial = new THREE.MeshLambertMaterial({
        map: loader.load('./src/img/credit.png'),
        transparent: true,
        opacity:1,
        side: THREE.DoubleSide
    });
    creditText = new THREE.Mesh(creditTextPlane, creditTextMaterial);
    creditText.position.set(cam_x_position,cam_y_position-height*62/100,cam_z_position-width*2/3)
    scene.add(creditText);

    var loader = new THREE.TextureLoader();
    var creditCoverPlane = new THREE.PlaneGeometry(width, height);
    var creditCoverMaterial = new THREE.MeshLambertMaterial({
        color: 0x000000,
        transparent: true,
        opacity:0,
        side: THREE.DoubleSide
    });
    creditCover = new THREE.Mesh(creditCoverPlane, creditCoverMaterial);
    creditCover.position.set(cam_x_position,cam_y_position,cam_z_position-10);
    scene.add(creditCover);

    // Add backsound
    listener = new THREE.AudioListener();
    camera.add(listener);
    backgroundSound = new THREE.Audio(listener);    
    let main = new THREE.AudioLoader().load('./src/SoundAsset/backsound-credit.mp3',
    (hasil)=>{
        backgroundSound.setBuffer(hasil);
        backgroundSound.play();
        backgroundSound.setLoop(true);
        backgroundSound.setVolume(1);
    });
}

function animate() {
    if(creditText.position.y < height*51/100){
        creditText.position.y += 1.53;
    } else{
        setTimeout(function(){
            if(creditCover.material.opacity <= 1){
                creditCover.material.opacity += 0.01;
            }
        },1500);
    }
    if(creditCover.material.opacity >= 0.95 && !back){
        window.location.href = "./index.html";
        back = true;
    }
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
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
document.getElementById("backMenu").addEventListener("click", function(){
    window.location.href = "./index.html";
    backgroundSound.stop();
});