import { speak } from "./speech-util.js";
import { renderQuestionImage } from "./image-util.js";
import { compareWords, splitWords } from "./lang-util.js";
import { taoNutBaiTiepTheo } from "./navigation.js";
import { langToLocale } from "./lang-util.js";

const language = localStorage.getItem("language") || "en";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const container = document.getElementById("memorizeContainer");
let currentIndex = 0;
let step = 0;
let readLimit = 3;
let recognition = null;
let isListening = false;
let finalTranscript = "";
let accumulatedMatched = [];

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function renderStep() {
  container.innerHTML = "";
  if (step === 0) renderMemorizeStep();
  else renderFillBlankStep();
}

function renderMemorizeStep() {
  const q = questions[currentIndex];
  accumulatedMatched = new Array(splitWords(q.dapAn).length).fill("");
  readLimit = 3;
  let hidden = false;

  container.innerHTML = `
    <h2>📖 Đọc thuộc lòng</h2>
    <p id="sentence" style="font-size:20px;line-height:1.6">${q.dapAn}</p>
    <button id="readBtn">🔊 Đọc lại (${readLimit} lần)</button>
    <button id="hideBtn">🙈 Ẩn câu để bắt đầu kiểm tra</button>
    <button id="speakBtn" style="display:none">🎙️ Bắt đầu nói</button>
    <div id="micStatus"></div>
    <div id="result"></div>
  `;
  renderQuestionImage(q.tenAnh, container);

  document.getElementById("readBtn").onclick = () => {
    if (readLimit > 0) {
      speak(q.dapAn, language); // dùng đúng ngôn ngữ
      readLimit--;
      document.getElementById(
        "readBtn"
      ).textContent = `🔊 Đọc lại (${readLimit} lần)`;
    }
  };

  document.getElementById("hideBtn").onclick = () => {
    hidden = true;
    document.getElementById("sentence").textContent =
      "🙈 Câu đã được ẩn, hãy đọc lại!";
    document.getElementById("hideBtn").style.display = "none";
    document.getElementById("speakBtn").style.display = "inline-block";
  };

  document.getElementById("speakBtn").onclick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Trình duyệt không hỗ trợ ghi âm!");
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = langToLocale(language); // cần import từ lang-util.js
      recognition.interimResults = true;
    }

    if (!isListening) {
      finalTranscript = "";
      isListening = true;
      recognition.start();
      document.getElementById("micStatus").textContent = "🎙️ Đang nghe...";
      recognition.onresult = (event) => {
        const r = event.results[event.results.length - 1];
        if (r.isFinal) finalTranscript = r[0].transcript.trim();
      };
      recognition.onerror = (e) => {
        document.getElementById("micStatus").textContent =
          "❌ Lỗi ghi âm: " + e.error;
        isListening = false;
      };
    } else {
      recognition.stop();
      isListening = false;
      document.getElementById("micStatus").textContent = "";

      setTimeout(() => {
        if (finalTranscript) {
          const q = questions[currentIndex];
          const result = compareWords(
            finalTranscript,
            q.dapAn,
            language,
            accumulatedMatched
          );

          accumulatedMatched = result.accumulatedArray;
          document.getElementById("result").innerHTML = `
            <p><strong>Bạn nói:</strong> "${finalTranscript}"</p>
            <p><strong>Đáp án:</strong> ${result.revealed}</p>
            <p><strong>💯 Độ khớp:</strong> ${result.percent}%</p>
          `;
          if (result.percent >= 70) {
            const nextBtn = document.createElement("button");
            nextBtn.textContent = "✅ Tiếp tục điền từ vào chỗ trống";
            nextBtn.style.marginTop = "20px";
            nextBtn.onclick = () => {
              step++;
              renderStep();
            };
            container.appendChild(nextBtn);
          }
        } else {
          document.getElementById(
            "result"
          ).innerHTML = `<p style="color:red">⚠️ Không nhận được nội dung nào!</p>`;
        }
      }, 300);
    }
  };
}

function renderFillBlankStep() {
  const q = questions[currentIndex];
  const words = splitWords(q.dapAn);
  const hideCount = Math.max(1, Math.floor(words.length / 3));
  const hiddenIndexes = shuffle([...Array(words.length).keys()]).slice(
    0,
    hideCount
  );
  const blanks = {};
  let selectedWord = null;

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
        const btn = document.createElement("button");
        btn.textContent = "➡️ Chuyển sang câu tiếp theo";
        btn.style.marginTop = "20px";
        btn.onclick = () => {
          currentIndex++;
          step = 0;
          if (currentIndex < questions.length) {
            renderStep();
          } else {
            container.innerHTML = `<h2>✅ Bạn đã hoàn thành bài học thuộc lòng!</h2>`;
            taoNutBaiTiepTheo(container);
          }
        };
        container.appendChild(btn);
      }
    };
  });
}

renderStep();
