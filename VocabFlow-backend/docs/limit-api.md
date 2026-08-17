Chặn spam:
Login: tối đa 5 lần / 1 phút theo IP + email.
Register: tối đa 3 lần / 10 phút theo IP + email.
Verify OTP register: tối đa 5 lần / 10 phút theo IP + email.
Resend register OTP: tối đa 1 lần / 1 phút theo IP + email, và 5 lần / 1 giờ theo email.
Forgot password OTP: tương tự resend OTP.
Submit Fill Blank: tối đa 1 lần / 3 giây theo IP + video.
Submit Quiz: tối đa 1 lần / 3 giây theo IP + video.

Endpoint	Rate limit
POST /user/upload-avatar	5 lần / phút / IP
PUT /user	10 lần / phút / IP
GET /user/toggle-active-account/{id}	10 lần / phút / IP + userId
DELETE /user	3 lần / 10 phút / IP
POST /user/change-password-otp	1 lần / phút và 5 lần / giờ / IP
POST /user/change-password	5 lần / 10 phút / IP