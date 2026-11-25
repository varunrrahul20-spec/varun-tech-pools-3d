(function () {
  'use strict';

  var cCanvas = document.getElementById('customizer3d');
  if (!cCanvas || typeof THREE === 'undefined' || !window.VarunPool3D) return;

  var P3D = window.VarunPool3D;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var stageContainer = document.getElementById('studio-stage');
  var mode3dBtn = document.getElementById('mode-3d-btn');
  var modeArBtn = document.getElementById('mode-ar-btn');
  var arBgImg = document.getElementById('ar-backyard-img');
  var arScaleControls = document.getElementById('ar-scale-controls');
  var arScaleSlider = document.getElementById('ar-scale-slider');
  var arScaleVal = document.getElementById('ar-scale-val');
  var stageStatusText = document.getElementById('stage-status-text');
  var stageSpecReadout = document.getElementById('stage-spec-readout');
  var formSpecSummary = document.getElementById('form-spec-summary');
  var resetCamBtn = document.getElementById('reset-camera-btn');
  var autoOrbitBtn = document.getElementById('auto-orbit-btn');
  var lightingToggleBtn = document.getElementById('lighting-toggle-btn');
  var lightingLabel = document.getElementById('lighting-label');
  var lightingIcon = document.getElementById('lighting-icon');

  var poolState = {
    shape: 'rectangular',
    size: '24 × 12 ft',
    tile: 'Marine Cobalt',
    deck: 'Travertine',
    led: 'Cyan Glow',
    mode: '3d',
    arScale: 1,
    lighting: 'day',
    autoOrbit: true
  };

  var tileConfigs = {
    'Marine Cobalt': { base: '#0752a2', accent: '#1289e8', grout: '#9ad8ff', water: 0x08aee0, caustic: 0x8af5ff },
    'Crystal Aqua': { base: '#0c88b8', accent: '#39d7ff', grout: '#d8fbff', water: 0x22d3ee, caustic: 0xb8fcff },
    'Deep Lagoon': { base: '#064e5f', accent: '#0ea5a4', grout: '#7ee6e1', water: 0x0ea5a4, caustic: 0x6ef7e8 },
    'Pearl Slate': { base: '#3b4d63', accent: '#647b96', grout: '#cbd5e1', water: 0x38bdf8, caustic: 0xa5e8ff }
  };

  var deckConfigs = {
    'Travertine': { base: '#e8f0f2', speckle: '#b8c9d1', hex: 0xffffff },
    'Sandstone': { base: '#dfd0b8', speckle: '#a38b6d', hex: 0xffffff },
    'Granite': { base: '#596373', speckle: '#2c3440', hex: 0xffffff }
  };

  var ledColors = {
    'Cyan Glow': 0x22d3ee,
    'Warm White': 0xffefc2,
    'Aurora RGB': 0x38bdf8,
    'Off': 0x000000
  };

  var sizeScales = {
    '20 × 10 ft': { sx: 0.85, sz: 0.85 },
    '24 × 12 ft': { sx: 1.0, sz: 1.0 },
    '32 × 16 ft': { sx: 1.2, sz: 1.16 }
  };

  function updateSpecReadouts() {
    var shapeLabel = poolState.shape === 'l-shaped' ? 'L-Shaped' : (poolState.shape === 'infinity' ? 'Infinity Edge' : 'Rectangular');
    var summary = shapeLabel + ' · ' + poolState.size + ' · ' + poolState.tile + ' · ' + poolState.deck + ' · LED: ' + poolState.led;
    if (stageSpecReadout) stageSpecReadout.textContent = summary;
    if (formSpecSummary) formSpecSummary.textContent = '3D Design: ' + summary;
  }

  try {
    var cRenderer = new THREE.WebGLRenderer({ canvas: cCanvas, antialias: true, alpha: true });
    cRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    cRenderer.setSize(cCanvas.clientWidth || 640, cCanvas.clientHeight || 420, false);

    var cScene = new THREE.Scene();
    var cCamera = new THREE.PerspectiveCamera(38, (cCanvas.clientWidth || 640) / Math.max(cCanvas.clientHeight || 420, 1), 0.1, 100);

    var hemiLight = new THREE.HemisphereLight(0xdaf6ff, 0x072959, 1.85);
    cScene.add(hemiLight);

    var sunLight = new THREE.DirectionalLight(0xffffff, 2.25);
    sunLight.position.set(5, 10, 6);
    cScene.add(sunLight);

    var ledPointLight = new THREE.PointLight(0x22d3ee, 2.2, 16);
    ledPointLight.position.set(0, 0.25, 0);
    cScene.add(ledPointLight);

    var cPoolRoot = new THREE.Group();
    cScene.add(cPoolRoot);

    var spriteTex = P3D.createSoftDiscTexture();
    var cWaterMeshes = [];
    var cCausticMats = [];
    var cLedMats = [];
    var cBubbleSys = null;
    var cWaterfallMat = null;
    var cMistSys = null;
    var ripples = [];
    var cClock = new THREE.Clock();

    // Soft contact shadow disc (especially helpful in AR mode)
    var shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    var sCtx = shadowCanvas.getContext('2d');
    var sGrad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 62);
    sGrad.addColorStop(0, 'rgba(3, 18, 52, 0.48)');
    sGrad.addColorStop(1, 'rgba(3, 18, 52, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    var shadowTex = new THREE.CanvasTexture(shadowCanvas);

    function createCustomLShapePool(tileTex, copingTex, tileCfg, deckCfg) {
      var group = new THREE.Group();
      var h = 0.72;
      var border = 0.36;

      var copingMat = new THREE.MeshStandardMaterial({
        color: deckCfg.hex,
        map: copingTex,
        roughness: 0.42,
        metalness: 0.06
      });
      var wallMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: tileTex,
        roughness: 0.25,
        metalness: 0.12
      });
      var shellMat = new THREE.MeshStandardMaterial({
        color: 0x0b2545,
        roughness: 0.65
      });

      // Main wing: width 5.4, depth 2.1, centered at (0, 0, -0.75)
      // Alcove wing: width 2.2, depth 2.2, centered at (-1.6, 0, 1.4)
      // Build coping perimeter around L shape
      var copingPieces = [
        { w: 5.4 + border * 2, d: border, x: 0, z: -0.75 - 1.05 - border / 2 }, // top back
        { w: border, d: 2.1, x: 2.7 + border / 2, z: -0.75 }, // right wing
        { w: 3.2 + border, d: border, x: 1.1 + border / 2, z: 0.3 + border / 2 }, // inner step-in horizontal
        { w: border, d: 2.2 + border, x: -0.5 + border / 2, z: 1.4 + border / 2 }, // inner vertical
        { w: 2.2 + border * 2, d: border, x: -1.6, z: 2.5 + border / 2 }, // front alcove
        { w: border, d: 4.3, x: -2.7 - border / 2, z: 0.35 } // left full wall
      ];
      copingPieces.forEach(function (p) {
        var slab = new THREE.Mesh(new THREE.BoxGeometry(p.w, 0.12, p.d), copingMat);
        slab.position.set(p.x, 0.03, p.z);
        group.add(slab);
      });

      // Floors
      var floorA = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.1), wallMat);
      floorA.rotation.x = -Math.PI / 2;
      floorA.position.set(0, -h, -0.75);
      group.add(floorA);

      var floorB = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), wallMat);
      floorB.rotation.x = -Math.PI / 2;
      floorB.position.set(-1.6, -h, 1.4);
      group.add(floorB);

      // Caustics
      var cMat = P3D.createCausticsMaterial(tileCfg.caustic, poolState.lighting === 'night' ? 0.65 : 0.45);
      cCausticMats.push(cMat);

      var causA = new THREE.Mesh(new THREE.PlaneGeometry(5.36, 2.06), cMat);
      causA.rotation.x = -Math.PI / 2;
      causA.position.set(0, -h + 0.015, -0.75);
      group.add(causA);

      var causB = new THREE.Mesh(new THREE.PlaneGeometry(2.16, 2.16), cMat);
      causB.rotation.x = -Math.PI / 2;
      causB.position.set(-1.6, -h + 0.015, 1.4);
      group.add(causB);

      // Perimeter interior walls
      var walls = [
        { w: 5.4, x: 0, z: -1.8, ry: 0 },
        { w: 2.1, x: 2.7, z: -0.75, ry: -Math.PI / 2 },
        { w: 3.2, x: 1.1, z: 0.3, ry: Math.PI },
        { w: 2.2, x: -0.5, z: 1.4, ry: -Math.PI / 2 },
        { w: 2.2, x: -1.6, z: 2.5, ry: Math.PI },
        { w: 4.3, x: -2.7, z: 0.35, ry: Math.PI / 2 }
      ];
      walls.forEach(function (wl) {
        var mesh = new THREE.Mesh(new THREE.PlaneGeometry(wl.w, h), wallMat);
        mesh.position.set(wl.x, -h / 2, wl.z);
        mesh.rotation.y = wl.ry;
        group.add(mesh);

        // Outer shell backing
        var back = new THREE.Mesh(new THREE.BoxGeometry(wl.w + border * 1.6, h, 0.08), shellMat);
        back.position.set(wl.x, -h / 2 - 0.02, wl.z);
        back.rotation.y = wl.ry;
        back.translateZ(-border * 0.9);
        group.add(back);
      });

      // Alcove underwater steps
      for (var s = 0; s < 3; s++) {
        var sw = 2.18;
        var sd = 0.95 * (1 - s * 0.25);
        var sh = h * ((3 - s) / 3.6);
        var st = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), wallMat);
        st.position.set(-1.6, -h + sh / 2, 2.5 - sd / 2);
        group.add(st);
      }

      // LED strips
      var ledMat = new THREE.MeshBasicMaterial({
        color: ledColors[poolState.led] || 0x22d3ee,
        transparent: true,
        opacity: poolState.led === 'Off' ? 0 : 0.9
      });
      cLedMats.push(ledMat);
      var lBack = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.03, 0.03), ledMat);
      lBack.position.set(0, -0.15, -1.78);
      group.add(lBack);
      var lLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 4.2), ledMat);
      lLeft.position.set(-2.68, -0.15, 0.35);
      group.add(lLeft);

      // Animated Water surfaces
      var wMat = new THREE.MeshPhysicalMaterial({
        color: tileCfg.water,
        metalness: 0.1,
        roughness: 0.12,
        transparent: true,
        opacity: 0.72,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        side: THREE.DoubleSide
      });

      var wGeoA = new THREE.PlaneGeometry(5.4, 2.1, 46, 20);
      wGeoA.rotateX(-Math.PI / 2);
      var wMeshA = new THREE.Mesh(wGeoA, wMat);
      wMeshA.position.set(0, -0.06, -0.75);
      wMeshA.userData.base = wGeoA.attributes.position.array.slice();
      group.add(wMeshA);
      cWaterMeshes.push(wMeshA);

      var wGeoB = new THREE.PlaneGeometry(2.2, 2.2, 22, 22);
      wGeoB.rotateX(-Math.PI / 2);
      var wMeshB = new THREE.Mesh(wGeoB, wMat);
      wMeshB.position.set(-1.6, -0.06, 1.4);
      wMeshB.userData.base = wGeoB.attributes.position.array.slice();
      group.add(wMeshB);
      cWaterMeshes.push(wMeshB);

      group.add(P3D.createStainlessLadder(2.1, 0.08, -1.0, 0.8));
      return group;
    }

    function buildPoolModel() {
      while (cPoolRoot.children.length > 0) {
        cPoolRoot.remove(cPoolRoot.children[0]);
      }
      cWaterMeshes = [];
      cCausticMats = [];
      cLedMats = [];
      cBubbleSys = null;
      cWaterfallMat = null;
      cMistSys = null;

      var tileCfg = tileConfigs[poolState.tile] || tileConfigs['Marine Cobalt'];
      var deckCfg = deckConfigs[poolState.deck] || deckConfigs['Travertine'];
      var tileTex = P3D.createMosaicTexture(tileCfg.base, tileCfg.accent, tileCfg.grout, 5, 3);
      var copingTex = P3D.createCopingTexture(deckCfg.base, deckCfg.speckle, 4, 2);

      var mainGroup = new THREE.Group();

      // Ground contact shadow
      var shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(8.8, 5.6),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: poolState.mode === 'ar' ? 0.85 : 0.45, depthWrite: false })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.78;
      mainGroup.add(shadowPlane);

      if (poolState.shape === 'l-shaped') {
        var lPool = createCustomLShapePool(tileTex, copingTex, tileCfg, deckCfg);
        mainGroup.add(lPool);
        cBubbleSys = P3D.createBubbleSystem(4.4, 1.8, -0.66, -0.1, 45, spriteTex);
        cBubbleSys.position.set(0, 0, -0.75);
        mainGroup.add(cBubbleSys);
      } else {
        var isInf = poolState.shape === 'infinity';
        var rectParts = P3D.buildHollowRectPool({
          width: 5.8,
          depth: 3.1,
          height: 0.72,
          border: 0.38,
          segX: 52,
          segZ: 30,
          tileTexture: tileTex,
          copingTexture: copingTex,
          tileColor: 0xffffff,
          copingColor: deckCfg.hex,
          shellColor: 0x0b2545,
          waterColor: tileCfg.water,
          waterOpacity: 0.72,
          causticColor: tileCfg.caustic,
          causticIntensity: poolState.lighting === 'night' ? 0.65 : 0.45,
          ledColor: ledColors[poolState.led] || 0x22d3ee,
          ledOpacity: poolState.led === 'Off' ? 0 : 0.9,
          omitSouthCoping: isInf
        });

        mainGroup.add(rectParts.group);
        cWaterMeshes.push(rectParts.waterMesh);
        cCausticMats.push(rectParts.causticsMat);
        cLedMats.push(rectParts.ledStripMat);

        var ladder = P3D.createStainlessLadder(2.4, 0.08, -0.35, 0.82);
        ladder.rotation.y = -Math.PI / 2;
        mainGroup.add(ladder);

        cBubbleSys = P3D.createBubbleSystem(5.2, 2.7, -0.66, -0.1, 55, spriteTex);
        mainGroup.add(cBubbleSys);

        if (isInf) {
          // Infinity edge weir wall + animated waterfall curtain + catch basin
          var weirMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tileTex, roughness: 0.2 });
          var weirWall = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.72, 0.14), weirMat);
          weirWall.position.set(0, -0.36, 1.62);
          mainGroup.add(weirWall);

          // Animated flowing waterfall curtain shader
          cWaterfallMat = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
              uTime: { value: 0 },
              uColor: { value: new THREE.Color(tileCfg.water) }
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
              'varying vec2 vUv;',
              'void main() {',
              '  float flow = sin(vUv.x * 38.0) * 0.5 + 0.5;',
              '  float streak = sin(vUv.y * 18.0 + uTime * 7.5 + flow * 2.4) * 0.5 + 0.5;',
              '  float foam = smoothstep(0.65, 1.0, streak) * 0.45 + (1.0 - vUv.y) * 0.35;',
              '  vec3 col = mix(uColor, vec3(0.88, 0.99, 1.0), foam);',
              '  gl_FragColor = vec4(col, 0.72 + foam * 0.22);',
              '}'
            ].join('\n')
          });

          var fallSheet = new THREE.Mesh(new THREE.PlaneGeometry(5.76, 0.70), cWaterfallMat);
          fallSheet.position.set(0, -0.34, 1.70);
          mainGroup.add(fallSheet);

          // Lower catch trough
          var trough = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.18, 0.62), rectParts.copingMat);
          trough.position.set(0, -0.72, 1.84);
          mainGroup.add(trough);

          var troughWater = new THREE.Mesh(
            new THREE.PlaneGeometry(5.8, 0.46),
            new THREE.MeshPhysicalMaterial({ color: tileCfg.water, transparent: true, opacity: 0.8, roughness: 0.1 })
          );
          troughWater.rotation.x = -Math.PI / 2;
          troughWater.position.set(0, -0.62, 1.84);
          mainGroup.add(troughWater);

          // Rising splash mist particles at catch basin
          cMistSys = P3D.createBubbleSystem(5.6, 0.35, -0.62, -0.32, 48, spriteTex);
          cMistSys.position.set(0, 0, 1.78);
          mainGroup.add(cMistSys);
        }
      }

      var sc = sizeScales[poolState.size] || { sx: 1, sz: 1 };
      mainGroup.scale.set(sc.sx * poolState.arScale, 1, sc.sz * poolState.arScale);
      cPoolRoot.add(mainGroup);
    }

    function applyLightingMode() {
      var isNight = poolState.lighting === 'night';
      if (stageContainer) {
        if (poolState.mode === 'ar') {
          stageContainer.style.background = '#071D65';
        } else {
          stageContainer.style.background = isNight
            ? 'radial-gradient(circle at 50% 30%, #0a2463 0%, #030b26 100%)'
            : 'radial-gradient(circle at 50% 25%, #164e9e 0%, #071D65 100%)';
        }
      }
      hemiLight.intensity = isNight ? 0.55 : 1.85;
      sunLight.intensity = isNight ? 0.45 : 2.25;
      ledPointLight.intensity = poolState.led === 'Off' ? 0 : (isNight ? 3.8 : 1.9);

      cCausticMats.forEach(function (m) {
        m.uniforms.uIntensity.value = isNight ? 0.68 : 0.45;
      });
      if (lightingLabel) lightingLabel.textContent = isNight ? 'Twilight' : 'Daylight';
      if (lightingIcon) lightingIcon.textContent = isNight ? 'dark_mode' : 'light_mode';
    }

    buildPoolModel();
    applyLightingMode();

    // Camera orbit, zoom, presets & click-to-ripple
    var isDragging = false;
    var pointerMoved = false;
    var prevX = 0;
    var prevY = 0;
    var rotY = -0.38;
    var rotX = 0.14;
    var camDistance = 9.4;
    var targetCamDistance = 9.4;

    var raycaster = new THREE.Raycaster();
    var pointerNdc = new THREE.Vector2();

    cCanvas.addEventListener('pointerdown', function (e) {
      isDragging = true;
      pointerMoved = false;
      prevX = e.clientX;
      prevY = e.clientY;
    });
    window.addEventListener('pointerup', function (e) {
      if (isDragging && !pointerMoved && !reducedMotion) {
        // Spawn ripple at clicked water point
        var rect = cCanvas.getBoundingClientRect();
        if (rect.width && rect.height && e.target === cCanvas) {
          pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointerNdc, cCamera);
          var hits = raycaster.intersectObjects(cWaterMeshes, false);
          if (hits.length > 0) {
            var localPt = hits[0].object.worldToLocal(hits[0].point.clone());
            ripples.push({
              x: localPt.x,
              z: localPt.z,
              startTime: cClock.getElapsedTime(),
              strength: 1.25
            });
            if (ripples.length > 6) ripples.shift();
          }
        }
      }
      isDragging = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      var dx = e.clientX - prevX;
      var dy = e.clientY - prevY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pointerMoved = true;
      prevX = e.clientX;
      prevY = e.clientY;
      rotY += dx * 0.008;
      rotX = Math.max(-0.22, Math.min(0.62, rotX + dy * 0.005));
    });

    cCanvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      targetCamDistance = Math.max(5.8, Math.min(13.5, targetCamDistance + e.deltaY * 0.005));
    }, { passive: false });

    // Camera presets
    document.querySelectorAll('[data-cam-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var preset = btn.getAttribute('data-cam-preset');
        if (preset === 'overview') {
          rotY = -0.38;
          rotX = 0.14;
          targetCamDistance = 9.4;
        } else if (preset === 'waterline') {
          rotY = 0.25;
          rotX = -0.14;
          targetCamDistance = 6.8;
        } else if (preset === 'top') {
          rotY = 0;
          rotX = 0.58;
          targetCamDistance = 9.6;
        }
      });
    });

    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', function () {
        rotY = -0.38;
        rotX = 0.14;
        targetCamDistance = 9.4;
        if (arScaleSlider) {
          arScaleSlider.value = '100';
          poolState.arScale = 1;
          if (arScaleVal) arScaleVal.textContent = '100%';
          buildPoolModel();
        }
      });
    }

    if (autoOrbitBtn) {
      autoOrbitBtn.addEventListener('click', function () {
        poolState.autoOrbit = !poolState.autoOrbit;
        autoOrbitBtn.setAttribute('aria-pressed', poolState.autoOrbit ? 'true' : 'false');
        autoOrbitBtn.classList.toggle('bg-aqua-cyan', poolState.autoOrbit);
        autoOrbitBtn.classList.toggle('text-deep-navy', poolState.autoOrbit);
        autoOrbitBtn.classList.toggle('bg-dark-surface-container/90', !poolState.autoOrbit);
        autoOrbitBtn.classList.toggle('text-ice-tint', !poolState.autoOrbit);
      });
    }

    if (lightingToggleBtn) {
      lightingToggleBtn.addEventListener('click', function () {
        poolState.lighting = poolState.lighting === 'day' ? 'night' : 'day';
        applyLightingMode();
      });
    }

    function setPreviewMode(mode) {
      poolState.mode = mode;
      if (mode === 'ar') {
        if (arBgImg) arBgImg.classList.remove('hidden');
        if (arScaleControls) {
          arScaleControls.classList.remove('hidden');
          arScaleControls.classList.add('flex');
        }
        if (stageStatusText) stageStatusText.textContent = 'AR Backyard Locked · Drag to Align Pool';
        if (modeArBtn) {
          modeArBtn.classList.add('bg-light-primary', 'text-light-on-primary');
          modeArBtn.classList.remove('text-light-on-surface-variant');
          modeArBtn.setAttribute('aria-selected', 'true');
        }
        if (mode3dBtn) {
          mode3dBtn.classList.remove('bg-light-primary', 'text-light-on-primary');
          mode3dBtn.classList.add('text-light-on-surface-variant');
          mode3dBtn.setAttribute('aria-selected', 'false');
        }
        cPoolRoot.position.y = -0.62;
        poolState.autoOrbit = false;
        if (autoOrbitBtn) {
          autoOrbitBtn.setAttribute('aria-pressed', 'false');
          autoOrbitBtn.classList.remove('bg-aqua-cyan', 'text-deep-navy');
          autoOrbitBtn.classList.add('bg-dark-surface-container/90', 'text-ice-tint');
        }
      } else {
        if (arBgImg) arBgImg.classList.add('hidden');
        if (arScaleControls) {
          arScaleControls.classList.add('hidden');
          arScaleControls.classList.remove('flex');
        }
        if (stageStatusText) stageStatusText.textContent = '3D Orbit Active · Drag to Rotate · Click Water to Ripple';
        if (mode3dBtn) {
          mode3dBtn.classList.add('bg-light-primary', 'text-light-on-primary');
          mode3dBtn.classList.remove('text-light-on-surface-variant');
          mode3dBtn.setAttribute('aria-selected', 'true');
        }
        if (modeArBtn) {
          modeArBtn.classList.remove('bg-light-primary', 'text-light-on-primary');
          modeArBtn.classList.add('text-light-on-surface-variant');
          modeArBtn.setAttribute('aria-selected', 'false');
        }
        cPoolRoot.position.y = 0;
      }
      buildPoolModel();
      applyLightingMode();
    }

    if (mode3dBtn) mode3dBtn.addEventListener('click', function () { setPreviewMode('3d'); });
    if (modeArBtn) modeArBtn.addEventListener('click', function () { setPreviewMode('ar'); });

    if (arScaleSlider) {
      arScaleSlider.addEventListener('input', function () {
        var pct = parseInt(arScaleSlider.value, 10) || 100;
        poolState.arScale = pct / 100;
        if (arScaleVal) arScaleVal.textContent = pct + '%';
        buildPoolModel();
      });
    }

    // Control group option buttons
    document.querySelectorAll('.customizer-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.closest('[data-control-group]');
        if (!group) return;
        var groupName = group.getAttribute('data-control-group');
        group.querySelectorAll('.customizer-opt').forEach(function (sibling) {
          sibling.classList.remove('bg-light-primary', 'text-light-on-primary', 'border-light-primary');
          sibling.classList.add('bg-light-surface-container-lowest', 'text-deep-navy', 'border-light-outline-variant');
        });
        btn.classList.remove('bg-light-surface-container-lowest', 'text-deep-navy', 'border-light-outline-variant');
        btn.classList.add('bg-light-primary', 'text-light-on-primary', 'border-light-primary');

        if (groupName === 'shape') {
          poolState.shape = btn.getAttribute('data-shape');
          buildPoolModel();
          applyLightingMode();
        } else if (groupName === 'size') {
          poolState.size = btn.getAttribute('data-size');
          buildPoolModel();
          applyLightingMode();
        } else if (groupName === 'tile') {
          poolState.tile = btn.getAttribute('data-tile');
          buildPoolModel();
          applyLightingMode();
        } else if (groupName === 'deck') {
          poolState.deck = btn.getAttribute('data-deck');
          buildPoolModel();
          applyLightingMode();
        } else if (groupName === 'led') {
          poolState.led = btn.getAttribute('data-led');
          var isOff = poolState.led === 'Off';
          var col = ledColors[poolState.led] || 0x22d3ee;
          ledPointLight.color.setHex(col);
          ledPointLight.intensity = isOff ? 0 : (poolState.lighting === 'night' ? 3.8 : 1.9);
          cLedMats.forEach(function (m) {
            m.color.setHex(col);
            m.opacity = isOff ? 0 : 0.9;
          });
        }
        updateSpecReadouts();
      });
    });

    function resizeCustomizer() {
      var cw = cCanvas.clientWidth;
      var ch = Math.max(cCanvas.clientHeight, 360);
      cRenderer.setSize(cw, ch, false);
      cCamera.aspect = cw / ch;
      cCamera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resizeCustomizer);
    resizeCustomizer();

    var isStudioVisible = true;
    if ('IntersectionObserver' in window) {
      var studioObs = new IntersectionObserver(function (entries) {
        isStudioVisible = entries[0].isIntersecting;
      }, { threshold: 0.02 });
      studioObs.observe(cCanvas);
    }

    var prevTime = 0;
    function animateCustomizer() {
      requestAnimationFrame(animateCustomizer);
      if (!isStudioVisible) return;

      var t = cClock.getElapsedTime();
      var dt = Math.min(t - prevTime, 0.05);
      prevTime = t;

      if (poolState.autoOrbit && !isDragging && !reducedMotion) {
        rotY += dt * 0.22;
      }

      cPoolRoot.rotation.y += (rotY - cPoolRoot.rotation.y) * 0.1;
      cPoolRoot.rotation.x += (rotX - cPoolRoot.rotation.x) * 0.1;
      camDistance += (targetCamDistance - camDistance) * 0.1;

      cCamera.position.set(0, camDistance * 0.62, camDistance * 0.94);
      cCamera.lookAt(0, -0.15, 0);

      if (!reducedMotion) {
        cWaterMeshes.forEach(function (wm) {
          P3D.animateWaterVertices(wm.geometry, wm.userData.base, t, ripples, 0.72, 1.45);
        });
        cCausticMats.forEach(function (cm) {
          cm.uniforms.uTime.value = t;
        });
        if (cBubbleSys) P3D.updateBubbleSystem(cBubbleSys, dt, t);
        if (cMistSys) P3D.updateBubbleSystem(cMistSys, dt * 1.4, t);
        if (cWaterfallMat) cWaterfallMat.uniforms.uTime.value = t;

        if (poolState.led === 'Aurora RGB') {
          var hue = (t * 0.08) % 1;
          ledPointLight.color.setHSL(hue, 0.9, 0.58);
          cLedMats.forEach(function (m) { m.color.setHSL(hue, 0.9, 0.58); });
        }
      }

      cRenderer.render(cScene, cCamera);
    }

    animateCustomizer();
    updateSpecReadouts();

    // Expose summary helper for main.js form handler
    window.getVarunPoolSummary = function () {
      return poolState;
    };
  } catch (err) {
    cCanvas.style.display = 'none';
  }
})();
