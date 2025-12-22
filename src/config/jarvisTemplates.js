/**
 * Jarvis接口Mock入参模板
 * 用于快速填充Mock调用测试的业务数据
 */

export const jarvisTemplates = {
  // 建档模板
  CreateArchives: {
      "sex": "2",
      "age": 53,
      "marriage": "2",
      "identitycard": "330511197202254629",
      "cardType": "1",
      "phone": "13059970500",
      "birthday": "1972-02-25",
      "address": "湖州",
      "patientName": "测试账号",
      "patientCode": "2508190055",
      "nation": "01",
      "nationName": "汉族",
      "hisPatientId": null,
      "visitNo": null,
      "archivesCode": "10011081",
      "archivalNo": "10011081",
      "userType": 1,
      "orgName": "湖州市机关单位",
      "registrationExtend1": null,
      "registrationExtend2": null,
      "registrationExtend3": null,
      "patientInfo": {
        "sex": "2",
        "age": 53,
        "marriage": "2",
        "identitycard": "330511197202254629",
        "cardType": "1",
        "patientLevelName": "普通体检人",
        "phone": "13059970500",
        "birthday": "1972-02-25",
        "hisOrgId": "85330",
        "address": "湖州",
        "patientName": "莫伟文",
        "patientCode": "2508190082",
        "hisPatientId": null,
        "visitNo": null,
        "userType": 1,
        "orgName": "湖州市机关单位",
        "registrationExtend1": null,
        "registrationExtend2": null,
        "registrationExtend3": null,
        "registertime": "2025-08-19 08:28:01",
        "physicalTypes": "physical:types:A",
        "physicalTypeName": "健康体检"
      }
  },

  // 获取档案模板
  GetArchives: {
    "BusinessMethod": "GetArchives",
    "BusinessCode": "2508190082",
    "data": {
      "patientCode": "2508190082"
    }
  },

  // 更新档案模板
  UpdateArchives: {
    "BusinessMethod": "UpdateArchives",
    "BusinessCode": "2508190082",
    "data": {
      "patientCode": "2508190082",
      "phone": "13800138000",
      "address": "湖州市"
    }
  }
};

// 模板显示名称映射
export const templateNames = {
  CreateArchives: '建档模板',
  GetArchives: '获取档案模板',
  UpdateArchives: '更新档案模板'
};
