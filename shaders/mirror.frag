precision highp float;

uniform sampler2D uReflectionTex;
uniform sampler2D uReflectionTexBack;
uniform mat4 uMirrorVP;
uniform mat4 uMirrorVPBack;
uniform vec3 uTint;
uniform float uReflectStrength;
uniform float uSide;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec3 N = normalize(vWorldNormal);
  float side = dot(N, vec3(1.0, 0.0, 0.0));
  
  vec3 color = uTint;
  
  if (side > 0.0) {
    vec4 clipPos = uMirrorVP * vec4(vWorldPos, 1.0);
    float w = clipPos.w;
    if (w > 0.0) {
      vec2 uv = (clipPos.xy / w) * 0.5 + 0.5;
      if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        vec3 refl = texture2D(uReflectionTex, uv).rgb;
        color = mix(uTint, refl, clamp(uReflectStrength, 0.0, 1.0));
      }
    }
  } else {
    vec4 clipPos = uMirrorVPBack * vec4(vWorldPos, 1.0);
    float w = clipPos.w;
    if (w > 0.0) {
      vec2 uv = (clipPos.xy / w) * 0.5 + 0.5;
      if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        vec3 refl = texture2D(uReflectionTexBack, uv).rgb;
        color = mix(uTint, refl, clamp(uReflectStrength, 0.0, 1.0));
      }
    }
  }

  gl_FragColor = vec4(color, 1.0);
}

