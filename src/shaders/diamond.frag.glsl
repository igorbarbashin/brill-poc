//@import lib WHY NOT WORK?! NO ERROR, USELESS
#line 3

#define PI  3.14159265359
#define TAU (PI*2.)
#define PHI 1.61803399
#define deg2rad 0.01745329251
#define SQRT2 (sqrt(2.))
#define BIG 1e8
#define ETA 1e-4
#define eqf(a,b) ( abs((a)-(b))<ETA )
#define fc (gl_FragCoord.xy)
#define aspect (res.x/res.y)
#define asp aspect
#define aspinv (1./aspect)
#define vec1 float
#define ivec1 int
#define uvec1 uint
#define len length
#define lerp mix
#define norm normalize
#define sat saturate
#define sats saturate_signed
#define smooth(x) smoothstep(0.,1.,x)
#define time float(iTime)
#define mouse ((iMouse.xy-res/2.)/(res*2.))
#define mouse_ang (mouse*TAU)
#define tex texture
#define BLACK  vec3(0.,0.,0.)
#define RED    vec3(1.,0.,0.)
#define GREEN  vec3(0.,1.,0.)
#define BLUE   vec3(0.,0.,1.)
#define YELLOW vec3(1.,1.,0.)
#define CYAN   vec3(0.,1.,1.)
#define PURPLE vec3(1.,0.,1.)
#define WHITE  vec3(1.,1.,1.)

vec4   srgb(vec4 c){ return pow(c,vec4(   2.2)); }
vec4 unsrgb(vec4 c){ return pow(c,vec4(1./2.2)); }
vec2 mods(vec2 x, vec1 y){ return mod(x,vec2(y));}
vec3 mods(vec3 x, vec1 y){ return mod(x,vec3(y));}
vec4 mods(vec4 x, vec1 y){ return mod(x,vec4(y));}

vec2 pows(vec2 x, vec1 y){ return pow(x,vec2(y));}
vec3 pows(vec3 x, vec1 y){ return pow(x,vec3(y));}
vec4 pows(vec4 x, vec1 y){ return pow(x,vec4(y));}




 vec2 mins( vec2 v,  vec1 s){ return min(v,  vec2(s));}
 vec3 mins( vec3 v,  vec1 s){ return min(v,  vec3(s));}
 vec4 mins( vec4 v,  vec1 s){ return min(v,  vec4(s));}
 vec2 maxs( vec2 v,  vec1 s){ return max(v,  vec2(s));}
 vec3 maxs( vec3 v,  vec1 s){ return max(v,  vec3(s));}
 vec4 maxs( vec4 v,  vec1 s){ return max(v,  vec4(s));}
 vec2 mins( vec1 s,  vec2 v){ return min(v,  vec2(s));}
 vec3 mins( vec1 s,  vec3 v){ return min(v,  vec3(s));}
 vec4 mins( vec1 s,  vec4 v){ return min(v,  vec4(s));}
 vec2 maxs( vec1 s,  vec2 v){ return max(v,  vec2(s));}
 vec3 maxs( vec1 s,  vec3 v){ return max(v,  vec3(s));}
 vec4 maxs( vec1 s,  vec4 v){ return max(v,  vec4(s));}

float maxv( vec2 a){ return                 max(a.x,a.y)  ;}
float maxv( vec3 a){ return         max(a.z,max(a.x,a.y)) ;}
float maxv( vec4 a){ return max(a.w,max(a.z,max(a.x,a.y)));}
float minv( vec2 a){ return                 min(a.x,a.y)  ;}
float minv( vec3 a){ return         min(a.z,min(a.x,a.y)) ;}
float minv( vec4 a){ return min(a.w,min(a.z,min(a.x,a.y)));}

