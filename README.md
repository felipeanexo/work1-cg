# Trabalho CG — Reflexo e Transparência (WebGL/GLSL)

Implementação modular do enunciado usando WebGL via Three.js, com shaders GLSL autorais (Phong para objetos e Fresnel/reflexo para o material do espelho), renderização em múltiplos passes (framebuffer/render target), iluminação própria e reflexo dinâmico.

## Estrutura do Projeto

```
work1/
├── index.html              # HTML principal
├── main-app.js             # Orquestração e inicialização
├── Makefile                # Comandos para testar
├── shaders/
│   ├── phong.vert         # Vertex shader Phong (objetos)
│   ├── phong.frag         # Fragment shader Phong (iluminação)
│   ├── glass.vert         # Vertex shader do espelho (nome legado)
│   └── glass.frag         # Fragment shader do espelho (Fresnel + reflexo 2 lados)
├── classes/
│   ├── camera-controller.js    # Controle de câmera flyby
│   ├── mirror-renderer.js      # Renderização multi-pass do reflexo
│   └── scene-manager.js        # Gerenciamento da cena e objetos
└── utils/
    ├── textures.js            # Geração de texturas procedurais
    ├── lights.js              # Configuração de iluminação
    └── shader-loader.js       # Carregamento de shaders

```

## Como rodar

### Opção 1: Makefile (recomendado)

```bash
make run        # Inicia servidor na porta 8088
make open       # Abre no navegador
make stop       # Para o servidor
make test       # Verifica arquivos
make help       # Lista todos os comandos
```

### Opção 2: Manual

```bash
cd /home/felipe-versiane/Code/Academic/8/cg/work1
python3 -m http.server 8088
```

Abra no navegador: `http://localhost:8088`

## Controles

- **Mouse**: olhar (clique em "Ativar mouse look" ou clique no canvas)
- **WASD**: mover
- **Space**: subir
- **Shift**: descer / movimento mais rápido
- **Slider**: controla a opacidade do espelho (uniform `uOpacity`)

## Características Técnicas

### Shaders Autorais

- **Phong Shader** (`shaders/phong.*`): Iluminação Phong completa (ambient + diffuse + specular) para todos os objetos
- **Mirror Shader** (`shaders/glass.*`): Espelho translúcido com Fresnel e reflexo dinâmico (2 lados)

### Renderização Multi-Pass

1. **Pass 1/2 (Reflexos)**: Renderiza a cena em 2 framebuffers (um por lado do plano) usando câmera espelhada + clipping plane
2. **Pass 3 (Principal)**: Renderiza a cena normal
3. O shader do espelho amostra os framebuffers para o reflexo de cada face

### Iluminação

- **Ambient Light**: Iluminação ambiente (0.3)
- **Directional Light**: Luz direcional principal (1.0) posicionada em (5, 8, 4)
- Cálculo Phong completo nos shaders (não usa materiais do Three.js)

### Reflexo Dinâmico

- Câmera espelhada calculada por reflexão do plano
- Framebuffer 1024x1024 para o reflexo
- Mapeamento UV correto com validação de bounds
- Fresnel effect baseado no ângulo de visão

## O que atende do enunciado

✅ **Shader customizado**: Vertex + fragment shaders são 100% autorais (Phong + Glass)  
✅ **Reflexo/transparência dinâmicos**: Framebuffer renderizado da cena (multi-pass), sem cubemap  
✅ **Transparência controlada**: Uniform `uOpacity` ajustável via slider  
✅ **Textura padrão**: Textura procedural (checker) aplicada em todos os objetos, incluindo o vidro  
✅ **Clipping plane**: `renderer.localClippingEnabled = true`, aplicado nos materiais (sem "if" para filtrar)  
✅ **Câmera flyby**: Mouse look + WASD/Space/Shift  
✅ **Iluminação própria**: Shader Phong autoral (não usa MeshStandardMaterial)  
✅ **Sombreamento**: Cálculo completo de Phong (ambient + diffuse + specular)
✅ **Cena com 2+ objetos**: Cubo + esfera em lados opostos do plano

## Estrutura Modular

O código está organizado em módulos reutilizáveis:

- **`classes/`**: Classes principais (SceneManager, CameraController, MirrorRenderer)
- **`shaders/`**: Shaders GLSL separados por funcionalidade
- **`utils/`**: Funções utilitárias (texturas, luzes, loader)
- **`main-app.js`**: Orquestração e loop de animação
