import { readFile, writeFile } from 'node:fs/promises';

import { MeshoptSimplifier } from 'meshoptimizer';

const sourcePath = process.argv[2] ?? 'public/trophy-blend.bin';
const outputPath = process.argv[3] ?? 'public/trophy-blend-fast.bin';
const targetTriangles = Number.parseInt(process.argv[4] ?? '110000', 10);
const magic = Buffer.from('PMGOBLD1', 'ascii');
const missing = 2 ** 32 - 1;

function readModel(buffer) {
  if (!buffer.subarray(0, 8).equals(magic)) {
    throw new Error('Invalid trophy model file.');
  }

  const vertexCount = buffer.readUInt32LE(8);
  const indexCount = buffer.readUInt32LE(12);
  const positionsOffset = 16;
  const positionsByteLength = vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT;
  const uvsOffset = positionsOffset + positionsByteLength;
  const uvsByteLength = vertexCount * 2 * Float32Array.BYTES_PER_ELEMENT;
  const indicesOffset = uvsOffset + uvsByteLength;
  const indicesByteLength = indexCount * Uint32Array.BYTES_PER_ELEMENT;

  return {
    vertexCount,
    indexCount,
    positions: new Float32Array(
      buffer.buffer.slice(
        buffer.byteOffset + positionsOffset,
        buffer.byteOffset + positionsOffset + positionsByteLength,
      ),
    ),
    uvs: new Float32Array(
      buffer.buffer.slice(
        buffer.byteOffset + uvsOffset,
        buffer.byteOffset + uvsOffset + uvsByteLength,
      ),
    ),
    indices: new Uint32Array(
      buffer.buffer.slice(
        buffer.byteOffset + indicesOffset,
        buffer.byteOffset + indicesOffset + indicesByteLength,
      ),
    ),
  };
}

function compactAttributes(model, indices) {
  const compactIndices = indices.slice();
  const [remap, compactVertexCount] =
    MeshoptSimplifier.compactMesh(compactIndices);
  const positions = new Float32Array(compactVertexCount * 3);
  const uvs = new Float32Array(compactVertexCount * 2);

  for (let sourceIndex = 0; sourceIndex < remap.length; sourceIndex += 1) {
    const targetIndex = remap[sourceIndex];
    if (targetIndex === missing) continue;

    positions.set(
      model.positions.subarray(sourceIndex * 3, sourceIndex * 3 + 3),
      targetIndex * 3,
    );
    uvs.set(
      model.uvs.subarray(sourceIndex * 2, sourceIndex * 2 + 2),
      targetIndex * 2,
    );
  }

  return { positions, uvs, indices: compactIndices };
}

function writeModel(model) {
  const headerBytes = 16;
  const positions = Buffer.from(model.positions.buffer);
  const uvs = Buffer.from(model.uvs.buffer);
  const indices = Buffer.from(model.indices.buffer);
  const buffer = Buffer.alloc(
    headerBytes + positions.byteLength + uvs.byteLength + indices.byteLength,
  );

  magic.copy(buffer, 0);
  buffer.writeUInt32LE(model.positions.length / 3, 8);
  buffer.writeUInt32LE(model.indices.length, 12);
  positions.copy(buffer, headerBytes);
  uvs.copy(buffer, headerBytes + positions.byteLength);
  indices.copy(buffer, headerBytes + positions.byteLength + uvs.byteLength);

  return buffer;
}

await MeshoptSimplifier.ready;

const source = await readFile(sourcePath);
const model = readModel(source);
const targetIndexCount = Math.max(3, Math.floor(targetTriangles) * 3);
const [simplifiedIndices, error] = MeshoptSimplifier.simplify(
  model.indices,
  model.positions,
  3,
  targetIndexCount,
  0.025,
  ['Permissive'],
);
const optimized = compactAttributes(model, simplifiedIndices);
const output = writeModel(optimized);

await writeFile(outputPath, output);

console.log(
  JSON.stringify(
    {
      sourcePath,
      outputPath,
      sourceBytes: source.byteLength,
      outputBytes: output.byteLength,
      sourceTriangles: model.indexCount / 3,
      outputTriangles: optimized.indices.length / 3,
      sourceVertices: model.vertexCount,
      outputVertices: optimized.positions.length / 3,
      simplificationError: error,
    },
    null,
    2,
  ),
);
