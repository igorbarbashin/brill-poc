import React, { useEffect } from 'react';
import * as THREE from 'three';

import { WEBGL }                      from 'three/examples/jsm/WebGL.js';
import { EffectComposer }             from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }                 from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { BloomPass }                  from './BloomPass.js';
import { DepthShell }                 from './DepthShell.js';
import { ShaderPass }                 from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GLTFLoader }                 from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls }              from 'three/examples/jsm/controls/OrbitControls';

import * as dat from 'dat.gui';
/*eslint-disable-next-line */
import lib from '!!webpack-glsl-loader!./shaders/lib.glsl';
/*eslint-disable-next-line */
import diamond_vert from '!!webpack-glsl-loader!./shaders/diamond.vert.glsl';
/*eslint-disable-next-line */
import inclusion_vert from '!!webpack-glsl-loader!./shaders/inclusion.vert.glsl';
/*eslint-disable-next-line */
import diamond_frag from '!!webpack-glsl-loader!./shaders/diamond.frag.glsl';


const cout = s => console.log(s);

const Inf = Infinity;

function mod(x, m) {//js's % is remainder instread of modulus, which mangles negatives
  return x - Math.floor(x / m) * m;
}
function fract(x) {
  return x - Math.floor(x);
}
function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
const saturate = clamp01;
const sat = saturate;
function smooth(x) {
  return x * x * (3 - 2 * x);
}
function len2(x, y) {
  return Math.sqrt(x * x + y * y);
}
function len3(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}
function linear_transform(x, from, to) {
  const a = (to[1] - to[0]) / (from[1] - from[0]);
  const b = to[0] - from[0];
  if (isNaN(a) || a === Inf)
    throw ('linear transform: invalid mapping');
  return x * a + b;
}
function rand_gauss() {
  const x = Math.rand();
  return Math.sqrt(-2 * Math.log(x) / x) * Math.sign(Math.rand() - .5);
}

var camera;
var gui = new dat.GUI();
var clock = new THREE.Clock();
var scene, renderer, composer, controls, diamond;


function datgui_add(ref, name, opt) {
  opt = opt || {};
  const min = opt.minmax !== undefined ? opt.minmax[0] : 0.;
  const max = opt.minmax !== undefined ? opt.minmax[1] : 1.;
  const lambda = opt.lambda || (x => x);

  const proxy = { value: ref.value };
  function assign() {
    ref.value = lambda(proxy.value);
  }
  assign();//ref is initialized to gui-space not lambda-space, reverse that

  if (ref.value instanceof THREE.Color) {
    return {
      datgui: gui.addColor(ref, 'value').name(name),
      set value(x) {
        proxy.value = x;
        assign();
        this.datgui.updateDisplay();
      },
      get value() { return proxy.value; },
      seek(delta, dt) { },//p.value= clamp(p.value+delta*dt, p.min,p.max); },
      randomize() { },//p.value= rand(); },
    };
  } else {
    return {
      datgui: gui.add(proxy, 'value', min, max).onChange(assign).name(name),
      set value(x) {
        proxy.value = x;
        assign();
        this.datgui.updateDisplay();
      },
      get value() { return proxy.value; },
      seek(delta, dt) { this.value = clamp(this.value + delta * dt, min, max); },
      randomize() { this.value = Math.rand() * (max - min); },
    };
  }
}

const parameters = [];
function add_parameter(p, name) {
  const g = datgui_add(p, name, p);//u is both ref and opts
  g.animate = true;
  parameters.push(g);
}
function add_parameter_uniforms(uniforms_object) {
  for (let k in uniforms_object) {
    let v = uniforms_object[k];
    add_parameter(v, v.name || k);
  }
}

var w = 1, h = 1;//of canvas == default framebuffer

