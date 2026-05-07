// Simple validation helper
const validate = (schema) => (req, res, next) => {
  const errors = [];
  Object.entries(schema).forEach(([field, rules]) => {
    const val = req.body[field];
    if (rules.required && (val === undefined || val === null || val === ''))
      errors.push(`${field} is required`);
    if (val !== undefined && rules.minLength && String(val).length < rules.minLength)
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    if (val !== undefined && rules.isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      errors.push(`${field} must be a valid email`);
    if (val !== undefined && rules.isNumeric && isNaN(val))
      errors.push(`${field} must be a number`);
  });
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  next();
};

module.exports = validate;
