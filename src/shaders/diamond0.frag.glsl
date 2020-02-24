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






uniform samplerCube env;

uniform vec3 color;
uniform float blur;
uniform float reflectance;
uniform float transmittance;
uniform float metal;
uniform float ior;

uniform float sparkle_abundance;
uniform float sparkle_rate;
uniform float sparkle_mag;

uniform float glow;
uniform float iridescence;
uniform float chroma;
uniform float inversion;
uniform float inclusion;

vec3 lowpass(vec3 p, float f){
	return floor(p*f)/f;
}
float gauss(float x, float sigma){
	float e= x/(sigma*sigma);
	return exp(-e*e);
}
float hash3i1f(ivec3 i){
	i= ((i>>16)^i)*0x45d9f3b;
	i= ((i>>16)^i)*0x45d9f3b;
	return float(i.x+i.y+i.z)/float(0x7FFFFFFF);
}
float nse31(vec3 p){
	return fract(sum(512.*tan(128.*p)));
}
vec3 nse33(vec3 p){
	return fract(512.*tan(128.*p));
}
float voronoi(vec3 x){
	//inigo quilez, 3d fork by khlor
    ivec3 p = ivec3(floor( x ));
    vec3  f = fract( x );

    ivec3 mb;
    vec3 mr;

    float res = 8.0;
    for( int k=-1; k<=1; k++ )
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        ivec3 b = ivec3(i,j,k);
        vec3  r = vec3(b) + hash3i1f(p+b)-f;
        float d = dot(r,r);

        if( d < res )
        {
            res = d;
            mr = r;
            mb = b;
        }
    }

    res = 8.0;
    for( int k=-2; k<=2; k++ )
    for( int j=-2; j<=2; j++ )
    for( int i=-2; i<=2; i++ )
    {
        ivec3 b = mb + ivec3(i,j,k);
        vec3  r = vec3(b) + hash3i1f(p+b) - f;
        float d = dot(0.5*(mr+r), normalize(r-mr));

        res = min( res, d );
    }

    return res;
}


float sparkle(vec3 p){
	float F= 1.e4;//lowpass freq
	//float nyquist= max(dFdx(p.x),dFdy(p.y));
	//F
	float acc= 0.;
	//sparkle rate intentionally introduces subpixel alias
	acc= lerp(
		nse31(lowpass(p,F)),
		nse31(lowpass(p,F*32.)),
		sparkle_rate
		);
	acc/= (1.+sparkle_rate);//*3.;//normalize
	acc= gauss(acc,sparkle_abundance);
    return acc;
    //todo better
}


varying vec3 oP;//object vert position
varying vec3 wP;//world position
varying vec3 vN;//view normal
varying vec3 wN;//world normal
varying vec3 vV;//view view direction
varying vec3 wV;//world view direction
void main () {
	vec3 nV= normalize(wV);
	vec3 nN= normalize(wN);

	//shader appies effects progressively in a way that is highly order dependent

	//inclusion
	//todo make a seperate geometry, this is a crude placeholder
	//inclusions are easily more complex than the outer gem
	vec3 incls;
	{	
		vec3 p= oP*469.;
		float f= voronoi(p);
		vec3 ddf= vec3(//numerical derivative
			voronoi(p+vec3(ETA,0.,0.)),
			voronoi(p+vec3(0.,ETA,0.)),
			voronoi(p+vec3(0.,0.,ETA))
			);
		incls= (ddf-f)/ETA;
		//incls= 1.-incls;
		//incls*= pow( sat( 1.-voronoi(p/16.) ), nmaps(inclusion));
		incls*= sat(-voronoi(p/16.)+inclusion);
	}
	nN+= (nN+incls)/2.;
	nN= normalize(nN);


	//nN+= rough;
	float rough_mip= blur;



	float S;
	S= sparkle(oP);
	S*= sparkle_mag;

	vec3 c;

	//reflection
	vec3 R= reflect(nV,nN);
	vec3 cR= textureCube(env, R, rough_mip).rgb;
	c+= cR*reflectance;
	
	//refraction
	#if BACKFACE
	vec3 I;
	vec3 cI;
	#if ENABLE_CHROMATIC
	vec3 Ir= refract(nV,nN,ior-chroma);
	vec3 Ig= refract(nV,nN,ior);
	vec3 Ib= refract(nV,nN,ior+chroma);
	I= Ig;
	cI.r= textureCube(env, Ir, rough_mip).r;
	cI.g= textureCube(env, Ig, rough_mip).g;
	cI.b= textureCube(env, Ib, rough_mip).b;
	#else
	I= refract(nV,nN,ior);
	cI= textureCube(env, I, rough_mip).rgb;
	#endif
	c+= cI*transmittance;
	#endif

	//iridescence, approx
	//applies to reflection and refraction
	float irrR= sin(iridescence*dot(nV,nN));
	c= hsv2rgb(rgb2hsv(c)+vec3(irrR,0.,0.));

	//ambient approximation
	#if BACKFACE
	vec3 cA= (cR+cI)/2.;
	#else
	vec3 cA= (cR);
	#endif

	//sparkle
	//approx the environment using samples already taken
	c+= cA*S;

	//metallness
	//affects all color additions above
	c= mix( c, c*color/255., vec3(metal));

	c= lerp(c,normalize(c),inversion);

	//glow
	c+= glow*color/255.;

	//debug
	//c= nN;
	//c= nV;
	//c= R;
	//c= textureCube(env, R).rgb+.2;
	//c= incls;
	//c= cI;
	//c= Ir;
	#if BACKFACE
	c= cI;
	#endif
	//c= cI;
	//c= nmapu(c);


	gl_FragColor= vec4(c,1.);
}