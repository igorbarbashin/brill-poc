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

const cout= s=>console.log(s);

const rand= Math.random;
const sign= Math.sign;
const sin= Math.sin;
const cos= Math.cos;
const abs= Math.abs;
const min= Math.min;
const max= Math.max;
const floor= Math.floor;
const ceil= Math.ceil;
const sqrt= Math.sqrt;
const pow= Math.pow;
const exp= Math.exp;
const log= Math.log;
const log2= Math.log2;
const Inf= Infinity;
const PI= Math.PI;
const TAU= 2.*PI;
function mod(x,m){//js's % is remainder instread of modulus, which mangles negatives
	return x-floor(x/m)*m;
}
function fract(x){
	return x-floor(x);
}
function clamp(x, a,b){
	return max(a, min(b, x));
}
function clamp01(x){
	return max(0, min(1, x));
}
const saturate= clamp01;
const sat= saturate;
function smooth(x){
	return x*x*(3-2*x);
}
function len2(x,y){
	return sqrt(x*x+y*y);
}
function len3(x,y,z){
	return sqrt(x*x+y*y+z*z);
}
function linear_transform(x,from,to){
	const a= (to[1]-to[0])/(from[1]-from[0]);
	const b= to[0]-from[0];
	if(a==NaN||a==Inf)
		throw('linear transform: invalid mapping');
	return x*a+b;
}
function rand_gauss(){
	const x= rand();
	return sqrt(-2*log(x)/x)*sign(rand()-.5);
}

var camera;
var gui= new dat.GUI();
var clock = new THREE.Clock();
var gltfLoader= new GLTFLoader();
var scene, renderer, composer, controls, diamond;


function datgui_add(ref, name, opt){
	opt=opt||{};
	const  min= opt.minmax!==undefined?opt.minmax[0]:0.;
	const  max= opt.minmax!==undefined?opt.minmax[1]:1.;
	const  lambda= opt.lambda||(x=>x);

	const proxy= { value: ref.value };
	function assign(){
		ref.value= lambda(proxy.value);
	}
	assign();//ref is initialized to gui-space not lambda-space, reverse that

	if(ref.value instanceof THREE.Color){
		return {
			datgui: gui.addColor(ref,'value').name(name),
			set value(x){
				proxy.value= x;
				assign();
				this.datgui.updateDisplay();
			},
			get value(){ return proxy.value; },
			seek(delta,dt){ },//p.value= clamp(p.value+delta*dt, p.min,p.max); },
			randomize(){ },//p.value= rand(); },
		};
	}else{
		return {
			datgui: gui.add(proxy,'value',min,max).onChange(assign).name(name),
			set value(x){
				proxy.value= x;
				assign();
				this.datgui.updateDisplay();
			},
			get value(){ return proxy.value; },
			seek(delta,dt){ this.value= clamp(this.value+delta*dt, min,max); },
			randomize(){ this.value= rand()*(max-min); },
		};
	}
}

const parameters= [];
function add_parameter(p,name){
	const g= datgui_add(p,name,p);//u is both ref and opts
	g.animate= true;
	parameters.push(g);
}
function add_parameter_uniforms(uniforms_object){
	for(let k in uniforms_object){
		let v= uniforms_object[k];
		if(v.value==undefined)
			continue;
		add_parameter(v, v.name||k);
	}
}

var w= 1, h= 1;//of canvas == default framebuffer

