let isMuted = false;

export function speak(text) {
  if (isMuted) return;
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  synth.cancel(); // dừng cái cũ nếu còn
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
