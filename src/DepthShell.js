import {
	Scene,
	AdditiveBlending,
	Color,
	NearestFilter,
	LinearFilter,
	MeshBasicMaterial,
	MeshDepthMaterial,
	RGBAFormat,
	ShaderMaterial,
	UniformsUtils,
	BackSide,
	FrontSide,
	RedFormat,
	Vector2,
	FloatType,
	Vector3,
	WebGLRenderTarget,
	DepthFormat,
	DepthTexture,
	UnsignedShortType,
} from "three/build/three.module.js";

//bug: not all devices may support depth texture shader-sampling, this is unhandled
//flaw: concave shapes can only express their foremost faces

function DepthShell(){
	var p= {
		minFilter: NearestFilter,
		magFilter: NearestFilter,
		stencilBuffer: false,//3js depth attachments are wack such that adding a stencil causes depth24_stencil8, while without is only depth16. i dont think we need much precision
		format: RedFormat,
		type: FloatType,
		depthBuffer: true,
	};
	//3js does not support multiple depth buffers

	const  back= this.back=  new WebGLRenderTarget(100,100,p);
	const front= this.front= new WebGLRenderTarget(100,100,p);
	 back.depthTexture= new DepthTexture();
	front.depthTexture= new DepthTexture();


	const scene_front= new Scene();
	const scene_back= new Scene();	
	//having 2 scenes is cleaner than mutating the override material
	scene_front.overrideMaterial= new MeshDepthMaterial({ colorWrite: true, side: FrontSide });
	 scene_back.overrideMaterial= new MeshDepthMaterial({ colorWrite: true, side:  BackSide }); 
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
