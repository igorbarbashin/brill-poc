import React, { useEffect } from 'react';
import * as THREE from 'three'
import {
	Clock,
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	WebGLRenderTarget,
	WebGLCubeRenderTarget,
	NearestFilter,
	LinearFilter,
	RGBAFormat,
	FloatType,
	CubeTextureLoader,
	sRGBEncoding,
	Mesh,
	Texture,
	CubeTexture,
	PlaneGeometry,
	MultiplyBlending,
	Color,
	ShaderMaterial,
	BackSide,
	NoBlending,
	AlwaysStencilFunc,
	ReplaceStencilOp,
	FrontSide,
	AdditiveBlending,
	MeshBasicMaterial,
	MeshDepthMaterial,
	DecrementStencilOp,
	DoubleSide,

	EqualStencilFunc,
	//i dont think its possible to wildcard import
} from 'three';
import { WEBGL } from 'three/examples/jsm/WebGL.js';
import {EffectComposer}          from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass}              from 'three/examples/jsm/postprocessing/RenderPass.js';
import {BloomPass}               from './BloomPass.js';
import {DepthShell}              from './DepthShell.js';
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
import diamond_vert from '!!webpack-glsl-loader!./shaders/diamond.vert.glsl';
/*eslint-disable-next-line */
import inclusion_vert from '!!webpack-glsl-loader!./shaders/inclusion.vert.glsl';
/*eslint-disable-next-line */
import diamond_frag from '!!webpack-glsl-loader!./shaders/diamond.frag.glsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

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
	if(isNaN(a)||a==Inf)
		throw('linear transform: invalid mapping');
	return x*a+b;
}
function rand_gauss(){
	const x= rand();
	return sqrt(-2*log(x)/x)*sign(rand()-.5);
}

var camera;
var gui= new dat.GUI();
var clock = new Clock();
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

	if(ref.value instanceof Color){
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
		add_parameter(v, v.name||k);
	}
}

var w= 1, h= 1;//of canvas == default framebuffer

