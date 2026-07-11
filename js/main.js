// 全体の司令塔
// DOM 操作・ファイル入出力・イベントリスナー・全体の制御を担当する

import {
  applyInvert,
  applyMirror,
  applyGrayscale,
  applyGlitch,
} from "./effects.js";
import { effectContents } from "./content.js";

// ---- DOM 要素の取得 ----
const fileInput = document.getElementById("file-input");
const uploadArea = document.getElementById("upload-area");
const workspace = document.getElementById("workspace");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const controlArea = document.getElementById("control-area");
const explanationArea = document.getElementById("explanation-area");
const explanationTitle = document.getElementById("explanation-title");
const explanationText = document.getElementById("explanation-text");
const actionArea = document.getElementById("action-area");
const saveButton = document.getElementById("save-button");
const resetButton = document.getElementById("reset-button");

// エフェクト名と処理関数の対応表
const effectFunctions = {
  invert: applyInvert,
  mirror: applyMirror,
  grayscale: applyGrayscale,
  glitch: applyGlitch,
};

// リセット用に、読み込み直後の ImageData を保持しておく
let originalImageData = null;

// ---- 画像の読み込みとリサイズ ----

/**
 * 画面幅に合わせてアスペクト比を維持したまま描画サイズを計算する
 * @param {number} imgWidth 元画像の幅
 * @param {number} imgHeight 元画像の高さ
 * @returns {{width: number, height: number}}
 */
function calcFitSize(imgWidth, imgHeight) {
  // ワークスペースの表示幅（スマホなら画面幅）を上限にする
  const maxWidth = Math.min(workspace.clientWidth, 800);
  const maxHeight = 600;
  const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
  return {
    width: Math.max(1, Math.round(imgWidth * scale)),
    height: Math.max(1, Math.round(imgHeight * scale)),
  };
}

/**
 * 選択された画像ファイルを読み込み、リサイズして Canvas に描画する
 * @param {File} file
 */
function loadImageFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const url = URL.createObjectURL(file);
  const img = new Image();

  img.onload = () => {
    URL.revokeObjectURL(url);

    // 幅の計測（clientWidth）のため、先にワークスペースを表示する
    workspace.classList.remove("hidden");
    controlArea.classList.remove("hidden");
    actionArea.classList.remove("hidden");
    explanationArea.classList.add("hidden");

    const { width, height } = calcFitSize(img.naturalWidth, img.naturalHeight);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    // リセット用に元の状態を保存
    originalImageData = ctx.getImageData(0, 0, width, height);
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert("画像の読み込みに失敗しました。別のファイルを試してみてね。");
  };

  img.src = url;
}

fileInput.addEventListener("change", (event) => {
  loadImageFile(event.target.files[0]);
  // 同じファイルをもう一度選んでも change が発火するようにリセット
  event.target.value = "";
});

// ---- エフェクトボタンの処理 ----

/**
 * エフェクトを適用し、解説文を表示する
 * @param {string} effectName effects の対応表のキー
 */
function handleEffect(effectName) {
  if (!originalImageData) return;

  const effectFunction = effectFunctions[effectName];
  const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const newImageData = effectFunction(currentImageData);
  ctx.putImageData(newImageData, 0, 0);

  // 解説文をふわっと表示する
  const content = effectContents[effectName];
  explanationTitle.textContent = content.title;
  explanationText.textContent = content.description;
  explanationArea.classList.remove("hidden");
  // リフローを挟んでアニメーションを最初から再生し直す
  explanationArea.classList.remove("animate-fade-in-up");
  void explanationArea.offsetWidth;
  explanationArea.classList.add("animate-fade-in-up");
}

controlArea.querySelectorAll("[data-effect]").forEach((button) => {
  button.addEventListener("click", () => {
    handleEffect(button.dataset.effect);
  });
});

// ---- リセット処理 ----

resetButton.addEventListener("click", () => {
  if (!originalImageData) return;
  ctx.putImageData(originalImageData, 0, 0);
  explanationArea.classList.add("hidden");
});

// ---- 保存処理 ----

saveButton.addEventListener("click", () => {
  if (!originalImageData) return;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "digital-magic.png";
  link.click();
});
