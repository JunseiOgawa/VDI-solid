/**
 * WebGLユーティリティ関数
 * LutLayerコンポーネントで使用するWebGL関連のヘルパー関数
 */

/**
 * シェーダーをコンパイル
 *
 * @param gl - WebGLコンテキスト
 * @param type - シェーダータイプ（VERTEX_SHADER or FRAGMENT_SHADER）
 * @param source - シェーダーソースコード
 * @returns コンパイルされたシェーダー
 * @throws コンパイルエラー
 */
export function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Failed to create shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${info}`);
  }

  return shader;
}

/**
 * シェーダープログラムを作成
 *
 * @param gl - WebGLコンテキスト
 * @param vertexShaderSource - 頂点シェーダーソース
 * @param fragmentShaderSource - フラグメントシェーダーソース
 * @returns リンクされたシェーダープログラム
 * @throws プログラム作成・リンクエラー
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string,
): WebGLProgram {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource,
  );

  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${info}`);
  }

  // シェーダーは不要になったので削除
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * フルスクリーン四角形の頂点バッファを設定
 *
 * @param gl - WebGLコンテキスト
 * @param program - シェーダープログラム
 * @param positionAttributeName - 位置属性の名前（デフォルト: "a_position"）
 * @param texCoordAttributeName - テクスチャ座標属性の名前（デフォルト: "a_texCoord"）
 */
export function setupQuad(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  positionAttributeName = "a_position",
  texCoordAttributeName = "a_texCoord",
): void {
  // 位置属性の取得と設定
  const positionLocation = gl.getAttribLocation(program, positionAttributeName);
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // フルスクリーン四角形の頂点座標（-1.0 ~ 1.0）
  const positions = new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
  ]);

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // テクスチャ座標属性の取得と設定
  const texCoordLocation = gl.getAttribLocation(program, texCoordAttributeName);
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

  // テクスチャ座標（0.0 ~ 1.0）
  // Y座標を反転させて画像が正しい向きで表示されるようにする
  const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);

  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
}

/**
 * 画像からテクスチャを作成
 *
 * @param gl - WebGLコンテキスト
 * @param image - HTMLImageElement
 * @returns 作成されたテクスチャ
 */
export function createTextureFromImage(
  gl: WebGLRenderingContext,
  image: HTMLImageElement,
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Failed to create texture");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // テクスチャパラメータの設定
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // 画像をテクスチャにアップロード
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  return texture;
}

/**
 * 3D LUTデータからテクスチャを作成
 * WebGLは3Dテクスチャをサポートしていないため、2Dテクスチャとして格納
 *
 * @param gl - WebGLコンテキスト
 * @param data - LUTデータ（Float32Array）
 * @param size - LUTのサイズ
 * @returns 作成されたテクスチャ
 */
export function create3DLutTexture(
  gl: WebGLRenderingContext,
  data: Float32Array,
  size: number,
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Failed to create LUT texture");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // テクスチャパラメータの設定
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // 3D LUTを2Dテクスチャとして格納
  // size × size × size の3D LUTを size × (size × size) の2Dテクスチャに変換
  const width = size * size;
  const height = size;

  // RGBデータをRGBAに変換（アルファチャンネルは1.0）
  const rgbaData = new Uint8Array(width * height * 4);
  for (let i = 0; i < size * size * size; i++) {
    const rgbaIndex = i * 4;
    const rgbIndex = i * 3;

    rgbaData[rgbaIndex] = Math.floor(data[rgbIndex] * 255);
    rgbaData[rgbaIndex + 1] = Math.floor(data[rgbIndex + 1] * 255);
    rgbaData[rgbaIndex + 2] = Math.floor(data[rgbIndex + 2] * 255);
    rgbaData[rgbaIndex + 3] = 255;
  }

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    rgbaData,
  );

  return texture;
}

/**
 * 頂点シェーダーのソースコード
 * フルスクリーン四角形を描画
 */
export const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

/**
 * フラグメントシェーダーのソースコード
 * 3D LUTを使用した色変換
 */
export const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform sampler2D u_image;
uniform sampler2D u_lut;
uniform float u_lutSize;

varying vec2 v_texCoord;

void main() {
  // 元の画像の色を取得
  vec4 color = texture2D(u_image, v_texCoord);

  // LUTサイズに基づいてインデックスを計算
  float lutScale = (u_lutSize - 1.0) / u_lutSize;
  float lutOffset = 0.5 / u_lutSize;

  // RGB値をLUTインデックスに変換（0.0-1.0 → LUT座標）
  vec3 scaledColor = color.rgb * lutScale + lutOffset;

  // 3D LUTルックアップ（2Dテクスチャとして格納されている）
  // Blue値でスライスを選択し、Red/Green値で位置を決定
  float blueSlice = floor(scaledColor.b * (u_lutSize - 1.0));
  float blueOffset = (blueSlice * u_lutSize) / (u_lutSize * u_lutSize);

  vec2 lutCoord;
  lutCoord.x = blueOffset + (scaledColor.r * u_lutSize) / (u_lutSize * u_lutSize);
  lutCoord.y = scaledColor.g;

  // LUTから変換後の色を取得
  vec4 lutColor = texture2D(u_lut, lutCoord);

  // アルファチャンネルは元の画像のものを保持
  gl_FragColor = vec4(lutColor.rgb, color.a);
}
`;
