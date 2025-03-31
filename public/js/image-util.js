export function renderQuestionImage(imageName, container) {
  if (!imageName) return;

  const img = document.createElement("img");
  img.src = `images/${imageName}`;
  img.alt = "Câu hỏi có hình ảnh";
  img.style.maxWidth = "100%";
  img.style.marginTop = "10px";

  container.appendChild(img);
}
