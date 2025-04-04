import { speak } from "./speech-util.js";
import { renderQuestionImage } from "./image-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const container = document.getElementById("comboContainer");

let currentIndex = 0;
let step = 0;
let selectedWord = null;
let readLimit = 3;
let recognition = null;
let isListening = false;
let finalTranscript = "";
let accumulatedMatched = [];

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function renderCurrentStep() {
  container.innerHTML = "";
  if (step === 0) renderFillBlank();
  else if (step === 1) renderSpeaking();
  else renderSpelling();
}

function taoNutChuyenBai() {
  const btn = document.createElement("button");
  btn.id = "nextStepBtn"; // Gán id để kiểm tra trùng
  btn.textContent = "➡️ Chuyển sang phần tiếp theo";
  btn.style.marginTop = "20px";
  btn.style.padding = "10px 20px";
  btn.style.fontSize = "16px";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  btn.onclick = () => {
    step++;
    renderCurrentStep();
  };
  container.appendChild(btn);
}

function renderFillBlank() {
  const q = questions[currentIndex];
  const words = q.dapAn.trim().split(" ");
  const hideCount = Math.max(1, Math.floor(words.length / 3));
  const hiddenIndexes = shuffle([...Array(words.length).keys()]).slice(
    0,
    hideCount
  );
  const blanks = {};

  const sentenceHTML = words
    .map((word, i) => {
      if (hiddenIndexes.includes(i)) {
        const id = `blank-${i}`;
        blanks[id] = word;
        return `<span id="${id}" style="display:inline-block;min-width:60px;border-bottom:2px dashed #888;">_____</span>`;
      }
      return word;
    })
    .join(" ");

  const choices = shuffle(hiddenIndexes.map((i) => words[i]));

  container.innerHTML = `
    <h2>📝 Điền vào chỗ trống</h2>
    <p style="line-height:1.8">${sentenceHTML}</p>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:12px;padding:12px;border:1px dashed #aaa;border-radius:8px;">
      ${choices
        .map(
          (w) =>
            `<span class="choice" style="padding:8px 14px;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-size:16px;background:#f5f5f5;">${w}</span>`
        )
        .join("")}
    </div>
  `;
  renderQuestionImage(q.tenAnh, container);

  document.querySelectorAll(".choice").forEach((choice) => {
    choice.onclick = () => {
      selectedWord = choice.textContent;
      document
        .querySelectorAll(".choice")
        .forEach((c) => (c.style.border = "1px solid #ccc"));
      choice.style.border = "2px solid blue";
    };
  });

  Object.keys(blanks).forEach((id) => {
    const el = document.getElementById(id);
    el.onclick = () => {
      if (!selectedWord) return;
      el.textContent = selectedWord;
      el.style.pointerEvents = "none";

      if (selectedWord === blanks[id]) el.style.color = "green";
      else el.style.color = "red";

      document.querySelectorAll(".choice").forEach((c) => {
        if (c.textContent === selectedWord) c.remove();
      });

      selectedWord = null;

      const remaining = Object.keys(blanks).filter((id) => {
        const t = document.getElementById(id);
        return t.textContent !== blanks[id];
      });

      if (remaining.length === 0) {
        taoNutChuyenBai();
      }
    };
  });
}

function hienThiKetQuaNoi(q, finalTranscript) {
  const spoken = finalTranscript
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .split(" ")
    .filter((w) => w);
  const target = q.dapAn
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .split(" ");
  const ans1 = target.map((w, i) => (spoken[i] === w ? w : "...")).join(" ");

  const ans2Inputs = target.map((w, i) => {
    if (accumulatedMatched[i] === w || spoken.includes(w)) {
      accumulatedMatched[i] = w;
      return `<input data-index="${i}" value="${w}" style="width:auto;font-size:18px;padding:6px 8px;margin:3px;border:2px solid green;border-radius:6px;text-align:center" />`;
    }
    return `<input data-index="${i}" value="" style="width:50px;font-size:18px;padding:6px 8px;margin:3px;text-align:center" />`;
  });

  const percent = Math.round(
    (accumulatedMatched.filter((w) => w).length / target.length) * 100
  );

  document.getElementById("result").innerHTML = `
    <p><strong>Bạn đã nói:</strong> "${finalTranscript}"</p>
    <p><strong>Đáp án 1 (theo thứ tự):</strong> ${ans1}</p>
    <p><strong>Đáp án 2 (điền tay):</strong><br>${ans2Inputs.join(" ")}</p>
    <p id="scoreLine"><strong>💯 Độ khớp:</strong> ${percent}%</p>
    <button id="btnCheckAns2">✅ Kiểm tra lại đáp án 2</button>
  `;

  document.getElementById("btnCheckAns2").onclick = () => {
    const inputs = document.querySelectorAll("input[data-index]");
    let correctCount = 0;
    inputs.forEach((inp) => {
      const idx = parseInt(inp.dataset.index);
      const val = inp.value.trim().toLowerCase();
      if (val === target[idx]) {
        inp.style.border = "2px solid green";
        correctCount++;
        accumulatedMatched[idx] = val;
      } else {
        inp.style.border = "2px solid red";
      }
    });
    const newPercent = Math.round((correctCount / target.length) * 100);
    document.getElementById(
      "scoreLine"
    ).innerHTML = `<strong>💯 Độ khớp:</strong> ${newPercent}%`;

    if (newPercent >= 80) {
      if (!document.getElementById("nextStepBtn")) {
        taoNutChuyenBai();
      }
    }
  };
}

