precision highp float;

uniform sampler2D uBaseTex;
uniform sampler2D uReflectionTex;
uniform mat4 uMirrorVP;
uniform vec3 uCameraPos;
uniform float uOpacity;
uniform vec3 uTint;
uniform vec3 uMirrorNormal;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(uCameraPos - vWorldPos);
  float nv = clamp(abs(dot(N, V)), 0.0, 1.0);
  float fresnel = pow(1.0 - nv, 2.5);

  float alpha = clamp(uOpacity, 0.0, 1.0);
  vec4 base = texture2D(uBaseTex, vUv) * vec4(uTint, 1.0);

  vec4 clipPos = uMirrorVP * vec4(vWorldPos, 1.0);
  float w = clipPos.w;

  vec4 reflection = vec4(0.0);
  if (w > 0.0) {
    vec2 reflectionUV = (clipPos.xy / w) * 0.5 + 0.5;
    if (reflectionUV.x >= 0.0 && reflectionUV.x <= 1.0 &&
        reflectionUV.y >= 0.0 && reflectionUV.y <= 1.0) {
      reflection = texture2D(uReflectionTex, reflectionUV);
    } else {
      reflection = vec4(uTint * 0.3, 1.0);
    }
  } else {
    reflection = vec4(uTint * 0.3, 1.0);
  }

  float ndm = dot(N, normalize(uMirrorNormal));
  float frontMask = step(0.0, ndm) * step(0.8, ndm); // only the orange-side face reflects

  float reflectAmount = clamp(0.20 + 0.80 * fresnel, 0.0, 1.0);

  vec3 color = mix(base.rgb, reflection.rgb, reflectAmount * frontMask);
  gl_FragColor = vec4(color, alpha);
}
