#ifdef GL_ES
  precision highp float;
#endif

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

varying lowp vec4 vColor;
uniform float frameValue;

void main(void) {
  float slowValue = floor(frameValue / 4.0);
  gl_FragColor = vColor + rand(gl_FragCoord.xy * vec2(13.0+slowValue,7.0+slowValue) * 0.01) * 0.14;
}