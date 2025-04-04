// reset-storage.js

// Danh sách các key cần xóa mỗi khi vào bài mới
const keysToClear = [
  "selectedQuestions",
  "loaiBaiTapList",
  "currentLoaiBaiTapIndex",
  "comboCompleted",
  "currentQuestionIndex",
];

// Xóa các key
keysToClear.forEach((key) => {
  localStorage.removeItem(key);
});

// In ra Console cho dễ debug
console.log("🚀 Đã reset dữ liệu cũ trong LocalStorage!");
