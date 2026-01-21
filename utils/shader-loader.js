export async function loadShader(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load shader: ${path}`);
  }
  return await response.text();
}

export async function loadShaders(vertexPath, fragmentPath) {
  const [vertex, fragment] = await Promise.all([
    loadShader(vertexPath),
    loadShader(fragmentPath),
  ]);
  return { vertex, fragment };
}
