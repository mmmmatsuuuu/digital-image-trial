// 解説用の図（ダイアグラム）を組み立てるモジュール
// content.js の diagram データを受け取り、DOM要素を組み立てて返す。
// Canvas や画像処理には依存しない、表示専用の部品。

/**
 * 色見本（スウォッチ）とRGB値ラベルの縦ブロックを作る
 * @param {{r: number, g: number, b: number}} rgb
 * @param {string} caption 見本の下に出す説明（例:「もとの色」）
 * @returns {HTMLElement}
 */
function createSwatch(rgb, caption) {
  const wrap = document.createElement("div");
  wrap.className = "flex flex-col items-center gap-1";

  const box = document.createElement("div");
  box.className = "h-14 w-14 rounded-lg border border-gray-500 shadow-lg";
  box.style.backgroundColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  const values = document.createElement("p");
  values.className = "text-[10px] leading-tight text-gray-300 text-center";
  values.textContent = `R:${rgb.r} G:${rgb.g} B:${rgb.b}`;

  const label = document.createElement("p");
  label.className = "text-[10px] font-bold text-gray-400";
  label.textContent = caption;

  wrap.append(box, values, label);
  return wrap;
}

/**
 * 計算式つきの矢印ブロックを作る
 * @param {string[]} formulas 矢印の上に表示する計算式の行
 * @returns {HTMLElement}
 */
function createArrow(formulas) {
  const wrap = document.createElement("div");
  wrap.className = "flex flex-col items-center justify-center px-1";

  for (const formula of formulas) {
    const line = document.createElement("p");
    line.className = "text-[10px] font-bold leading-tight text-cyan-300 whitespace-nowrap";
    line.textContent = formula;
    wrap.append(line);
  }

  const arrow = document.createElement("p");
  arrow.className = "text-2xl leading-none text-cyan-400";
  arrow.textContent = "→";
  wrap.append(arrow);

  return wrap;
}

/**
 * 1マス分のセルを作る（ワークの0/1マス、グリッチのピクセル共用）
 * @param {string} color CSSの背景色
 * @param {string} [text] マスの中に表示する文字（0/1など）
 * @param {string} [textColor] 文字色
 * @returns {HTMLElement}
 */
function createCell(color, text = "", textColor = "#fff") {
  const cell = document.createElement("div");
  cell.className =
    "flex h-6 w-6 items-center justify-center rounded-sm border border-gray-500 text-[10px] font-bold";
  cell.style.backgroundColor = color;
  cell.style.color = textColor;
  cell.textContent = text;
  return cell;
}

/**
 * 4階調（2ビット）のマスが並んだ1行を作る
 * 00=黒 〜 11=白（数字が大きいほど明るい）
 * @param {string[]} codes 2ビットの数字（"00"〜"11"）の並び
 * @param {string} caption
 * @returns {HTMLElement}
 */
function createGrayCodeRow(codes, caption) {
  const wrap = document.createElement("div");
  wrap.className = "flex flex-col items-center gap-1";

  const row = document.createElement("div");
  row.className = "flex gap-0.5";
  for (const code of codes) {
    const level = parseInt(code, 2); // 0〜3
    const value = level * 85; // 4階調を0〜255に換算
    const textColor = level >= 2 ? "#111" : "#fff";
    row.append(createCell(`rgb(${value}, ${value}, ${value})`, code, textColor));
  }

  const label = document.createElement("p");
  label.className = "text-[10px] font-bold text-gray-400";
  label.textContent = caption;

  wrap.append(row, label);
  return wrap;
}

/**
 * グリッチ説明用のミニ画像（縦線入りのマス目）を作る
 * @param {number} rows 行数
 * @param {number} cols 列数
 * @param {number[]} lineCols 縦線を描く列番号
 * @param {number[]} shiftedRows 右にズラす行番号
 * @param {number} shift ズラすマス数（0なら元の画像）
 * @param {string} caption
 * @returns {HTMLElement}
 */
function createPixelGrid(rows, cols, lineCols, shiftedRows, shift, caption) {
  const wrap = document.createElement("div");
  wrap.className = "flex flex-col items-center gap-1";

  const grid = document.createElement("div");
  grid.className = "flex flex-col gap-0.5";

  for (let y = 0; y < rows; y++) {
    const rowEl = document.createElement("div");
    rowEl.className = "flex gap-0.5";
    const rowShift = shiftedRows.includes(y) ? shift : 0;

    for (let x = 0; x < cols; x++) {
      const srcX = x - rowShift;
      if (srcX < 0) {
        rowEl.append(createCell("#000000")); // ズレて空いたすき間＝黒
      } else if (lineCols.includes(srcX)) {
        rowEl.append(createCell("#22d3ee")); // 縦線のピクセル
      } else {
        rowEl.append(createCell("#4b5563")); // 背景のピクセル
      }
    }
    grid.append(rowEl);
  }

  const label = document.createElement("p");
  label.className = "text-[10px] font-bold text-gray-400";
  label.textContent = caption;

  wrap.append(grid, label);
  return wrap;
}

/**
 * diagram データから図のDOM要素を組み立てる
 * @param {object} diagram content.js で定義された図データ
 * @returns {HTMLElement}
 */
export function createDiagram(diagram) {
  const container = document.createElement("div");
  container.className =
    "mt-2 flex flex-wrap items-center justify-center gap-3 rounded-xl bg-gray-900/70 p-3";

  switch (diagram.type) {
    // 色→計算→色（ダークモード・レトロ白黒）
    case "color-calc":
      container.append(
        createSwatch(diagram.before, "もとの色"),
        createArrow(diagram.formulas),
        createSwatch(diagram.after, "計算後の色")
      );
      break;

    // 4階調のマスの行の並べかえ（左右はんてん）
    case "row-reverse":
      container.append(
        createGrayCodeRow(diagram.codes, "もとの行"),
        createArrow(diagram.formulas),
        createGrayCodeRow([...diagram.codes].reverse(), "並べかえたあと")
      );
      break;

    // 行のズラし（サイバーバグ）
    case "row-shift":
      container.append(
        createPixelGrid(diagram.rows, diagram.cols, diagram.lineCols, [], 0, "もとの画像"),
        createArrow(diagram.formulas),
        createPixelGrid(
          diagram.rows,
          diagram.cols,
          diagram.lineCols,
          diagram.shiftedRows,
          diagram.shift,
          "ズラしたあと"
        )
      );
      break;
  }

  // 図の下に添える補足（2進数での見え方など）
  if (diagram.caption) {
    const caption = document.createElement("p");
    caption.className =
      "w-full text-center text-[10px] leading-relaxed text-cyan-300/90";
    caption.textContent = diagram.caption;
    container.append(caption);
  }

  return container;
}