//normalized map to signed
//[ 0,1]->[-1,1]
vec1 nmaps(vec1 x){ return x*2.-1.; }
vec2 nmaps(vec2 x){ return x*2.-1.; }
vec3 nmaps(vec3 x){ return x*2.-1.; }
vec4 nmaps(vec4 x){ return x*2.-1.; }
//normalized map to unsigned
//[-1,1]->[ 0,1]
vec1 nmapu(vec1 x){ return x*.5+.5; }
vec2 nmapu(vec2 x){ return x*.5+.5; }
vec3 nmapu(vec3 x){ return x*.5+.5; }
vec4 nmapu(vec4 x){ return x*.5+.5; }

//[0,1]
float saw(float x){ return mod(x,1.); }
float tri(float x){ return abs( mod(x,2.) -1.); }

float sum ( vec2 v){ return dot(v,vec2(1));}
float sum ( vec3 v){ return dot(v,vec3(1));}
float sum ( vec4 v){ return dot(v,vec4(1));}
  int sum (ivec2 v){ return v.x+v.y;}
  int sum (ivec3 v){ return v.x+v.y+v.z;}
  int sum (ivec4 v){ return v.x+v.y+v.z+v.w;}
float prod( vec2 v){ return v.x*v.y;}
float prod( vec3 v){ return v.x*v.y*v.z;}
float prod( vec4 v){ return v.x*v.y*v.z*v.w;}
  int prod(ivec2 v){ return v.x*v.y;}
  int prod(ivec3 v){ return v.x*v.y*v.z;}
  int prod(ivec4 v){ return v.x*v.y*v.z*v.w;}

#define sqrtabs(x) sqrt(abs(x))
#define powabs(x,p) pow(abs(x),p)

#define smoother(x) (x*x*x * (x*(x*6.-15.)+10.) )

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
vec3 rgb2hsv(vec3 rgb) {
 	float Cmax = max(rgb.r, max(rgb.g, rgb.b));
 	float Cmin = min(rgb.r, min(rgb.g, rgb.b));
 	float delta = Cmax - Cmin;

 	vec3 hsv = vec3(0., 0., Cmax);

 	if (Cmax > Cmin) {
 		hsv.y = delta / Cmax;

 		if (rgb.r == Cmax)
 			hsv.x = (rgb.g - rgb.b) / delta;
 		else {
 			if (rgb.g == Cmax)
 				hsv.x = 2. + (rgb.b - rgb.r) / delta;
 			else
 				hsv.x = 4. + (rgb.r - rgb.g) / delta;
 		}
 		hsv.x = fract(hsv.x / 6.);
 	}
 	return hsv;
 }
///////////////////
//lib copypaste end







uniform vec3 color;
uniform float gamma;
uniform float blur;
uniform float reflectance;
uniform float transmittance;
uniform float metal;
uniform float ior;

uniform float sparkle_abundance;
uniform float shimmer;
uniform float sparkle_mag;

uniform float glow;
uniform float iridescence;
uniform float chroma;
uniform float inversion;
uniform float inclusion;


precision highp sampler2DShadow;
uniform sampler2D tex_depth_front;
uniform sampler2D tex_depth_back;

#if ENVIRONMENT_CUBEMAP
uniform samplerCube tex_env;
#endif

vec3 env(vec3 v, float mip){
	#if ENVIRONMENT_CUBEMAP
	return texture(tex_env, v, mip).rgb;
	#else
	//v= normalize(v); somehow causes nans, len==0 should assertn't but whatever
	return vec3(sat(pow(abs(v.z), (8.-blur))));
	#endif
}
//note if there are weird artefacts in the reflactions its probably the texture itself






vec3  quant(vec3  p, vec3 f){	return floor(p*f)/f; }
vec3  quant(vec3  p, float f){	return quant(p,vec3(f)); }
float quant(float p, float f){	return floor(p*f)/f; }
vec3 quant_log2(vec3 p){ return exp2(floor(log2(p))); }
float gauss(float x){
	//box-muller
	return sqrt(-2.*log(sat(x)));
}
float hash3i1f(ivec3 i){
	i= ((i>>16)^i)*0x45d9f3b;
	i= ((i>>16)^i)*0x45d9f3b;
	//i= abs(i);
	int s= i.x+i.y+i.z;
	s= ((s>>16)^s)*0x45d9f3b;
	return nmapu((float(s)/float(0x7FFFFFFE)));
}
float nse31(vec3 p){
	return hash3i1f(ivec3(p*float(0xFFFFFFF)));
}
vec3 nse33(vec3 p){
	return fract(512.*tan(128.*p));
}

