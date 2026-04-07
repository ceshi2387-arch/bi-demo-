var SHEET_DAILY = '日报提交';
var SHEET_AI    = 'AI工具记录';
var SS_ID       = '1lvob--2yqx3xdt9AgQGI_xRGu-VX3utaTbGj1WQWQc4';

function testWrite() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('ID: ' + ss.getId());
  var s = ss.getSheetByName(SHEET_DAILY);
  if (!s) {
    s = ss.insertSheet(SHEET_DAILY);
    s.appendRow(['提交时间','日期','员工ID','姓名','部门','今日完成工作','遇到的问题','需协调事项','明日工作计划']);
  }
  s.appendRow(['测试时间', '2026/4/3', 'T001', '测试员', '三部1组', '测试内容', '无', '无', '无']);
}

function doGet(e) {
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    var s1 = ss.getSheetByName(SHEET_DAILY);
    if (!s1) {
      s1 = ss.insertSheet(SHEET_DAILY);
      s1.appendRow(['提交时间','日期','员工ID','姓名','部门','今日完成工作','遇到的问题','需协调事项','明日工作计划']);
    }
    s1.appendRow([
      data['提交时间'], data['日期'], data['员工ID'], data['姓名'], data['部门'],
      data['今日完成工作'], data['遇到的问题'], data['需协调事项'], data['明日工作计划']
    ]);

    var tools = data['AI工具'] || [];
    if (tools.length) {
      var s2 = ss.getSheetByName(SHEET_AI);
      if (!s2) {
        s2 = ss.insertSheet(SHEET_AI);
        s2.appendRow(['提交时间','日期','员工ID','姓名','部门','工具名称','使用场景','完成内容','使用次数','成功率','节省工时','字符消耗量','问题建议']);
      }
      for (var i = 0; i < tools.length; i++) {
        var t = tools[i];
        if (!t['工具名称']) continue;
        s2.appendRow([
          data['提交时间'], data['日期'], data['员工ID'], data['姓名'], data['部门'],
          t['工具名称'], t['使用场景'], t['完成内容'],
          Number(t['使用次数'])||0, t['成功率'],
          Number(t['节省工时'])||0, Number(t['字符消耗量'])||0, t['问题建议']
        ]);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:'error',msg:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}
