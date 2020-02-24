import React, { useEffect } from 'react';
import * as THREE from 'three';
import { WEBGL } from 'three/examples/jsm/WebGL.js';
import {EffectComposer}          from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass}              from 'three/examples/jsm/postprocessing/RenderPass.js';
import {BloomPass}               from './BloomPass.js';
import {AfterimagePass}          from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import {AdaptiveToneMappingPass} from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass.js';
import {ShaderPass}              from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {CopyShader}              from "three/examples/jsm/shaders/CopyShader.js";
import {VerticalBlurShader}      from "three/examples/jsm/shaders/VerticalBlurShader.js";
import {HorizontalBlurShader}    from "three/examples/jsm/shaders/HorizontalBlurShader.js";
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

//sugar
function datgui_add(ref, name, min,max){ gui.add(     ref, 'value', min,max).name(name); }
function datgui_addColor(ref, name){     gui.addColor(ref, 'value').name(name); }

function log(x){ console.log(x); }

/*proxy used for values that dont use the gui's value directly, such as uniforms
since the gui will feedback if a transform is applied directly to its reference

datgui is not compatible with setters! (which is dumb)
'value' fields are a just a hack to make reference types*/
function datgui_addProxy(ref, name, min,max, lambda){
	const proxy= { value: ref.value };
	function assign(){ ref.value= lambda(proxy.value); }
	assign();//ref is initialized to gui-space not lambda-space, reverse that
	gui.add(proxy,'value',min,max).onChange(assign).name(name);
}

var w= 1, h= 1;//of canvas == default framebuffer