vec3 nyquist(vec3 p){
	#if (__VERSION__>=200)
	return 2.*max(
		abs(dFdx(p)),
		abs(dFdy(p)));
	#else
	return 1.e3;
	#endif
}

varying vec3 oP;//object vert position
varying vec3 wP;//world position
varying vec3 vN;//view normal
varying vec3 wN;//world normal
varying vec3 vV;//view view direction
varying vec2 vUV;//screenspace[0,1]
varying vec3 wV;//world view direction
void main () {
	vec3 nV= normalize(wV);
	vec3 nN= normalize(wN);

	//shader appies effects progressively to a color accumulator
	//that is, effects are highly order dependent
	vec3 c;


	//nN+= rough;
	float rough_mip= blur;

	//reflection
	vec3 R= reflect(nV,nN);
	vec3 cR= env(R, rough_mip);
	c+= cR*reflectance;

	//metallness
	//affects all color additions above
	c= mix( c, c*color/255., vec3(metal));
	
	//refraction
	vec3 I;
	vec3 cI;
	float ior_;
	#if BACKFACE
	ior_= 1./ior;
	#else
	ior_= ior;
	#endif
	#if ENABLE_CHROMATIC
		vec3 Ir= refract(nV,nN,ior_-chroma);
		vec3 Ig= refract(nV,nN,ior_       );
		vec3 Ib= refract(nV,nN,ior_+chroma);
		Ir+= step(-sum(Ir),0.)*R;//internal reflection
		Ig+= step(-sum(Ig),0.)*R;
		Ib+= step(-sum(Ib),0.)*R;	
		I= Ig;
		cI.r= env(Ir, rough_mip).r;
		cI.g= env(Ig, rough_mip).g;
		cI.b= env(Ib, rough_mip).b;
	#else
		I= refract(nV,nN,ior_);
		I+= step(-sum(I),0.)*R;
		cI= env(I, rough_mip);
	#endif
	c+= cI*transmittance;

	//ambient approximation using environment samples already taken
	vec3 cA;
	#if BACKFACE
		cA= (cR+cI)/2.;
	#else
		cA= (cR);
	#endif

	//sparkle
	float S;
	{
		vec3 p= oP;
		vec3 N= quant_log2(nyquist(p)+ETA/80.);
		vec3 F= 1./N;
		//gl_FragColor= vec4(abs(N),1.);
		//return;//!!
		//shimmer intentionally introduces subpixel+temporal alias
		S= nse31(quant(p,F));
		S= gauss(S)-nse31(p)*shimmer;
		S= sparkle_mag*sat(S*sparkle_abundance-2.);//lots of guessing was involved here
	}
	c+= cA*S*lerp(vec3(1.),color/255., vec3(metal));


	//iridescence, approx
	float irrR= sin(iridescence*dot(nV,nN));
	c= hsv2rgb(rgb2hsv(c)+vec3(irrR,irrR,0.));

	//inversion
	c= lerp(c,normalize(c),inversion);

	//depth
	float D= 1.;

	//glow
	c+= glow*color/255.*D;

	//depth shell debug
	//c= abs(
	////	+texture(tex_depth_back,  vUV).rrr
	//	+texture(tex_depth_front, vUV).rrr
	//);
	//c= sin(c*800000000.);
	//c.r= .35;

	//c= vec3(0.,0.,1.);
	c= nN*.5+.5;
	#if DEBUG
	//c= nV;
	//c= R;
	//c= env(R, rough_mip)+.2;
	//c= incls;
	//c= cI;
	//c= Ir;
	//c= cI;
	//c= nmapu(c);
	//c= vec3(S);
	#endif

	c= max(vec3(0.),c);
	c= pow(c,vec3(gamma));//contrived contrast
	//should this be done by tonemapper instead?

	gl_FragColor= vec4(c,1.);
}