async function main() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1., 0.005, 32);
  camera.position.z = 0.6;

  const wgl2_yes = WEBGL.isWebGL2Available();
  if (!wgl2_yes)
    alert(WEBGL.getWebGL2ErrorMessage());

  const canvas = document.getElementById('canvas');
  controls = new OrbitControls(camera, canvas);
  const gl = canvas.getContext(wgl2_yes ? 'webgl2' : 'webgl', {
    //hdr framebuffer does this stuff
    alpha: false,
    antialias: false,
    depth: false,
    desynchronized: true,
    preserveDrawingBuffer: true,
  });

  renderer = new THREE.WebGLRenderer({ canvas: canvas, context: gl, antialias: true });

  var rtex = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depth: true,
    stencil: true,
  });

  const depthShell = new DepthShell();

  composer = new EffectComposer(renderer, rtex);
  composer.addPass(new RenderPass(scene, camera));
  // const pass_bloom= new BloomPass();
  // composer.addPass(pass_bloom);
  const pass_tmap = new ShaderPass({
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
  datgui_add(pass_tmap.uniforms.exposure, 'scene exposure', { minmax: [-2, 7], lambda: Math.exp });
  composer.addPass(pass_tmap);


  var env_tex = new THREE.CubeTextureLoader()
    .setPath('./textures/cubemap/')
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
  // scene.background = new THREE.Color(0xffffff);

  //todo background mask into own file
  var fsq = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { mul: { value: -8. } },
      vertexShader: "void main(){ gl_Position= vec4(position, 1.0); }",
      fragmentShader: "uniform float mul; void main(){ gl_FragColor= vec4(mul); }",
      blending: THREE.MultiplyBlending,
      depthWrite: false,
      depthTest: false,
    }));
  datgui_add(fsq.material.uniforms.mul, 'background exposure', { minmax: [-8, 7], lambda: Math.exp });
  scene.add(fsq);

  diamond = {};
  diamond.meshes = {};
  diamond.uniforms = {
    color: { value: new THREE.Color(233, 245, 255) },//fixme properly bind threecolor to datgui
    gamma: { value: 3.5, minmax: [.125, 8.] },
    metal: { value: 1. },
    blur: { value: 0., name: "gloss", lambda: x => (1. - x) * 6. },//transforms to mip level
    reflectance: { value: .45 },
    transmittance: { value: .4 },
    ior: { value: 0.09, minmax: [-5, 5], name: "refraction index" },
    sparkle_abundance: { value: .38, name: "sparkle amount", lambda: x => Math.pow(x, .5) },
    sparkle_mag: { value: 0, minmax: [0, 32], name: "sparkle brightness" },
    shimmer: { value: 0. },
    glow: { value: 0.2, minmax: [0, 4] },
    iridescence: { value: 0., minmax: [0, 4], lambda: x => x * Math.max(0., x - .125) },
    chroma: { value: 0.23, minmax: [-1, 1], lambda: x => Math.sin(x * x * x * Math.PI) },
    inversion: { value: 1, minmax: [-1, 1], lambda: x => Math.pow(x * 1.2, 4.) },
    inclusion: { value: 0., minmax: [0, 10], lambda: x => Math.pow(linear_transform(x, [0, 10], [0, 6.8]), 1.3) },
    dance: { value: 1., lambda: x => x * x * x / 208. },
    excitement: { value: 0., lambda: x => x * x * x * 200. },
  };
  add_parameter_uniforms(diamond.uniforms);
  //things not included in datgui, the order dependence here is kinda bleh
  {
    let u = diamond.uniforms;
    u.tex_env = { value: env_tex };
    u.tex_depth_back = { value: depthShell.back.texture };
    u.tex_depth_front = { value: depthShell.front.texture };
    u.time = { value: 0. };
  }

  var t = {};
  //defines must use 0:1 instead of false:true
  diamond.defines = {
    DEBUG: 0,
    ENVIRONMENT_CUBEMAP: 1,//uses phong if off, saving O(N) dependent texture samples
    ENABLE_CHROMATIC: 1,//off:on 1:3 rays
  }
  diamond.materials = {};
  diamond.defines.BACKFACE = 1;
  diamond.materials.back = new THREE.ShaderMaterial({
    uniforms: diamond.uniforms,
    defines: diamond.defines,
    vertexShader: diamond_vert,
    fragmentShader: diamond_frag,
    side: THREE.BackSide,
    transparent: true,//this affects sort order
    blending: THREE.NoBlending,//shader blends itself

    stencilWrite: true,//for inclusions, allowing early stencil test, since discard donks early depth
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilZPass: THREE.ReplaceStencilOp,
    stencilRef: 1,
  });
  //diamond.defines.DEBUG= 1;//!!
  //t={}; Object.assign(diamond.defines,t); diamond.defines= t;//unlinks previous references preventing their mutation
  //diamond.defines.BACKFACE= 0;//uh this should be 0, but it looks better this way :shrug:
  diamond.materials.front = new THREE.ShaderMaterial({
    uniforms: diamond.uniforms,
    defines: diamond.defines,
    vertexShader: diamond_vert,
    fragmentShader: diamond_frag,
    side: THREE.FrontSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });

  //t={}; Object.assign(diamond.defines,t); diamond.defines= t;
  //diamond.defines.DEBUG= 1;//!!
  diamond.materials.inclusions = new THREE.ShaderMaterial({
    //TODO
    uniforms: diamond.uniforms,
    defines: diamond.defines,
    vertexShader: inclusion_vert,
    fragmentShader: diamond_frag,
    side: THREE.FrontSide,
    //side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.NoBlending,
    vertexColors: true,//todo confirm how to vertex attributes

    depthWrite: true,
    depthTest: true,
    stencilWrite: true,
    stencilFunc: THREE.EqualStencilFunc,
    stencilRef: 1,
  });

  //t={}; Object.assign(diamond.defines,t); diamond.defines= t;
  //fixme oh god what is even happeneing with these reference-based params
  //bug: gems need individual stencil ids otherwise they will draw their inclusions inside other nearby gems

  diamond.probes = {
    internal_normals: new THREE.WebGLCubeRenderTarget(),
    //i think i will pack into an integer texture for this
  };

  //renderOrder is very important, [backface, front stencil, inclusions, front actual]

  //gltf loading
  //room for improvement but low priority
  const loaders = [];
  //maybe everything should be a single gltf file?
  function diamondload(gltf) {
    //todo figure out how to multiple materials on single mesh
    //passing material array does not work
    diamond.meshes.back = new THREE.Mesh(
      gltf.scene.children[0].geometry,
      diamond.materials.back,
    );
    diamond.meshes.front = new THREE.Mesh(
      gltf.scene.children[0].geometry,
      diamond.materials.front,
    );
  }
  function inclusionsload(gltf) {
    diamond.meshes.inclusions = new THREE.Mesh(
      gltf.scene.children[0].geometry,
      diamond.materials.inclusions,
    );
  }
  const meshload = (file, lambda) => {//this is a mess
    const p = new Promise(resolve =>
      new GLTFLoader().load(file,
        mesh => {
          lambda(mesh);
          resolve();
        })
    );
    loaders.push(p);
    return p;
  }
  meshload('./diamond/diamond.glb', diamondload);
  meshload('./inclusion_geometry/subdiv_cubes.glb', inclusionsload);


  function resize() {
    w = Math.floor(canvas.clientWidth);
    h = Math.floor(canvas.clientHeight);
    //FIXME why broken??!?!
    //cout('afsddad')
    //cout([w,h].join())
    //canvas.width= w;
    //canvas.height= h;

    [
      //perhaps this should be an event which dependents register themself?
      // pass_bloom,
      renderer,
      rtex,
      composer,
      depthShell,
    ].forEach(x => x.setSize(w, h));

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  //parameter initialization
  Object.values(parameters).forEach(p => {
    // //randomized randomization
    // if(rand()>.85)
    // 	p.randomize();
    // //randomized animation
    // if(rand()>.95)
    // 	p.animation= rand_gauss()/12.;
    // else
    p.animation = 0.;
  });



  cout('LOADING AWAIT')
  await Promise.all(loaders);
  cout('LOADING DONE')

  diamond.meshes.back.renderOrder = 0;
  diamond.meshes.inclusions.renderOrder = 1;
  diamond.meshes.front.renderOrder = 2;

  scene.add(diamond.meshes.back);
  scene.add(diamond.meshes.front);
  //scene.add(diamond.meshes.inclusions);
  //depthShell.add(diamond.meshes.front);//this is correct because there is only 2 meshes because 2 materials :C

  diamond.meshes.inclusions.scale.setScalar(.02);




  function render() {
    var dt = clock.getDelta();
    controls.update();

    //todo use object children instead
    for (let k in diamond.meshes) {
      const m = diamond.meshes[k];
      //m.rotation.x += 0.0005;
      //m.rotation.y += 0.0005;
      // m.rotation.x= -Math.PI/2.;
      m.rotation.z += 0.0015;
    }
    diamond.uniforms.time.value += dt / 8.;//reduced scale makes better precision

    Object.values(parameters).forEach(p => {
      if (p.animation !== 0.)
        p.seek(rand_gauss() * p.animation, dt);
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

function DiamondViewer() {

  useEffect(() => {
    main();
  }, []);

  return (
    <canvas id="canvas" style={{ width: '100%', height: '100%' }} />
  );

};

export default DiamondViewer;