import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

let camera, scene, renderer;
let container, stats, pivot;
var mousePosition, rayCaster, btnPlay;  //Menggunakan rayCaster untuk hover object

//Kecepatan rotasi kamera
const cam_speed = 0.005;
//Atribut World (di landing page)
const worldWidth = 512, worldDepth = 512;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;
const data = generateHeight( worldWidth, worldDepth );

init();     //initialize
animate();  //create animation

function init() {

    container = document.getElementById( 'container' );

    //Menggunakan jenis kamera "Perspective Camera"
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 20000 );
    //Mengatur posisi awal kamera terhadap sumbu y
    camera.position.y = getY( worldHalfWidth, worldHalfDepth ) + 2500;

    //Membuat Scene dan warna backgroundnya
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0XCFF7FF );

    //Membuat world untuk landing page
    const matrix = new THREE.Matrix4();

    const pxGeometry = new THREE.PlaneGeometry( 100, 100 );
    pxGeometry.attributes.uv.array[ 1 ] = 0.5;
    pxGeometry.attributes.uv.array[ 3 ] = 0.5;
    pxGeometry.rotateY( Math.PI / 2 );
    pxGeometry.translate( 50, 0, 0 );

    const nxGeometry = new THREE.PlaneGeometry( 100, 100 );
    nxGeometry.attributes.uv.array[ 1 ] = 0.5;
    nxGeometry.attributes.uv.array[ 3 ] = 0.5;
    nxGeometry.rotateY( - Math.PI / 2 );
    nxGeometry.translate( - 50, 0, 0 );

    const pyGeometry = new THREE.PlaneGeometry( 100, 100 );
    pyGeometry.attributes.uv.array[ 5 ] = 0.5;
    pyGeometry.attributes.uv.array[ 7 ] = 0.5;
    pyGeometry.rotateX( - Math.PI / 2 );
    pyGeometry.translate( 0, 50, 0 );

    const pzGeometry = new THREE.PlaneGeometry( 100, 100 );
    pzGeometry.attributes.uv.array[ 1 ] = 0.5;
    pzGeometry.attributes.uv.array[ 3 ] = 0.5;
    pzGeometry.translate( 0, 0, 50 );

    const nzGeometry = new THREE.PlaneGeometry( 100, 100 );
    nzGeometry.attributes.uv.array[ 1 ] = 0.5;
    nzGeometry.attributes.uv.array[ 3 ] = 0.5;
    nzGeometry.rotateY( Math.PI );
    nzGeometry.translate( 0, 0, - 50 );

    const geometries = [];

    for ( let z = 0; z < worldDepth; z ++ ) {
        for ( let x = 0; x < worldWidth; x ++ ) {
            const h = getY( x, z );
            matrix.makeTranslation(
                x * 100 - worldHalfWidth * 100,
                h * 100,
                z * 100 - worldHalfDepth * 100
            );

            const px = getY( x + 1, z );
            const nx = getY( x - 1, z );
            const pz = getY( x, z + 1 );
            const nz = getY( x, z - 1 );

            geometries.push( pyGeometry.clone().applyMatrix4( matrix ) );

            if ( ( px !== h && px !== h + 1 ) || x === 0 ) {
                geometries.push( pxGeometry.clone().applyMatrix4( matrix ) );
            }

            if ( ( nx !== h && nx !== h + 1 ) || x === worldWidth - 1 ) {
                geometries.push( nxGeometry.clone().applyMatrix4( matrix ) );
            }

            if ( ( pz !== h && pz !== h + 1 ) || z === worldDepth - 1 ) {
                geometries.push( pzGeometry.clone().applyMatrix4( matrix ) );
            }

            if ( ( nz !== h && nz !== h + 1 ) || z === 0 ) {
                geometries.push( nzGeometry.clone().applyMatrix4( matrix ) );
            }
        }
    }

    const geometry = BufferGeometryUtils.mergeBufferGeometries( geometries );
    geometry.computeBoundingSphere();

    //Menambahkan Grass
    const texture = new THREE.TextureLoader().load( './src/img/grass.png' );
    texture.magFilter = THREE.NearestFilter;
    const mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: texture, side: THREE.DoubleSide } ) );
    scene.add( mesh );

    //Menambahkan kabut
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.000065);

    //Menggunakan jenis lighting "Ambient Light" dan "Directional Light"
    const ambientLight = new THREE.AmbientLight( 0xFFFFFF );
    scene.add( ambientLight );
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
    directionalLight.position.set(0, 1000, 1000).normalize();
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );
    
    // Texture YOURCRAVE
    var loader = new THREE.TextureLoader();
    var plane = new THREE.PlaneGeometry(6250, 770);
    var material = new THREE.MeshLambertMaterial({
        map: loader.load('./src/img/yourcrave.png'),
        transparent: true,
        opacity:1,
        side: THREE.DoubleSide
    });
    var yourcrave = new THREE.Mesh(plane, material);
    yourcrave.position.set(0,4000,-2500)
    scene.add(yourcrave);

    // Texture BUTTON_PLAY
    var plane = new THREE.PlaneGeometry(910, 290);
    var material = new THREE.MeshLambertMaterial({
        map: loader.load('./src/img/button_play.png'),
        side: THREE.DoubleSide
    });
    btnPlay = new THREE.Mesh(plane, material);
    btnPlay.position.set(0,2200,-1000)
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

function generateHeight( width, height ) {
    const data = [], perlin = new ImprovedNoise(),
        size = width * height, z = Math.random() * 100;
    let quality = 2;

    for ( let j = 0; j < 4; j ++ ) {
        if ( j === 0 ) for ( let i = 0; i < size; i ++ ) data[ i ] = 0;
        for ( let i = 0; i < size; i ++ ) {
            const x = i % width, y = ( i / width ) | 0;
            data[ i ] += perlin.noise( x / quality, y / quality, z ) * quality;
        }
        quality *= 4;
    }
    return data;
}

function getY( x, z ) {
    return ( data[ x + z * worldWidth ] * 0.15 ) | 0;
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
    console.log(intersects);
    if (intersects.length > 0 && intersects[0].object.id === btnPlay.id) {
        btnPlay.material.color.set(0x78ff66);
    } else{
        btnPlay.material.color.set(0XFFFFFF);
    }
    
}

//Membuat halaman menjadi responsive
window.addEventListener('resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})