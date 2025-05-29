import { speak } from "./speech-util.js";
import {
  langToLocale,
  normalize,
  splitWords,
  compareWords,
  compareChinese,
} from "./lang-util.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");
if (!questions.length) {
  alert("Không có dữ liệu. Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const container = document.getElementById("translateContainer");
const defaultTime = parseInt(localStorage.getItem("translateTime")) || 30;

let currentIndex = 0;
let recognition;
let timerInterval;
let accumulatedMatched = [];

function startSpeechRecognition(onResult) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("⚠️ Trình duyệt không hỗ trợ nhận diện giọng nói!");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = () => {
    alert("❌ Lỗi nhận diện giọng nói.");
    speakBtn.disabled = false;
  };

  recognition.start();
}

function renderQuestion(q, index) {
  const lang = q.language || localStorage.getItem("language") || "en";
  const block = document.createElement("div");
  block.className = "question-block";
  block.id = `cau-${index}`; // ✅ để scroll tới đúng phần tử
  const progress = document.createElement("div");
  progress.className = "question-progress";
  progress.style.marginBottom = "6px";
  progress.style.fontWeight = "bold";
  progress.textContent = `📌 Câu ${index + 1} / ${questions.length}`;
  block.appendChild(progress);

  const vi = document.createElement("div");
  vi.className = "translate-box";
  vi.textContent = `📝 Câu ${index + 1}: ${q.cauHoi}`;

  const timer = document.createElement("div");
  timer.id = `timer-${index}`;
  timer.className = "timer";
  timer.textContent = `⏱️ ${defaultTime}s`;

  const spoken = document.createElement("div");
  spoken.className = "spoken-result";
  spoken.innerHTML = `<strong>Bạn nói:</strong> `;

  const match = document.createElement("div");
  match.className = "match-result";

  const accumulatedLine = document.createElement("div");
  accumulatedLine.className = "match-result";

  const controls = document.createElement("div");
  controls.className = "controls";

  const speakBtn = document.createElement("button");
  speakBtn.textContent = "🎙️ Bắt đầu nói";

  const replayBtn = document.createElement("button");
  replayBtn.textContent = "🔊 Đọc lại";
  replayBtn.disabled = true;
  replayBtn.style.opacity = "0.5";

  const helpBtn = document.createElement("button");
  helpBtn.textContent = "🔍 Trợ giúp";
  helpBtn.disabled = true;
  helpBtn.style.opacity = "0.5";

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "➡️ Câu tiếp theo";
  nextBtn.disabled = true;

  controls.appendChild(speakBtn);
  controls.appendChild(replayBtn);
  controls.appendChild(helpBtn);
  controls.appendChild(nextBtn);

  block.appendChild(vi);
  block.appendChild(timer);
  block.appendChild(spoken);
  block.appendChild(match);
  block.appendChild(accumulatedLine);
  block.appendChild(controls);
  container.appendChild(block);

  let secondsLeft = defaultTime;
  let finished = false;
  let troGiupUsed = false;
  let isListening = false;
  let finalTranscript = "";
  recognition = null;
  let retryMode = false;
  let retryCount = 0;
  let retryScores = [];
  let mustRedo = JSON.parse(localStorage.getItem("mustRedo") || "[]");

  const answerWords = splitWords(normalize(q.dapAn, lang), lang);

  accumulatedMatched = new Array(answerWords.length).fill("");

  function resetTimer() {
    clearInterval(timerInterval);
    secondsLeft = defaultTime;
    timer.textContent = `⏱️ ${secondsLeft}s`;
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      secondsLeft--;
      timer.textContent = `⏱️ ${secondsLeft}s`;
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        if (!finished) {
          const correctNow = accumulatedMatched.filter(
            (w, i) => w === answerWords[i]
          ).length;
          const percent = Math.round((correctNow / answerWords.length) * 100);

          if (percent >= 70) {
            finished = true;
            nextBtn.disabled = false;
            replayBtn.disabled = false;
            replayBtn.style.opacity = "1";
          } else {
            retryMode = true;
            retryCount = 0;
            retryScores = [];

            const info = document.createElement("div");
            info.innerHTML = `
  <p style="color: red"><strong>📌 Đáp án đúng:</strong> ${q.dapAn}</p>
  <p><strong>⚠️ Hãy ghi nhớ đáp án đúng, sau đó bấm 'Bắt đầu nói' và nói 3 lần. Tổng độ khớp ≥ 60% sẽ được tính là hoàn thành.</strong></p>
  <div id="retryResults-${index}" style="margin-top:10px"></div>
`;
            block.appendChild(info);
          }
        }
      }
    }, 1000);
  }

  speakBtn.onclick = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Trình duyệt không hỗ trợ ghi âm!");
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = langToLocale(lang);
      recognition.interimResults = true;
    }

    if (!isListening) {
      finalTranscript = "";
      isListening = true;
      speakBtn.textContent = "⏳ Chờ";
      recognition.start();

      recognition.onresult = (event) => {
        const r = event.results[event.results.length - 1];
        if (r.isFinal) finalTranscript = r[0].transcript.trim();
      };

      recognition.onerror = (e) => {
        alert("❌ Lỗi ghi âm: " + e.error);
        isListening = false;
        speakBtn.textContent = "🎙️ Bắt đầu nói";
      };
    } else {
      recognition.stop();
      isListening = false;
      speakBtn.textContent = "🎙️ Bắt đầu nói";

      setTimeout(() => {
        if (!finalTranscript) {
          spoken.innerHTML = `<p style="color:red">⚠️ Không nhận được nội dung nào!</p>`;
          return;
        }

        let result;
        if (lang === "zh") {
          result = compareChinese(finalTranscript, q.dapAn, accumulatedMatched);
          accumulatedMatched = result.accumulatedArray;
        } else {
          result = compareWords(
            finalTranscript,
            q.dapAn,
            lang,
            accumulatedMatched
          );
          accumulatedMatched = result.accumulatedArray;
        }

        spoken.innerHTML = `<strong>Bạn nói:</strong> "${finalTranscript}"`;
        match.innerHTML = `<strong>✅ Đúng:</strong> ${result.revealed}<br>🎯 <strong>Độ khớp:</strong> ${result.percent}%`;
        accumulatedLine.innerHTML = `<strong>Đáp án tích lũy:</strong> ${result.accumulated}`;

        if (retryMode) {
          retryCount++;
          retryScores.push(result.percent);

          const retryResults = document.getElementById(`retryResults-${index}`);
          const resBlock = document.createElement("div");
          resBlock.style.marginTop = "10px";
          resBlock.innerHTML = `
          <p><strong>🗣️ Lần ${retryCount}</strong></p>
          <p style="margin-left:16px">📌 Bạn nói: <em>${finalTranscript}</em></p>
          <p style="margin-left:16px">🎯 Độ khớp: ${result.percent}%</p>
        `;
          retryResults.appendChild(resBlock);

          if (retryCount === 3) {
            const avg = Math.round(
              retryScores.reduce((a, b) => a + b, 0) / retryScores.length
            );
            const pass = avg >= 60;
            const summary = document.createElement("p");
            summary.innerHTML = `<strong>📊 Trung bình độ khớp: ${avg}% → ${
              pass ? "✅ Đạt" : "❌ Chưa đạt"
            }</strong>`;
            retryResults.appendChild(summary);

            if (!pass) {
              mustRedo.push(q);
              localStorage.setItem("mustRedo", JSON.stringify(mustRedo));
            }

            nextBtn.disabled = false;
            finished = true;
          }

          return;
        }

        if (result.percent >= 70) {
          clearInterval(timerInterval);
          nextBtn.disabled = false;
          replayBtn.disabled = false;
          replayBtn.style.opacity = "1";
          helpBtn.disabled = true;
          helpBtn.style.opacity = "0.5";
          finished = true;

          const fullAnswer = document.createElement("div");
          fullAnswer.innerHTML = `<strong>📌 Đáp án đúng:</strong> ${q.dapAn}`;
          block.appendChild(fullAnswer);
        } else if (result.percent >= 50 && !troGiupUsed) {
          helpBtn.disabled = false;
          helpBtn.style.opacity = "1";
        }
      }, 300);
    }
  };

  helpBtn.onclick = () => {
    for (let i = 0; i < answerWords.length; i++) {
      if (!accumulatedMatched[i]) {
        accumulatedMatched[i] = answerWords[i];
        break;
      }
    }

    let updated, newPercent;

    if (lang === "zh") {
      updated = accumulatedMatched.map((c) => c || "＿").join("");
    } else {
      updated = accumulatedMatched.map((w) => w || "___").join(" ");
    }

    accumulatedLine.innerHTML = `<strong>Đáp án tích lũy:</strong> ${updated}`;

    const correctNow = accumulatedMatched.filter(
      (w, i) => w === answerWords[i]
    ).length;
    newPercent = Math.round((correctNow / answerWords.length) * 100);

    match.innerHTML += `<br><em>➡️ Sau trợ giúp: ${newPercent}%</em>`;

    if (newPercent >= 70) {
      clearInterval(timerInterval);
      nextBtn.disabled = false;
      replayBtn.disabled = false;
      replayBtn.style.opacity = "1";
      finished = true;

      const fullAnswer = document.createElement("div");
      fullAnswer.innerHTML = `<strong>📌 Đáp án đúng:</strong> ${q.dapAn}`;
      block.appendChild(fullAnswer);
    }

    troGiupUsed = true;
    helpBtn.disabled = true;
    helpBtn.style.opacity = "0.5";
  };

  replayBtn.onclick = () => {
    speak(q.dapAn, lang);
  };

  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      container.innerHTML = ""; // ✅ Xóa toàn bộ câu cũ
      renderQuestion(questions[currentIndex], currentIndex);
    } else {
      const done = document.createElement("div");
      let redoList = JSON.parse(localStorage.getItem("mustRedo") || "[]");

      let content = `<h2>🎉 Bạn đã hoàn thành bài luyện dịch!</h2>`;
      if (redoList.length > 0) {
        content += `<p style="color:red"><strong>❌ Các câu cần làm lại:</strong></p><ul>`;
        redoList.forEach((q, i) => {
          content += `<li>Câu ${i + 1}: ${q.cauHoi}</li>`;
        });
        content += `</ul>`;
      }

      done.innerHTML = content;
      localStorage.removeItem("mustRedo");
      container.appendChild(done);
    }
  };

  resetTimer();
  startTimer();
  speakBtn.click();

  setTimeout(() => {
    document
      .getElementById(`cau-${index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

renderQuestion(questions[currentIndex], currentIndex);
