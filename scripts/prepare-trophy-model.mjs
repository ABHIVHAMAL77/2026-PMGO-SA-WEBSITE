import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { MeshoptSimplifier } from 'meshoptimizer';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? 'public/trophy-web.bin';
const targetTriangles = Number.parseInt(process.argv[4] ?? '60000', 10);
const weldTolerance = Number.parseFloat(process.argv[5] ?? '0.002');
const missing = 2 ** 32 - 1;
const magic = new Uint8Array([80, 77, 71, 79, 51, 68, 49, 0]);

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
}

function toUint32Array(array) {
  return array instanceof Uint32Array ? array : Uint32Array.from(array);
}

function normalizePositions(sourcePositions, remap, vertexCount) {
  const compactPositions = new Float32Array(vertexCount * 3);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let sourceIndex = 0; sourceIndex < remap.length; sourceIndex += 1) {
    const targetIndex = remap[sourceIndex];
    if (targetIndex === missing) continue;

    const sourceOffset = sourceIndex * 3;
    const x = sourcePositions[sourceOffset];
    const y = sourcePositions[sourceOffset + 2];
    const z = -sourcePositions[sourceOffset + 1];
    const targetOffset = targetIndex * 3;

    compactPositions[targetOffset] = x;
    compactPositions[targetOffset + 1] = y;
    compactPositions[targetOffset + 2] = z;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const scale = Math.max(maxY - minY, 0.0001);

  for (let index = 0; index < compactPositions.length; index += 3) {
    compactPositions[index] = (compactPositions[index] - centerX) / scale;
    compactPositions[index + 1] =
      (compactPositions[index + 1] - centerY) / scale;
    compactPositions[index + 2] =
      (compactPositions[index + 2] - centerZ) / scale;
  }

  return compactPositions;
}

function buildBinaryModel(positions, indices) {
  const headerBytes = 16;
  const positionBytes = positions.byteLength;
  const indexBytes = indices.byteLength;
  const model = Buffer.alloc(headerBytes + positionBytes + indexBytes);
  magic.forEach((value, index) => {
    model[index] = value;
  });
  model.writeUInt32LE(positions.length / 3, 8);
  model.writeUInt32LE(indices.length, 12);

  Buffer.from(positions.buffer, positions.byteOffset, positionBytes).copy(
    model,
    headerBytes,
  );
  Buffer.from(indices.buffer, indices.byteOffset, indexBytes).copy(
    model,
    headerBytes + positionBytes,
  );
  return model;
}

if (!inputPath) {
  throw new Error(
    'Usage: node scripts/prepare-trophy-model.mjs <input.stl> [output.bin] [targetTriangles] [weldTolerance]',
  );
}

const rawStl = readFileSync(inputPath);
const sourceGeometry = new STLLoader().parse(toArrayBuffer(rawStl));
const weldedGeometry = BufferGeometryUtils.mergeVertices(
  sourceGeometry,
  weldTolerance,
);
const sourcePositions = weldedGeometry.getAttribute('position').array;
const sourceIndices = toUint32Array(weldedGeometry.index.array);
const targetIndexCount = Math.max(3, Math.floor(targetTriangles) * 3);

await MeshoptSimplifier.ready;

const [simplifiedIndices, error] = MeshoptSimplifier.simplify(
  sourceIndices,
  sourcePositions,
  3,
  targetIndexCount,
  0.02,
  ['Permissive'],
);
const compactIndices = simplifiedIndices.slice();
const [remap, compactVertexCount] =
  MeshoptSimplifier.compactMesh(compactIndices);
const compactPositions = normalizePositions(
  sourcePositions,
  remap,
  compactVertexCount,
);
const binaryModel = buildBinaryModel(compactPositions, compactIndices);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, binaryModel);

console.log(
  JSON.stringify(
    {
      inputPath,
      outputPath,
      originalTriangles: sourceGeometry.getAttribute('position').count / 3,
      weldedVertices: sourcePositions.length / 3,
      targetTriangles,
      outputTriangles: compactIndices.length / 3,
      outputVertices: compactVertexCount,
      outputBytes: binaryModel.byteLength,
      simplificationError: error,
    },
    null,
    2,
  ),
);
