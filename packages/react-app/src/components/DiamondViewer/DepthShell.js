import * as THREE from 'three';

//bug: not all devices may support depth texture shader-sampling, this is unhandled
//flaw: concave shapes can only express their foremost faces

function DepthShell(){
	var p= {
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		stencilBuffer: false,//3js depth attachments are wack such that adding a stencil causes depth24_stencil8, while without is only depth16. i dont think we need much precision
		format: THREE.RedFormat,
		type: THREE.FloatType,
		depthBuffer: true,
	};
	//3js does not support multiple depth buffers

	const  back= this.back=  new THREE.WebGLRenderTarget(100,100,p);
	const front= this.front= new THREE.WebGLRenderTarget(100,100,p);
	 back.depthTexture= new THREE.DepthTexture();
	front.depthTexture= new THREE.DepthTexture();


	const scene_front= new THREE.Scene();
	const scene_back= new THREE.Scene();	
	//having 2 scenes is cleaner than mutating the override material
	scene_front.overrideMaterial= new THREE.MeshDepthMaterial({ colorWrite: true, side: THREE.FrontSide });
	scene_back.overrideMaterial= new THREE.MeshDepthMaterial({ colorWrite: true, side: THREE.BackSide }); 
	scene_front.sortObjects= false;
	scene_back.sortObjects= false;
	this.add= o=>{
		scene_front.add(o);
		 scene_back.add(o);
	};
	this.dispose= ()=>{
		back.dispose();
		front.dispose();
	};
	this.setSize= (width, height)=>{
		const w= width;
		const h= height;
		 back.setSize(w,h);
		front.setSize(w,h);
	};
	//uses the added objects
	this.render= (renderer,camera)=>{
		const pop= {
			targ: renderer.getRenderTarget(),
		};

		renderer.setRenderTarget(back);
		//renderer.clearDepth();
		renderer.render(scene_back, camera);

		renderer.setRenderTarget(front);
		//renderer.clearDepth();
		renderer.render(scene_front, camera);

		//restore state (this is terrible yet standard design)
		renderer.setRenderTarget(pop.targ);
	};
};

export { DepthShell };
