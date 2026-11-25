(function (global) {
  'use strict';

  var VarunPool3D = {};

  /**
   * Generates a procedural mosaic pool-tile CanvasTexture with subtle tile variation.
   */
  VarunPool3D.createMosaicTexture = function (baseHex, accentHex, groutHex, repeatX, repeatY) {
    var size = 256;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = groutHex || '#cdeeff';
    ctx.fillRect(0, 0, size, size);

    var cells = 8;
    var cellSize = size / cells;
    var pad = 2;

    var baseColor = new THREE.Color(baseHex);
    var accentColor = new THREE.Color(accentHex || baseHex);

    for (var row = 0; row < cells; row++) {
      for (var col = 0; col < cells; col++) {
        var hash = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453;
        var rand = hash - Math.floor(hash);
        var tileColor = baseColor.clone().lerp(accentColor, rand * 0.42);
        if (rand > 0.84) {
          tileColor.offsetHSL(0, 0, 0.08);
        } else if (rand < 0.16) {
          tileColor.offsetHSL(0, 0, -0.06);
        }
        ctx.fillStyle = '#' + tileColor.getHexString();
        ctx.fillRect(col * cellSize + pad, row * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2);

        // Subtle glass-tile specular highlight on top edge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.fillRect(col * cellSize + pad, row * cellSize + pad, cellSize - pad * 2, 3);
      }
    }

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX || 4, repeatY || 4);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  };

  /**
   * Generates a subtle natural stone coping texture (Travertine, Sandstone, Granite).
   */
  VarunPool3D.createCopingTexture = function (baseHex, speckleHex, repeatX, repeatY) {
    var size = 256;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);

    var speckle = new THREE.Color(speckleHex);
    ctx.fillStyle = 'rgba(' + Math.round(speckle.r * 255) + ',' + Math.round(speckle.g * 255) + ',' + Math.round(speckle.b * 255) + ',0.16)';
    for (var i = 0; i < 420; i++) {
      var h1 = Math.sin(i * 19.31) * 43758.5453;
      var h2 = Math.cos(i * 41.17) * 29183.1234;
      var rx = (h1 - Math.floor(h1)) * size;
      var ry = (h2 - Math.floor(h2)) * size;
      var rw = 2 + (i % 7);
      ctx.fillRect(rx, ry, rw, 2);
    }

    // Subtle stone slab seams
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size / 2 - 2);
    ctx.strokeRect(1, size / 2 + 1, size - 2, size / 2 - 2);

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX || 3, repeatY || 2);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  };

  /**
   * Creates a GPU-animated GLSL caustics ShaderMaterial for underwater pool surfaces.
   */
  VarunPool3D.createCausticsMaterial = function (tintHex, intensity) {
    var c = new THREE.Color(tintHex || 0x7ef3ff);
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: c },
        uIntensity: { value: intensity !== undefined ? intensity : 0.42 },
        uScale: { value: 3.4 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec3 uColor;',
        'uniform float uIntensity;',
        'uniform float uScale;',
        'varying vec2 vUv;',
        '',
        'float causticPattern(vec2 uv, float t) {',
        '  vec2 p = mod(uv * 6.2831853, 6.2831853) - 250.0;',
        '  vec2 i = p;',
        '  float c = 1.0;',
        '  float inten = 0.005;',
        '  for (int n = 0; n < 4; n++) {',
        '    float nt = t * (1.0 - (3.2 / float(n + 1)));',
        '    i = p + vec2(cos(nt - i.x) + sin(nt + i.y), sin(nt - i.y) + cos(nt + i.x));',
        '    c += 1.0 / length(vec2(p.x / (sin(i.x + nt) / inten), p.y / (cos(i.y + nt) / inten)));',
        '  }',
        '  c /= 4.0;',
        '  c = 1.17 - pow(c, 1.4);',
        '  return pow(abs(c), 7.0);',
        '}',
        '',
        'void main() {',
        '  float c1 = causticPattern(vUv * uScale, uTime * 0.45);',
        '  float c2 = causticPattern(vUv * (uScale * 1.15) + vec2(0.35, 0.2), -uTime * 0.35);',
        '  float val = clamp((c1 + c2 * 0.65) * uIntensity, 0.0, 0.95);',
        '  gl_FragColor = vec4(uColor * val, val);',
        '}'
      ].join('\n')
    });
  };

  /**
   * Builds a soft circular sprite texture for bubbles and water glints.
   */
  VarunPool3D.createSoftDiscTexture = function () {
    var canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.45, 'rgba(180, 247, 255, 0.75)');
    grad.addColorStop(1, 'rgba(180, 247, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  };

  /**
   * Updates water surface vertices with multi-layered ocean/pool waves plus interactive radial ripples.
   */
  VarunPool3D.animateWaterVertices = function (geometry, baseArr, time, ripples, ampScale, freqScale) {
    var pos = geometry.attributes.position;
    var amp = ampScale || 1.0;
    var freq = freqScale || 1.0;
    var activeRipples = [];

    if (ripples && ripples.length) {
      for (var r = 0; r < ripples.length; r++) {
        if (time - ripples[r].startTime < 3.6) {
          activeRipples.push(ripples[r]);
        }
      }
      ripples.length = 0;
      for (var k = 0; k < activeRipples.length; k++) ripples.push(activeRipples[k]);
    }

    for (var i = 0; i < pos.count; i++) {
      var x = baseArr[i * 3];
      var z = baseArr[i * 3 + 2];

      var y =
        Math.sin(x * 0.78 * freq + time * 1.25) * 0.048 * amp +
        Math.cos(z * 0.95 * freq + time * 0.92) * 0.036 * amp +
        Math.sin((x + z) * 0.62 * freq - time * 1.15) * 0.022 * amp;

      for (var j = 0; j < activeRipples.length; j++) {
        var rp = activeRipples[j];
        var age = time - rp.startTime;
        var dx = x - rp.x;
        var dz = z - rp.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        var radius = age * 2.6;
        var ringDelta = dist - radius;
        if (Math.abs(ringDelta) < 1.35) {
          var decay = Math.exp(-age * 1.05) * Math.exp(-ringDelta * ringDelta * 3.8);
          y += Math.sin(ringDelta * 9.5) * 0.095 * rp.strength * decay;
        }
      }

      pos.array[i * 3 + 1] = y;
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  /**
   * Builds a recessed rectangular pool basin (4 coping borders, 4 tiled walls, tiled floor, steps, LED cove).
   * Returns { group, waterMesh, causticsMat, ledStripMat, floorMat, wallMat, copingMat }.
   */
  VarunPool3D.buildHollowRectPool = function (opts) {
    var w = opts.width;
    var d = opts.depth;
    var h = opts.height || 0.72;
    var border = opts.border || 0.42;
    var tileTex = opts.tileTexture;
    var copingTex = opts.copingTexture;

    var group = new THREE.Group();

    var copingMat = new THREE.MeshStandardMaterial({
      color: opts.copingColor || 0xe8f4f8,
      map: copingTex || null,
      roughness: 0.42,
      metalness: 0.06
    });

    var wallMat = new THREE.MeshStandardMaterial({
      color: opts.tileColor || 0xffffff,
      map: tileTex || null,
      roughness: 0.25,
      metalness: 0.12
    });

    // Outer deck / coping ring (4 slabs leaving the basin hollow)
    var topSlab = new THREE.Mesh(new THREE.BoxGeometry(w + border * 2, 0.14, border), copingMat);
    topSlab.position.set(0, 0.04, -(d / 2 + border / 2));
    group.add(topSlab);

    var bottomSlab = null;
    if (!opts.omitSouthCoping) {
      bottomSlab = new THREE.Mesh(new THREE.BoxGeometry(w + border * 2, 0.14, border), copingMat);
      bottomSlab.position.set(0, 0.04, d / 2 + border / 2);
      group.add(bottomSlab);
    }

    var leftSlab = new THREE.Mesh(new THREE.BoxGeometry(border, 0.14, d), copingMat);
    leftSlab.position.set(-(w / 2 + border / 2), 0.04, 0);
    group.add(leftSlab);

    var rightSlab = new THREE.Mesh(new THREE.BoxGeometry(border, 0.14, d), copingMat);
    rightSlab.position.set(w / 2 + border / 2, 0.04, 0);
    group.add(rightSlab);

    // Outer apron shell for clean silhouette from side/below angles
    var outerShellMat = new THREE.MeshStandardMaterial({
      color: opts.shellColor || 0x0b2545,
      roughness: 0.65,
      metalness: 0.1
    });
    var outerNorth = new THREE.Mesh(new THREE.BoxGeometry(w + border * 2, h, 0.12), outerShellMat);
    outerNorth.position.set(0, -h / 2 - 0.02, -(d / 2 + border - 0.06));
    group.add(outerNorth);
    var outerSouth = null;
    if (!opts.omitSouthCoping) {
      outerSouth = new THREE.Mesh(new THREE.BoxGeometry(w + border * 2, h, 0.12), outerShellMat);
      outerSouth.position.set(0, -h / 2 - 0.02, d / 2 + border - 0.06);
      group.add(outerSouth);
    }
    var outerWest = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, d + border * 2), outerShellMat);
    outerWest.position.set(-(w / 2 + border - 0.06), -h / 2 - 0.02, 0);
    group.add(outerWest);
    var outerEast = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, d + border * 2), outerShellMat);
    outerEast.position.set(w / 2 + border - 0.06, -h / 2 - 0.02, 0);
    group.add(outerEast);

    // Tiled pool floor
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), wallMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -h;
    group.add(floor);

    // Animated GPU caustics layer hovering 1.5cm over floor
    var causticsMat = VarunPool3D.createCausticsMaterial(opts.causticColor || 0x7ef3ff, opts.causticIntensity || 0.45);
    var causticsPlane = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, d - 0.04), causticsMat);
    causticsPlane.rotation.x = -Math.PI / 2;
    causticsPlane.position.y = -h + 0.015;
    group.add(causticsPlane);

    // 4 Interior tiled walls
    var wallNorth = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    wallNorth.position.set(0, -h / 2, -d / 2);
    group.add(wallNorth);

    var wallSouth = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    wallSouth.rotation.y = Math.PI;
    wallSouth.position.set(0, -h / 2, d / 2);
    group.add(wallSouth);

    var wallWest = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat);
    wallWest.rotation.y = Math.PI / 2;
    wallWest.position.set(-w / 2, -h / 2, 0);
    group.add(wallWest);

    var wallEast = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat);
    wallEast.rotation.y = -Math.PI / 2;
    wallEast.position.set(w / 2, -h / 2, 0);
    group.add(wallEast);

    // Recessed underwater entry steps on the left-back corner
    var stepCount = 3;
    for (var s = 0; s < stepCount; s++) {
      var stepW = (w * 0.24) * (1 - s * 0.14);
      var stepD = (d * 0.34) * (1 - s * 0.14);
      var stepH = h * ((stepCount - s) / (stepCount + 0.5));
      var stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), wallMat);
      stepMesh.position.set(-w / 2 + stepW / 2, -h + stepH / 2, -d / 2 + stepD / 2);
      group.add(stepMesh);
    }

    // Glowing underwater LED cove strip along interior perimeter
    var ledStripMat = new THREE.MeshBasicMaterial({
      color: opts.ledColor !== undefined ? opts.ledColor : 0x22d3ee,
      transparent: true,
      opacity: opts.ledOpacity !== undefined ? opts.ledOpacity : 0.85
    });
    var ledThickness = 0.035;
    var ledY = -0.18;
    var ledN = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, ledThickness, ledThickness), ledStripMat);
    ledN.position.set(0, ledY, -d / 2 + 0.02);
    group.add(ledN);
    var ledS = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, ledThickness, ledThickness), ledStripMat);
    ledS.position.set(0, ledY, d / 2 - 0.02);
    group.add(ledS);
    var ledW = new THREE.Mesh(new THREE.BoxGeometry(ledThickness, ledThickness, d - 0.04), ledStripMat);
    ledW.position.set(-w / 2 + 0.02, ledY, 0);
    group.add(ledW);
    var ledE = new THREE.Mesh(new THREE.BoxGeometry(ledThickness, ledThickness, d - 0.04), ledStripMat);
    ledE.position.set(w / 2 - 0.02, ledY, 0);
    group.add(ledE);

    // Translucent water surface mesh
    var segX = opts.segX || 56;
    var segZ = opts.segZ || 36;
    var waterGeo = new THREE.PlaneGeometry(w, d, segX, segZ);
    waterGeo.rotateX(-Math.PI / 2);
    var waterMat = new THREE.MeshPhysicalMaterial({
      color: opts.waterColor || 0x0cb8e8,
      metalness: 0.1,
      roughness: 0.12,
      transparent: true,
      opacity: opts.waterOpacity !== undefined ? opts.waterOpacity : 0.72,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      side: THREE.DoubleSide
    });
    var waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = -0.06;
    waterMesh.userData.base = waterGeo.attributes.position.array.slice();
    group.add(waterMesh);

    return {
      group: group,
      waterMesh: waterMesh,
      waterMat: waterMat,
      causticsMat: causticsMat,
      ledStripMat: ledStripMat,
      wallMat: wallMat,
      copingMat: copingMat
    };
  };

  /**
   * Builds a stainless-steel pool ladder anchored on the coping edge.
   */
  VarunPool3D.createStainlessLadder = function (x, y, z, scale) {
    var s = scale || 1;
    var ladder = new THREE.Group();
    var metal = new THREE.MeshStandardMaterial({ color: 0xecf8ff, metalness: 0.9, roughness: 0.14 });

    function addTube(pts, r) {
      var vectors = pts.map(function (p) { return new THREE.Vector3(p[0] * s, p[1] * s, p[2] * s); });
      var curve = new THREE.CatmullRomCurve3(vectors);
      ladder.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, (r || 0.035) * s, 10, false), metal));
    }

    addTube([[0, -0.45, 0], [0, 0.35, 0.02], [0, 0.52, 0.22], [0, 0.52, 0.48], [0, 0.32, 0.62], [0, 0.02, 0.62]]);
    addTube([[0.48, -0.45, 0], [0.48, 0.35, 0.02], [0.48, 0.52, 0.22], [0.48, 0.52, 0.48], [0.48, 0.32, 0.62], [0.48, 0.02, 0.62]]);

    for (var i = 0; i < 3; i++) {
      var rung = new THREE.Mesh(new THREE.CylinderGeometry(0.024 * s, 0.024 * s, 0.48 * s, 12), metal);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0.24 * s, (-0.32 + i * 0.18) * s, 0.02 * s);
      ladder.add(rung);
    }

    ladder.position.set(x, y, z);
    return ladder;
  };

  /**
   * Creates an animated underwater rising-bubble particle system.
   */
  VarunPool3D.createBubbleSystem = function (width, depth, minY, maxY, count, spriteTex) {
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var speeds = new Float32Array(count);
    var phases = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * width * 0.88;
      positions[i * 3 + 1] = minY + Math.random() * (maxY - minY);
      positions[i * 3 + 2] = (Math.random() - 0.5) * depth * 0.88;
      speeds[i] = 0.22 + Math.random() * 0.34;
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xdffbff,
      map: spriteTex || null,
      size: 0.14,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var points = new THREE.Points(geo, mat);
    points.userData = {
      speeds: speeds,
      phases: phases,
      minY: minY,
      maxY: maxY,
      width: width,
      depth: depth
    };
    return points;
  };

  VarunPool3D.updateBubbleSystem = function (points, dt, t) {
    var data = points.userData;
    var attr = points.geometry.attributes.position;
    var arr = attr.array;
    for (var i = 0; i < data.speeds.length; i++) {
      arr[i * 3 + 1] += data.speeds[i] * dt;
      arr[i * 3] += Math.sin(t * 2.1 + data.phases[i]) * 0.0025;
      if (arr[i * 3 + 1] > data.maxY) {
        arr[i * 3 + 1] = data.minY;
        arr[i * 3] = (Math.random() - 0.5) * data.width * 0.88;
        arr[i * 3 + 2] = (Math.random() - 0.5) * data.depth * 0.88;
      }
    }
    attr.needsUpdate = true;
  };

  global.VarunPool3D = VarunPool3D;
})(window);
