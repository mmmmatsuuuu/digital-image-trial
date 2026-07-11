// 画像処理ロジック（純粋関数群）
// すべての関数は ImageData を受け取り、新しい ImageData を返す。
// DOM や画面要素には一切依存しない。

/**
 * 元の ImageData をコピーした新しい ImageData を作る
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
function cloneImageData(imageData) {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

/**
 * 🌙 ダークモード（ネガポジ反転）
 * RGB それぞれに「255 - 現在の値」を適用する
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
export function applyInvert(imageData) {
  const result = cloneImageData(imageData);
  const data = result.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // R
    data[i + 1] = 255 - data[i + 1]; // G
    data[i + 2] = 255 - data[i + 2]; // B
    // data[i + 3]（透明度）はそのまま
  }
  return result;
}

/**
 * 🪞 左右はんてん
 * 横1行ごとにピクセル（4バイト単位）の並び順を逆にする
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
export function applyMirror(imageData) {
  const result = cloneImageData(imageData);
  const src = imageData.data;
  const dst = result.data;
  const { width, height } = imageData;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = (y * width + x) * 4;
      const dstIndex = (y * width + (width - 1 - x)) * 4;
      dst[dstIndex] = src[srcIndex];
      dst[dstIndex + 1] = src[srcIndex + 1];
      dst[dstIndex + 2] = src[srcIndex + 2];
      dst[dstIndex + 3] = src[srcIndex + 3];
    }
  }
  return result;
}

/**
 * ⏳ レトロ白黒
 * 各ピクセルの R, G, B の平均値を新しい RGB 値として上書きする
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
export function applyGrayscale(imageData) {
  const result = cloneImageData(imageData);
  const data = result.data;
  for (let i = 0; i < data.length; i += 4) {
    const average = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = average;
    data[i + 1] = average;
    data[i + 2] = average;
  }
  return result;
}

/**
 * ⚡️ サイバーバグ（グリッチ）
 * ランダムな高さの行のかたまり（帯）を、ランダムなピクセル数だけ
 * 横にシフトさせる。空いた隙間は黒で埋める。
 * 細い帯と太い帯、小さなズレと画面を大きく横切るズレを混ぜて
 * 「データの並びが壊れた」見た目を大胆に作る。
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
export function applyGlitch(imageData) {
  const result = cloneImageData(imageData);
  const data = result.data;
  const { width, height } = imageData;

  // 10〜18 か所のグリッチ帯をランダムに作る
  const bandCount = 10 + Math.floor(Math.random() * 9);

  for (let band = 0; band < bandCount; band++) {
    const startY = Math.floor(Math.random() * height);
    // 7割は数ピクセルの細い帯、3割は太い帯（最大80px）にする
    const bandHeight =
      Math.random() < 0.7
        ? 2 + Math.floor(Math.random() * 14)
        : 30 + Math.floor(Math.random() * 51);
    // 25%の確率で画像幅の30〜55%を横切る「大ズレ」、それ以外は5〜30%のズレ
    const shiftRatio =
      Math.random() < 0.25
        ? 0.3 + Math.random() * 0.25
        : 0.05 + Math.random() * 0.25;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const shift = direction * Math.floor(width * shiftRatio);
    const endY = Math.min(startY + bandHeight, height);

    for (let y = startY; y < endY; y++) {
      const rowStart = y * width * 4;
      const originalRow = data.slice(rowStart, rowStart + width * 4);

      for (let x = 0; x < width; x++) {
        const srcX = x - shift;
        const dstIndex = rowStart + x * 4;

        if (srcX >= 0 && srcX < width) {
          const srcIndex = srcX * 4;
          data[dstIndex] = originalRow[srcIndex];
          data[dstIndex + 1] = originalRow[srcIndex + 1];
          data[dstIndex + 2] = originalRow[srcIndex + 2];
          data[dstIndex + 3] = originalRow[srcIndex + 3];
        } else {
          // シフトで空いた隙間は黒（0）で埋める
          data[dstIndex] = 0;
          data[dstIndex + 1] = 0;
          data[dstIndex + 2] = 0;
          data[dstIndex + 3] = 255;
        }
      }
    }
  }
  return result;
}
