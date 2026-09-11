'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const trophyModelPath = '/trophy-blend-fast.bin';
const trophyTexturePath = '/trophy-glass-texture.png?v=no-text';
const trophyMagic = [80, 77, 71, 79, 66, 76, 68, 49];

function parseTrophyGeometry(buffer: ArrayBuffer) {
  const view = new DataView(buffer);

  trophyMagic.forEach((value, index) => {
    if (view.getUint8(index) !== value) {
      throw new Error('Invalid trophy model file.');
    }
  });

  const vertexCount = view.getUint32(8, true);
  const indexCount = view.getUint32(12, true);
  const positionsOffset = 16;
  const positionsByteLength = vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT;
  const uvsOffset = positionsOffset + positionsByteLength;
  const uvsByteLength = vertexCount * 2 * Float32Array.BYTES_PER_ELEMENT;
  const indicesOffset = uvsOffset + uvsByteLength;
  const indicesByteLength = indexCount * Uint32Array.BYTES_PER_ELEMENT;

  const positions = new Float32Array(
    buffer.slice(positionsOffset, positionsOffset + positionsByteLength),
  );
  const uvs = new Float32Array(
    buffer.slice(uvsOffset, uvsOffset + uvsByteLength),
  );
  const indices = new Uint32Array(
    buffer.slice(indicesOffset, indicesOffset + indicesByteLength),
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function ThreeStage() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let frameId = 0;
    const startTime = performance.now() * 0.001;
    const layout = {
      x: 0,
      y: 0.24,
      z: 0,
      scale: 1.46,
      shardScale: 1,
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0.04, 5.45);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.dataset.qa = 'three-canvas';
    mount.dataset.trophy = 'loading';
    mount.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environmentScene = new RoomEnvironment();
    const environmentMap = pmremGenerator.fromScene(
      environmentScene,
      0.04,
    ).texture;
    scene.environment = environmentMap;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const root = new THREE.Group();
    scene.add(root);

    const trophyPivot = new THREE.Group();
    trophyPivot.rotation.set(-0.1, -0.28, 0.03);
    root.add(trophyPivot);

    const keyLight = new THREE.DirectionalLight(0xf5fbff, 3.55);
    keyLight.position.set(2.8, 4.2, 5.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x75e3ff, 2.2);
    rimLight.position.set(-3.2, 2.2, 3.8);
    scene.add(rimLight);

    const redLight = new THREE.PointLight(0xff2c42, 10, 10);
    redLight.position.set(-2.7, -0.5, 2.3);
    scene.add(redLight);

    const blueLight = new THREE.PointLight(0x0db7ff, 18, 10);
    blueLight.position.set(2.8, 1.9, 3.2);
    scene.add(blueLight);

    const whiteStripLight = new THREE.DirectionalLight(0xffffff, 0.82);
    whiteStripLight.position.set(0, 3.2, 5.8);
    scene.add(whiteStripLight);

    scene.add(new THREE.AmbientLight(0xaed3ff, 0.46));

    const trophyTexture = new THREE.TextureLoader().load(trophyTexturePath);
    trophyTexture.colorSpace = THREE.SRGBColorSpace;
    trophyTexture.flipY = false;
    trophyTexture.anisotropy = 12;

    const trophyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8fdff,
      map: trophyTexture,
      metalness: 0.12,
      roughness: 0.22,
      clearcoat: 0.3,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.7,
      ior: 1.38,
      specularColor: new THREE.Color(0xdff8ff),
      specularIntensity: 0.4,
      emissive: new THREE.Color(0x0c2a3d),
      emissiveIntensity: 0.035,
    });
    const shardRedMaterial = new THREE.MeshStandardMaterial({
      color: 0xf22f45,
      emissive: 0x7f1020,
      emissiveIntensity: 0.22,
      metalness: 0.3,
      roughness: 0.34,
      transparent: true,
      opacity: 0.28,
    });
    const shardBlueMaterial = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x095d85,
      emissiveIntensity: 0.22,
      metalness: 0.3,
      roughness: 0.34,
      transparent: true,
      opacity: 0.22,
    });
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xd9f7ff,
      size: 0.009,
      transparent: true,
      opacity: 0.025,
      depthWrite: false,
    });
    const disposableMaterials: THREE.Material[] = [
      trophyMaterial,
      shardRedMaterial,
      shardBlueMaterial,
      ringMaterial,
      particleMaterial,
    ];

    fetch(trophyModelPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load trophy model: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((buffer) => parseTrophyGeometry(buffer))
      .then((geometry) => {
        if (disposed) {
          geometry.dispose();
          return;
        }

        const trophyMesh = new THREE.Mesh(geometry, trophyMaterial);
        trophyMesh.name = 'blend-trophy';
        trophyMesh.rotation.set(0, 0.02, 0);
        trophyPivot.add(trophyMesh);
        mount.dataset.trophy = 'loaded';
      })
      .catch(() => {
        mount.dataset.trophy = 'fallback';
      });

    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.84, 0.008, 12, 128),
      ringMaterial,
    );
    haloRing.position.set(0, 0.04, -0.58);
    haloRing.rotation.set(Math.PI / 2, 0, 0.04);
    root.add(haloRing);

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 460;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 1.7 + Math.random() * 4.8;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -2 + Math.random() * 4.3;
      positions[i * 3 + 2] = -4.2 + Math.random() * 3.1;
    }
    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    root.add(particles);

    const shardGroup = new THREE.Group();
    root.add(shardGroup);

    const shardPositions = [
      [-0.98, 0.72, -0.42, 0.09],
      [0.92, 0.62, -0.48, 0.065],
      [-1.08, -0.2, -0.34, 0.055],
      [1.02, -0.02, -0.38, 0.08],
      [-0.54, 1.05, -0.52, 0.05],
      [0.55, 1, -0.5, 0.052],
    ];

    shardPositions.forEach(([x, y, z, size], index) => {
      const geometry =
        index % 2 === 0
          ? new THREE.OctahedronGeometry(size, 0)
          : new THREE.TetrahedronGeometry(size, 0);
      const shard = new THREE.Mesh(
        geometry,
        index % 2 === 0 ? shardBlueMaterial : shardRedMaterial,
      );
      shard.position.set(x, y, z);
      shard.rotation.set(index * 0.45, index * 0.72, index * 0.22);
      shardGroup.add(shard);
    });

    const applyLayout = () => {
      const isMobile = window.innerWidth < 720;
      const isTablet = window.innerWidth < 1024;
      const isWide = window.innerWidth > 1600;
      const isLarge = window.innerWidth > 1180;
      layout.scale = isMobile
        ? 1.1
        : isTablet
          ? 1.5
          : isWide
            ? 2.62
            : isLarge
              ? 2.56
              : 2.14;
      layout.x = isMobile
        ? 0
        : isTablet
          ? 0.72
          : isWide
            ? 2.78
            : isLarge
              ? 2.52
              : 1.82;
      layout.y = isMobile ? 0.45 : isTablet ? 0.04 : -0.7;
      layout.z = isMobile ? 0.06 : 0;
      layout.shardScale = isMobile ? 0.72 : isTablet ? 0.82 : 1.08;
    };

    const positionHeroObjects = () => {
      trophyPivot.position.set(layout.x, layout.y, layout.z);
      trophyPivot.scale.setScalar(layout.scale);

      haloRing.position.set(layout.x, layout.y, -0.58);
      haloRing.scale.setScalar(layout.scale / 1.52);
      shardGroup.position.set(layout.x, layout.y, 0);
      shardGroup.scale.setScalar(layout.shardScale);
    };

    const onResize = () => {
      applyLayout();
      positionHeroObjects();
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onScroll = () => {
      const heroProgress = Math.min(
        window.scrollY / (window.innerHeight * 0.9),
        1,
      );
      const heroPresence = 1 - heroProgress;

      positionHeroObjects();
      shardBlueMaterial.opacity = 0.025 + heroPresence * 0.085;
      shardRedMaterial.opacity = 0.025 + heroPresence * 0.095;
      ringMaterial.opacity = 0.018 + heroPresence * 0.04;
      particleMaterial.opacity = 0.01 + heroPresence * 0.025;
      mount.style.opacity = `${0.16 + heroPresence * 0.82}`;
    };

    const animate = () => {
      const time = performance.now() * 0.001 - startTime;
      if (!prefersReducedMotion) {
        trophyPivot.rotation.x = -0.1;
        trophyPivot.rotation.y = -0.28 + time * 0.72;
        trophyPivot.rotation.z = 0.03;
        haloRing.rotation.z = time * 0.095;
        particles.rotation.y = time * 0.012;
        shardGroup.rotation.y = time * 0.14;
        shardGroup.rotation.x = Math.sin(time * 0.42) * 0.035;
        shardGroup.children.forEach((child, index) => {
          child.rotation.x += 0.003 + index * 0.0008;
          child.rotation.y += 0.005 + index * 0.0006;
        });
      } else {
        trophyPivot.rotation.set(-0.1, -0.28, 0.03);
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    onResize();
    onScroll();
    animate();

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frameId);
      mount.removeChild(renderer.domElement);
      const disposableGeometries = new Set<THREE.BufferGeometry>();
      root.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.LineSegments
        ) {
          disposableGeometries.add(object.geometry);
        }
      });
      disposableGeometries.forEach((geometry) => {
        geometry.dispose();
      });
      disposableMaterials.forEach((material) => {
        material.dispose();
      });
      trophyTexture.dispose();
      environmentMap.dispose();
      environmentScene.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-[5]"
      style={{ opacity: 0 }}
      aria-hidden="true"
      data-qa="three-stage"
    />
  );
}
