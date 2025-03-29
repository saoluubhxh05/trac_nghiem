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
