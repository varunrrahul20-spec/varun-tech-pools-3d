(function () {
  'use strict';

  var canvas = document.getElementById('pool3d');
  if (!canvas || typeof THREE === 'undefined' || !window.VarunPool3D) return;

  var P3D = window.VarunPool3D;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(canvas.clientWidth, Math.max(canvas.clientHeight, 1), false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / Math.max(canvas.clientHeight, 1), 0.1, 120);
    camera.position.set(-0.6, 6.4, 12.2);
    camera.lookAt(1.8, -0.3, -0.2);

    scene.add(new THREE.HemisphereLight(0xd4f8ff, 0x05285a, 2.0));
    var sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(-6, 11, 7);
    scene.add(sun);

    var aquaFill = new THREE.PointLight(0x12c7ee, 2.2, 28);
    aquaFill.position.set(2.5, 1.8, 0.5);
    scene.add(aquaFill);

    var heroGroup = new THREE.Group();
    scene.add(heroGroup);

    var tileTex = P3D.createMosaicTexture('#0759c9', '#12c7ee', '#bfefff', 10, 6);
    var copingTex = P3D.createCopingTexture('#e8f4f8', '#94b8d0', 6, 4);
    var spriteTex = P3D.createSoftDiscTexture();

    var poolParts = P3D.buildHollowRectPool({
      width: 15.5,
      depth: 9.6,
      height: 1.35,
      border: 0.72,
      segX: 84,
      segZ: 54,
      tileTexture: tileTex,
      copingTexture: copingTex,
      tileColor: 0xffffff,
      copingColor: 0xeef9ff,
      shellColor: 0x051b4d,
      waterColor: 0x09b8ea,
      waterOpacity: 0.72,
      causticColor: 0x8ef5ff,
      causticIntensity: 0.56,
      ledColor: 0x22d3ee,
      ledOpacity: 0.9
    });
    heroGroup.add(poolParts.group);

    // Stainless steel ladder on the right coping edge
    var ladder = P3D.createStainlessLadder(6.3, 0.1, -1.6, 1.55);
    ladder.rotation.y = -Math.PI / 2;
    heroGroup.add(ladder);

    // Rising underwater bubbles
    var bubbles = P3D.createBubbleSystem(14.5, 8.6, -1.25, -0.08, 120, spriteTex);
    heroGroup.add(bubbles);

    // Shimmering surface sun-glint particles
    var glintCount = 130;
    var glintGeo = new THREE.BufferGeometry();
    var glintPos = new Float32Array(glintCount * 3);
    for (var g = 0; g < glintCount; g++) {
      glintPos[g * 3] = (Math.random() - 0.5) * 14.8;
      glintPos[g * 3 + 1] = 0.02 + Math.random() * 0.05;
      glintPos[g * 3 + 2] = (Math.random() - 0.5) * 9.0;
    }
    glintGeo.setAttribute('position', new THREE.BufferAttribute(glintPos, 3));
    var glintMat = new THREE.PointsMaterial({
      color: 0xffffff,
      map: spriteTex,
      size: 0.12,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var glints = new THREE.Points(glintGeo, glintMat);
    heroGroup.add(glints);

    // Three softly glowing floating pool light orbs
    var floatOrbs = [];
    var orbCoords = [
      { x: 2.2, z: -1.4, r: 0.24, phase: 0.0 },
      { x: -1.8, z: 1.9, r: 0.19, phase: 2.1 },
      { x: 4.5, z: 2.1, r: 0.21, phase: 4.2 }
    ];
    var orbMat = new THREE.MeshPhysicalMaterial({
      color: 0xdffbff,
      emissive: 0x12c7ee,
      emissiveIntensity: 0.65,
      roughness: 0.12,
      metalness: 0.05,
      clearcoat: 1.0
    });
    orbCoords.forEach(function (cfg) {
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(cfg.r, 24, 24), orbMat);
      mesh.position.set(cfg.x, 0.03, cfg.z);
      mesh.userData = { baseX: cfg.x, baseZ: cfg.z, phase: cfg.phase };
      heroGroup.add(mesh);
      floatOrbs.push(mesh);
    });

    // Position the pool slightly right so hero copy stays crisp on the left
    heroGroup.position.set(2.5, -0.45, -0.4);
    heroGroup.rotation.x = 0.04;
    heroGroup.rotation.y = -0.18;

    // Interactive pointer ripples via raycasting
    var raycaster = new THREE.Raycaster();
    var pointerNdc = new THREE.Vector2();
    var ripples = [];
    var lastMoveRipple = 0;
    var pointerX = 0;
    var pointerY = 0;
    var clock = new THREE.Clock();

    function spawnRippleAtEvent(clientX, clientY, strength) {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      var hits = raycaster.intersectObject(poolParts.waterMesh, false);
      if (hits.length > 0) {
        var localPt = poolParts.waterMesh.worldToLocal(hits[0].point.clone());
        ripples.push({
          x: localPt.x,
          z: localPt.z,
          startTime: clock.getElapsedTime(),
          strength: strength
        });
        if (ripples.length > 8) ripples.shift();
      }
    }

    var heroSection = document.getElementById('home') || window;
    heroSection.addEventListener('pointermove', function (e) {
      pointerX = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 1.1;
      pointerY = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 0.55;
      var now = performance.now();
      if (!reducedMotion && now - lastMoveRipple > 240) {
        lastMoveRipple = now;
        spawnRippleAtEvent(e.clientX, e.clientY, 0.55);
      }
    });

    heroSection.addEventListener('pointerdown', function (e) {
      if (e.target && e.target.closest('a, button')) return;
      if (!reducedMotion) {
        spawnRippleAtEvent(e.clientX, e.clientY, 1.45);
      }
    });

    function handleResize() {
      var w = canvas.clientWidth;
      var h = Math.max(canvas.clientHeight, 1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', handleResize);

    var isVisible = true;
    if ('IntersectionObserver' in window) {
      var visObs = new IntersectionObserver(function (entries) {
        isVisible = entries[0].isIntersecting;
      }, { threshold: 0.02 });
      visObs.observe(canvas);
    }

    var prevTime = 0;
    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      var t = clock.getElapsedTime();
      var dt = Math.min(t - prevTime, 0.05);
      prevTime = t;

      if (!reducedMotion) {
        P3D.animateWaterVertices(
          poolParts.waterMesh.geometry,
          poolParts.waterMesh.userData.base,
          t,
          ripples,
          1.15,
          0.95
        );

        poolParts.causticsMat.uniforms.uTime.value = t;
        P3D.updateBubbleSystem(bubbles, dt, t);

        // Bobbing floating orbs
        for (var o = 0; o < floatOrbs.length; o++) {
          var orb = floatOrbs[o];
          var ph = orb.userData.phase;
          orb.position.y = 0.03 + Math.sin(t * 1.7 + ph) * 0.045;
          orb.position.x = orb.userData.baseX + Math.sin(t * 0.45 + ph) * 0.14;
          orb.position.z = orb.userData.baseZ + Math.cos(t * 0.38 + ph) * 0.12;
        }

        glintMat.opacity = 0.55 + Math.sin(t * 1.9) * 0.22;
        heroGroup.rotation.y = -0.18 + Math.sin(t * 0.22) * 0.045;

        // Scroll-linked subtle camera choreography + pointer parallax
        var scrollNorm = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
        var targetCamX = -0.6 + pointerX + scrollNorm * 0.9;
        var targetCamY = 6.4 - pointerY - scrollNorm * 1.4;
        var targetCamZ = 12.2 - scrollNorm * 1.6;

        camera.position.x += (targetCamX - camera.position.x) * 0.05;
        camera.position.y += (targetCamY - camera.position.y) * 0.05;
        camera.position.z += (targetCamZ - camera.position.z) * 0.05;
        camera.lookAt(1.8, -0.35, -0.2);
      }

      renderer.render(scene, camera);
    }

    animate();
  } catch (err) {
    canvas.style.display = 'none';
  }
})();
