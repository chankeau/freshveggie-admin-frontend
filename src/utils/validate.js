// src/utils/validate.js

// 内部辅助函数，检查是否是有效的中国大陆手机号
function isCellPhone (val) {
  // 简单校验，覆盖常见号段，可能需要根据最新号段更新
  return /^1[3-9]\d{9}$/.test(val);
}

// 校验账号 (用于 Vant Form validator)
// rule 参数通常不需要，value 是字段值, callback 用于 Element UI (这里不用)
// Vant validator 应返回 true (通过), false (不通过), 或 Promise
export function checkUserName (value) {
  if (!value) {
    return false; // 或者返回具体的错误消息 '请输入账号'
  }
  value = String(value).trim(); // 确保是字符串并去除空格
  if (value.length < 3 || value.length > 20) {
    return false; // 或者返回 '账号长度应是3-20位'
  }
  return true; // 校验通过
}

// 校验姓名 (用于 Vant Form validator)
export function checkName (value) {
  if (!value) {
    return false; // '请输入姓名'
  }
  value = String(value).trim();
  if (value.length === 0 || value.length > 12) { // 考虑空字符串情况
    return false; // '姓名长度应是1-12位'
  }
  return true;
}

// 校验手机号 (用于 Vant Form validator)
export function checkPhone (value) {
  if (!value) {
    return false; // '请输入手机号'
  }
  if (!isCellPhone(String(value))) {
    return false; // '请输入正确的手机号!'
  }
  return true;
}

// 校验身份证号 (用于 Vant Form validator)
export function validID (value) {
  if (!value) {
    return false; // '请输入身份证号码'
  }
  // 身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!reg.test(String(value))) {
    return false; // '身份证号码不正确'
  }
  return true;
}

// --- 以下函数未在 EmployeeForm 中明确使用，如果其他地方用到，也需要 export ---

// 这个函数在原代码中被引用，但 EmployeeForm 实际用了 validID
// export function validIDNumber (value) { ... }

// 示例：这个函数如果要在外部使用，也需要 export
export function isValidUsername (str) {
  if (!str) return false;
  // 仅作为示例，实际校验可能更复杂
  return ['admin', 'editor'].includes(String(str).trim());
}

// 示例：这个函数如果要在外部使用，也需要 export
export function isExternal (path) {
  return /^(https?:|mailto:|tel:)/.test(path);
}

// 注意：Vant Form 的 validator 函数可以直接返回错误消息字符串，这样更灵活
// 例如：
// export function checkUserNameWithMessage(value) {
//   if (!value) {
//     return '请输入账号';
//   }
//   value = String(value).trim();
//   if (value.length < 3 || value.length > 20) {
//     return '账号长度应是3-20位';
//   }
//   return true; // 通过时返回 true
// }
// 在 EmployeeForm 中使用: :rules="[{ validator: checkUserNameWithMessage }]"
// 这样就不需要在 :rules 中写 message 了。根据你的偏好选择。