//@import lib WHY NOT WORK?! NO ERROR, USELESS
#line 2

#define PI  3.14159265359
#define TAU (PI*2.)
#define PHI 1.61803399
#define deg2rad 0.01745329251
#define SQRT2 (sqrt(2.))
#define BIG 1e8
#define ETA 1e-4
#define eqf(a,b) ( abs((a)-(b))<ETA )
#define fc (gl_FragCoord.xy)
#define res (iResolution.xy)
#define ires ivec2(iResolution.xy)
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

///////////////////
//lib copypaste end




uniform samplerCube env;

uniform vec3 color;
uniform float reflectance;
uniform float transmittance;
uniform float metal;
uniform float ior;

uniform float sparkle_abundance;
uniform float sparkle_rate;
uniform float sparkle_mag;

uniform float glow;

float nse(vec3 p){
	float G= 4.e4;
	p= floor(p*G)/G;//lowpass

	float v;
	p*= 128.*PHI;
	v+= fract(512.*PHI*tan(p.x));
	v+= fract(512.*PHI*tan(p.y));
	v+= fract(512.*PHI*tan(p.z));
    return v;
    //todo better
}

float gauss(float x, float sigma){
	float e= x/(sigma*sigma);
	return exp(-e*e);
}

varying vec3 O;
varying vec3 V;
varying vec3 N;
void main () {
	vec3 nV= normalize(V);
	vec3 nN= normalize(N);
	vec3 R= reflect(nV,nN);
	vec3 I= refract(nV,nN,ior);

	//nN+= rough;

	float S;
	S= nse(O);
	S= gauss(S,sparkle_abundance);
	S*= sparkle_mag;

	
	//reflection
	vec3 cR= textureCube(env, R).rgb;
	//sparkle
	//approx using the same sample as flat reflection
	cR= cR*reflectance + cR*S;
	//refraction
	vec3 cI= textureCube(env, I).rgb*transmittance;
	vec3 cRI= cR+cI;
	vec3 c= mix( cRI, cRI*color/255., vec3(metal));
	c+= glow*color/255.;
	gl_FragColor= vec4(c,1.);
}