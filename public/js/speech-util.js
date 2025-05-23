// ✅ speech-util.js: hỗ trợ phát âm đa ngôn ngữ
import { langToLocale } from "./lang-util.js";

let isMuted = false;

export function speak(text, lang = "en") {
  if (isMuted) return;
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);

  // ✅ Dùng ngôn ngữ phù hợp
  utter.lang = langToLocale(lang);

  synth.cancel(); // dừng giọng cũ nếu còn
  synth.speak(utter);
}

export function toggleMute() {
  isMuted = !isMuted;
  updateMuteButton();
}

export function updateMuteButton() {
  const btn = document.getElementById("toggleMuteBtn");
  if (!btn) return;
  btn.textContent = isMuted ? "🔇 Đang tắt tiếng" : "🔊 Đang bật tiếng";
}
