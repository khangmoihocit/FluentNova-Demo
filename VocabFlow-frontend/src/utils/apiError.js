export const extractErrorMessage = (error, fallback = 'Đã có lỗi xảy ra') => {
  console.log(error);
  // if (!error?.response?.data) return 'Lỗi kết nối máy chủ / Không phản hồi';

  if (error.success === false) {
    if (error.code === 'VALIDATION_ERROR' && error.errors) {
      const firstKey = Object.keys(error.errors)[0];
      if (firstKey) return error.errors[firstKey];
    } else {
      return error.message || 'Đã có lỗi xảy ra';
    }
  }

  return fallback;
};

export const handleFormError = (error, form, defaultMsg) => {
  const data = error?.response?.data;

  if (data?.code === 'VALIDATION_ERROR' && data.errors && form) {
    const formFields = Object.entries(data.errors).map(([key, value]) => ({
      name: key,
      errors: [value],
    }));
    form.setFields(formFields);
    return data.message || 'Vui lòng kiểm tra lại dữ liệu nhập';
  }

  return extractErrorMessage(error, defaultMsg);
};