async function main(){
	scene= new THREE.Scene();
	camera= new THREE.PerspectiveCamera(40, 1., 0.001,10);
	camera.position.z = 0.6;
	controls = new OrbitControls(camera);

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
	composer.addPass(pass_bloom);
	const pass_tmap= new ShaderPass({
		uniforms: {
			tDiffuse: { value: null },
			exposure: { value: 0. }
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
				//c.rgb= pow(max(vec3(0.),c.rgb), vec3(2.));//gamma
				//im pretty sure gamma is not being handled 'correctly' but it looks good so whatever
				gl_FragColor= c;
			}`
	});
	datgui_add(pass_tmap.uniforms.exposure,'scene exposure',{minmax:[-2,7], lambda:Math.exp});
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
		]);//is this blocking or async?
	//env_tex.encoding= THREE.sRGBEncoding;//this should be srgb, but looks bad with reinhard
	scene.background= env_tex;

	var fsq= new THREE.Mesh(
		new THREE.PlaneGeometry(2,2),
		new THREE.ShaderMaterial({
			uniforms: { mul: {value: -8.} },
			vertexShader:"void main(){ gl_Position= vec4(position, 1.0); }",
			fragmentShader:"uniform float mul; void main(){ gl_FragColor= vec4(mul); }",
			blending: THREE.MultiplyBlending,
			depthWrite: false,
			depthTest: false,
		}));
	datgui_add(fsq.material.uniforms.mul, 'background exposure', {minmax:[-8,7], lambda:Math.exp});
	scene.add(fsq);

	diamond= {};
	diamond.uniforms= {
		env_tex: env_tex,
		color:{value: new THREE.Color(0xffffff)},//fixme properly bind threecolor to datgui
		gamma:            {value: 1.5, minmax:[.125,4.]},
		metal:            {value: .1},
		blur:             {value: 1., name:"gloss",lambda:x=>(1.-x)*6.},//transforms to mip level
		reflectance:      {value: .5},
		transmittance:    {value: 1.},
		ior:              {value: 2., minmax:[-5,5], name:"refraction index"},
		sparkle_abundance:{value: .4,  name:"sparkle amount",lambda:x=>Math.pow(x,.5)},
		sparkle_mag:      {value: 1., minmax:[0,128], name:"sparkle brightness"},
		shimmer:     	  {value: .5},
		glow:             {value: .1, minmax:[  0,  4]},
		iridescence:      {value: 0., minmax:[  0,  4], lambda:Math.exp },
		chroma:           {value: .1, minmax:[-.5, .5]},
		inversion:        {value: 0., minmax:[ -2,  2]},
		inclusion:        {value: 2., minmax:[  0, 10],lambda:x=>Math.pow(linear_transform(x,[0,10],[0,.8]), .3) }
	};
	//defines must use 0:1 instead of false:true
	diamond.defines={
		ENVIRONMENT_CUBEMAP: 0,//uses phong if off, saving O(N) dependent texture samples
		ENABLE_CHROMATIC: 1,//off:on 1 ray vs 3
	}
	add_parameter_uniforms(diamond.uniforms);


	diamond.materials= {};
	diamond.defines.BACKFACE= 1;
	diamond.materials.back= new THREE.ShaderMaterial({
		uniforms: diamond.uniforms,
		defines: diamond.defines,
		vertexShader: shader0_vert,
		fragmentShader: shader0_frag,
		side: THREE.BackSide,
		transparent: true,//this affects sort order
		blending: THREE.NoBlending,//shader blends itself
	});
	diamond.defines.BACKFACE= 0;
	diamond.materials.front= new THREE.ShaderMaterial({
		uniforms: diamond.uniforms,
		defines: diamond.defines,
		vertexShader: shader0_vert,
		fragmentShader: shader0_frag,
		side: THREE.FrontSide,
		transparent: true,
		blending: THREE.AdditiveBlending,
	});


	//gltf loading
	const loaders= [];
	//maybe everything should be a single gltf file? i dunno.
	function diamondload(gltf){
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
	}
	function inclusionsload(gltf){
		//todo figure out how to multiple materials on single mesh
		//passing material array does not work
		diamond.mesh_inclusions= new THREE.Mesh(
			gltf.scene.children[0].geometry, 		
			diamond.materials.inclusions,			
		);
		//TODO
		diamond.mesh_back.renderOrder= 0;
		diamond.mesh_front.renderOrder= 1;
		scene.add(diamond.mesh_inclusions);
	}
	const meshloader= (file,lambda)=> {//this is a mess
		const p= new Promise( resolve =>
			gltfLoader.load(file,
			mesh=>{
				lambda(mesh);
				resolve();
			})
		);
		loaders.push(p);
		return p;
	}
	var meshloader_diamond= meshloader('./diamond/diamond.glb',diamondload);
	var meshloader_inclusions= meshloader('./inclusion_geometry/subdiv_cubes.glb',inclusionsload);

	
	function resize(){
		w= canvas.clientWidth;
		h= canvas.clientHeight;//fixme make this work with canvas wh instead
		//cout('afsddad')
		//cout([w,h].join())
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

	//parameter initialization
	Object.values(parameters).forEach(p=>{
		//randomized randomization
		if(rand()>.69)
			p.randomize();
		//randomized animation
		p.animate= rand()>.9;
	});


	cout('LOADING AWAIT')
	await Promise.all(loaders);
	cout('LOADING DONE')


	function render(){
		var dt= clock.getDelta();

		[diamond.mesh_front,diamond.mesh_back].map(m=>{
			//m.rotation.x += 0.0005;
			//m.rotation.y += 0.0005;
			m.rotation.x= -Math.PI/2.;
			m.rotation.z += 0.0015;
		})

		Object.values(parameters).forEach(p=>{
			if(p.animate)
				p.seek(rand_gauss()*.2,dt);
			//todo make animator analytic instead of differential
		});

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