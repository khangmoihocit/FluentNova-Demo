export const POPULAR_EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|proton\.me|protonmail\.com|live\.com|msn\.com)$/i;

export const PASSWORD_POLICY_PATTERN = /^(?=.*[A-Z])(?=.*[A-Za-z])(?=.*\d).+$/;

export const popularEmailRule = {
  pattern: POPULAR_EMAIL_PATTERN,
  message: 'Email phải thuộc domain phổ biến như gmail.com, yahoo.com, outlook.com.',
};

export const passwordPolicyRules = [
  { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự.' },
  {
    pattern: PASSWORD_POLICY_PATTERN,
    message: 'Mật khẩu phải có ít nhất 1 chữ viết hoa, 1 chữ cái và 1 chữ số.',
  },
];
