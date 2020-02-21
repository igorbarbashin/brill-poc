import React, { useEffect } from 'react';
import * as THREE from 'three';
import {EffectComposer}          from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass}              from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass}         from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {AfterimagePass}          from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import {AdaptiveToneMappingPass} from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass.js';
import {ShaderPass}              from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {CopyShader}              from "three/examples/jsm/shaders/CopyShader.js";
import {ColorCorrectionShader}   from 'three/examples/jsm/shaders/ColorCorrectionShader.js';
import {GammaCorrectionShader}   from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import {GLTFLoader}              from 'three/examples/jsm/loaders/GLTFLoader';
import * as dat from 'dat.gui';
import './App.css';
/*eslint-disable-next-line */
import lib from '!!webpack-glsl-loader!./shaders/lib.glsl';
/*eslint-disable-next-line */
import shader0_vert from '!!webpack-glsl-loader!./shaders/diamond0.vert.glsl';
/*eslint-disable-next-line */
import shader0_frag from '!!webpack-glsl-loader!./shaders/diamond0.frag.glsl';
const OrbitControls = require('three-orbit-controls')(THREE);


var camera, scene, renderer, composer, controls, gui, diamond;
var clock = new THREE.Clock();
var gltfLoader= new GLTFLoader();

async function main(){
	const w= window.innerWidth;
	const h= window.innerHeight;
	camera = new THREE.PerspectiveCamera(
		60,
		w/h,
		0.001,10
	);
	camera.position.z = 0.6;
	controls = new OrbitControls(camera);

	scene = new THREE.Scene();

	var rtex= new THREE.WebGLRenderTarget( w,h, { minFilter: THREE.NearestFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.FloatType } );
	renderer= new THREE.WebGLRenderer({antialias: true});
	console.log(renderer)
	document.body.appendChild(renderer.domElement);

	composer= new EffectComposer(renderer,rtex);
	composer.addPass(new RenderPass(scene,camera));
	//composer.addPass(new AdaptiveToneMappingPass());
	composer.addPass(new UnrealBloomPass(1024, 10, 16, 1.));//resolution, strength, radius, threshold
	const pass_tmap= new ShaderPass({
		uniforms: {
			"tDiffuse": { value: null },
			"exposure": { value: 1. }
		},
		vertexShader: `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,
		fragmentShader: `
			uniform sampler2D tDiffuse;
			uniform float exposure;
			varying vec2 vUv;
			void main() {
				vec4 c= texture2D(tDiffuse, vUv);
				c.rgb= ReinhardToneMapping(c.rgb*exposure);
				//c.rgb= pow(c.rgb, vec3(2.2));//gamma
				//im not sure if gamma is being handled auto or if reinhard makes it look good
				gl_FragColor= c;
			}`
	});
	composer.addPass(pass_tmap);

	var env_tex = new THREE.CubeTextureLoader()
		.setPath('./environment0/')
		.load([
			'px.png',
			'nx.png',
			'py.png',
			'ny.png',
			'pz.png',
			'nz.png'
		]);
	//env_tex.encoding= THREE.sRGBEncoding;//this should be srgb, but looks bad with reinhard
		console.log(env_tex)
	scene.background= env_tex

	diamond= {};
	const exposure= {value: 1.};
	const expfun= Math.exp;
	diamond.uniforms= {
		env: env_tex,
		exposure: {value: expfun(exposure)},
		color: {value: new THREE.Color(0xffffff)},
		metal: {value: 0.},
		reflectance: {value: .5},
		transmittance: {value: 1.},
		ior: {value: 2.},
		sparkle_abundance: {value: .05},
		sparkle_rate: {value: 1.},
		sparkle_mag: {value: 10024.},
		glow: {value: .1}
	};
	gui = new dat.GUI();

	//datgui does not work with setters
	gui.add(exposure,           'value',  -2, 7).name('exposure').onChange(function(){
		pass_tmap.uniforms.exposure.value= expfun(exposure.value);
	});
	gui.addColor(diamond.uniforms.color,        'value'        ).name('color');
	gui.add(diamond.uniforms.metal,             'value',  0,  1).name('metallicity');
	gui.add(diamond.uniforms.reflectance,       'value',  0,  1).name('reflectance');
	gui.add(diamond.uniforms.transmittance,     'value',  0,  1).name('transmittance');
	gui.add(diamond.uniforms.ior,               'value', -5,  5).name('refraction');
	gui.add(diamond.uniforms.sparkle_abundance, 'value',  0,  1).name('sparkle abundance');
	gui.add(diamond.uniforms.sparkle_rate,      'value',  0,  1).name('sparkle rate');
	gui.add(diamond.uniforms.sparkle_mag,       'value',  0,  1024).name('sparkle mag');
	gui.add(diamond.uniforms.glow,              'value',  0,  8).name('glow');
	



	diamond.materials= {};
	diamond.materials.front= new THREE.ShaderMaterial({
		uniforms: diamond.uniforms,
		vertexShader: shader0_vert,
		fragmentShader: shader0_frag,
		side: THREE.FrontSide
	});
	diamond.materials.back= new THREE.ShaderMaterial({
		uniforms: diamond.uniforms,
		vertexShader: shader0_vert,
		fragmentShader: shader0_frag,
		side: THREE.BackSide
	});

	function meshload(gltf){
		console.log(gltf);
		diamond.mesh= new THREE.Mesh(
			gltf.scene.children[0].geometry,
			//[
				//diamond.materials.back,
				diamond.materials.front
			//]
		);
		scene.add(diamond.mesh);
		console.log('GLTF LOADED');
	}
	var meshload_promise= new Promise( resolve => gltfLoader.load('./diamond/diamond.glb',
		mesh=>{
			meshload(mesh);
			resolve();
		})
	);
	console.log('PROMISED');

		
	var resize= function () {
		const w= window.innerWidth;
		const h= window.innerHeight;
		renderer.setSize(w,h);
		composer.setSize(w,h);
		camera.aspect= w/h;
		camera.updateProjectionMatrix();
	};
	window.addEventListener('resize', resize);
	resize();

	//finish loading
	console.log('LOADING AWAIT')
	await Promise.all([
		meshload_promise
	]);

	console.log(scene)
	function render(t){
		var dt= clock.getDelta();

		diamond.mesh.rotation.x += 0.0005;
		diamond.mesh.rotation.y += 0.0005;
		diamond.mesh.rotation.z += 0.0015;


		composer.render(dt);
		//renderer.render(scene,camera);

		requestAnimationFrame(render);
	};
	render(0);
}

function App(){
	//i dont understand this
	useEffect(function(){
		//i have no idea why this needs wrapped
		main();
	});
	return <></>;
};


export default App;
