// ── GA4 数据拉取脚本 ─────────────────────────────────────────────────
// 表格 ID：17lw0lrIsHi2MhnH1af2YAyatudHVX4wLJ9B9WZsWKH0
// 每天自动运行，把 GA4 数据写入各产品对应的 Sheet

var GA4_SS_ID = '17lw0lrIsHi2MhnH1af2YAyatudHVX4wLJ9B9WZsWKH0';

// 产品配置（后续陆续填入其他产品的 Property ID）
var PRODUCTS = [
  { name: '911爆料', propertyId: '324013886' },
  // { name: '911爆料APP', propertyId: '' },
  // { name: '章鱼导航',   propertyId: '' },
  // { name: '吃瓜网',     propertyId: '' },
  // { name: '吃瓜网APP',  propertyId: '' },
  // { name: '吃瓜导航',   propertyId: '' },
  // { name: '每日大乱斗', propertyId: '' },
  // { name: '91爆料',     propertyId: '' },
  // { name: '91爆料APP',  propertyId: '' },
  // { name: '麻豆导航',   propertyId: '' },
  // { name: '私房KTV',    propertyId: '' },
  // { name: '猎奇社',     propertyId: '' },
  // { name: '1024吃瓜',   propertyId: '' },
  // { name: '探花网',     propertyId: '' },
];

// 拉取天数
var DAYS = 30;

// ── 主函数：手动运行或定时触发 ─────────────────────────────────────
function fetchAllGA4() {
  var ss = SpreadsheetApp.openById(GA4_SS_ID);
  var endDate   = new Date();
  endDate.setDate(endDate.getDate() - 1); // 昨天
  var startDate = new Date();
  startDate.setDate(startDate.getDate() - DAYS);

  var startStr = formatDate(startDate);
  var endStr   = formatDate(endDate);

  PRODUCTS.forEach(function(p) {
    if (!p.propertyId) return;
    try {
      fetchGA4Product(ss, p.name, p.propertyId, startStr, endStr);
      Logger.log('✓ ' + p.name + ' 完成');
    } catch(e) {
      Logger.log('✗ ' + p.name + ' 失败: ' + e.message);
    }
  });
}

// ── 拉取单个产品数据 ────────────────────────────────────────────────
function fetchGA4Product(ss, name, propertyId, startDate, endDate) {
  // 调用 GA4 Data API
  var url = 'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport';
  var payload = {
    dateRanges: [{ startDate: startDate, endDate: endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'sessionDefaultChannelGroup' }
    ],
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' }
    ],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();

  if (code !== 200) {
    throw new Error('HTTP ' + code + ': ' + text.substring(0, 200));
  }

  var result = JSON.parse(text);
  var rows = result.rows || [];

  // 找到或创建对应 Sheet
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    sheet.clearContents();
  }

  // 写表头
  sheet.appendRow(['日期', '渠道来源', '日活', '新增']);

  // 写数据
  rows.forEach(function(row) {
    var rawDate = row.dimensionValues[0].value;
    var date = rawDate.slice(0,4) + '/' + rawDate.slice(4,6) + '/' + rawDate.slice(6,8);
    var channel = row.dimensionValues[1].value;
    var dau     = Number(row.metricValues[0].value);
    var newU    = Number(row.metricValues[1].value);
    sheet.appendRow([date, channel, dau, newU]);
  });
}

// ── 工具函数 ────────────────────────────────────────────────────────
function formatDate(d) {
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth()+1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

// ── 设置每日定时触发器（只需运行一次）──────────────────────────────
function setupTrigger() {
  // 删除旧触发器
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'fetchAllGA4') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // 每天早上 8 点运行
  ScriptApp.newTrigger('fetchAllGA4')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  Logger.log('定时器设置完成，每天 08:00 自动拉取');
}
