import { taoNutBaiTiepTheo } from "./navigation.js";

const questions = JSON.parse(localStorage.getItem("selectedQuestions") || "[]");

if (!questions.length) {
  alert("Không có dữ liệu! Vui lòng chọn bài trước.");
  window.location.href = "select-quiz.html";
}

const questionCol = document.getElementById("questionCol");
const answerCol = document.getElementById("answerCol");
const finishBtn = document.getElementById("finishBtn");
const resultMsg = document.getElementById("resultMsg");

let selectedQuestion = null,
  selectedAnswer = null,
  correctPairs = new Set();

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

const pairs = questions.map((q, index) => ({
  id: index,
  cau: q["Câu trắc nghiệm"] || q["cauHoi"],
  dapAn: q["Đáp án đúng"] || q["dapAn"],
}));

pairs.forEach((pair) => {
  const divQ = document.createElement("div");
  divQ.className = "item";
  divQ.textContent = pair.cau;
  divQ.dataset.id = pair.id;
  divQ.dataset.type = "question";
  divQ.onclick = () => handleSelect(divQ);
  questionCol.appendChild(divQ);
});

shuffle(pairs).forEach((pair) => {
  const divA = document.createElement("div");
  divA.className = "item";
  divA.textContent = pair.dapAn;
  divA.dataset.id = pair.id;
  divA.dataset.type = "answer";
  divA.onclick = () => handleSelect(divA);
  answerCol.appendChild(divA);
});

function handleSelect(el) {
  if (el.classList.contains("correct")) return;
  const type = el.dataset.type;
  const prev = type === "question" ? selectedQuestion : selectedAnswer;
  if (prev && prev !== el) prev.classList.remove("selected");

  el.classList.add("selected");
  type === "question" ? (selectedQuestion = el) : (selectedAnswer = el);

  if (selectedQuestion && selectedAnswer) {
    const correct = selectedQuestion.dataset.id === selectedAnswer.dataset.id;
    selectedQuestion.classList.add(correct ? "correct" : "wrong");
    selectedAnswer.classList.add(correct ? "correct" : "wrong");

    if (correct) correctPairs.add(selectedQuestion.dataset.id);
    setTimeout(
      () => {
        [selectedQuestion, selectedAnswer].forEach((e) =>
          e.classList.remove("wrong", "selected")
        );
        selectedQuestion = selectedAnswer = null;
      },
      correct ? 0 : 1000
    );
  }
}

finishBtn.addEventListener("click", () => {
  localStorage.setItem("lastDoneDate", new Date().toISOString());

  const total = pairs.length;
  const correct = correctPairs.size;
  resultMsg.textContent = `🎉 Bạn đã ghép đúng ${correct}/${total} câu.`;

  // Tạo nút chuyển bài tiếp theo sau khi nhấn hoàn thành
  taoNutBaiTiepTheo(resultMsg.parentElement);
});