async function main(){
	scene= new Scene();
	camera= new PerspectiveCamera(60, 1., 0.005,32);
	camera.position.z = 0.6;

	const wgl2_yes= WEBGL.isWebGL2Available();
	if(!wgl2_yes)
		alert(WEBGL.getWebGL2ErrorMessage());

	const canvas= document.getElementById('canvas');
	controls= new OrbitControls(camera,canvas);
	const gl= canvas.getContext(wgl2_yes?'webgl2':'webgl',{
		//hdr framebuffer does this stuff
		alpha:false,
		antialias: false,
		depth: false,
		desynchronized: true,
		preserveDrawingBuffer: true,
	});

	renderer= new WebGLRenderer({canvas: canvas, context: gl});
	var rtex= new WebGLRenderTarget( w,h, {
		minFilter: NearestFilter,
		magFilter: LinearFilter,
		format: RGBAFormat,
		type: FloatType,
		depth: true,
		stencil: true,
		});

	const depthShell= new DepthShell();

	composer= new EffectComposer(renderer,rtex);
	composer.addPass(new RenderPass(scene,camera));
	//composer.addPass(new AdaptiveToneMappingPass());//this is not very good
	const pass_bloom= new BloomPass();
	composer.addPass(pass_bloom);
	const pass_tmap= new ShaderPass({
		uniforms: {
			tDiffuse: { value: null },
			exposure: { value: 1.2 }
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


	var env_tex = new CubeTextureLoader()
		.setPath('./textures/cubemap/')
		.load([
			'px.png',
			'nx.png',
			'py.png',
			'ny.png',
			'pz.png',
			'nz.png'
		]);//is this blocking or async?
	//env_tex.encoding= sRGBEncoding;//this should be srgb, but looks bad with reinhard
	scene.background= env_tex;
	//scene.background= new Color(0);

	//todo background mask into own file
	var fsq= new Mesh(
		new PlaneGeometry(2,2),
		new ShaderMaterial({
			uniforms: { mul: {value: -8.} },
			vertexShader:"void main(){ gl_Position= vec4(position, 1.0); }",
			fragmentShader:"uniform float mul; void main(){ gl_FragColor= vec4(mul); }",
			blending: MultiplyBlending,
			depthWrite: false,
			depthTest: false,
		}));
	datgui_add(fsq.material.uniforms.mul, 'background exposure', {minmax:[-8,7], lambda:Math.exp});
	scene.add(fsq);

	diamond= {};
	diamond.meshes= {};
	diamond.uniforms= {
		color:{value: new Color(255,255,255)},//fixme properly bind threecolor to datgui
		gamma:            {value: 4, minmax:[.125,8.]},
		metal:            {value: 1.},
		blur:             {value: 1., name:"gloss",lambda:x=>(1.-x)*6.},//transforms to mip level
		reflectance:      {value: 1.},
		transmittance:    {value: .3},
		ior:              {value: -0.8, minmax:[-5,5], name:"refraction index"},
		sparkle_abundance:{value: .38,  name:"sparkle amount",lambda:x=>Math.pow(x,.5)},
		sparkle_mag:      {value: 32, minmax:[0,32], name:"sparkle brightness"},
		shimmer:     	  {value: 0.},
		glow:             {value: 0., minmax:[  0,  4]},
		iridescence:      {value: 0., minmax:[  0,  4],lambda:x=>x*max(0.,x-.125) },
		chroma:           {value: 0., minmax:[-1,   1],lambda:x=>sin(x*x*x*PI)},
		inversion:        {value: 1., minmax:[ -1,  1],lambda:x=>pow(x*1.2,4.)},
		inclusion:        {value: 0., minmax:[  0, 10],lambda:x=>pow(linear_transform(x,[0,10],[0,6.8]), 1.3) },
		dance:            {value: 1., lambda:x=>x*x*x/208.},
		excitement:       {value: 0., lambda:x=>x*x*x*200.},
	};
	add_parameter_uniforms(diamond.uniforms);
	//things not included in datgui, the order dependence here is kinda bleh
	{
		let u= diamond.uniforms;
		u.tex_env= {value: env_tex};
		u.tex_depth_back=  {value: depthShell.back.texture};
		u.tex_depth_front= {value: depthShell.front.texture};
		u.time= {value: 0.};
	}

	var t={};
	//defines must use 0:1 instead of false:true
	diamond.defines={
		DEBUG: 0,
		ENVIRONMENT_CUBEMAP: 1,//uses phong if off, saving O(N) dependent texture samples
		ENABLE_CHROMATIC: 1,//off:on 1:3 rays
	}
	diamond.materials= {};
	diamond.defines.BACKFACE= 1;
	diamond.materials.back= new ShaderMaterial({
		uniforms: diamond.uniforms,
		defines: diamond.defines,
		vertexShader: diamond_vert,
		fragmentShader: diamond_frag,
		side: BackSide,
		transparent: true,//this affects sort order
		blending: NoBlending,//shader blends itself

		stencilWrite: true,//for inclusions, allowing early stencil test, since discard donks early depth
		stencilFunc: AlwaysStencilFunc,
		stencilZPass: ReplaceStencilOp,
		stencilRef: 1,
	});
	//diamond.defines.DEBUG= 1;//!!
	//t={}; Object.assign(diamond.defines,t); diamond.defines= t;//unlinks previous references preventing their mutation
	//diamond.defines.BACKFACE= 0;//uh this should be 0, but it looks better this way :shrug:
	diamond.materials.front= new ShaderMaterial({
		uniforms: diamond.uniforms,
		defines: diamond.defines,
		vertexShader: diamond_vert,
		fragmentShader: diamond_frag,
		side: FrontSide,
		transparent: true,
		blending: AdditiveBlending,
	});

	//t={}; Object.assign(diamond.defines,t); diamond.defines= t;
	//diamond.defines.DEBUG= 1;//!!
	diamond.materials.inclusions= new ShaderMaterial({
		//TODO
		uniforms: diamond.uniforms,
		defines: diamond.defines,
		vertexShader: inclusion_vert,
		fragmentShader: diamond_frag,
		side: FrontSide,
		//side: DoubleSide,
		transparent: true,
		blending: NoBlending,
		vertexColors: true,//todo confirm how to vertex attributes

		depthWrite: true,
		depthTest: true,
		stencilWrite: true,
		stencilFunc: EqualStencilFunc,
		stencilRef: 1,
	});

	//t={}; Object.assign(diamond.defines,t); diamond.defines= t;
	//fixme oh god what is even happeneing with these reference-based params
	//bug: gems need individual stencil ids otherwise they will draw their inclusions inside other nearby gems

	diamond.probes= {
		internal_normals: new WebGLCubeRenderTarget(),
		//i think i will pack into an integer texture for this
	};

	//renderOrder is very important, [backface, front stencil, inclusions, front actual]

	//gltf loading
	//room for improvement but low priority
	const loaders= [];
	//maybe everything should be a single gltf file?
	function diamondload(gltf){
		//todo figure out how to multiple materials on single mesh
		//passing material array does not work
		diamond.meshes.back= new Mesh(
			gltf.scene.children[0].geometry,
			diamond.materials.back,
		);
		diamond.meshes.front= new Mesh(
			gltf.scene.children[0].geometry,
			diamond.materials.front,
		);
	}
	function inclusionsload(gltf){
		diamond.meshes.inclusions= new Mesh(
			gltf.scene.children[0].geometry, 		
			diamond.materials.inclusions,			
		);
	}
	const meshload= (file,lambda)=> {//this is a mess
		const p= new Promise( resolve =>
			new GLTFLoader().load(file,
			mesh=>{
				lambda(mesh);
				resolve();
			})
		);
		loaders.push(p);
		return p;
	}
	meshload('./diamond/diamond.glb',diamondload);
	meshload('./inclusion_geometry/subdiv_cubes.glb',inclusionsload);

	
	function resize(){
		w= floor(canvas.clientWidth);
		h= floor(canvas.clientHeight);
		//FIXME why broken??!?!
		//cout('afsddad')
		//cout([w,h].join())
		//canvas.width= w;
		//canvas.height= h;

		[
			//perhaps this should be an event which dependents register themself?
			pass_bloom,
			renderer,
			rtex,
			composer,
			depthShell,
		].forEach(x=>x.setSize(w,h));

		camera.aspect= w/h;
		camera.updateProjectionMatrix();
	};
	window.addEventListener('resize', resize);
	resize();

	//parameter initialization
	Object.values(parameters).forEach(p=>{
		// //randomized randomization
		// if(rand()>.85)
		// 	p.randomize();
		// //randomized animation
		// if(rand()>.95)
		// 	p.animation= rand_gauss()/12.;
		// else
			p.animation= 0.;
  });
  
  

	cout('LOADING AWAIT')
	await Promise.all(loaders);
	cout('LOADING DONE')

	diamond.meshes.back.renderOrder= 0;
	diamond.meshes.inclusions.renderOrder= 1;
	diamond.meshes.front.renderOrder= 2;

	scene.add(diamond.meshes.back);
	scene.add(diamond.meshes.front);
	//scene.add(diamond.meshes.inclusions);
	//depthShell.add(diamond.meshes.front);//this is correct because there is only 2 meshes because 2 materials :C

	diamond.meshes.inclusions.scale.setScalar(.02);




	function render(){
		var dt= clock.getDelta();
		controls.update();

		//todo use object children instead
		for(let k in diamond.meshes){
			const m= diamond.meshes[k];
			//m.rotation.x += 0.0005;
			//m.rotation.y += 0.0005;
			// m.rotation.x= -Math.PI/2.;
			// m.rotation.z += 0.0015;
		}
		diamond.uniforms.time.value+= dt/8.;//reduced scale makes better precision

		Object.values(parameters).forEach(p=>{
			if(p.animation!=0.)
				p.seek(rand_gauss()*p.animation,dt);
			//todo make animator analytic(t) instead of differential(dt)
		});

		//order dependent
		//depthShell.render(renderer,camera);
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