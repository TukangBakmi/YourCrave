import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { worldWidth } from '../../js/main';

var THREEx	= THREEx	|| {}

THREEx.DayNight	= {}

function currentPhase(sunAngle){
	if( Math.sin(sunAngle) > Math.sin(0) ){
		return 'day'
	}else if( Math.sin(sunAngle) > Math.sin(-Math.PI/6) ){
		return 'twilight'
	}else{
		return 'night'
	}
}


//////////////////////////////////////////////////////////////////////////////////
//		starfield								//
//////////////////////////////////////////////////////////////////////////////////

function StarField(){
	// create the mesh
	var texture	= new THREE.TextureLoader().load('/src/img/galaxy_starfield.png')
	var material	= new THREE.MeshBasicMaterial({
		map	: texture,
		side	: THREE.BackSide,
 		color	: 0x808080,
	})
	var geometry	= new THREE.SphereGeometry(worldWidth/2, worldWidth/10, worldWidth/10)
	var mesh	= new THREE.Mesh(geometry, material)
	this.object3d	= mesh

	this.update	= function(sunAngle){
		var phase	= currentPhase(sunAngle)
		if( phase === 'day' ){
			mesh.visible	= false
		}else if( phase === 'twilight' ){
			mesh.visible	= false
		} else {
			mesh.visible	= true
			mesh.rotation.x	= sunAngle / 5
	        	var intensity	= Math.abs(Math.sin(sunAngle))
	        	material.color.setRGB(intensity/10, intensity/10, intensity/10);
				console.log(sunAngle);
				console.log(intensity);
		}
	}
}

//////////////////////////////////////////////////////////////////////////////////
//		SunLight							//
//////////////////////////////////////////////////////////////////////////////////

function SunLight(){
	var light	= new THREE.DirectionalLight( 0xffffff,0.6 );
	this.object3d	= light
	
	this.update	= function(sunAngle){
		light.position.x = 0;
		light.position.y = Math.sin(sunAngle) * 90000;
		light.position.z = Math.cos(sunAngle) * 90000;

		var phase	= currentPhase(sunAngle)
		if( phase === 'day' ){
			light.color.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)) +")");
		}else if( phase === 'twilight' ){
		        light.intensity = 0.6;
	        	light.color.set("rgb(" + (255-Math.floor(Math.sin(sunAngle)*510*-1)) + "," + (55-Math.floor(Math.sin(sunAngle)*110*-1)) + ",0)");
		} else {
			light.intensity	= 0;
		}
	}	
}

//////////////////////////////////////////////////////////////////////////////////
//		SunSphere							//
//////////////////////////////////////////////////////////////////////////////////

function SunSphere(){
	var geometry	= new THREE.SphereGeometry( 10, 30, 30 )
	var material	= new THREE.MeshBasicMaterial({
		color		: 0xff0000
	})
	var mesh	= new THREE.Mesh(geometry, material)
	this.object3d	= mesh

	this.update	= function(sunAngle){
		mesh.position.x = 0;
		mesh.position.y = Math.sin(sunAngle) * worldWidth/2;
		mesh.position.z = Math.cos(sunAngle) * worldWidth/2;

		var phase	= currentPhase(sunAngle)
		if( phase === 'day' ){
			mesh.material.color.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)+5) +")");
		}else if( phase === 'twilight' ){
			mesh.material.color.set("rgb(255,55,5)");
		} else {
		}
	}
}


//////////////////////////////////////////////////////////////////////////////////
//		Skydom								//
//////////////////////////////////////////////////////////////////////////////////

function Skydom(){
	var geometry	= new THREE.SphereGeometry( worldWidth/2+10, worldWidth/10, worldWidth/10 );
	var uniforms	= THREE.UniformsUtils.clone({
		topColor	: { type: "c", value: new THREE.Color().setHSL( 0.6, 1, 0.75 ) },
		bottomColor	: { type: "c", value: new THREE.Color( 0xffffff ) },
		offset		: { type: "f", value: 400 },
		exponent	: { type: "f", value: 0.6 },
	});
	var material	= new THREE.ShaderMaterial({
		vertexShader	: [
			'varying vec3 vWorldPosition;',
			'void main() {',
			'	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
			'	vWorldPosition = worldPosition.xyz;',
			'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
			'}',
		].join('\n'),
		fragmentShader	: [
			'uniform vec3 topColor;',
			'uniform vec3 bottomColor;',
			'uniform float offset;',
			'uniform float exponent;',
	
			'varying vec3 vWorldPosition;',
	
			'void main() {',
			'	float h = normalize( vWorldPosition + offset ).y;',
			'	gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 1.0 );',
			'}',
		].join('\n'),
		uniforms	: uniforms,
		side		: THREE.BackSide
	});

	var mesh	= new THREE.Mesh( geometry, material );
	this.object3d	= mesh
	
	this.update	= function(sunAngle){
		var phase	= currentPhase(sunAngle)
		if( phase === 'day' ){
			uniforms.topColor.value.set("rgb(207,247,255)");
			uniforms.bottomColor.value.set("rgb(255,"+ (Math.floor(Math.sin(sunAngle)*200)+55) + "," + (Math.floor(Math.sin(sunAngle)*200)) +")");
		} else if( phase === 'twilight' ){
			uniforms.topColor.value.set("rgb(207," + (247-Math.floor(Math.sin(sunAngle)*240*-1)) + "," + (255-Math.floor(Math.sin(sunAngle)*510*-1)) +")");
			uniforms.bottomColor.value.set("rgb(" + (255-Math.floor(Math.sin(sunAngle)*510*-1)) + "," + (55-Math.floor(Math.sin(sunAngle)*110*-1)) + ",0)");
		} else {
			uniforms.topColor.value.set('black')
			uniforms.bottomColor.value.set('black');
		}		
	}
}

export { SunSphere, StarField, SunLight, Skydom };