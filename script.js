// 配置参数
const CONFIG = {
  csvPath: 'pdata.csv',    // CSV文件路径
  debounceTime: 300,          // 防抖时间(毫秒)
  selectors: {                // DOM选择器
    temperature: '#temperature',
    type: '#type',
    current: '#current',
    attribute: '#attribute',
    results: '#results',
    resetButton: '#reset-button'
  }
};

// 全局变量
let products = [];
let debounceTimer;

// 主初始化函数
async function init() {
  try {
    // 加载CSV数据
    await loadCSVData();

    // 初始化温度筛选选项
    initTemperatureOptions();

    // 绑定事件监听
    document.querySelectorAll('.filter select').forEach(select => {
      select.addEventListener('input', handleFilterChange);
    });

    // 绑定重置按钮点击事件
    document.querySelector(CONFIG.selectors.resetButton)
      .addEventListener('click', resetFilters);
    // 初始筛选
    filterProducts();
  } catch (error) {
    showError(`系统初始化失败: ${error.message}`);
  }
}

// 重置筛选条件
function resetFilters() {
  // 清空所有筛选条件
  document.querySelector(CONFIG.selectors.temperature).value = '';
  document.querySelector(CONFIG.selectors.type).value = '';
  document.querySelector(CONFIG.selectors.current).value = '';
  document.querySelector(CONFIG.selectors.attribute).value = '';

  // 重新筛选并渲染结果
  filterProducts();
}
// CSV数据加载
async function loadCSVData() {
  try {
    const response = await fetch(CONFIG.csvPath);
    if (!response.ok) throw new Error('CSV文件加载失败');

    const csvText = await response.text();
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    products = data.map(item => ({
      name: item.规格,
      model: item.型号,
      type: item.类型,
      current: item.电流,
      temperature: item.温度,
      attribute: item.属性,
      link: item.链接,
      description: item.描述
    }));
  } catch (error) {
    throw new Error(`数据加载失败: ${error.message}`);
  }
}

// 初始化温度选项
function initTemperatureOptions() {
  const temperatures = [...new Set(products.map(p => p.temperature))]
    .sort((a, b) => a - b);

  const select = document.querySelector(CONFIG.selectors.temperature);
  select.innerHTML = `
      <option value="">全部温度</option>
      ${temperatures.map(t => `
          <option value="${t}">${t}℃</option>
      `).join('')}
  `;
}

// 筛选处理函数
function handleFilterChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(filterProducts, CONFIG.debounceTime);
}

// 产品筛选逻辑
function filterProducts() {
  const filters = {
    temperature: document.querySelector(CONFIG.selectors.temperature).value,
    type: document.querySelector(CONFIG.selectors.type).value,
    current: document.querySelector(CONFIG.selectors.current).value,
    attribute: document.querySelector(CONFIG.selectors.attribute).value
  };

  const filtered = products.filter(product =>
    Object.entries(filters).every(([key, value]) =>
      !value || String(product[key]) === value
    )
  );

  renderResults(filtered);
}

// 渲染结果
function renderResults(products) {
  const container = document.querySelector(CONFIG.selectors.results);

  if (products.length === 0) {
    container.innerHTML = `
          <div class="error-message">
              🚫 没有找到匹配的产品，请尝试其他筛选条件
          </div>
      `;
    return;
  }

  container.innerHTML = products.map(product => `
      <div class="product-card">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-detail">
              <span class="detail-label">型号:</span> ${product.model}
          </p>
          <p class="product-detail">
              <span class="detail-label">类型:</span> ${product.type}
          </p>
          <p class="product-detail">
              <span class="detail-label">电流:</span> ${product.current}
          </p>
          <p class="product-detail">
              <span class="detail-label">温度:</span> ${product.temperature}℃
          </p>
          <p class="product-detail">
              <span class="detail-label">属性:</span> ${product.attribute}
          </p>
          ${product.description ? `
              <p class="product-detail">${product.description}</p>
          ` : ''}
          <a href="${product.link}" class="view-button" target="_blank">查看详情购买</a>
      </div>
  `).join('');
}

// 错误处理
function showError(message) {
  const container = document.querySelector(CONFIG.selectors.results);
  container.innerHTML = `
      <div class="error-message">
          ⚠️ ${message}
      </div>
  `;
}

// 启动应用
init();