function renderSpeaking() {
  const q = questions[currentIndex];
  if (!accumulatedMatched.length) {
    accumulatedMatched = new Array(q.dapAn.trim().split(" ").length).fill("");
  }
  readLimit = 3;
  isListening = false;

  container.innerHTML = `
    <h2>🎤 Luyện nói</h2>
    <p>💡 Gợi ý: "${q.dapAn.split(" ").slice(0, 2).join(" ")}..."</p>
    <button id="speakBtn">🎙️ Bắt đầu nói</button>
    <button id="playBtn">🔊 Đọc lại</button>
    <span id="readCount">Còn lại: ${readLimit} lần</span>
    <div id="micStatus"></div>
    <div id="result"></div>
  `;
  renderQuestionImage(q.tenAnh, container);

  const speakBtn = document.getElementById("speakBtn");
  const playBtn = document.getElementById("playBtn");
  const micStatus = document.getElementById("micStatus");
  const result = document.getElementById("result");
  const readCount = document.getElementById("readCount");

  playBtn.onclick = () => {
    if (readLimit > 0) {
      speak(q.dapAn);
      readLimit--;
      readCount.textContent = `Còn lại: ${readLimit} lần`;
    }
  };

  speakBtn.onclick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      micStatus.textContent = "⚠️ Trình duyệt không hỗ trợ ghi âm!";
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
    }

    if (!isListening) {
      finalTranscript = "";
      micStatus.textContent = "🎙️ Đang nghe...";
      isListening = true;
      speakBtn.textContent = "⏳ Chờ";

      recognition.onresult = (event) => {
        const r = event.results[event.results.length - 1];
        if (r.isFinal) finalTranscript = r[0].transcript.trim();
      };

      recognition.onerror = (e) => {
        micStatus.textContent = "❌ Lỗi ghi âm: " + e.error;
        isListening = false;
        speakBtn.textContent = "🎙️ Bắt đầu nói";
      };

      recognition.start();
    } else {
      recognition.stop();
      isListening = false;
      speakBtn.textContent = "🎙️ Bắt đầu nói";
      micStatus.textContent = "";

      setTimeout(() => {
        if (finalTranscript.trim()) {
          hienThiKetQuaNoi(q, finalTranscript);
        } else {
          result.innerHTML = `<p style="color:red">⚠️ Không nhận được nội dung nào!</p>`;
        }
      }, 300);
    }
  };
}

function renderSpelling() {
  const q = questions[currentIndex];
  readLimit = 3;

  container.innerHTML = `
    <h2>✍️ Luyện chính tả</h2>
    <button id="playAudioBtn">🔊 Đọc lại</button>
    <input type="text" id="answerInput" placeholder="Nhập câu bạn vừa nghe..." style="width:90%;font-size:18px;padding:8px;margin:10px 0;" />
    <button id="submitBtn">✅ Kiểm tra</button>
    <span id="readCounter">(Còn lại: ${readLimit} lần)</span>
    <div id="result"></div>
  `;
  renderQuestionImage(q.tenAnh, container);

  document.getElementById("playAudioBtn").onclick = () => {
    if (readLimit > 0) {
      speak(q.dapAn);
      readLimit--;
      document.getElementById(
        "readCounter"
      ).textContent = `(Còn lại: ${readLimit} lần)`;
    }
  };

  document.getElementById("submitBtn").onclick = () => {
    const user = document
      .getElementById("answerInput")
      .value.trim()
      .toLowerCase()
      .split(" ");
    const expected = q.dapAn.trim().toLowerCase().split(" ");
    const dots = expected.map((w, i) => (user[i] === w ? w : "...")).join(" ");
    const percent = Math.round(
      (expected.filter((w, i) => user[i] === w).length / expected.length) * 100
    );

    document.getElementById("result").innerHTML = `
      <p><strong>Đáp án đúng:</strong> ${dots}</p>
      <p><strong>🎯 Độ khớp:</strong> ${percent}%</p>
    `;

    if (percent >= 80) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "➡️ Chuyển sang câu tiếp theo";
      nextBtn.id = "nextStepBtn";
      nextBtn.style.marginTop = "20px";
      nextBtn.style.padding = "10px 20px";
      nextBtn.style.fontSize = "16px";
      nextBtn.style.borderRadius = "8px";
      nextBtn.style.cursor = "pointer";

      nextBtn.onclick = () => {
        currentIndex++;
        step = 0;
        if (currentIndex < questions.length) {
          renderCurrentStep();
        } else {
          container.innerHTML = `<h2>✅ Bạn đã hoàn thành bài tập Combo!</h2>`;
          taoNutBaiTiepTheo(container);
        }
      };

      if (!document.getElementById("nextStepBtn")) {
        container.appendChild(nextBtn);
      }
    }
  };
}

renderCurrentStep();
