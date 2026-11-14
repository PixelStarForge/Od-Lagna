import * as THREE from "three";
import {
  raDecToVector3,
  getSpectralColor,
  CELESTIAL_SPHERE_RADIUS,
} from "./celestial-math";
import type { StarRecord, ConstellationRecord, CharacterStarRecord } from "../../lib/constellation-schema";

export interface StarHitTarget {
  star: StarRecord;
  character?: CharacterStarRecord;
  worldPosition: THREE.Vector3;
}

export class CelestialEngine {
  public group: THREE.Group;
  public linesGroup: THREE.Group;
  public halosGroup: THREE.Group;
  public labelsGroup: THREE.Group;
  public starMap: Map<string, StarRecord> = new Map();
  public characterStarMap: Map<string, CharacterStarRecord> = new Map();
  public starPositions: Map<string, THREE.Vector3> = new Map();
  public constellationCenters: Map<string, THREE.Vector3> = new Map();

  private raycaster = new THREE.Raycaster();
  private hitSpheres: THREE.Mesh[] = [];
  private haloMaterials: THREE.MeshBasicMaterial[] = [];
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];

  constructor(
    stars: StarRecord[],
    constellations: ConstellationRecord[],
    characterStars: CharacterStarRecord[]
  ) {
    this.group = new THREE.Group();
    this.linesGroup = new THREE.Group();
    this.halosGroup = new THREE.Group();
    this.labelsGroup = new THREE.Group();

    this.group.add(this.linesGroup);
    this.group.add(this.halosGroup);
    this.group.add(this.labelsGroup);

    // Index stars and character associations
    for (const s of stars) {
      this.starMap.set(s.id, s);
      const pos = raDecToVector3(s.ra, s.dec, CELESTIAL_SPHERE_RADIUS);
      this.starPositions.set(s.id, pos);
    }
    for (const cs of characterStars) {
      this.characterStarMap.set(cs.starId, cs);
    }

    // 1. Build Catalog Star Points
    this.buildCatalogStars(stars);

    // 2. Build Ambient Deep Space Stars (~1200 background stars)
    this.buildAmbientStarfield(1200);

    // 3. Build Constellation Line Segments
    this.buildConstellationLines(constellations);

    // 4. Build Constellation Name Labels (displayed all the time)
    this.buildConstellationLabels(constellations);

    // 5. Build Re:Zero Character Star Beacons & Hit Targets
    this.buildCharacterBeacons(characterStars);

    // Raycaster precision for sphere points
    this.raycaster.params.Points = { threshold: 12 };
  }

  private buildCatalogStars(stars: StarRecord[]): void {
    const starCount = stars.length;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    stars.forEach((s, idx) => {
      const pos = this.starPositions.get(s.id)!;
      positions[idx * 3] = pos.x;
      positions[idx * 3 + 1] = pos.y;
      positions[idx * 3 + 2] = pos.z;

      const color = getSpectralColor(s.spectralClass);
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;

      // Hit sphere for raycasting
      const hitRadius = s.magnitude < 1.5 ? 18 : 12;
      const hitGeo = new THREE.SphereGeometry(hitRadius, 8, 8);
      this.geometries.push(hitGeo);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      this.materials.push(hitMat);
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(pos);
      hitMesh.userData = {
        star: s,
        character: this.characterStarMap.get(s.id),
        worldPosition: pos,
      };
      this.group.add(hitMesh);
      this.hitSpheres.push(hitMesh);
    });

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.geometries.push(starGeo);

    const starMat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: false,
    });
    this.materials.push(starMat);

    const points = new THREE.Points(starGeo, starMat);
    this.group.add(points);
  }

  private buildAmbientStarfield(count: number): void {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random points on celestial sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = CELESTIAL_SPHERE_RADIUS;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Subtle dim blue-white / amber tint
      const brightness = 0.35 + Math.random() * 0.45;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.95;
      colors[i * 3 + 2] = brightness * 1.05;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.geometries.push(geo);

    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: false,
    });
    this.materials.push(mat);

    const ambientPoints = new THREE.Points(geo, mat);
    this.group.add(ambientPoints);
  }

  private buildConstellationLines(constellations: ConstellationRecord[]): void {
    const linePositions: number[] = [];

    for (const c of constellations) {
      for (const [starA, starB] of c.lines) {
        const posA = this.starPositions.get(starA);
        const posB = this.starPositions.get(starB);
        if (posA && posB) {
          linePositions.push(posA.x, posA.y, posA.z);
          linePositions.push(posB.x, posB.y, posB.z);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    this.geometries.push(lineGeo);

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x6e7b99,
      transparent: true,
      opacity: 0.4,
    });
    this.materials.push(lineMat);

    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    this.linesGroup.add(lineSegments);
  }

  private buildConstellationLabels(constellations: ConstellationRecord[]): void {
    for (const c of constellations) {
      const starIds = new Set<string>();
      for (const [s1, s2] of c.lines) {
        starIds.add(s1);
        starIds.add(s2);
      }
      if (starIds.size === 0) continue;

      const center = new THREE.Vector3();
      let count = 0;
      for (const id of starIds) {
        const pos = this.starPositions.get(id);
        if (pos) {
          center.add(pos);
          count++;
        }
      }
      if (count === 0) continue;
      center.divideScalar(count);
      // Position on the celestial sphere, slightly inward so it renders cleanly and prominently
      center.normalize().multiplyScalar(CELESTIAL_SPHERE_RADIUS * 0.93);
      this.constellationCenters.set(c.id, center.clone());

      // Canvas texture (2048 x 512) for high-resolution, ultra-visible text rendering
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.clearRect(0, 0, 2048, 512);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;

      const text = c.name.toUpperCase();

      // Regular/medium weight (not bold), enlarged 3x more for high visibility
      let fontSize = 320;
      ctx.font = `500 ${fontSize}px var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = ctx.measureText(text).width;
      if (textWidth > 1850) {
        fontSize = Math.floor(fontSize * (1850 / textWidth));
        ctx.font = `500 ${fontSize}px var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      }

      // Dark stroke outline hugging letters so white text remains crisp against stars
      ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
      ctx.lineWidth = 20;
      ctx.strokeText(text, 1024, 256);

      // Plain white text (not bold, no background colors or boxes)
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, 1024, 256);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      this.textures.push(texture);

      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        depthTest: false,
      });
      this.materials.push(spriteMat);

      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(center);
      sprite.renderOrder = 999;
      // 3x larger billboard scale: 1920 x 480 units
      sprite.scale.set(1920, 480, 1);
      this.labelsGroup.add(sprite);
    }
  }

  public getConstellationCenter(id: string): THREE.Vector3 | undefined {
    return this.constellationCenters.get(id);
  }

  private buildCharacterBeacons(characterStars: CharacterStarRecord[]): void {
    for (const cs of characterStars) {
      const pos = this.starPositions.get(cs.starId);
      if (!pos) continue;

      // Luminous pulsing ring billboard facing origin
      const ringGeo = new THREE.RingGeometry(5, 7.5, 32);
      this.geometries.push(ringGeo);

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3b30, // Accent crimson glow
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      this.materials.push(ringMat);
      this.haloMaterials.push(ringMat);

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      this.halosGroup.add(ring);
    }
  }

  /**
   * Performs raycasting against star hitboxes using normalized mouse coordinates (-1 to 1).
   */
  public getIntersectedStar(
    normalizedX: number,
    normalizedY: number,
    camera: THREE.Camera
  ): StarHitTarget | null {
    this.raycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), camera);
    const intersects = this.raycaster.intersectObjects(this.hitSpheres, false);

    if (intersects.length > 0 && intersects[0].object.userData) {
      return intersects[0].object.userData as StarHitTarget;
    }
    return null;
  }

  /**
   * Projects a 3D world coordinate to 2D screen pixels.
   */
  public projectToScreen(
    pos: THREE.Vector3,
    camera: THREE.Camera,
    width: number,
    height: number
  ): { x: number; y: number; visible: boolean } {
    const cloned = pos.clone().project(camera);
    // Check if point is in front of camera
    const isFront = cloned.z < 1;

    const x = ((cloned.x + 1) * width) / 2;
    const y = ((-cloned.y + 1) * height) / 2;

    return {
      x,
      y,
      visible: isFront && x >= 0 && x <= width && y >= 0 && y <= height,
    };
  }

  /**
   * Pulsing animation step for character halos.
   */
  public update(timeMs: number): void {
    const pulse = 0.55 + 0.35 * Math.sin(timeMs * 0.0035);
    for (const mat of this.haloMaterials) {
      mat.opacity = pulse;
    }
  }

  public setLinesVisible(visible: boolean): void {
    this.linesGroup.visible = visible;
  }

  public setHalosVisible(visible: boolean): void {
    this.halosGroup.visible = visible;
  }

  public dispose(): void {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    for (const t of this.textures) t.dispose();
  }
}
