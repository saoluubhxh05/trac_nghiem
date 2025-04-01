const firebaseConfig = {
apiKey: "AIzaSyBvNfpf4KQeJw9fuDkTyXdoDY3LEuUL1fc",
authDomain: "abcd-9d83a.firebaseapp.com",
projectId: "abcd-9d83a",
storageBucket: "abcd-9d83a.appspot.com",
messagingSenderId: "380338460918",
appId: "1:380338460918:web:d1b1d7c9bc40471ded34d7",
measurementId: "G-R1694J34HS",
};

# Khởi tạo Git trong thư mục

git init

# Kết nối tới repo GitHub của bạn

git remote add origin https://github.com/saoluubhxh05/trac_nghiem.git

# Thêm toàn bộ file vào Git

git add .

# Commit với nội dung ghi chú

git commit -m "Lần đầu up toàn bộ phần mềm trắc nghiệm lên GitHub"

# Đẩy lên GitHub (nhánh chính là main hoặc master)

git branch -M main
git push -u origin main

4.phải tạo cấu trúc đúng mới deploy web chạy được
trac_nghiem3/
├── firebase.json
├── .firebaserc
├── public/
│ ├── index.html
│ ├── select-quiz.html
│ ├── quiz.html
│ ├── matching.html
│ ├── speaking.html
│ ├── spelling.html
│ ├── import.html
│ ├── js/
│ │ ├── select.js
│ │ ├── quiz.js
│ │ ├── matching.js
│ │ ├── speaking.js
│ │ ├── spelling.js
│ │ ├── navigation.js
│ │ ├── image-util.js
│ │ └── speech-util.js
│ ├── css/
│ │ └── style.css ⬅️ nếu có
│ ├── images/
│ └── [ảnh minh hoạ] ⬅️ nếu có

3.cập nhật git
//Thêm toàn bộ file vừa chỉnh sửa //Ghi chú cập nhật vào lịch sử //Gửi toàn bộ thay đổi lên GitHub

git add .
git commit -m "Cập nhật"
git push
firebase deploy

thêm 1 trang html, file js có tính năng hiện ra câu đáp án đúng , ẩn 1 số chữ ngẫu nhiên, các từ điền vào được để dưới câu có thứ tự ngẫu nhiên. Bấm chọn từ bấm chọn khoảng trống để chọn đúng nếu đúng tô màu xanh, không đúng tô đỏ
