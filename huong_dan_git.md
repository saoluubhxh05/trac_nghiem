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

3.cập nhật git
//Thêm toàn bộ file vừa chỉnh sửa
git add .

//Ghi chú cập nhật vào lịch sử
git commit -m "🔄 Cập nhật: lưu dữ liệu import theo tài khoản + hiển thị tên người dùng"

//Gửi toàn bộ thay đổi lên GitHub
git push
