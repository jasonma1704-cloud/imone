document.addEventListener('DOMContentLoaded', function () {
  const selector = document.getElementById('language-selector');
  if (!selector) return;

  // 语言对应目录映射
  const langMap = {
    zh: '',       // 中文 = 根目录
    en: 'en',     // 英文 = /en/
    pt: 'pt',     // 葡萄牙语 = /pt/
    ja: 'ja'      // 日语 = /ja/
  };

  // 1. 读取本地存储的语言，自动选中
  const savedLang = localStorage.getItem('selectedLang') || 'zh';
  if (selector.querySelector(`option[value="${savedLang}"]`)) {
    selector.value = savedLang;
  }

  // 2. 切换语言时触发
  selector.addEventListener('change', function () {
    const lang = this.value;
    const targetDir = langMap[lang] || '';

    // 保存选择
    localStorage.setItem('selectedLang', lang);

    // 构建跳转路径
    const path = window.location.pathname;

    // 移除已有语言前缀（/en/index.html → /index.html）
    let newPath = path.replace(/^\/(en|pt|ja)\//, '/');

    // 加上目标语言目录
    if (targetDir) {
      newPath = `/${targetDir}${newPath}`;
    }

    // 跳转
    window.location.href = newPath;
  });
});