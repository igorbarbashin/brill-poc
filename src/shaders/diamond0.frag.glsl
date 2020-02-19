uniform samplerCube env;

uniform vec3 color;
uniform float reflectance;
uniform float transmittance;
uniform float metal;
uniform float ior;

varying vec3 V;
varying vec3 N;
void main () {
	vec3 nV= normalize(V);
	vec3 nN= normalize(N);
	vec3 R= reflect(nV,nN);
	vec3 I= refract(nV,nN,ior);

	vec3 cR= textureCube(env, R).rgb*((metal)*color)*reflectance;
	vec3 cI= textureCube(env, I).rgb*transmittance;
	vec3 cRI= cR+cI;
	//vec3 c= mix( cRI, cRI*color, metal);
	vec3 c= cRI*color/255.;
	gl_FragColor= vec4(c,1.);
}