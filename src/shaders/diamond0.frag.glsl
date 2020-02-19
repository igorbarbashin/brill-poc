uniform samplerCube env;

uniform float reflectance;
uniform float transmittance;
uniform float ior;

varying vec3 V;
varying vec3 N;
void main () {
	vec3 nV= normalize(V);
	vec3 nN= normalize(N);
	vec3 R= reflect(nV,nN);
	vec3 I= refract(nV,nN,ior);
	vec3 c= 
		+textureCube(env, R).rgb*reflectance
		+textureCube(env, I).rgb*transmittance
		//N
		;
	gl_FragColor= vec4(c,1.);
}