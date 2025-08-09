// 获取完整的图片URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // 在开发环境中使用localhost
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${imagePath}`;
};

// 图片加载错误处理
export const handleImageError = (event) => {
  const img = event.target;
  const fallback = img.nextElementSibling;
  
  if (img && fallback) {
    img.style.display = 'none';
    fallback.style.display = 'flex';
  }
};