async function main(){
	camera = new THREE.PerspectiveCamera(40, 1., 0.001,10);
	camera.position.z = 0.6;
	controls = new OrbitControls(camera);

	scene = new THREE.Scene();

	const wgl2_yes= WEBGL.isWebGL2Available();
	if(!wgl2_yes)
		alert(WEBGL.getWebGL2ErrorMessage());
		/*todo elegantly disable features, currently crashes if wgl1
		known wgl2 features in use
			shader dFdxy
		*/

	const canvas= document.getElementById('canvas');
	const gl= canvas.getContext(wgl2_yes?'webgl2':'webgl',{
		//hdr framebuffer does this stuff
		alpha:false,
		antialias: false,
		depth: false,
		desynchronized: true,
		preserveDrawingBuffer: true,
	});

	renderer= new THREE.WebGLRenderer({canvas: canvas, context: gl});
	var rtex= new THREE.WebGLRenderTarget( w,h, {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBAFormat,
		type: THREE.FloatType
		} );
	//targets have their own depthbuffer and stencil by default

	composer= new EffectComposer(renderer,rtex);
	composer.addPass(new RenderPass(scene,camera));
	//composer.addPass(new AdaptiveToneMappingPass());//this is not very good
	const pass_bloom= new BloomPass();
	//!!composer.addPass(pass_bloom);
	const pass_tmap= new ShaderPass({
		uniforms: {
			tDiffuse: { value: null },
			exposure: { value: 1. }
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
				//im not sure if gamma is being handled auto or if reinhard does that
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
	scene.background= env_tex;

	var fsq= new THREE.Mesh(
		new THREE.PlaneGeometry(2,2),
		new THREE.ShaderMaterial({
			uniforms: { mul: {value: -2.} },
			vertexShader:"void main(){ gl_Position= vec4(position, 1.0); }",
			fragmentShader:"uniform float mul; void main(){ gl_FragColor= vec4(mul); }",
			blending: THREE.MultiplyBlending,
			depthWrite: false,
			depthTest: false,
		}));
	scene.add(fsq);

	diamond= {};
	diamond.uniforms= {
		env: env_tex,
		exposure: {value: 1.},
		color:{value: new THREE.Color(0xffffff)},
		metal:            {value:   .1},
		blur:             {value:   0.},
		reflectance:      {value:   .5},
		transmittance:    {value:   1.},
		ior:              {value:   2.},
		sparkle_abundance:{value:  .7},
		sparkle_rate:     {value:   .5},
		sparkle_mag:      {value: 1.},
		glow:             {value:   .1},
		iridescence:      {value: 0.},
		chroma:           {value: 1.},
		inversion:           {value: 0.},
		inclusion:           {value: 4.},
	};
	gui = new dat.GUI();

	datgui_addProxy(pass_tmap.uniforms.exposure,  'exposure', -2,7, Math.exp);
	datgui_addProxy(fsq.material.uniforms.mul,  'background_exposure', -8,7, Math.exp);
	datgui_addColor(diamond.uniforms.color,       'color');
	datgui_add(diamond.uniforms.metal,            'metallicity',  0,1);
	datgui_add(diamond.uniforms.blur,        'blur',    0,6);
	datgui_add(diamond.uniforms.reflectance,      'reflectance',  0,1);
	datgui_add(diamond.uniforms.transmittance,    'transmittance',0,1);
	datgui_add(diamond.uniforms.ior,              'refraction',  -5,5);
	datgui_addProxy(diamond.uniforms.sparkle_abundance,'sparkle abundance', 0,1, x=>Math.pow(x,4.));
	datgui_add(diamond.uniforms.sparkle_rate,     'sparkle rate', 0,1);
	datgui_add(diamond.uniforms.sparkle_mag,      'sparkle mag',  0,512);
	datgui_add(diamond.uniforms.glow,             'glow',         0,8);
	datgui_add(diamond.uniforms.iridescence,             'iridescence',         0,16);
	datgui_add(diamond.uniforms.chroma,             'chroma',         -.2,.2);//*diamond.uniforms.ior);
	datgui_add(diamond.uniforms.inversion,             'inversion',         0,4);
	datgui_addProxy(diamond.uniforms.inclusion,             'inclusion',         0,10, x=>(x/10.)*2.-1.);//[0,10]->[-1,1]
	



	diamond.materials= {};
	const chromatic= 1;
	diamond.materials.back= new THREE.ShaderMaterial({
		uniforms: diamond.uniforms,
		defines: {
			BACKFACE: 1,
			ENABLE_CHROMATIC: chromatic,
		},
		vertexShader: shader0_vert,
		fragmentShader: shader0_frag,
		side: THREE.BackSide,
		transparent: true,//this affects sort order
		blending: THREE.NoBlending,//shader blends itself
	});
	diamond.materials.front= new THREE.ShaderMaterial({
		uniforms: diamond.uniforms,
		defines: {
			BACKFACE: 0,
			ENABLE_CHROMATIC: chromatic,
		},
		vertexShader: shader0_vert,
		fragmentShader: shader0_frag,
		side: THREE.FrontSide,
		transparent: true,
		blending: THREE.AdditiveBlending,
	});

	function meshload(gltf){
		//todo figure out how to multiple materials on single mesh
		//passing material array does not work
		diamond.mesh_back= new THREE.Mesh(
			gltf.scene.children[0].geometry, 		
			diamond.materials.back,			
		);
		diamond.mesh_front= new THREE.Mesh(
			gltf.scene.children[0].geometry, 		
			diamond.materials.front,			
		);
		diamond.mesh_back.renderOrder= 0;
		diamond.mesh_front.renderOrder= 1;
		scene.add(diamond.mesh_front);
		scene.add(diamond.mesh_back);
		log('LOADED: GLTF');
	}
	var meshload_promise= new Promise( resolve => gltfLoader.load('./diamond/diamond.glb',
		mesh=>{
			meshload(mesh);
			resolve();
		})
	);

	
	function resize(){
		w= canvas.clientWidth;
		h= canvas.clientHeight;
		//log('afsddad')
		//log([w,h].join())
		//canvas.width= w;
		//canvas.height= h;

		[
			//perhaps this should be an event which dependents register themself?
			pass_bloom,
			renderer,
			rtex,
			composer
		].map(x=>x.setSize(w,h))


		camera.aspect= w/h;
		camera.updateProjectionMatrix();
	};
	window.addEventListener('resize', resize);
	resize();

	//finish loading
	log('LOADING AWAIT')
	await Promise.all([
		meshload_promise
	]);
	log('LOADING DONE')

	function render(){
		var dt= clock.getDelta();

		[diamond.mesh_front,diamond.mesh_back].map(m=>{
			//m.rotation.x += 0.0005;
			//m.rotation.y += 0.0005;
			m.rotation.x= -Math.PI/2.;
			//m.rotation.z += 0.0015;
			//FIXME??????
		})


		composer.render(dt);
		//renderer.render(scene,camera);

		requestAnimationFrame(render);
	};
	render();
}

var App= {
	react: function(){
		return (
			<canvas id="canvas" style={{width: '100vw', height: '100vh'}} />
			);
	},
	main: main
};

export default App;