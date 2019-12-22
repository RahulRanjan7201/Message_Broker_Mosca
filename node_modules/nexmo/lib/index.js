"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var querystring = require("querystring");

var msgpath = { host: "rest.nexmo.com", path: "/sms/json" };
var shortcodePath = { host: "rest.nexmo.com", path: "/sc/us/${type}/json" };
var ttsEndpoint = { host: "api.nexmo.com", path: "/tts/json" };
var ttsPromptEndpoint = { host: "api.nexmo.com", path: "/tts-prompt/json" };
var callEndpoint = { host: "rest.nexmo.com", path: "/call/json" };
var verifyEndpoint = { host: "api.nexmo.com", path: "/verify/json" };
var checkVerifyEndpoint = { host: "api.nexmo.com", path: "/verify/check/json" };
var controlVerifyEndpoint = {
  host: "api.nexmo.com",
  path: "/verify/control/json"
};
var searchVerifyEndpoint = {
  host: "api.nexmo.com",
  path: "/verify/search/json"
};
var niEndpoint = { host: "api.nexmo.com", path: "/ni/advanced/async/json" };
var niBasicEndpoint = { host: "api.nexmo.com", path: "/ni/basic/json" };
var niStandardEndpoint = { host: "api.nexmo.com", path: "/ni/standard/json" };
var niAdvancedEndpoint = { host: "api.nexmo.com", path: "/ni/advanced/json" };
var up = {};
var numberPattern = new RegExp("^[0-9 +()-]*$");

var _options = null;

// Error message resources are maintained globally in one place for easy management
var ERROR_MESSAGES = {
  sender: "Invalid from address",
  to: "Invalid to address",
  msg: "Invalid Text Message",
  msgParams: "Invalid shortcode message parameters",
  countrycode: "Invalid Country Code",
  msisdn: "Invalid MSISDN passed",
  body: "Invalid Body value in Binary Message",
  udh: "Invalid udh value in Binary Message",
  title: "Invalid title in WAP Push message",
  url: "Invalid url in WAP Push message",
  maxDigits: "Invalid max digits for TTS prompt",
  byeText: "Invalid bye text for TTS prompt",
  pinCode: "Invalid pin code for TTS confirm",
  failedText: "Invalid failed text for TTS confirm",
  answerUrl: "Invalid answer URL for call",
  verifyValidation: "Missing Mandatory fields (number and/or brand)",
  checkVerifyValidation: "Missing Mandatory fields (request_id and/or code)",
  controlVerifyValidation: "Missing Mandatory fields (request_id and/or cmd-command)",
  searchVerifyValidation: "Missing Mandatory fields (request_id or request_ids)",
  numberInsightAdvancedValidation: "Missing Mandatory fields (number and/or callback url)",
  numberInsightValidation: "Missing Mandatory field - number",
  numberInsightPatternFailure: "Number can contain digits and may include any or all of the following: white space, -,+, (, ).",
  optionsNotAnObject: "Options parameter should be a dictionary. Check the docs for valid properties for options",
  product: "Invalid product. Should be one of [voice, sms]"
};

exports.initialize = function (pkey, psecret, options) {
  if (!pkey || !psecret) {
    throw "key and secret cannot be empty, set valid values";
  }
  up = {
    api_key: pkey,
    api_secret: psecret
  };
  _options = options;
};

exports.sendBinaryMessage = function (sender, recipient, body, udh, callback) {
  if (!body) {
    sendError(callback, new Error(ERROR_MESSAGES.body));
  } else if (!udh) {
    sendError(callback, new Error(ERROR_MESSAGES.udh));
  } else {
    sendMessage({
      from: sender,
      to: recipient,
      type: "binary",
      body: body,
      udh: udh
    }, callback);
  }
};

exports.sendWapPushMessage = function (sender, recipient, title, url, validity, callback) {
  if (!title) {
    sendError(callback, new Error(ERROR_MESSAGES.title));
  } else if (!url) {
    sendError(callback, new Error(ERROR_MESSAGES.url));
  } else {
    if (typeof validity === "function") {
      callback = validity;
      validity = 86400000;
    }
    sendMessage({
      from: sender,
      to: recipient,
      type: "wappush",
      title: title,
      validity: validity,
      url: url
    }, callback);
  }
};

exports.sendTextMessage = function (sender, recipient, message, opts, callback) {
  if (!message) {
    sendError(callback, new Error(ERROR_MESSAGES.msg));
  } else {
    if (!callback) {
      callback = opts;
      opts = {};
    }
    opts["from"] = sender;
    opts["to"] = recipient;
    opts["text"] = message;
    sendMessage(opts, callback);
  }
};

exports.sendMessage = function (opts, callback) {
  sendMessage(opts, callback);
};
function sendMessage(data, callback) {
  if (!data.from) {
    sendError(callback, new Error(ERROR_MESSAGES.sender));
  } else if (!data.to) {
    sendError(callback, new Error(ERROR_MESSAGES.to));
  } else {
    var path = clone(msgpath);
    path.path += "?" + querystring.stringify(data);
    _options.logger.info("sending message from " + data.from + " to " + data.to + " with message " + data.text);
    sendRequest(path, "POST", function (err, apiResponse) {
      if (!err && apiResponse.status && apiResponse.messages[0].status > 0) {
        sendError(callback, new Error(apiResponse.messages[0]["error-text"]), apiResponse);
      } else {
        if (callback) callback(err, apiResponse);
      }
    });
  }
}

function sendViaShortcode(type, recipient, messageParams, opts, callback) {
  if (!recipient) {
    sendError(callback, new Error(ERROR_MESSAGES.to));
  }
  if (!messageParams || !Object.keys(messageParams)) {
    sendError(callback, new Error(ERROR_MESSAGES.msgParams));
  }
  opts = opts || {};
  var path = clone(shortcodePath);
  path.path = path.path.replace("${type}", type);
  Object.keys(messageParams).forEach(function (key) {
    opts[key] = messageParams[key];
  });
  opts.to = recipient;
  path.path += "?" + querystring.stringify(opts);
  _options.logger.info("sending message from shortcode " + type + " to " + recipient + " with parameters " + JSON.stringify(messageParams));
  sendRequest(path, "POST", function (err, apiResponse) {
    if (!err && apiResponse.status && apiResponse.messages[0].status > 0) {
      sendError(callback, new Error(apiResponse.messages[0]["error-text"]), apiResponse);
    } else {
      if (callback) callback(err, apiResponse);
    }
  });
}
exports.shortcodeAlert = function (recipient, messageParams, opts, callback) {
  sendViaShortcode("alert", recipient, messageParams, opts, callback);
};
exports.shortcode2FA = function (recipient, messageParams, opts, callback) {
  sendViaShortcode("2fa", recipient, messageParams, opts, callback);
};
exports.shortcodeMarketing = function (recipient, messageParams, opts, callback) {
  sendViaShortcode("marketing", recipient, messageParams, opts, callback);
};

function clone(a) {
  return JSON.parse(JSON.stringify(a));
}

function getEndpoint(action) {
  return { path: action };
}

function sendRequest(endpoint, method, callback) {
  endpoint.path = endpoint.path + (endpoint.path.indexOf("?") > 0 ? "&" : "?") + querystring.stringify(up);
  _options.httpClient.request(endpoint, method, callback);
}

exports.checkBalance = function (callback) {
  var balanceEndpoint = getEndpoint("/account/get-balance");
  sendRequest(balanceEndpoint, callback);
};

exports.getNumbers = function (options, callback) {
  var numbersEndpoint = getEndpoint("/account/numbers");
  if (typeof options === "function") {
    callback = options;
  } else if ((typeof options === "undefined" ? "undefined" : _typeof(options)) === "object") {
    numbersEndpoint.path = numbersEndpoint.path + "?";
    for (var key in options) {
      numbersEndpoint.path = numbersEndpoint.path + key + "=" + options[key] + "&";
    }
  } else {
    sendError(callback, new Error(ERROR_MESSAGES.optionsNotAnObject));
    return;
  }
  sendRequest(numbersEndpoint, callback);
};

exports.searchNumbers = function (countryCode, pattern, callback) {
  if (!countryCode || countryCode.length !== 2) {
    sendError(callback, new Error(ERROR_MESSAGES.countrycode));
  } else {
    var searchEndpoint = getEndpoint("/number/search");
    searchEndpoint.path += "?country=" + countryCode;
    if (typeof pattern === "function") {
      callback = pattern;
    } else if ((typeof pattern === "undefined" ? "undefined" : _typeof(pattern)) === "object") {
      searchEndpoint.path = searchEndpoint.path + "&";
      for (var arg in pattern) {
        searchEndpoint.path = searchEndpoint.path + arg + "=" + pattern[arg] + "&";
      }
    } else {
      searchEndpoint.path = searchEndpoint.path + "&pattern=" + pattern;
    }
    sendRequest(searchEndpoint, callback);
  }
};

exports.buyNumber = function (countryCode, msisdn, callback) {
  if (!countryCode || countryCode.length !== 2) {
    sendError(callback, new Error(ERROR_MESSAGES.countrycode));
  } else if (!msisdn) {
    sendError(callback, new Error(ERROR_MESSAGES.msisdn));
  } else {
    var buyEndpoint = getEndpoint("/number/buy");
    buyEndpoint.path += "?country=" + countryCode + "&msisdn=" + msisdn;
    sendRequest(buyEndpoint, "POST", callback);
  }
};

exports.cancelNumber = function (countryCode, msisdn, callback) {
  if (!countryCode || countryCode.length !== 2) {
    sendError(callback, new Error(ERROR_MESSAGES.countrycode));
  } else if (!msisdn) {
    sendError(callback, new Error(ERROR_MESSAGES.msisdn));
  } else {
    var cancelEndpoint = getEndpoint("/number/cancel");
    cancelEndpoint.path += "?country=" + countryCode + "&msisdn=" + msisdn;
    sendRequest(cancelEndpoint, "POST", callback);
  }
};

exports.cancelNumber = function (countryCode, msisdn, callback) {
  if (!countryCode || countryCode.length !== 2) {
    sendError(callback, new Error(ERROR_MESSAGES.countrycode));
  } else if (!msisdn) {
    sendError(callback, new Error(ERROR_MESSAGES.msisdn));
  } else {
    var cancelEndpoint = getEndpoint("/number/cancel");
    cancelEndpoint.path += "?country=" + countryCode + "&msisdn=" + msisdn;
    sendRequest(cancelEndpoint, "POST", callback);
  }
};

exports.updateNumber = function (countryCode, msisdn, params, callback) {
  if (!countryCode || countryCode.length !== 2) {
    sendError(callback, new Error(ERROR_MESSAGES.countrycode));
  } else if (!msisdn) {
    sendError(callback, new Error(ERROR_MESSAGES.msisdn));
  } else {
    var updateEndpoint = getEndpoint("/number/update");
    updateEndpoint.path += "?country=" + countryCode + "&msisdn=" + msisdn;
    updateEndpoint.path = updateEndpoint.path + "&";
    for (var arg in params) {
      updateEndpoint.path = updateEndpoint.path + arg + "=" + encodeURIComponent(params[arg]) + "&";
    }
    sendRequest(updateEndpoint, "POST", callback);
  }
};

exports.changePassword = function (newSecret, callback) {
  var settingsEndpoint = getEndpoint("/account/settings");
  settingsEndpoint.path += "?newSecret=" + encodeURIComponent(newSecret);
  sendRequest(settingsEndpoint, "POST", callback);
};

exports.changeMoCallbackUrl = function (newUrl, callback) {
  var settingsEndpoint = getEndpoint("/account/settings");
  settingsEndpoint.path += "?moCallBackUrl=" + encodeURIComponent(newUrl);
  sendRequest(settingsEndpoint, "POST", callback);
};

exports.changeDrCallbackUrl = function (newUrl, callback) {
  var settingsEndpoint = getEndpoint("/account/settings");
  settingsEndpoint.path += "?drCallBackUrl=" + encodeURIComponent(newUrl);
  sendRequest(settingsEndpoint, "POST", callback);
};

exports.verifyNumber = function (inputParams, callback) {
  if (!inputParams.number || !inputParams.brand) {
    sendError(callback, new Error(ERROR_MESSAGES.verifyValidation));
  } else {
    var vEndpoint = clone(verifyEndpoint);
    vEndpoint.path += "?" + querystring.stringify(inputParams);
    sendRequest(vEndpoint, callback);
  }
};

exports.checkVerifyRequest = function (inputParams, callback) {
  if (!inputParams.request_id || !inputParams.code) {
    sendError(callback, new Error(ERROR_MESSAGES.checkVerifyValidation));
  } else {
    var vEndpoint = clone(checkVerifyEndpoint);
    vEndpoint.path += "?" + querystring.stringify(inputParams);
    sendRequest(vEndpoint, callback);
  }
};

exports.controlVerifyRequest = function (inputParams, callback) {
  if (!inputParams.request_id || !inputParams.cmd) {
    sendError(callback, new Error(ERROR_MESSAGES.controlVerifyValidation));
  } else {
    var vEndpoint = clone(controlVerifyEndpoint);
    vEndpoint.path += "?" + querystring.stringify(inputParams);
    sendRequest(vEndpoint, callback);
  }
};

exports.searchVerifyRequest = function (requestIds, callback) {
  var requestIdParam = {};
  if (!requestIds) {
    sendError(callback, new Error(ERROR_MESSAGES.searchVerifyValidation));
  } else {
    if (Array.isArray(requestIds)) {
      if (requestIds.length === 1) {
        requestIdParam.request_id = requestIds;
      } else {
        requestIdParam.request_ids = requestIds;
      }
    } else {
      requestIdParam.request_id = requestIds;
    }
    var vEndpoint = clone(searchVerifyEndpoint);
    vEndpoint.path += "?" + querystring.stringify(requestIdParam);
    sendRequest(vEndpoint, callback);
  }
};

exports.numberInsight = function (inputParams, callback) {
  numberInsightAsync(inputParams, callback);
};

exports.numberInsightBasic = function (inputParams, callback) {
  numberInsightCommon(niBasicEndpoint, inputParams, callback);
};

exports.numberInsightStandard = function (inputParams, callback) {
  numberInsightCommon(niStandardEndpoint, inputParams, callback);
};

exports.numberInsightAdvanced = function (inputParams, callback) {
  numberInsightCommon(niAdvancedEndpoint, inputParams, callback);
};

exports.numberInsightAdvancedAsync = function (inputParams, callback) {
  numberInsightAsync(inputParams, callback);
};

function numberInsightAsync(inputParams, callback) {
  if (!inputParams.number || !inputParams.callback) {
    sendError(callback, new Error(ERROR_MESSAGES.numberInsightAdvancedValidation));
  } else {
    var nEndpoint = clone(niEndpoint);
    nEndpoint.path += "?" + querystring.stringify(inputParams);
    sendRequest(nEndpoint, callback);
  }
}

function numberInsightCommon(endpoint, inputParams, callback) {
  if (validateNumber(inputParams, callback)) {
    var inputObj;
    if ((typeof inputParams === "undefined" ? "undefined" : _typeof(inputParams)) !== "object") {
      inputObj = { number: inputParams };
    } else {
      inputObj = inputParams;
    }
    var nEndpoint = clone(endpoint);
    nEndpoint.path += "?" + querystring.stringify(inputObj);
    sendRequest(nEndpoint, callback);
  }
}
function validateNumber(inputParams, callback) {
  if ((typeof inputParams === "undefined" ? "undefined" : _typeof(inputParams)) === "object" && !inputParams.number) {
    sendError(callback, new Error(ERROR_MESSAGES.numberInsightValidation));
    return false;
  } else if ((typeof inputParams === "undefined" ? "undefined" : _typeof(inputParams)) === "object" && !numberPattern.test(inputParams.number)) {
    sendError(callback, new Error(ERROR_MESSAGES.numberInsightPatternFailure));
    return false;
  } else if ((typeof inputParams === "undefined" ? "undefined" : _typeof(inputParams)) !== "object" && (!inputParams || !numberPattern.test(inputParams))) {
    sendError(callback, new Error(ERROR_MESSAGES.numberInsightPatternFailure));
    return false;
  }
  return true;
}

function sendVoiceMessage(voiceEndpoint, data, callback) {
  if (!data.to) {
    sendError(callback, new Error(ERROR_MESSAGES.to));
  } else {
    var endpoint = clone(voiceEndpoint);
    endpoint.path += "?" + querystring.stringify(data);
    _options.logger.info("sending TTS message to " + data.to + " with message " + data.text);
    sendRequest(endpoint, "POST", function (err, apiResponse) {
      if (!err && apiResponse.status && apiResponse.status > 0) {
        sendError(callback, new Error(apiResponse["error-text"]), apiResponse);
      } else {
        if (callback) callback(err, apiResponse);
      }
    });
  }
}

exports.sendTTSMessage = function (recipient, message, opts, callback) {
  if (!message) {
    sendError(callback, new Error(ERROR_MESSAGES.msg));
  } else {
    if (!opts) {
      opts = {};
    }
    opts["to"] = recipient;
    opts["text"] = message;
    sendVoiceMessage(ttsEndpoint, opts, callback);
  }
};

exports.sendTTSPromptWithCapture = function (recipient, message, maxDigits, byeText, opts, callback) {
  if (!message) {
    sendError(callback, new Error(ERROR_MESSAGES.msg));
  } else if (!maxDigits || isNaN(maxDigits) || maxDigits.length > 16) {
    sendError(callback, new Error(ERROR_MESSAGES.maxDigits));
  } else if (!byeText) {
    sendError(callback, new Error(ERROR_MESSAGES.byeText));
  } else {
    if (!opts) {
      opts = {};
    }
    opts["to"] = recipient;
    opts["text"] = message;
    opts["max_digits"] = maxDigits;
    opts["bye_text"] = byeText;
    sendVoiceMessage(ttsPromptEndpoint, opts, callback);
  }
};

exports.sendTTSPromptWithConfirm = function (recipient, message, maxDigits, pinCode, byeText, failedText, opts, callback) {
  if (!message) {
    sendError(callback, new Error(ERROR_MESSAGES.msg));
  } else if (!maxDigits || isNaN(maxDigits) || maxDigits.length > 16) {
    sendError(callback, new Error(ERROR_MESSAGES.maxDigits));
  } else if (!pinCode || pinCode.length !== maxDigits) {
    sendError(callback, new Error(ERROR_MESSAGES.pinCode));
  } else if (!byeText) {
    sendError(callback, new Error(ERROR_MESSAGES.byeText));
  } else if (!failedText) {
    sendError(callback, new Error(ERROR_MESSAGES.failedText));
  } else {
    if (!opts) {
      opts = {};
    }
    opts["to"] = recipient;
    opts["text"] = message;
    opts["max_digits"] = maxDigits;
    opts["pin_code"] = pinCode;
    opts["bye_text"] = byeText;
    opts["failed_text"] = failedText;
    sendVoiceMessage(ttsPromptEndpoint, opts, callback);
  }
};

exports.call = function (recipient, answerUrl, opts, callback) {
  if (!answerUrl) {
    sendError(callback, new Error(ERROR_MESSAGES.answerUrl));
  } else {
    if (!opts) {
      opts = {};
    }
    opts["to"] = recipient;
    opts["answer_url"] = answerUrl;
    sendVoiceMessage(callEndpoint, opts, callback);
  }
};

function sendError(callback, err, returnData) {
  // Throw the error in case if there is no callback passed
  if (callback) {
    callback(err, returnData);
  } else {
    throw err;
  }
}

exports.setHost = function (aHost) {
  msgpath.host = aHost;
  shortcodePath.host = aHost;
  ttsEndpoint.host = aHost;
  ttsPromptEndpoint.host = aHost;
  callEndpoint.host = aHost;
  verifyEndpoint.host = aHost;
  checkVerifyEndpoint.host = aHost;
  controlVerifyEndpoint.host = aHost;
  searchVerifyEndpoint.host = aHost;
  niEndpoint.host = aHost;
  niBasicEndpoint.host = aHost;
  niStandardEndpoint.host = aHost;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6WyJxdWVyeXN0cmluZyIsInJlcXVpcmUiLCJtc2dwYXRoIiwiaG9zdCIsInBhdGgiLCJzaG9ydGNvZGVQYXRoIiwidHRzRW5kcG9pbnQiLCJ0dHNQcm9tcHRFbmRwb2ludCIsImNhbGxFbmRwb2ludCIsInZlcmlmeUVuZHBvaW50IiwiY2hlY2tWZXJpZnlFbmRwb2ludCIsImNvbnRyb2xWZXJpZnlFbmRwb2ludCIsInNlYXJjaFZlcmlmeUVuZHBvaW50IiwibmlFbmRwb2ludCIsIm5pQmFzaWNFbmRwb2ludCIsIm5pU3RhbmRhcmRFbmRwb2ludCIsIm5pQWR2YW5jZWRFbmRwb2ludCIsInVwIiwibnVtYmVyUGF0dGVybiIsIlJlZ0V4cCIsIl9vcHRpb25zIiwiRVJST1JfTUVTU0FHRVMiLCJzZW5kZXIiLCJ0byIsIm1zZyIsIm1zZ1BhcmFtcyIsImNvdW50cnljb2RlIiwibXNpc2RuIiwiYm9keSIsInVkaCIsInRpdGxlIiwidXJsIiwibWF4RGlnaXRzIiwiYnllVGV4dCIsInBpbkNvZGUiLCJmYWlsZWRUZXh0IiwiYW5zd2VyVXJsIiwidmVyaWZ5VmFsaWRhdGlvbiIsImNoZWNrVmVyaWZ5VmFsaWRhdGlvbiIsImNvbnRyb2xWZXJpZnlWYWxpZGF0aW9uIiwic2VhcmNoVmVyaWZ5VmFsaWRhdGlvbiIsIm51bWJlckluc2lnaHRBZHZhbmNlZFZhbGlkYXRpb24iLCJudW1iZXJJbnNpZ2h0VmFsaWRhdGlvbiIsIm51bWJlckluc2lnaHRQYXR0ZXJuRmFpbHVyZSIsIm9wdGlvbnNOb3RBbk9iamVjdCIsInByb2R1Y3QiLCJleHBvcnRzIiwiaW5pdGlhbGl6ZSIsInBrZXkiLCJwc2VjcmV0Iiwib3B0aW9ucyIsImFwaV9rZXkiLCJhcGlfc2VjcmV0Iiwic2VuZEJpbmFyeU1lc3NhZ2UiLCJyZWNpcGllbnQiLCJjYWxsYmFjayIsInNlbmRFcnJvciIsIkVycm9yIiwic2VuZE1lc3NhZ2UiLCJmcm9tIiwidHlwZSIsInNlbmRXYXBQdXNoTWVzc2FnZSIsInZhbGlkaXR5Iiwic2VuZFRleHRNZXNzYWdlIiwibWVzc2FnZSIsIm9wdHMiLCJkYXRhIiwiY2xvbmUiLCJzdHJpbmdpZnkiLCJsb2dnZXIiLCJpbmZvIiwidGV4dCIsInNlbmRSZXF1ZXN0IiwiZXJyIiwiYXBpUmVzcG9uc2UiLCJzdGF0dXMiLCJtZXNzYWdlcyIsInNlbmRWaWFTaG9ydGNvZGUiLCJtZXNzYWdlUGFyYW1zIiwiT2JqZWN0Iiwia2V5cyIsInJlcGxhY2UiLCJmb3JFYWNoIiwia2V5IiwiSlNPTiIsInNob3J0Y29kZUFsZXJ0Iiwic2hvcnRjb2RlMkZBIiwic2hvcnRjb2RlTWFya2V0aW5nIiwiYSIsInBhcnNlIiwiZ2V0RW5kcG9pbnQiLCJhY3Rpb24iLCJlbmRwb2ludCIsIm1ldGhvZCIsImluZGV4T2YiLCJodHRwQ2xpZW50IiwicmVxdWVzdCIsImNoZWNrQmFsYW5jZSIsImJhbGFuY2VFbmRwb2ludCIsImdldE51bWJlcnMiLCJudW1iZXJzRW5kcG9pbnQiLCJzZWFyY2hOdW1iZXJzIiwiY291bnRyeUNvZGUiLCJwYXR0ZXJuIiwibGVuZ3RoIiwic2VhcmNoRW5kcG9pbnQiLCJhcmciLCJidXlOdW1iZXIiLCJidXlFbmRwb2ludCIsImNhbmNlbE51bWJlciIsImNhbmNlbEVuZHBvaW50IiwidXBkYXRlTnVtYmVyIiwicGFyYW1zIiwidXBkYXRlRW5kcG9pbnQiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjaGFuZ2VQYXNzd29yZCIsIm5ld1NlY3JldCIsInNldHRpbmdzRW5kcG9pbnQiLCJjaGFuZ2VNb0NhbGxiYWNrVXJsIiwibmV3VXJsIiwiY2hhbmdlRHJDYWxsYmFja1VybCIsInZlcmlmeU51bWJlciIsImlucHV0UGFyYW1zIiwibnVtYmVyIiwiYnJhbmQiLCJ2RW5kcG9pbnQiLCJjaGVja1ZlcmlmeVJlcXVlc3QiLCJyZXF1ZXN0X2lkIiwiY29kZSIsImNvbnRyb2xWZXJpZnlSZXF1ZXN0IiwiY21kIiwic2VhcmNoVmVyaWZ5UmVxdWVzdCIsInJlcXVlc3RJZHMiLCJyZXF1ZXN0SWRQYXJhbSIsIkFycmF5IiwiaXNBcnJheSIsInJlcXVlc3RfaWRzIiwibnVtYmVySW5zaWdodCIsIm51bWJlckluc2lnaHRBc3luYyIsIm51bWJlckluc2lnaHRCYXNpYyIsIm51bWJlckluc2lnaHRDb21tb24iLCJudW1iZXJJbnNpZ2h0U3RhbmRhcmQiLCJudW1iZXJJbnNpZ2h0QWR2YW5jZWQiLCJudW1iZXJJbnNpZ2h0QWR2YW5jZWRBc3luYyIsIm5FbmRwb2ludCIsInZhbGlkYXRlTnVtYmVyIiwiaW5wdXRPYmoiLCJ0ZXN0Iiwic2VuZFZvaWNlTWVzc2FnZSIsInZvaWNlRW5kcG9pbnQiLCJzZW5kVFRTTWVzc2FnZSIsInNlbmRUVFNQcm9tcHRXaXRoQ2FwdHVyZSIsImlzTmFOIiwic2VuZFRUU1Byb21wdFdpdGhDb25maXJtIiwiY2FsbCIsInJldHVybkRhdGEiLCJzZXRIb3N0IiwiYUhvc3QiXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBRUEsSUFBSUEsY0FBY0MsUUFBUSxhQUFSLENBQWxCOztBQUVBLElBQUlDLFVBQVUsRUFBRUMsTUFBTSxnQkFBUixFQUEwQkMsTUFBTSxXQUFoQyxFQUFkO0FBQ0EsSUFBSUMsZ0JBQWdCLEVBQUVGLE1BQU0sZ0JBQVIsRUFBMEJDLE1BQU0scUJBQWhDLEVBQXBCO0FBQ0EsSUFBSUUsY0FBYyxFQUFFSCxNQUFNLGVBQVIsRUFBeUJDLE1BQU0sV0FBL0IsRUFBbEI7QUFDQSxJQUFJRyxvQkFBb0IsRUFBRUosTUFBTSxlQUFSLEVBQXlCQyxNQUFNLGtCQUEvQixFQUF4QjtBQUNBLElBQUlJLGVBQWUsRUFBRUwsTUFBTSxnQkFBUixFQUEwQkMsTUFBTSxZQUFoQyxFQUFuQjtBQUNBLElBQUlLLGlCQUFpQixFQUFFTixNQUFNLGVBQVIsRUFBeUJDLE1BQU0sY0FBL0IsRUFBckI7QUFDQSxJQUFJTSxzQkFBc0IsRUFBRVAsTUFBTSxlQUFSLEVBQXlCQyxNQUFNLG9CQUEvQixFQUExQjtBQUNBLElBQUlPLHdCQUF3QjtBQUMxQlIsUUFBTSxlQURvQjtBQUUxQkMsUUFBTTtBQUZvQixDQUE1QjtBQUlBLElBQUlRLHVCQUF1QjtBQUN6QlQsUUFBTSxlQURtQjtBQUV6QkMsUUFBTTtBQUZtQixDQUEzQjtBQUlBLElBQUlTLGFBQWEsRUFBRVYsTUFBTSxlQUFSLEVBQXlCQyxNQUFNLHlCQUEvQixFQUFqQjtBQUNBLElBQUlVLGtCQUFrQixFQUFFWCxNQUFNLGVBQVIsRUFBeUJDLE1BQU0sZ0JBQS9CLEVBQXRCO0FBQ0EsSUFBSVcscUJBQXFCLEVBQUVaLE1BQU0sZUFBUixFQUF5QkMsTUFBTSxtQkFBL0IsRUFBekI7QUFDQSxJQUFJWSxxQkFBcUIsRUFBRWIsTUFBTSxlQUFSLEVBQXlCQyxNQUFNLG1CQUEvQixFQUF6QjtBQUNBLElBQUlhLEtBQUssRUFBVDtBQUNBLElBQUlDLGdCQUFnQixJQUFJQyxNQUFKLENBQVcsZUFBWCxDQUFwQjs7QUFFQSxJQUFJQyxXQUFXLElBQWY7O0FBRUE7QUFDQSxJQUFJQyxpQkFBaUI7QUFDbkJDLFVBQVEsc0JBRFc7QUFFbkJDLE1BQUksb0JBRmU7QUFHbkJDLE9BQUssc0JBSGM7QUFJbkJDLGFBQVcsc0NBSlE7QUFLbkJDLGVBQWEsc0JBTE07QUFNbkJDLFVBQVEsdUJBTlc7QUFPbkJDLFFBQU0sc0NBUGE7QUFRbkJDLE9BQUsscUNBUmM7QUFTbkJDLFNBQU8sbUNBVFk7QUFVbkJDLE9BQUssaUNBVmM7QUFXbkJDLGFBQVcsbUNBWFE7QUFZbkJDLFdBQVMsaUNBWlU7QUFhbkJDLFdBQVMsa0NBYlU7QUFjbkJDLGNBQVkscUNBZE87QUFlbkJDLGFBQVcsNkJBZlE7QUFnQm5CQyxvQkFBa0IsZ0RBaEJDO0FBaUJuQkMseUJBQXVCLG1EQWpCSjtBQWtCbkJDLDJCQUNFLDBEQW5CaUI7QUFvQm5CQywwQkFDRSxzREFyQmlCO0FBc0JuQkMsbUNBQ0UsdURBdkJpQjtBQXdCbkJDLDJCQUF5QixrQ0F4Qk47QUF5Qm5CQywrQkFDRSxnR0ExQmlCO0FBMkJuQkMsc0JBQ0UsMkZBNUJpQjtBQTZCbkJDLFdBQVM7QUE3QlUsQ0FBckI7O0FBZ0NBQyxRQUFRQyxVQUFSLEdBQXFCLFVBQVNDLElBQVQsRUFBZUMsT0FBZixFQUF3QkMsT0FBeEIsRUFBaUM7QUFDcEQsTUFBSSxDQUFDRixJQUFELElBQVMsQ0FBQ0MsT0FBZCxFQUF1QjtBQUNyQixVQUFNLGtEQUFOO0FBQ0Q7QUFDRGhDLE9BQUs7QUFDSGtDLGFBQVNILElBRE47QUFFSEksZ0JBQVlIO0FBRlQsR0FBTDtBQUlBN0IsYUFBVzhCLE9BQVg7QUFDRCxDQVREOztBQVdBSixRQUFRTyxpQkFBUixHQUE0QixVQUFTL0IsTUFBVCxFQUFpQmdDLFNBQWpCLEVBQTRCMUIsSUFBNUIsRUFBa0NDLEdBQWxDLEVBQXVDMEIsUUFBdkMsRUFBaUQ7QUFDM0UsTUFBSSxDQUFDM0IsSUFBTCxFQUFXO0FBQ1Q0QixjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVPLElBQXpCLENBQXBCO0FBQ0QsR0FGRCxNQUVPLElBQUksQ0FBQ0MsR0FBTCxFQUFVO0FBQ2YyQixjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVRLEdBQXpCLENBQXBCO0FBQ0QsR0FGTSxNQUVBO0FBQ0w2QixnQkFDRTtBQUNFQyxZQUFNckMsTUFEUjtBQUVFQyxVQUFJK0IsU0FGTjtBQUdFTSxZQUFNLFFBSFI7QUFJRWhDLFlBQU1BLElBSlI7QUFLRUMsV0FBS0E7QUFMUCxLQURGLEVBUUUwQixRQVJGO0FBVUQ7QUFDRixDQWpCRDs7QUFtQkFULFFBQVFlLGtCQUFSLEdBQTZCLFVBQzNCdkMsTUFEMkIsRUFFM0JnQyxTQUYyQixFQUczQnhCLEtBSDJCLEVBSTNCQyxHQUoyQixFQUszQitCLFFBTDJCLEVBTTNCUCxRQU4yQixFQU8zQjtBQUNBLE1BQUksQ0FBQ3pCLEtBQUwsRUFBWTtBQUNWMEIsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlUyxLQUF6QixDQUFwQjtBQUNELEdBRkQsTUFFTyxJQUFJLENBQUNDLEdBQUwsRUFBVTtBQUNmeUIsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlVSxHQUF6QixDQUFwQjtBQUNELEdBRk0sTUFFQTtBQUNMLFFBQUksT0FBTytCLFFBQVAsS0FBb0IsVUFBeEIsRUFBb0M7QUFDbENQLGlCQUFXTyxRQUFYO0FBQ0FBLGlCQUFXLFFBQVg7QUFDRDtBQUNESixnQkFDRTtBQUNFQyxZQUFNckMsTUFEUjtBQUVFQyxVQUFJK0IsU0FGTjtBQUdFTSxZQUFNLFNBSFI7QUFJRTlCLGFBQU9BLEtBSlQ7QUFLRWdDLGdCQUFVQSxRQUxaO0FBTUUvQixXQUFLQTtBQU5QLEtBREYsRUFTRXdCLFFBVEY7QUFXRDtBQUNGLENBN0JEOztBQStCQVQsUUFBUWlCLGVBQVIsR0FBMEIsVUFBU3pDLE1BQVQsRUFBaUJnQyxTQUFqQixFQUE0QlUsT0FBNUIsRUFBcUNDLElBQXJDLEVBQTJDVixRQUEzQyxFQUFxRDtBQUM3RSxNQUFJLENBQUNTLE9BQUwsRUFBYztBQUNaUixjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVHLEdBQXpCLENBQXBCO0FBQ0QsR0FGRCxNQUVPO0FBQ0wsUUFBSSxDQUFDK0IsUUFBTCxFQUFlO0FBQ2JBLGlCQUFXVSxJQUFYO0FBQ0FBLGFBQU8sRUFBUDtBQUNEO0FBQ0RBLFNBQUssTUFBTCxJQUFlM0MsTUFBZjtBQUNBMkMsU0FBSyxJQUFMLElBQWFYLFNBQWI7QUFDQVcsU0FBSyxNQUFMLElBQWVELE9BQWY7QUFDQU4sZ0JBQVlPLElBQVosRUFBa0JWLFFBQWxCO0FBQ0Q7QUFDRixDQWJEOztBQWVBVCxRQUFRWSxXQUFSLEdBQXNCLFVBQVNPLElBQVQsRUFBZVYsUUFBZixFQUF5QjtBQUM3Q0csY0FBWU8sSUFBWixFQUFrQlYsUUFBbEI7QUFDRCxDQUZEO0FBR0EsU0FBU0csV0FBVCxDQUFxQlEsSUFBckIsRUFBMkJYLFFBQTNCLEVBQXFDO0FBQ25DLE1BQUksQ0FBQ1csS0FBS1AsSUFBVixFQUFnQjtBQUNkSCxjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVDLE1BQXpCLENBQXBCO0FBQ0QsR0FGRCxNQUVPLElBQUksQ0FBQzRDLEtBQUszQyxFQUFWLEVBQWM7QUFDbkJpQyxjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVFLEVBQXpCLENBQXBCO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsUUFBSW5CLE9BQU8rRCxNQUFNakUsT0FBTixDQUFYO0FBQ0FFLFNBQUtBLElBQUwsSUFBYSxNQUFNSixZQUFZb0UsU0FBWixDQUFzQkYsSUFBdEIsQ0FBbkI7QUFDQTlDLGFBQVNpRCxNQUFULENBQWdCQyxJQUFoQixDQUNFLDBCQUNFSixLQUFLUCxJQURQLEdBRUUsTUFGRixHQUdFTyxLQUFLM0MsRUFIUCxHQUlFLGdCQUpGLEdBS0UyQyxLQUFLSyxJQU5UO0FBUUFDLGdCQUFZcEUsSUFBWixFQUFrQixNQUFsQixFQUEwQixVQUFTcUUsR0FBVCxFQUFjQyxXQUFkLEVBQTJCO0FBQ25ELFVBQUksQ0FBQ0QsR0FBRCxJQUFRQyxZQUFZQyxNQUFwQixJQUE4QkQsWUFBWUUsUUFBWixDQUFxQixDQUFyQixFQUF3QkQsTUFBeEIsR0FBaUMsQ0FBbkUsRUFBc0U7QUFDcEVuQixrQkFDRUQsUUFERixFQUVFLElBQUlFLEtBQUosQ0FBVWlCLFlBQVlFLFFBQVosQ0FBcUIsQ0FBckIsRUFBd0IsWUFBeEIsQ0FBVixDQUZGLEVBR0VGLFdBSEY7QUFLRCxPQU5ELE1BTU87QUFDTCxZQUFJbkIsUUFBSixFQUFjQSxTQUFTa0IsR0FBVCxFQUFjQyxXQUFkO0FBQ2Y7QUFDRixLQVZEO0FBV0Q7QUFDRjs7QUFFRCxTQUFTRyxnQkFBVCxDQUEwQmpCLElBQTFCLEVBQWdDTixTQUFoQyxFQUEyQ3dCLGFBQTNDLEVBQTBEYixJQUExRCxFQUFnRVYsUUFBaEUsRUFBMEU7QUFDeEUsTUFBSSxDQUFDRCxTQUFMLEVBQWdCO0FBQ2RFLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZUUsRUFBekIsQ0FBcEI7QUFDRDtBQUNELE1BQUksQ0FBQ3VELGFBQUQsSUFBa0IsQ0FBQ0MsT0FBT0MsSUFBUCxDQUFZRixhQUFaLENBQXZCLEVBQW1EO0FBQ2pEdEIsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlSSxTQUF6QixDQUFwQjtBQUNEO0FBQ0R3QyxTQUFPQSxRQUFRLEVBQWY7QUFDQSxNQUFJN0QsT0FBTytELE1BQU05RCxhQUFOLENBQVg7QUFDQUQsT0FBS0EsSUFBTCxHQUFZQSxLQUFLQSxJQUFMLENBQVU2RSxPQUFWLENBQWtCLFNBQWxCLEVBQTZCckIsSUFBN0IsQ0FBWjtBQUNBbUIsU0FBT0MsSUFBUCxDQUFZRixhQUFaLEVBQTJCSSxPQUEzQixDQUFtQyxVQUFTQyxHQUFULEVBQWM7QUFDL0NsQixTQUFLa0IsR0FBTCxJQUFZTCxjQUFjSyxHQUFkLENBQVo7QUFDRCxHQUZEO0FBR0FsQixPQUFLMUMsRUFBTCxHQUFVK0IsU0FBVjtBQUNBbEQsT0FBS0EsSUFBTCxJQUFhLE1BQU1KLFlBQVlvRSxTQUFaLENBQXNCSCxJQUF0QixDQUFuQjtBQUNBN0MsV0FBU2lELE1BQVQsQ0FBZ0JDLElBQWhCLENBQ0Usb0NBQ0VWLElBREYsR0FFRSxNQUZGLEdBR0VOLFNBSEYsR0FJRSxtQkFKRixHQUtFOEIsS0FBS2hCLFNBQUwsQ0FBZVUsYUFBZixDQU5KO0FBUUFOLGNBQVlwRSxJQUFaLEVBQWtCLE1BQWxCLEVBQTBCLFVBQVNxRSxHQUFULEVBQWNDLFdBQWQsRUFBMkI7QUFDbkQsUUFBSSxDQUFDRCxHQUFELElBQVFDLFlBQVlDLE1BQXBCLElBQThCRCxZQUFZRSxRQUFaLENBQXFCLENBQXJCLEVBQXdCRCxNQUF4QixHQUFpQyxDQUFuRSxFQUFzRTtBQUNwRW5CLGdCQUNFRCxRQURGLEVBRUUsSUFBSUUsS0FBSixDQUFVaUIsWUFBWUUsUUFBWixDQUFxQixDQUFyQixFQUF3QixZQUF4QixDQUFWLENBRkYsRUFHRUYsV0FIRjtBQUtELEtBTkQsTUFNTztBQUNMLFVBQUluQixRQUFKLEVBQWNBLFNBQVNrQixHQUFULEVBQWNDLFdBQWQ7QUFDZjtBQUNGLEdBVkQ7QUFXRDtBQUNENUIsUUFBUXVDLGNBQVIsR0FBeUIsVUFBUy9CLFNBQVQsRUFBb0J3QixhQUFwQixFQUFtQ2IsSUFBbkMsRUFBeUNWLFFBQXpDLEVBQW1EO0FBQzFFc0IsbUJBQWlCLE9BQWpCLEVBQTBCdkIsU0FBMUIsRUFBcUN3QixhQUFyQyxFQUFvRGIsSUFBcEQsRUFBMERWLFFBQTFEO0FBQ0QsQ0FGRDtBQUdBVCxRQUFRd0MsWUFBUixHQUF1QixVQUFTaEMsU0FBVCxFQUFvQndCLGFBQXBCLEVBQW1DYixJQUFuQyxFQUF5Q1YsUUFBekMsRUFBbUQ7QUFDeEVzQixtQkFBaUIsS0FBakIsRUFBd0J2QixTQUF4QixFQUFtQ3dCLGFBQW5DLEVBQWtEYixJQUFsRCxFQUF3RFYsUUFBeEQ7QUFDRCxDQUZEO0FBR0FULFFBQVF5QyxrQkFBUixHQUE2QixVQUMzQmpDLFNBRDJCLEVBRTNCd0IsYUFGMkIsRUFHM0JiLElBSDJCLEVBSTNCVixRQUoyQixFQUszQjtBQUNBc0IsbUJBQWlCLFdBQWpCLEVBQThCdkIsU0FBOUIsRUFBeUN3QixhQUF6QyxFQUF3RGIsSUFBeEQsRUFBOERWLFFBQTlEO0FBQ0QsQ0FQRDs7QUFTQSxTQUFTWSxLQUFULENBQWVxQixDQUFmLEVBQWtCO0FBQ2hCLFNBQU9KLEtBQUtLLEtBQUwsQ0FBV0wsS0FBS2hCLFNBQUwsQ0FBZW9CLENBQWYsQ0FBWCxDQUFQO0FBQ0Q7O0FBRUQsU0FBU0UsV0FBVCxDQUFxQkMsTUFBckIsRUFBNkI7QUFDM0IsU0FBTyxFQUFFdkYsTUFBTXVGLE1BQVIsRUFBUDtBQUNEOztBQUVELFNBQVNuQixXQUFULENBQXFCb0IsUUFBckIsRUFBK0JDLE1BQS9CLEVBQXVDdEMsUUFBdkMsRUFBaUQ7QUFDL0NxQyxXQUFTeEYsSUFBVCxHQUNFd0YsU0FBU3hGLElBQVQsSUFDQ3dGLFNBQVN4RixJQUFULENBQWMwRixPQUFkLENBQXNCLEdBQXRCLElBQTZCLENBQTdCLEdBQWlDLEdBQWpDLEdBQXVDLEdBRHhDLElBRUE5RixZQUFZb0UsU0FBWixDQUFzQm5ELEVBQXRCLENBSEY7QUFJQUcsV0FBUzJFLFVBQVQsQ0FBb0JDLE9BQXBCLENBQTRCSixRQUE1QixFQUFzQ0MsTUFBdEMsRUFBOEN0QyxRQUE5QztBQUNEOztBQUVEVCxRQUFRbUQsWUFBUixHQUF1QixVQUFTMUMsUUFBVCxFQUFtQjtBQUN4QyxNQUFJMkMsa0JBQWtCUixZQUFZLHNCQUFaLENBQXRCO0FBQ0FsQixjQUFZMEIsZUFBWixFQUE2QjNDLFFBQTdCO0FBQ0QsQ0FIRDs7QUFLQVQsUUFBUXFELFVBQVIsR0FBcUIsVUFBU2pELE9BQVQsRUFBa0JLLFFBQWxCLEVBQTRCO0FBQy9DLE1BQUk2QyxrQkFBa0JWLFlBQVksa0JBQVosQ0FBdEI7QUFDQSxNQUFJLE9BQU94QyxPQUFQLEtBQW1CLFVBQXZCLEVBQW1DO0FBQ2pDSyxlQUFXTCxPQUFYO0FBQ0QsR0FGRCxNQUVPLElBQUksUUFBT0EsT0FBUCx5Q0FBT0EsT0FBUCxPQUFtQixRQUF2QixFQUFpQztBQUN0Q2tELG9CQUFnQmhHLElBQWhCLEdBQXVCZ0csZ0JBQWdCaEcsSUFBaEIsR0FBdUIsR0FBOUM7QUFDQSxTQUFLLElBQUkrRSxHQUFULElBQWdCakMsT0FBaEIsRUFBeUI7QUFDdkJrRCxzQkFBZ0JoRyxJQUFoQixHQUNFZ0csZ0JBQWdCaEcsSUFBaEIsR0FBdUIrRSxHQUF2QixHQUE2QixHQUE3QixHQUFtQ2pDLFFBQVFpQyxHQUFSLENBQW5DLEdBQWtELEdBRHBEO0FBRUQ7QUFDRixHQU5NLE1BTUE7QUFDTDNCLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZXVCLGtCQUF6QixDQUFwQjtBQUNBO0FBQ0Q7QUFDRDRCLGNBQVk0QixlQUFaLEVBQTZCN0MsUUFBN0I7QUFDRCxDQWZEOztBQWlCQVQsUUFBUXVELGFBQVIsR0FBd0IsVUFBU0MsV0FBVCxFQUFzQkMsT0FBdEIsRUFBK0JoRCxRQUEvQixFQUF5QztBQUMvRCxNQUFJLENBQUMrQyxXQUFELElBQWdCQSxZQUFZRSxNQUFaLEtBQXVCLENBQTNDLEVBQThDO0FBQzVDaEQsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlSyxXQUF6QixDQUFwQjtBQUNELEdBRkQsTUFFTztBQUNMLFFBQUkrRSxpQkFBaUJmLFlBQVksZ0JBQVosQ0FBckI7QUFDQWUsbUJBQWVyRyxJQUFmLElBQXVCLGNBQWNrRyxXQUFyQztBQUNBLFFBQUksT0FBT0MsT0FBUCxLQUFtQixVQUF2QixFQUFtQztBQUNqQ2hELGlCQUFXZ0QsT0FBWDtBQUNELEtBRkQsTUFFTyxJQUFJLFFBQU9BLE9BQVAseUNBQU9BLE9BQVAsT0FBbUIsUUFBdkIsRUFBaUM7QUFDdENFLHFCQUFlckcsSUFBZixHQUFzQnFHLGVBQWVyRyxJQUFmLEdBQXNCLEdBQTVDO0FBQ0EsV0FBSyxJQUFJc0csR0FBVCxJQUFnQkgsT0FBaEIsRUFBeUI7QUFDdkJFLHVCQUFlckcsSUFBZixHQUNFcUcsZUFBZXJHLElBQWYsR0FBc0JzRyxHQUF0QixHQUE0QixHQUE1QixHQUFrQ0gsUUFBUUcsR0FBUixDQUFsQyxHQUFpRCxHQURuRDtBQUVEO0FBQ0YsS0FOTSxNQU1BO0FBQ0xELHFCQUFlckcsSUFBZixHQUFzQnFHLGVBQWVyRyxJQUFmLEdBQXNCLFdBQXRCLEdBQW9DbUcsT0FBMUQ7QUFDRDtBQUNEL0IsZ0JBQVlpQyxjQUFaLEVBQTRCbEQsUUFBNUI7QUFDRDtBQUNGLENBbkJEOztBQXFCQVQsUUFBUTZELFNBQVIsR0FBb0IsVUFBU0wsV0FBVCxFQUFzQjNFLE1BQXRCLEVBQThCNEIsUUFBOUIsRUFBd0M7QUFDMUQsTUFBSSxDQUFDK0MsV0FBRCxJQUFnQkEsWUFBWUUsTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUM1Q2hELGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZUssV0FBekIsQ0FBcEI7QUFDRCxHQUZELE1BRU8sSUFBSSxDQUFDQyxNQUFMLEVBQWE7QUFDbEI2QixjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVNLE1BQXpCLENBQXBCO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsUUFBSWlGLGNBQWNsQixZQUFZLGFBQVosQ0FBbEI7QUFDQWtCLGdCQUFZeEcsSUFBWixJQUFvQixjQUFja0csV0FBZCxHQUE0QixVQUE1QixHQUF5QzNFLE1BQTdEO0FBQ0E2QyxnQkFBWW9DLFdBQVosRUFBeUIsTUFBekIsRUFBaUNyRCxRQUFqQztBQUNEO0FBQ0YsQ0FWRDs7QUFZQVQsUUFBUStELFlBQVIsR0FBdUIsVUFBU1AsV0FBVCxFQUFzQjNFLE1BQXRCLEVBQThCNEIsUUFBOUIsRUFBd0M7QUFDN0QsTUFBSSxDQUFDK0MsV0FBRCxJQUFnQkEsWUFBWUUsTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUM1Q2hELGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZUssV0FBekIsQ0FBcEI7QUFDRCxHQUZELE1BRU8sSUFBSSxDQUFDQyxNQUFMLEVBQWE7QUFDbEI2QixjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVNLE1BQXpCLENBQXBCO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsUUFBSW1GLGlCQUFpQnBCLFlBQVksZ0JBQVosQ0FBckI7QUFDQW9CLG1CQUFlMUcsSUFBZixJQUF1QixjQUFja0csV0FBZCxHQUE0QixVQUE1QixHQUF5QzNFLE1BQWhFO0FBQ0E2QyxnQkFBWXNDLGNBQVosRUFBNEIsTUFBNUIsRUFBb0N2RCxRQUFwQztBQUNEO0FBQ0YsQ0FWRDs7QUFZQVQsUUFBUStELFlBQVIsR0FBdUIsVUFBU1AsV0FBVCxFQUFzQjNFLE1BQXRCLEVBQThCNEIsUUFBOUIsRUFBd0M7QUFDN0QsTUFBSSxDQUFDK0MsV0FBRCxJQUFnQkEsWUFBWUUsTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUM1Q2hELGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZUssV0FBekIsQ0FBcEI7QUFDRCxHQUZELE1BRU8sSUFBSSxDQUFDQyxNQUFMLEVBQWE7QUFDbEI2QixjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVNLE1BQXpCLENBQXBCO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsUUFBSW1GLGlCQUFpQnBCLFlBQVksZ0JBQVosQ0FBckI7QUFDQW9CLG1CQUFlMUcsSUFBZixJQUF1QixjQUFja0csV0FBZCxHQUE0QixVQUE1QixHQUF5QzNFLE1BQWhFO0FBQ0E2QyxnQkFBWXNDLGNBQVosRUFBNEIsTUFBNUIsRUFBb0N2RCxRQUFwQztBQUNEO0FBQ0YsQ0FWRDs7QUFZQVQsUUFBUWlFLFlBQVIsR0FBdUIsVUFBU1QsV0FBVCxFQUFzQjNFLE1BQXRCLEVBQThCcUYsTUFBOUIsRUFBc0N6RCxRQUF0QyxFQUFnRDtBQUNyRSxNQUFJLENBQUMrQyxXQUFELElBQWdCQSxZQUFZRSxNQUFaLEtBQXVCLENBQTNDLEVBQThDO0FBQzVDaEQsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlSyxXQUF6QixDQUFwQjtBQUNELEdBRkQsTUFFTyxJQUFJLENBQUNDLE1BQUwsRUFBYTtBQUNsQjZCLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZU0sTUFBekIsQ0FBcEI7QUFDRCxHQUZNLE1BRUE7QUFDTCxRQUFJc0YsaUJBQWlCdkIsWUFBWSxnQkFBWixDQUFyQjtBQUNBdUIsbUJBQWU3RyxJQUFmLElBQXVCLGNBQWNrRyxXQUFkLEdBQTRCLFVBQTVCLEdBQXlDM0UsTUFBaEU7QUFDQXNGLG1CQUFlN0csSUFBZixHQUFzQjZHLGVBQWU3RyxJQUFmLEdBQXNCLEdBQTVDO0FBQ0EsU0FBSyxJQUFJc0csR0FBVCxJQUFnQk0sTUFBaEIsRUFBd0I7QUFDdEJDLHFCQUFlN0csSUFBZixHQUNFNkcsZUFBZTdHLElBQWYsR0FBc0JzRyxHQUF0QixHQUE0QixHQUE1QixHQUFrQ1EsbUJBQW1CRixPQUFPTixHQUFQLENBQW5CLENBQWxDLEdBQW9FLEdBRHRFO0FBRUQ7QUFDRGxDLGdCQUFZeUMsY0FBWixFQUE0QixNQUE1QixFQUFvQzFELFFBQXBDO0FBQ0Q7QUFDRixDQWZEOztBQWlCQVQsUUFBUXFFLGNBQVIsR0FBeUIsVUFBU0MsU0FBVCxFQUFvQjdELFFBQXBCLEVBQThCO0FBQ3JELE1BQUk4RCxtQkFBbUIzQixZQUFZLG1CQUFaLENBQXZCO0FBQ0EyQixtQkFBaUJqSCxJQUFqQixJQUF5QixnQkFBZ0I4RyxtQkFBbUJFLFNBQW5CLENBQXpDO0FBQ0E1QyxjQUFZNkMsZ0JBQVosRUFBOEIsTUFBOUIsRUFBc0M5RCxRQUF0QztBQUNELENBSkQ7O0FBTUFULFFBQVF3RSxtQkFBUixHQUE4QixVQUFTQyxNQUFULEVBQWlCaEUsUUFBakIsRUFBMkI7QUFDdkQsTUFBSThELG1CQUFtQjNCLFlBQVksbUJBQVosQ0FBdkI7QUFDQTJCLG1CQUFpQmpILElBQWpCLElBQXlCLG9CQUFvQjhHLG1CQUFtQkssTUFBbkIsQ0FBN0M7QUFDQS9DLGNBQVk2QyxnQkFBWixFQUE4QixNQUE5QixFQUFzQzlELFFBQXRDO0FBQ0QsQ0FKRDs7QUFNQVQsUUFBUTBFLG1CQUFSLEdBQThCLFVBQVNELE1BQVQsRUFBaUJoRSxRQUFqQixFQUEyQjtBQUN2RCxNQUFJOEQsbUJBQW1CM0IsWUFBWSxtQkFBWixDQUF2QjtBQUNBMkIsbUJBQWlCakgsSUFBakIsSUFBeUIsb0JBQW9COEcsbUJBQW1CSyxNQUFuQixDQUE3QztBQUNBL0MsY0FBWTZDLGdCQUFaLEVBQThCLE1BQTlCLEVBQXNDOUQsUUFBdEM7QUFDRCxDQUpEOztBQU1BVCxRQUFRMkUsWUFBUixHQUF1QixVQUFTQyxXQUFULEVBQXNCbkUsUUFBdEIsRUFBZ0M7QUFDckQsTUFBSSxDQUFDbUUsWUFBWUMsTUFBYixJQUF1QixDQUFDRCxZQUFZRSxLQUF4QyxFQUErQztBQUM3Q3BFLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZWdCLGdCQUF6QixDQUFwQjtBQUNELEdBRkQsTUFFTztBQUNMLFFBQUl3RixZQUFZMUQsTUFBTTFELGNBQU4sQ0FBaEI7QUFDQW9ILGNBQVV6SCxJQUFWLElBQWtCLE1BQU1KLFlBQVlvRSxTQUFaLENBQXNCc0QsV0FBdEIsQ0FBeEI7QUFDQWxELGdCQUFZcUQsU0FBWixFQUF1QnRFLFFBQXZCO0FBQ0Q7QUFDRixDQVJEOztBQVVBVCxRQUFRZ0Ysa0JBQVIsR0FBNkIsVUFBU0osV0FBVCxFQUFzQm5FLFFBQXRCLEVBQWdDO0FBQzNELE1BQUksQ0FBQ21FLFlBQVlLLFVBQWIsSUFBMkIsQ0FBQ0wsWUFBWU0sSUFBNUMsRUFBa0Q7QUFDaER4RSxjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVpQixxQkFBekIsQ0FBcEI7QUFDRCxHQUZELE1BRU87QUFDTCxRQUFJdUYsWUFBWTFELE1BQU16RCxtQkFBTixDQUFoQjtBQUNBbUgsY0FBVXpILElBQVYsSUFBa0IsTUFBTUosWUFBWW9FLFNBQVosQ0FBc0JzRCxXQUF0QixDQUF4QjtBQUNBbEQsZ0JBQVlxRCxTQUFaLEVBQXVCdEUsUUFBdkI7QUFDRDtBQUNGLENBUkQ7O0FBVUFULFFBQVFtRixvQkFBUixHQUErQixVQUFTUCxXQUFULEVBQXNCbkUsUUFBdEIsRUFBZ0M7QUFDN0QsTUFBSSxDQUFDbUUsWUFBWUssVUFBYixJQUEyQixDQUFDTCxZQUFZUSxHQUE1QyxFQUFpRDtBQUMvQzFFLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZWtCLHVCQUF6QixDQUFwQjtBQUNELEdBRkQsTUFFTztBQUNMLFFBQUlzRixZQUFZMUQsTUFBTXhELHFCQUFOLENBQWhCO0FBQ0FrSCxjQUFVekgsSUFBVixJQUFrQixNQUFNSixZQUFZb0UsU0FBWixDQUFzQnNELFdBQXRCLENBQXhCO0FBQ0FsRCxnQkFBWXFELFNBQVosRUFBdUJ0RSxRQUF2QjtBQUNEO0FBQ0YsQ0FSRDs7QUFVQVQsUUFBUXFGLG1CQUFSLEdBQThCLFVBQVNDLFVBQVQsRUFBcUI3RSxRQUFyQixFQUErQjtBQUMzRCxNQUFJOEUsaUJBQWlCLEVBQXJCO0FBQ0EsTUFBSSxDQUFDRCxVQUFMLEVBQWlCO0FBQ2Y1RSxjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVtQixzQkFBekIsQ0FBcEI7QUFDRCxHQUZELE1BRU87QUFDTCxRQUFJOEYsTUFBTUMsT0FBTixDQUFjSCxVQUFkLENBQUosRUFBK0I7QUFDN0IsVUFBSUEsV0FBVzVCLE1BQVgsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDM0I2Qix1QkFBZU4sVUFBZixHQUE0QkssVUFBNUI7QUFDRCxPQUZELE1BRU87QUFDTEMsdUJBQWVHLFdBQWYsR0FBNkJKLFVBQTdCO0FBQ0Q7QUFDRixLQU5ELE1BTU87QUFDTEMscUJBQWVOLFVBQWYsR0FBNEJLLFVBQTVCO0FBQ0Q7QUFDRCxRQUFJUCxZQUFZMUQsTUFBTXZELG9CQUFOLENBQWhCO0FBQ0FpSCxjQUFVekgsSUFBVixJQUFrQixNQUFNSixZQUFZb0UsU0FBWixDQUFzQmlFLGNBQXRCLENBQXhCO0FBQ0E3RCxnQkFBWXFELFNBQVosRUFBdUJ0RSxRQUF2QjtBQUNEO0FBQ0YsQ0FsQkQ7O0FBb0JBVCxRQUFRMkYsYUFBUixHQUF3QixVQUFTZixXQUFULEVBQXNCbkUsUUFBdEIsRUFBZ0M7QUFDdERtRixxQkFBbUJoQixXQUFuQixFQUFnQ25FLFFBQWhDO0FBQ0QsQ0FGRDs7QUFJQVQsUUFBUTZGLGtCQUFSLEdBQTZCLFVBQVNqQixXQUFULEVBQXNCbkUsUUFBdEIsRUFBZ0M7QUFDM0RxRixzQkFBb0I5SCxlQUFwQixFQUFxQzRHLFdBQXJDLEVBQWtEbkUsUUFBbEQ7QUFDRCxDQUZEOztBQUlBVCxRQUFRK0YscUJBQVIsR0FBZ0MsVUFBU25CLFdBQVQsRUFBc0JuRSxRQUF0QixFQUFnQztBQUM5RHFGLHNCQUFvQjdILGtCQUFwQixFQUF3QzJHLFdBQXhDLEVBQXFEbkUsUUFBckQ7QUFDRCxDQUZEOztBQUlBVCxRQUFRZ0cscUJBQVIsR0FBZ0MsVUFBU3BCLFdBQVQsRUFBc0JuRSxRQUF0QixFQUFnQztBQUM5RHFGLHNCQUFvQjVILGtCQUFwQixFQUF3QzBHLFdBQXhDLEVBQXFEbkUsUUFBckQ7QUFDRCxDQUZEOztBQUlBVCxRQUFRaUcsMEJBQVIsR0FBcUMsVUFBU3JCLFdBQVQsRUFBc0JuRSxRQUF0QixFQUFnQztBQUNuRW1GLHFCQUFtQmhCLFdBQW5CLEVBQWdDbkUsUUFBaEM7QUFDRCxDQUZEOztBQUlBLFNBQVNtRixrQkFBVCxDQUE0QmhCLFdBQTVCLEVBQXlDbkUsUUFBekMsRUFBbUQ7QUFDakQsTUFBSSxDQUFDbUUsWUFBWUMsTUFBYixJQUF1QixDQUFDRCxZQUFZbkUsUUFBeEMsRUFBa0Q7QUFDaERDLGNBQ0VELFFBREYsRUFFRSxJQUFJRSxLQUFKLENBQVVwQyxlQUFlb0IsK0JBQXpCLENBRkY7QUFJRCxHQUxELE1BS087QUFDTCxRQUFJdUcsWUFBWTdFLE1BQU10RCxVQUFOLENBQWhCO0FBQ0FtSSxjQUFVNUksSUFBVixJQUFrQixNQUFNSixZQUFZb0UsU0FBWixDQUFzQnNELFdBQXRCLENBQXhCO0FBQ0FsRCxnQkFBWXdFLFNBQVosRUFBdUJ6RixRQUF2QjtBQUNEO0FBQ0Y7O0FBRUQsU0FBU3FGLG1CQUFULENBQTZCaEQsUUFBN0IsRUFBdUM4QixXQUF2QyxFQUFvRG5FLFFBQXBELEVBQThEO0FBQzVELE1BQUkwRixlQUFldkIsV0FBZixFQUE0Qm5FLFFBQTVCLENBQUosRUFBMkM7QUFDekMsUUFBSTJGLFFBQUo7QUFDQSxRQUFJLFFBQU94QixXQUFQLHlDQUFPQSxXQUFQLE9BQXVCLFFBQTNCLEVBQXFDO0FBQ25Dd0IsaUJBQVcsRUFBRXZCLFFBQVFELFdBQVYsRUFBWDtBQUNELEtBRkQsTUFFTztBQUNMd0IsaUJBQVd4QixXQUFYO0FBQ0Q7QUFDRCxRQUFJc0IsWUFBWTdFLE1BQU15QixRQUFOLENBQWhCO0FBQ0FvRCxjQUFVNUksSUFBVixJQUFrQixNQUFNSixZQUFZb0UsU0FBWixDQUFzQjhFLFFBQXRCLENBQXhCO0FBQ0ExRSxnQkFBWXdFLFNBQVosRUFBdUJ6RixRQUF2QjtBQUNEO0FBQ0Y7QUFDRCxTQUFTMEYsY0FBVCxDQUF3QnZCLFdBQXhCLEVBQXFDbkUsUUFBckMsRUFBK0M7QUFDN0MsTUFBSSxRQUFPbUUsV0FBUCx5Q0FBT0EsV0FBUCxPQUF1QixRQUF2QixJQUFtQyxDQUFDQSxZQUFZQyxNQUFwRCxFQUE0RDtBQUMxRG5FLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZXFCLHVCQUF6QixDQUFwQjtBQUNBLFdBQU8sS0FBUDtBQUNELEdBSEQsTUFHTyxJQUNMLFFBQU9nRixXQUFQLHlDQUFPQSxXQUFQLE9BQXVCLFFBQXZCLElBQ0EsQ0FBQ3hHLGNBQWNpSSxJQUFkLENBQW1CekIsWUFBWUMsTUFBL0IsQ0FGSSxFQUdMO0FBQ0FuRSxjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVzQiwyQkFBekIsQ0FBcEI7QUFDQSxXQUFPLEtBQVA7QUFDRCxHQU5NLE1BTUEsSUFDTCxRQUFPK0UsV0FBUCx5Q0FBT0EsV0FBUCxPQUF1QixRQUF2QixLQUNDLENBQUNBLFdBQUQsSUFBZ0IsQ0FBQ3hHLGNBQWNpSSxJQUFkLENBQW1CekIsV0FBbkIsQ0FEbEIsQ0FESyxFQUdMO0FBQ0FsRSxjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVzQiwyQkFBekIsQ0FBcEI7QUFDQSxXQUFPLEtBQVA7QUFDRDtBQUNELFNBQU8sSUFBUDtBQUNEOztBQUVELFNBQVN5RyxnQkFBVCxDQUEwQkMsYUFBMUIsRUFBeUNuRixJQUF6QyxFQUErQ1gsUUFBL0MsRUFBeUQ7QUFDdkQsTUFBSSxDQUFDVyxLQUFLM0MsRUFBVixFQUFjO0FBQ1ppQyxjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVFLEVBQXpCLENBQXBCO0FBQ0QsR0FGRCxNQUVPO0FBQ0wsUUFBSXFFLFdBQVd6QixNQUFNa0YsYUFBTixDQUFmO0FBQ0F6RCxhQUFTeEYsSUFBVCxJQUFpQixNQUFNSixZQUFZb0UsU0FBWixDQUFzQkYsSUFBdEIsQ0FBdkI7QUFDQTlDLGFBQVNpRCxNQUFULENBQWdCQyxJQUFoQixDQUNFLDRCQUE0QkosS0FBSzNDLEVBQWpDLEdBQXNDLGdCQUF0QyxHQUF5RDJDLEtBQUtLLElBRGhFO0FBR0FDLGdCQUFZb0IsUUFBWixFQUFzQixNQUF0QixFQUE4QixVQUFTbkIsR0FBVCxFQUFjQyxXQUFkLEVBQTJCO0FBQ3ZELFVBQUksQ0FBQ0QsR0FBRCxJQUFRQyxZQUFZQyxNQUFwQixJQUE4QkQsWUFBWUMsTUFBWixHQUFxQixDQUF2RCxFQUEwRDtBQUN4RG5CLGtCQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVWlCLFlBQVksWUFBWixDQUFWLENBQXBCLEVBQTBEQSxXQUExRDtBQUNELE9BRkQsTUFFTztBQUNMLFlBQUluQixRQUFKLEVBQWNBLFNBQVNrQixHQUFULEVBQWNDLFdBQWQ7QUFDZjtBQUNGLEtBTkQ7QUFPRDtBQUNGOztBQUVENUIsUUFBUXdHLGNBQVIsR0FBeUIsVUFBU2hHLFNBQVQsRUFBb0JVLE9BQXBCLEVBQTZCQyxJQUE3QixFQUFtQ1YsUUFBbkMsRUFBNkM7QUFDcEUsTUFBSSxDQUFDUyxPQUFMLEVBQWM7QUFDWlIsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlRyxHQUF6QixDQUFwQjtBQUNELEdBRkQsTUFFTztBQUNMLFFBQUksQ0FBQ3lDLElBQUwsRUFBVztBQUNUQSxhQUFPLEVBQVA7QUFDRDtBQUNEQSxTQUFLLElBQUwsSUFBYVgsU0FBYjtBQUNBVyxTQUFLLE1BQUwsSUFBZUQsT0FBZjtBQUNBb0YscUJBQWlCOUksV0FBakIsRUFBOEIyRCxJQUE5QixFQUFvQ1YsUUFBcEM7QUFDRDtBQUNGLENBWEQ7O0FBYUFULFFBQVF5Ryx3QkFBUixHQUFtQyxVQUNqQ2pHLFNBRGlDLEVBRWpDVSxPQUZpQyxFQUdqQ2hDLFNBSGlDLEVBSWpDQyxPQUppQyxFQUtqQ2dDLElBTGlDLEVBTWpDVixRQU5pQyxFQU9qQztBQUNBLE1BQUksQ0FBQ1MsT0FBTCxFQUFjO0FBQ1pSLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZUcsR0FBekIsQ0FBcEI7QUFDRCxHQUZELE1BRU8sSUFBSSxDQUFDUSxTQUFELElBQWN3SCxNQUFNeEgsU0FBTixDQUFkLElBQWtDQSxVQUFVd0UsTUFBVixHQUFtQixFQUF6RCxFQUE2RDtBQUNsRWhELGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZVcsU0FBekIsQ0FBcEI7QUFDRCxHQUZNLE1BRUEsSUFBSSxDQUFDQyxPQUFMLEVBQWM7QUFDbkJ1QixjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVZLE9BQXpCLENBQXBCO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsUUFBSSxDQUFDZ0MsSUFBTCxFQUFXO0FBQ1RBLGFBQU8sRUFBUDtBQUNEO0FBQ0RBLFNBQUssSUFBTCxJQUFhWCxTQUFiO0FBQ0FXLFNBQUssTUFBTCxJQUFlRCxPQUFmO0FBQ0FDLFNBQUssWUFBTCxJQUFxQmpDLFNBQXJCO0FBQ0FpQyxTQUFLLFVBQUwsSUFBbUJoQyxPQUFuQjtBQUNBbUgscUJBQWlCN0ksaUJBQWpCLEVBQW9DMEQsSUFBcEMsRUFBMENWLFFBQTFDO0FBQ0Q7QUFDRixDQXhCRDs7QUEwQkFULFFBQVEyRyx3QkFBUixHQUFtQyxVQUNqQ25HLFNBRGlDLEVBRWpDVSxPQUZpQyxFQUdqQ2hDLFNBSGlDLEVBSWpDRSxPQUppQyxFQUtqQ0QsT0FMaUMsRUFNakNFLFVBTmlDLEVBT2pDOEIsSUFQaUMsRUFRakNWLFFBUmlDLEVBU2pDO0FBQ0EsTUFBSSxDQUFDUyxPQUFMLEVBQWM7QUFDWlIsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlRyxHQUF6QixDQUFwQjtBQUNELEdBRkQsTUFFTyxJQUFJLENBQUNRLFNBQUQsSUFBY3dILE1BQU14SCxTQUFOLENBQWQsSUFBa0NBLFVBQVV3RSxNQUFWLEdBQW1CLEVBQXpELEVBQTZEO0FBQ2xFaEQsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlVyxTQUF6QixDQUFwQjtBQUNELEdBRk0sTUFFQSxJQUFJLENBQUNFLE9BQUQsSUFBWUEsUUFBUXNFLE1BQVIsS0FBbUJ4RSxTQUFuQyxFQUE4QztBQUNuRHdCLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZWEsT0FBekIsQ0FBcEI7QUFDRCxHQUZNLE1BRUEsSUFBSSxDQUFDRCxPQUFMLEVBQWM7QUFDbkJ1QixjQUFVRCxRQUFWLEVBQW9CLElBQUlFLEtBQUosQ0FBVXBDLGVBQWVZLE9BQXpCLENBQXBCO0FBQ0QsR0FGTSxNQUVBLElBQUksQ0FBQ0UsVUFBTCxFQUFpQjtBQUN0QnFCLGNBQVVELFFBQVYsRUFBb0IsSUFBSUUsS0FBSixDQUFVcEMsZUFBZWMsVUFBekIsQ0FBcEI7QUFDRCxHQUZNLE1BRUE7QUFDTCxRQUFJLENBQUM4QixJQUFMLEVBQVc7QUFDVEEsYUFBTyxFQUFQO0FBQ0Q7QUFDREEsU0FBSyxJQUFMLElBQWFYLFNBQWI7QUFDQVcsU0FBSyxNQUFMLElBQWVELE9BQWY7QUFDQUMsU0FBSyxZQUFMLElBQXFCakMsU0FBckI7QUFDQWlDLFNBQUssVUFBTCxJQUFtQi9CLE9BQW5CO0FBQ0ErQixTQUFLLFVBQUwsSUFBbUJoQyxPQUFuQjtBQUNBZ0MsU0FBSyxhQUFMLElBQXNCOUIsVUFBdEI7QUFDQWlILHFCQUFpQjdJLGlCQUFqQixFQUFvQzBELElBQXBDLEVBQTBDVixRQUExQztBQUNEO0FBQ0YsQ0FoQ0Q7O0FBa0NBVCxRQUFRNEcsSUFBUixHQUFlLFVBQVNwRyxTQUFULEVBQW9CbEIsU0FBcEIsRUFBK0I2QixJQUEvQixFQUFxQ1YsUUFBckMsRUFBK0M7QUFDNUQsTUFBSSxDQUFDbkIsU0FBTCxFQUFnQjtBQUNkb0IsY0FBVUQsUUFBVixFQUFvQixJQUFJRSxLQUFKLENBQVVwQyxlQUFlZSxTQUF6QixDQUFwQjtBQUNELEdBRkQsTUFFTztBQUNMLFFBQUksQ0FBQzZCLElBQUwsRUFBVztBQUNUQSxhQUFPLEVBQVA7QUFDRDtBQUNEQSxTQUFLLElBQUwsSUFBYVgsU0FBYjtBQUNBVyxTQUFLLFlBQUwsSUFBcUI3QixTQUFyQjtBQUNBZ0gscUJBQWlCNUksWUFBakIsRUFBK0J5RCxJQUEvQixFQUFxQ1YsUUFBckM7QUFDRDtBQUNGLENBWEQ7O0FBYUEsU0FBU0MsU0FBVCxDQUFtQkQsUUFBbkIsRUFBNkJrQixHQUE3QixFQUFrQ2tGLFVBQWxDLEVBQThDO0FBQzVDO0FBQ0EsTUFBSXBHLFFBQUosRUFBYztBQUNaQSxhQUFTa0IsR0FBVCxFQUFja0YsVUFBZDtBQUNELEdBRkQsTUFFTztBQUNMLFVBQU1sRixHQUFOO0FBQ0Q7QUFDRjs7QUFFRDNCLFFBQVE4RyxPQUFSLEdBQWtCLFVBQVNDLEtBQVQsRUFBZ0I7QUFDaEMzSixVQUFRQyxJQUFSLEdBQWUwSixLQUFmO0FBQ0F4SixnQkFBY0YsSUFBZCxHQUFxQjBKLEtBQXJCO0FBQ0F2SixjQUFZSCxJQUFaLEdBQW1CMEosS0FBbkI7QUFDQXRKLG9CQUFrQkosSUFBbEIsR0FBeUIwSixLQUF6QjtBQUNBckosZUFBYUwsSUFBYixHQUFvQjBKLEtBQXBCO0FBQ0FwSixpQkFBZU4sSUFBZixHQUFzQjBKLEtBQXRCO0FBQ0FuSixzQkFBb0JQLElBQXBCLEdBQTJCMEosS0FBM0I7QUFDQWxKLHdCQUFzQlIsSUFBdEIsR0FBNkIwSixLQUE3QjtBQUNBakosdUJBQXFCVCxJQUFyQixHQUE0QjBKLEtBQTVCO0FBQ0FoSixhQUFXVixJQUFYLEdBQWtCMEosS0FBbEI7QUFDQS9JLGtCQUFnQlgsSUFBaEIsR0FBdUIwSixLQUF2QjtBQUNBOUkscUJBQW1CWixJQUFuQixHQUEwQjBKLEtBQTFCO0FBQ0QsQ0FiRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuXG52YXIgcXVlcnlzdHJpbmcgPSByZXF1aXJlKFwicXVlcnlzdHJpbmdcIik7XG5cbnZhciBtc2dwYXRoID0geyBob3N0OiBcInJlc3QubmV4bW8uY29tXCIsIHBhdGg6IFwiL3Ntcy9qc29uXCIgfTtcbnZhciBzaG9ydGNvZGVQYXRoID0geyBob3N0OiBcInJlc3QubmV4bW8uY29tXCIsIHBhdGg6IFwiL3NjL3VzLyR7dHlwZX0vanNvblwiIH07XG52YXIgdHRzRW5kcG9pbnQgPSB7IGhvc3Q6IFwiYXBpLm5leG1vLmNvbVwiLCBwYXRoOiBcIi90dHMvanNvblwiIH07XG52YXIgdHRzUHJvbXB0RW5kcG9pbnQgPSB7IGhvc3Q6IFwiYXBpLm5leG1vLmNvbVwiLCBwYXRoOiBcIi90dHMtcHJvbXB0L2pzb25cIiB9O1xudmFyIGNhbGxFbmRwb2ludCA9IHsgaG9zdDogXCJyZXN0Lm5leG1vLmNvbVwiLCBwYXRoOiBcIi9jYWxsL2pzb25cIiB9O1xudmFyIHZlcmlmeUVuZHBvaW50ID0geyBob3N0OiBcImFwaS5uZXhtby5jb21cIiwgcGF0aDogXCIvdmVyaWZ5L2pzb25cIiB9O1xudmFyIGNoZWNrVmVyaWZ5RW5kcG9pbnQgPSB7IGhvc3Q6IFwiYXBpLm5leG1vLmNvbVwiLCBwYXRoOiBcIi92ZXJpZnkvY2hlY2svanNvblwiIH07XG52YXIgY29udHJvbFZlcmlmeUVuZHBvaW50ID0ge1xuICBob3N0OiBcImFwaS5uZXhtby5jb21cIixcbiAgcGF0aDogXCIvdmVyaWZ5L2NvbnRyb2wvanNvblwiXG59O1xudmFyIHNlYXJjaFZlcmlmeUVuZHBvaW50ID0ge1xuICBob3N0OiBcImFwaS5uZXhtby5jb21cIixcbiAgcGF0aDogXCIvdmVyaWZ5L3NlYXJjaC9qc29uXCJcbn07XG52YXIgbmlFbmRwb2ludCA9IHsgaG9zdDogXCJhcGkubmV4bW8uY29tXCIsIHBhdGg6IFwiL25pL2FkdmFuY2VkL2FzeW5jL2pzb25cIiB9O1xudmFyIG5pQmFzaWNFbmRwb2ludCA9IHsgaG9zdDogXCJhcGkubmV4bW8uY29tXCIsIHBhdGg6IFwiL25pL2Jhc2ljL2pzb25cIiB9O1xudmFyIG5pU3RhbmRhcmRFbmRwb2ludCA9IHsgaG9zdDogXCJhcGkubmV4bW8uY29tXCIsIHBhdGg6IFwiL25pL3N0YW5kYXJkL2pzb25cIiB9O1xudmFyIG5pQWR2YW5jZWRFbmRwb2ludCA9IHsgaG9zdDogXCJhcGkubmV4bW8uY29tXCIsIHBhdGg6IFwiL25pL2FkdmFuY2VkL2pzb25cIiB9O1xudmFyIHVwID0ge307XG52YXIgbnVtYmVyUGF0dGVybiA9IG5ldyBSZWdFeHAoXCJeWzAtOSArKCktXSokXCIpO1xuXG52YXIgX29wdGlvbnMgPSBudWxsO1xuXG4vLyBFcnJvciBtZXNzYWdlIHJlc291cmNlcyBhcmUgbWFpbnRhaW5lZCBnbG9iYWxseSBpbiBvbmUgcGxhY2UgZm9yIGVhc3kgbWFuYWdlbWVudFxudmFyIEVSUk9SX01FU1NBR0VTID0ge1xuICBzZW5kZXI6IFwiSW52YWxpZCBmcm9tIGFkZHJlc3NcIixcbiAgdG86IFwiSW52YWxpZCB0byBhZGRyZXNzXCIsXG4gIG1zZzogXCJJbnZhbGlkIFRleHQgTWVzc2FnZVwiLFxuICBtc2dQYXJhbXM6IFwiSW52YWxpZCBzaG9ydGNvZGUgbWVzc2FnZSBwYXJhbWV0ZXJzXCIsXG4gIGNvdW50cnljb2RlOiBcIkludmFsaWQgQ291bnRyeSBDb2RlXCIsXG4gIG1zaXNkbjogXCJJbnZhbGlkIE1TSVNETiBwYXNzZWRcIixcbiAgYm9keTogXCJJbnZhbGlkIEJvZHkgdmFsdWUgaW4gQmluYXJ5IE1lc3NhZ2VcIixcbiAgdWRoOiBcIkludmFsaWQgdWRoIHZhbHVlIGluIEJpbmFyeSBNZXNzYWdlXCIsXG4gIHRpdGxlOiBcIkludmFsaWQgdGl0bGUgaW4gV0FQIFB1c2ggbWVzc2FnZVwiLFxuICB1cmw6IFwiSW52YWxpZCB1cmwgaW4gV0FQIFB1c2ggbWVzc2FnZVwiLFxuICBtYXhEaWdpdHM6IFwiSW52YWxpZCBtYXggZGlnaXRzIGZvciBUVFMgcHJvbXB0XCIsXG4gIGJ5ZVRleHQ6IFwiSW52YWxpZCBieWUgdGV4dCBmb3IgVFRTIHByb21wdFwiLFxuICBwaW5Db2RlOiBcIkludmFsaWQgcGluIGNvZGUgZm9yIFRUUyBjb25maXJtXCIsXG4gIGZhaWxlZFRleHQ6IFwiSW52YWxpZCBmYWlsZWQgdGV4dCBmb3IgVFRTIGNvbmZpcm1cIixcbiAgYW5zd2VyVXJsOiBcIkludmFsaWQgYW5zd2VyIFVSTCBmb3IgY2FsbFwiLFxuICB2ZXJpZnlWYWxpZGF0aW9uOiBcIk1pc3NpbmcgTWFuZGF0b3J5IGZpZWxkcyAobnVtYmVyIGFuZC9vciBicmFuZClcIixcbiAgY2hlY2tWZXJpZnlWYWxpZGF0aW9uOiBcIk1pc3NpbmcgTWFuZGF0b3J5IGZpZWxkcyAocmVxdWVzdF9pZCBhbmQvb3IgY29kZSlcIixcbiAgY29udHJvbFZlcmlmeVZhbGlkYXRpb246XG4gICAgXCJNaXNzaW5nIE1hbmRhdG9yeSBmaWVsZHMgKHJlcXVlc3RfaWQgYW5kL29yIGNtZC1jb21tYW5kKVwiLFxuICBzZWFyY2hWZXJpZnlWYWxpZGF0aW9uOlxuICAgIFwiTWlzc2luZyBNYW5kYXRvcnkgZmllbGRzIChyZXF1ZXN0X2lkIG9yIHJlcXVlc3RfaWRzKVwiLFxuICBudW1iZXJJbnNpZ2h0QWR2YW5jZWRWYWxpZGF0aW9uOlxuICAgIFwiTWlzc2luZyBNYW5kYXRvcnkgZmllbGRzIChudW1iZXIgYW5kL29yIGNhbGxiYWNrIHVybClcIixcbiAgbnVtYmVySW5zaWdodFZhbGlkYXRpb246IFwiTWlzc2luZyBNYW5kYXRvcnkgZmllbGQgLSBudW1iZXJcIixcbiAgbnVtYmVySW5zaWdodFBhdHRlcm5GYWlsdXJlOlxuICAgIFwiTnVtYmVyIGNhbiBjb250YWluIGRpZ2l0cyBhbmQgbWF5IGluY2x1ZGUgYW55IG9yIGFsbCBvZiB0aGUgZm9sbG93aW5nOiB3aGl0ZSBzcGFjZSwgLSwrLCAoLCApLlwiLFxuICBvcHRpb25zTm90QW5PYmplY3Q6XG4gICAgXCJPcHRpb25zIHBhcmFtZXRlciBzaG91bGQgYmUgYSBkaWN0aW9uYXJ5LiBDaGVjayB0aGUgZG9jcyBmb3IgdmFsaWQgcHJvcGVydGllcyBmb3Igb3B0aW9uc1wiLFxuICBwcm9kdWN0OiBcIkludmFsaWQgcHJvZHVjdC4gU2hvdWxkIGJlIG9uZSBvZiBbdm9pY2UsIHNtc11cIlxufTtcblxuZXhwb3J0cy5pbml0aWFsaXplID0gZnVuY3Rpb24ocGtleSwgcHNlY3JldCwgb3B0aW9ucykge1xuICBpZiAoIXBrZXkgfHwgIXBzZWNyZXQpIHtcbiAgICB0aHJvdyBcImtleSBhbmQgc2VjcmV0IGNhbm5vdCBiZSBlbXB0eSwgc2V0IHZhbGlkIHZhbHVlc1wiO1xuICB9XG4gIHVwID0ge1xuICAgIGFwaV9rZXk6IHBrZXksXG4gICAgYXBpX3NlY3JldDogcHNlY3JldFxuICB9O1xuICBfb3B0aW9ucyA9IG9wdGlvbnM7XG59O1xuXG5leHBvcnRzLnNlbmRCaW5hcnlNZXNzYWdlID0gZnVuY3Rpb24oc2VuZGVyLCByZWNpcGllbnQsIGJvZHksIHVkaCwgY2FsbGJhY2spIHtcbiAgaWYgKCFib2R5KSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMuYm9keSkpO1xuICB9IGVsc2UgaWYgKCF1ZGgpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy51ZGgpKTtcbiAgfSBlbHNlIHtcbiAgICBzZW5kTWVzc2FnZShcbiAgICAgIHtcbiAgICAgICAgZnJvbTogc2VuZGVyLFxuICAgICAgICB0bzogcmVjaXBpZW50LFxuICAgICAgICB0eXBlOiBcImJpbmFyeVwiLFxuICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICB1ZGg6IHVkaFxuICAgICAgfSxcbiAgICAgIGNhbGxiYWNrXG4gICAgKTtcbiAgfVxufTtcblxuZXhwb3J0cy5zZW5kV2FwUHVzaE1lc3NhZ2UgPSBmdW5jdGlvbihcbiAgc2VuZGVyLFxuICByZWNpcGllbnQsXG4gIHRpdGxlLFxuICB1cmwsXG4gIHZhbGlkaXR5LFxuICBjYWxsYmFja1xuKSB7XG4gIGlmICghdGl0bGUpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy50aXRsZSkpO1xuICB9IGVsc2UgaWYgKCF1cmwpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy51cmwpKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIHZhbGlkaXR5ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNhbGxiYWNrID0gdmFsaWRpdHk7XG4gICAgICB2YWxpZGl0eSA9IDg2NDAwMDAwO1xuICAgIH1cbiAgICBzZW5kTWVzc2FnZShcbiAgICAgIHtcbiAgICAgICAgZnJvbTogc2VuZGVyLFxuICAgICAgICB0bzogcmVjaXBpZW50LFxuICAgICAgICB0eXBlOiBcIndhcHB1c2hcIixcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICB2YWxpZGl0eTogdmFsaWRpdHksXG4gICAgICAgIHVybDogdXJsXG4gICAgICB9LFxuICAgICAgY2FsbGJhY2tcbiAgICApO1xuICB9XG59O1xuXG5leHBvcnRzLnNlbmRUZXh0TWVzc2FnZSA9IGZ1bmN0aW9uKHNlbmRlciwgcmVjaXBpZW50LCBtZXNzYWdlLCBvcHRzLCBjYWxsYmFjaykge1xuICBpZiAoIW1lc3NhZ2UpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5tc2cpKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIG9wdHNbXCJmcm9tXCJdID0gc2VuZGVyO1xuICAgIG9wdHNbXCJ0b1wiXSA9IHJlY2lwaWVudDtcbiAgICBvcHRzW1widGV4dFwiXSA9IG1lc3NhZ2U7XG4gICAgc2VuZE1lc3NhZ2Uob3B0cywgY2FsbGJhY2spO1xuICB9XG59O1xuXG5leHBvcnRzLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24ob3B0cywgY2FsbGJhY2spIHtcbiAgc2VuZE1lc3NhZ2Uob3B0cywgY2FsbGJhY2spO1xufTtcbmZ1bmN0aW9uIHNlbmRNZXNzYWdlKGRhdGEsIGNhbGxiYWNrKSB7XG4gIGlmICghZGF0YS5mcm9tKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMuc2VuZGVyKSk7XG4gIH0gZWxzZSBpZiAoIWRhdGEudG8pIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy50bykpO1xuICB9IGVsc2Uge1xuICAgIHZhciBwYXRoID0gY2xvbmUobXNncGF0aCk7XG4gICAgcGF0aC5wYXRoICs9IFwiP1wiICsgcXVlcnlzdHJpbmcuc3RyaW5naWZ5KGRhdGEpO1xuICAgIF9vcHRpb25zLmxvZ2dlci5pbmZvKFxuICAgICAgXCJzZW5kaW5nIG1lc3NhZ2UgZnJvbSBcIiArXG4gICAgICAgIGRhdGEuZnJvbSArXG4gICAgICAgIFwiIHRvIFwiICtcbiAgICAgICAgZGF0YS50byArXG4gICAgICAgIFwiIHdpdGggbWVzc2FnZSBcIiArXG4gICAgICAgIGRhdGEudGV4dFxuICAgICk7XG4gICAgc2VuZFJlcXVlc3QocGF0aCwgXCJQT1NUXCIsIGZ1bmN0aW9uKGVyciwgYXBpUmVzcG9uc2UpIHtcbiAgICAgIGlmICghZXJyICYmIGFwaVJlc3BvbnNlLnN0YXR1cyAmJiBhcGlSZXNwb25zZS5tZXNzYWdlc1swXS5zdGF0dXMgPiAwKSB7XG4gICAgICAgIHNlbmRFcnJvcihcbiAgICAgICAgICBjYWxsYmFjayxcbiAgICAgICAgICBuZXcgRXJyb3IoYXBpUmVzcG9uc2UubWVzc2FnZXNbMF1bXCJlcnJvci10ZXh0XCJdKSxcbiAgICAgICAgICBhcGlSZXNwb25zZVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIsIGFwaVJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZW5kVmlhU2hvcnRjb2RlKHR5cGUsIHJlY2lwaWVudCwgbWVzc2FnZVBhcmFtcywgb3B0cywgY2FsbGJhY2spIHtcbiAgaWYgKCFyZWNpcGllbnQpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy50bykpO1xuICB9XG4gIGlmICghbWVzc2FnZVBhcmFtcyB8fCAhT2JqZWN0LmtleXMobWVzc2FnZVBhcmFtcykpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5tc2dQYXJhbXMpKTtcbiAgfVxuICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgdmFyIHBhdGggPSBjbG9uZShzaG9ydGNvZGVQYXRoKTtcbiAgcGF0aC5wYXRoID0gcGF0aC5wYXRoLnJlcGxhY2UoXCIke3R5cGV9XCIsIHR5cGUpO1xuICBPYmplY3Qua2V5cyhtZXNzYWdlUGFyYW1zKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIG9wdHNba2V5XSA9IG1lc3NhZ2VQYXJhbXNba2V5XTtcbiAgfSk7XG4gIG9wdHMudG8gPSByZWNpcGllbnQ7XG4gIHBhdGgucGF0aCArPSBcIj9cIiArIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShvcHRzKTtcbiAgX29wdGlvbnMubG9nZ2VyLmluZm8oXG4gICAgXCJzZW5kaW5nIG1lc3NhZ2UgZnJvbSBzaG9ydGNvZGUgXCIgK1xuICAgICAgdHlwZSArXG4gICAgICBcIiB0byBcIiArXG4gICAgICByZWNpcGllbnQgK1xuICAgICAgXCIgd2l0aCBwYXJhbWV0ZXJzIFwiICtcbiAgICAgIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2VQYXJhbXMpXG4gICk7XG4gIHNlbmRSZXF1ZXN0KHBhdGgsIFwiUE9TVFwiLCBmdW5jdGlvbihlcnIsIGFwaVJlc3BvbnNlKSB7XG4gICAgaWYgKCFlcnIgJiYgYXBpUmVzcG9uc2Uuc3RhdHVzICYmIGFwaVJlc3BvbnNlLm1lc3NhZ2VzWzBdLnN0YXR1cyA+IDApIHtcbiAgICAgIHNlbmRFcnJvcihcbiAgICAgICAgY2FsbGJhY2ssXG4gICAgICAgIG5ldyBFcnJvcihhcGlSZXNwb25zZS5tZXNzYWdlc1swXVtcImVycm9yLXRleHRcIl0pLFxuICAgICAgICBhcGlSZXNwb25zZVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhlcnIsIGFwaVJlc3BvbnNlKTtcbiAgICB9XG4gIH0pO1xufVxuZXhwb3J0cy5zaG9ydGNvZGVBbGVydCA9IGZ1bmN0aW9uKHJlY2lwaWVudCwgbWVzc2FnZVBhcmFtcywgb3B0cywgY2FsbGJhY2spIHtcbiAgc2VuZFZpYVNob3J0Y29kZShcImFsZXJ0XCIsIHJlY2lwaWVudCwgbWVzc2FnZVBhcmFtcywgb3B0cywgY2FsbGJhY2spO1xufTtcbmV4cG9ydHMuc2hvcnRjb2RlMkZBID0gZnVuY3Rpb24ocmVjaXBpZW50LCBtZXNzYWdlUGFyYW1zLCBvcHRzLCBjYWxsYmFjaykge1xuICBzZW5kVmlhU2hvcnRjb2RlKFwiMmZhXCIsIHJlY2lwaWVudCwgbWVzc2FnZVBhcmFtcywgb3B0cywgY2FsbGJhY2spO1xufTtcbmV4cG9ydHMuc2hvcnRjb2RlTWFya2V0aW5nID0gZnVuY3Rpb24oXG4gIHJlY2lwaWVudCxcbiAgbWVzc2FnZVBhcmFtcyxcbiAgb3B0cyxcbiAgY2FsbGJhY2tcbikge1xuICBzZW5kVmlhU2hvcnRjb2RlKFwibWFya2V0aW5nXCIsIHJlY2lwaWVudCwgbWVzc2FnZVBhcmFtcywgb3B0cywgY2FsbGJhY2spO1xufTtcblxuZnVuY3Rpb24gY2xvbmUoYSkge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhKSk7XG59XG5cbmZ1bmN0aW9uIGdldEVuZHBvaW50KGFjdGlvbikge1xuICByZXR1cm4geyBwYXRoOiBhY3Rpb24gfTtcbn1cblxuZnVuY3Rpb24gc2VuZFJlcXVlc3QoZW5kcG9pbnQsIG1ldGhvZCwgY2FsbGJhY2spIHtcbiAgZW5kcG9pbnQucGF0aCA9XG4gICAgZW5kcG9pbnQucGF0aCArXG4gICAgKGVuZHBvaW50LnBhdGguaW5kZXhPZihcIj9cIikgPiAwID8gXCImXCIgOiBcIj9cIikgK1xuICAgIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeSh1cCk7XG4gIF9vcHRpb25zLmh0dHBDbGllbnQucmVxdWVzdChlbmRwb2ludCwgbWV0aG9kLCBjYWxsYmFjayk7XG59XG5cbmV4cG9ydHMuY2hlY2tCYWxhbmNlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdmFyIGJhbGFuY2VFbmRwb2ludCA9IGdldEVuZHBvaW50KFwiL2FjY291bnQvZ2V0LWJhbGFuY2VcIik7XG4gIHNlbmRSZXF1ZXN0KGJhbGFuY2VFbmRwb2ludCwgY2FsbGJhY2spO1xufTtcblxuZXhwb3J0cy5nZXROdW1iZXJzID0gZnVuY3Rpb24ob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgdmFyIG51bWJlcnNFbmRwb2ludCA9IGdldEVuZHBvaW50KFwiL2FjY291bnQvbnVtYmVyc1wiKTtcbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwib2JqZWN0XCIpIHtcbiAgICBudW1iZXJzRW5kcG9pbnQucGF0aCA9IG51bWJlcnNFbmRwb2ludC5wYXRoICsgXCI/XCI7XG4gICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgIG51bWJlcnNFbmRwb2ludC5wYXRoID1cbiAgICAgICAgbnVtYmVyc0VuZHBvaW50LnBhdGggKyBrZXkgKyBcIj1cIiArIG9wdGlvbnNba2V5XSArIFwiJlwiO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5vcHRpb25zTm90QW5PYmplY3QpKTtcbiAgICByZXR1cm47XG4gIH1cbiAgc2VuZFJlcXVlc3QobnVtYmVyc0VuZHBvaW50LCBjYWxsYmFjayk7XG59O1xuXG5leHBvcnRzLnNlYXJjaE51bWJlcnMgPSBmdW5jdGlvbihjb3VudHJ5Q29kZSwgcGF0dGVybiwgY2FsbGJhY2spIHtcbiAgaWYgKCFjb3VudHJ5Q29kZSB8fCBjb3VudHJ5Q29kZS5sZW5ndGggIT09IDIpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5jb3VudHJ5Y29kZSkpO1xuICB9IGVsc2Uge1xuICAgIHZhciBzZWFyY2hFbmRwb2ludCA9IGdldEVuZHBvaW50KFwiL251bWJlci9zZWFyY2hcIik7XG4gICAgc2VhcmNoRW5kcG9pbnQucGF0aCArPSBcIj9jb3VudHJ5PVwiICsgY291bnRyeUNvZGU7XG4gICAgaWYgKHR5cGVvZiBwYXR0ZXJuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNhbGxiYWNrID0gcGF0dGVybjtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXR0ZXJuID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBzZWFyY2hFbmRwb2ludC5wYXRoID0gc2VhcmNoRW5kcG9pbnQucGF0aCArIFwiJlwiO1xuICAgICAgZm9yICh2YXIgYXJnIGluIHBhdHRlcm4pIHtcbiAgICAgICAgc2VhcmNoRW5kcG9pbnQucGF0aCA9XG4gICAgICAgICAgc2VhcmNoRW5kcG9pbnQucGF0aCArIGFyZyArIFwiPVwiICsgcGF0dGVyblthcmddICsgXCImXCI7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlYXJjaEVuZHBvaW50LnBhdGggPSBzZWFyY2hFbmRwb2ludC5wYXRoICsgXCImcGF0dGVybj1cIiArIHBhdHRlcm47XG4gICAgfVxuICAgIHNlbmRSZXF1ZXN0KHNlYXJjaEVuZHBvaW50LCBjYWxsYmFjayk7XG4gIH1cbn07XG5cbmV4cG9ydHMuYnV5TnVtYmVyID0gZnVuY3Rpb24oY291bnRyeUNvZGUsIG1zaXNkbiwgY2FsbGJhY2spIHtcbiAgaWYgKCFjb3VudHJ5Q29kZSB8fCBjb3VudHJ5Q29kZS5sZW5ndGggIT09IDIpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5jb3VudHJ5Y29kZSkpO1xuICB9IGVsc2UgaWYgKCFtc2lzZG4pIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5tc2lzZG4pKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgYnV5RW5kcG9pbnQgPSBnZXRFbmRwb2ludChcIi9udW1iZXIvYnV5XCIpO1xuICAgIGJ1eUVuZHBvaW50LnBhdGggKz0gXCI/Y291bnRyeT1cIiArIGNvdW50cnlDb2RlICsgXCImbXNpc2RuPVwiICsgbXNpc2RuO1xuICAgIHNlbmRSZXF1ZXN0KGJ1eUVuZHBvaW50LCBcIlBPU1RcIiwgY2FsbGJhY2spO1xuICB9XG59O1xuXG5leHBvcnRzLmNhbmNlbE51bWJlciA9IGZ1bmN0aW9uKGNvdW50cnlDb2RlLCBtc2lzZG4sIGNhbGxiYWNrKSB7XG4gIGlmICghY291bnRyeUNvZGUgfHwgY291bnRyeUNvZGUubGVuZ3RoICE9PSAyKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMuY291bnRyeWNvZGUpKTtcbiAgfSBlbHNlIGlmICghbXNpc2RuKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMubXNpc2RuKSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGNhbmNlbEVuZHBvaW50ID0gZ2V0RW5kcG9pbnQoXCIvbnVtYmVyL2NhbmNlbFwiKTtcbiAgICBjYW5jZWxFbmRwb2ludC5wYXRoICs9IFwiP2NvdW50cnk9XCIgKyBjb3VudHJ5Q29kZSArIFwiJm1zaXNkbj1cIiArIG1zaXNkbjtcbiAgICBzZW5kUmVxdWVzdChjYW5jZWxFbmRwb2ludCwgXCJQT1NUXCIsIGNhbGxiYWNrKTtcbiAgfVxufTtcblxuZXhwb3J0cy5jYW5jZWxOdW1iZXIgPSBmdW5jdGlvbihjb3VudHJ5Q29kZSwgbXNpc2RuLCBjYWxsYmFjaykge1xuICBpZiAoIWNvdW50cnlDb2RlIHx8IGNvdW50cnlDb2RlLmxlbmd0aCAhPT0gMikge1xuICAgIHNlbmRFcnJvcihjYWxsYmFjaywgbmV3IEVycm9yKEVSUk9SX01FU1NBR0VTLmNvdW50cnljb2RlKSk7XG4gIH0gZWxzZSBpZiAoIW1zaXNkbikge1xuICAgIHNlbmRFcnJvcihjYWxsYmFjaywgbmV3IEVycm9yKEVSUk9SX01FU1NBR0VTLm1zaXNkbikpO1xuICB9IGVsc2Uge1xuICAgIHZhciBjYW5jZWxFbmRwb2ludCA9IGdldEVuZHBvaW50KFwiL251bWJlci9jYW5jZWxcIik7XG4gICAgY2FuY2VsRW5kcG9pbnQucGF0aCArPSBcIj9jb3VudHJ5PVwiICsgY291bnRyeUNvZGUgKyBcIiZtc2lzZG49XCIgKyBtc2lzZG47XG4gICAgc2VuZFJlcXVlc3QoY2FuY2VsRW5kcG9pbnQsIFwiUE9TVFwiLCBjYWxsYmFjayk7XG4gIH1cbn07XG5cbmV4cG9ydHMudXBkYXRlTnVtYmVyID0gZnVuY3Rpb24oY291bnRyeUNvZGUsIG1zaXNkbiwgcGFyYW1zLCBjYWxsYmFjaykge1xuICBpZiAoIWNvdW50cnlDb2RlIHx8IGNvdW50cnlDb2RlLmxlbmd0aCAhPT0gMikge1xuICAgIHNlbmRFcnJvcihjYWxsYmFjaywgbmV3IEVycm9yKEVSUk9SX01FU1NBR0VTLmNvdW50cnljb2RlKSk7XG4gIH0gZWxzZSBpZiAoIW1zaXNkbikge1xuICAgIHNlbmRFcnJvcihjYWxsYmFjaywgbmV3IEVycm9yKEVSUk9SX01FU1NBR0VTLm1zaXNkbikpO1xuICB9IGVsc2Uge1xuICAgIHZhciB1cGRhdGVFbmRwb2ludCA9IGdldEVuZHBvaW50KFwiL251bWJlci91cGRhdGVcIik7XG4gICAgdXBkYXRlRW5kcG9pbnQucGF0aCArPSBcIj9jb3VudHJ5PVwiICsgY291bnRyeUNvZGUgKyBcIiZtc2lzZG49XCIgKyBtc2lzZG47XG4gICAgdXBkYXRlRW5kcG9pbnQucGF0aCA9IHVwZGF0ZUVuZHBvaW50LnBhdGggKyBcIiZcIjtcbiAgICBmb3IgKHZhciBhcmcgaW4gcGFyYW1zKSB7XG4gICAgICB1cGRhdGVFbmRwb2ludC5wYXRoID1cbiAgICAgICAgdXBkYXRlRW5kcG9pbnQucGF0aCArIGFyZyArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1thcmddKSArIFwiJlwiO1xuICAgIH1cbiAgICBzZW5kUmVxdWVzdCh1cGRhdGVFbmRwb2ludCwgXCJQT1NUXCIsIGNhbGxiYWNrKTtcbiAgfVxufTtcblxuZXhwb3J0cy5jaGFuZ2VQYXNzd29yZCA9IGZ1bmN0aW9uKG5ld1NlY3JldCwgY2FsbGJhY2spIHtcbiAgdmFyIHNldHRpbmdzRW5kcG9pbnQgPSBnZXRFbmRwb2ludChcIi9hY2NvdW50L3NldHRpbmdzXCIpO1xuICBzZXR0aW5nc0VuZHBvaW50LnBhdGggKz0gXCI/bmV3U2VjcmV0PVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KG5ld1NlY3JldCk7XG4gIHNlbmRSZXF1ZXN0KHNldHRpbmdzRW5kcG9pbnQsIFwiUE9TVFwiLCBjYWxsYmFjayk7XG59O1xuXG5leHBvcnRzLmNoYW5nZU1vQ2FsbGJhY2tVcmwgPSBmdW5jdGlvbihuZXdVcmwsIGNhbGxiYWNrKSB7XG4gIHZhciBzZXR0aW5nc0VuZHBvaW50ID0gZ2V0RW5kcG9pbnQoXCIvYWNjb3VudC9zZXR0aW5nc1wiKTtcbiAgc2V0dGluZ3NFbmRwb2ludC5wYXRoICs9IFwiP21vQ2FsbEJhY2tVcmw9XCIgKyBlbmNvZGVVUklDb21wb25lbnQobmV3VXJsKTtcbiAgc2VuZFJlcXVlc3Qoc2V0dGluZ3NFbmRwb2ludCwgXCJQT1NUXCIsIGNhbGxiYWNrKTtcbn07XG5cbmV4cG9ydHMuY2hhbmdlRHJDYWxsYmFja1VybCA9IGZ1bmN0aW9uKG5ld1VybCwgY2FsbGJhY2spIHtcbiAgdmFyIHNldHRpbmdzRW5kcG9pbnQgPSBnZXRFbmRwb2ludChcIi9hY2NvdW50L3NldHRpbmdzXCIpO1xuICBzZXR0aW5nc0VuZHBvaW50LnBhdGggKz0gXCI/ZHJDYWxsQmFja1VybD1cIiArIGVuY29kZVVSSUNvbXBvbmVudChuZXdVcmwpO1xuICBzZW5kUmVxdWVzdChzZXR0aW5nc0VuZHBvaW50LCBcIlBPU1RcIiwgY2FsbGJhY2spO1xufTtcblxuZXhwb3J0cy52ZXJpZnlOdW1iZXIgPSBmdW5jdGlvbihpbnB1dFBhcmFtcywgY2FsbGJhY2spIHtcbiAgaWYgKCFpbnB1dFBhcmFtcy5udW1iZXIgfHwgIWlucHV0UGFyYW1zLmJyYW5kKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMudmVyaWZ5VmFsaWRhdGlvbikpO1xuICB9IGVsc2Uge1xuICAgIHZhciB2RW5kcG9pbnQgPSBjbG9uZSh2ZXJpZnlFbmRwb2ludCk7XG4gICAgdkVuZHBvaW50LnBhdGggKz0gXCI/XCIgKyBxdWVyeXN0cmluZy5zdHJpbmdpZnkoaW5wdXRQYXJhbXMpO1xuICAgIHNlbmRSZXF1ZXN0KHZFbmRwb2ludCwgY2FsbGJhY2spO1xuICB9XG59O1xuXG5leHBvcnRzLmNoZWNrVmVyaWZ5UmVxdWVzdCA9IGZ1bmN0aW9uKGlucHV0UGFyYW1zLCBjYWxsYmFjaykge1xuICBpZiAoIWlucHV0UGFyYW1zLnJlcXVlc3RfaWQgfHwgIWlucHV0UGFyYW1zLmNvZGUpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5jaGVja1ZlcmlmeVZhbGlkYXRpb24pKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgdkVuZHBvaW50ID0gY2xvbmUoY2hlY2tWZXJpZnlFbmRwb2ludCk7XG4gICAgdkVuZHBvaW50LnBhdGggKz0gXCI/XCIgKyBxdWVyeXN0cmluZy5zdHJpbmdpZnkoaW5wdXRQYXJhbXMpO1xuICAgIHNlbmRSZXF1ZXN0KHZFbmRwb2ludCwgY2FsbGJhY2spO1xuICB9XG59O1xuXG5leHBvcnRzLmNvbnRyb2xWZXJpZnlSZXF1ZXN0ID0gZnVuY3Rpb24oaW5wdXRQYXJhbXMsIGNhbGxiYWNrKSB7XG4gIGlmICghaW5wdXRQYXJhbXMucmVxdWVzdF9pZCB8fCAhaW5wdXRQYXJhbXMuY21kKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMuY29udHJvbFZlcmlmeVZhbGlkYXRpb24pKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgdkVuZHBvaW50ID0gY2xvbmUoY29udHJvbFZlcmlmeUVuZHBvaW50KTtcbiAgICB2RW5kcG9pbnQucGF0aCArPSBcIj9cIiArIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShpbnB1dFBhcmFtcyk7XG4gICAgc2VuZFJlcXVlc3QodkVuZHBvaW50LCBjYWxsYmFjayk7XG4gIH1cbn07XG5cbmV4cG9ydHMuc2VhcmNoVmVyaWZ5UmVxdWVzdCA9IGZ1bmN0aW9uKHJlcXVlc3RJZHMsIGNhbGxiYWNrKSB7XG4gIHZhciByZXF1ZXN0SWRQYXJhbSA9IHt9O1xuICBpZiAoIXJlcXVlc3RJZHMpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5zZWFyY2hWZXJpZnlWYWxpZGF0aW9uKSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocmVxdWVzdElkcykpIHtcbiAgICAgIGlmIChyZXF1ZXN0SWRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXF1ZXN0SWRQYXJhbS5yZXF1ZXN0X2lkID0gcmVxdWVzdElkcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcXVlc3RJZFBhcmFtLnJlcXVlc3RfaWRzID0gcmVxdWVzdElkcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVxdWVzdElkUGFyYW0ucmVxdWVzdF9pZCA9IHJlcXVlc3RJZHM7XG4gICAgfVxuICAgIHZhciB2RW5kcG9pbnQgPSBjbG9uZShzZWFyY2hWZXJpZnlFbmRwb2ludCk7XG4gICAgdkVuZHBvaW50LnBhdGggKz0gXCI/XCIgKyBxdWVyeXN0cmluZy5zdHJpbmdpZnkocmVxdWVzdElkUGFyYW0pO1xuICAgIHNlbmRSZXF1ZXN0KHZFbmRwb2ludCwgY2FsbGJhY2spO1xuICB9XG59O1xuXG5leHBvcnRzLm51bWJlckluc2lnaHQgPSBmdW5jdGlvbihpbnB1dFBhcmFtcywgY2FsbGJhY2spIHtcbiAgbnVtYmVySW5zaWdodEFzeW5jKGlucHV0UGFyYW1zLCBjYWxsYmFjayk7XG59O1xuXG5leHBvcnRzLm51bWJlckluc2lnaHRCYXNpYyA9IGZ1bmN0aW9uKGlucHV0UGFyYW1zLCBjYWxsYmFjaykge1xuICBudW1iZXJJbnNpZ2h0Q29tbW9uKG5pQmFzaWNFbmRwb2ludCwgaW5wdXRQYXJhbXMsIGNhbGxiYWNrKTtcbn07XG5cbmV4cG9ydHMubnVtYmVySW5zaWdodFN0YW5kYXJkID0gZnVuY3Rpb24oaW5wdXRQYXJhbXMsIGNhbGxiYWNrKSB7XG4gIG51bWJlckluc2lnaHRDb21tb24obmlTdGFuZGFyZEVuZHBvaW50LCBpbnB1dFBhcmFtcywgY2FsbGJhY2spO1xufTtcblxuZXhwb3J0cy5udW1iZXJJbnNpZ2h0QWR2YW5jZWQgPSBmdW5jdGlvbihpbnB1dFBhcmFtcywgY2FsbGJhY2spIHtcbiAgbnVtYmVySW5zaWdodENvbW1vbihuaUFkdmFuY2VkRW5kcG9pbnQsIGlucHV0UGFyYW1zLCBjYWxsYmFjayk7XG59O1xuXG5leHBvcnRzLm51bWJlckluc2lnaHRBZHZhbmNlZEFzeW5jID0gZnVuY3Rpb24oaW5wdXRQYXJhbXMsIGNhbGxiYWNrKSB7XG4gIG51bWJlckluc2lnaHRBc3luYyhpbnB1dFBhcmFtcywgY2FsbGJhY2spO1xufTtcblxuZnVuY3Rpb24gbnVtYmVySW5zaWdodEFzeW5jKGlucHV0UGFyYW1zLCBjYWxsYmFjaykge1xuICBpZiAoIWlucHV0UGFyYW1zLm51bWJlciB8fCAhaW5wdXRQYXJhbXMuY2FsbGJhY2spIHtcbiAgICBzZW5kRXJyb3IoXG4gICAgICBjYWxsYmFjayxcbiAgICAgIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5udW1iZXJJbnNpZ2h0QWR2YW5jZWRWYWxpZGF0aW9uKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIG5FbmRwb2ludCA9IGNsb25lKG5pRW5kcG9pbnQpO1xuICAgIG5FbmRwb2ludC5wYXRoICs9IFwiP1wiICsgcXVlcnlzdHJpbmcuc3RyaW5naWZ5KGlucHV0UGFyYW1zKTtcbiAgICBzZW5kUmVxdWVzdChuRW5kcG9pbnQsIGNhbGxiYWNrKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBudW1iZXJJbnNpZ2h0Q29tbW9uKGVuZHBvaW50LCBpbnB1dFBhcmFtcywgY2FsbGJhY2spIHtcbiAgaWYgKHZhbGlkYXRlTnVtYmVyKGlucHV0UGFyYW1zLCBjYWxsYmFjaykpIHtcbiAgICB2YXIgaW5wdXRPYmo7XG4gICAgaWYgKHR5cGVvZiBpbnB1dFBhcmFtcyAhPT0gXCJvYmplY3RcIikge1xuICAgICAgaW5wdXRPYmogPSB7IG51bWJlcjogaW5wdXRQYXJhbXMgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXRPYmogPSBpbnB1dFBhcmFtcztcbiAgICB9XG4gICAgdmFyIG5FbmRwb2ludCA9IGNsb25lKGVuZHBvaW50KTtcbiAgICBuRW5kcG9pbnQucGF0aCArPSBcIj9cIiArIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShpbnB1dE9iaik7XG4gICAgc2VuZFJlcXVlc3QobkVuZHBvaW50LCBjYWxsYmFjayk7XG4gIH1cbn1cbmZ1bmN0aW9uIHZhbGlkYXRlTnVtYmVyKGlucHV0UGFyYW1zLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIGlucHV0UGFyYW1zID09PSBcIm9iamVjdFwiICYmICFpbnB1dFBhcmFtcy5udW1iZXIpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5udW1iZXJJbnNpZ2h0VmFsaWRhdGlvbikpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIGlmIChcbiAgICB0eXBlb2YgaW5wdXRQYXJhbXMgPT09IFwib2JqZWN0XCIgJiZcbiAgICAhbnVtYmVyUGF0dGVybi50ZXN0KGlucHV0UGFyYW1zLm51bWJlcilcbiAgKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMubnVtYmVySW5zaWdodFBhdHRlcm5GYWlsdXJlKSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2UgaWYgKFxuICAgIHR5cGVvZiBpbnB1dFBhcmFtcyAhPT0gXCJvYmplY3RcIiAmJlxuICAgICghaW5wdXRQYXJhbXMgfHwgIW51bWJlclBhdHRlcm4udGVzdChpbnB1dFBhcmFtcykpXG4gICkge1xuICAgIHNlbmRFcnJvcihjYWxsYmFjaywgbmV3IEVycm9yKEVSUk9SX01FU1NBR0VTLm51bWJlckluc2lnaHRQYXR0ZXJuRmFpbHVyZSkpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc2VuZFZvaWNlTWVzc2FnZSh2b2ljZUVuZHBvaW50LCBkYXRhLCBjYWxsYmFjaykge1xuICBpZiAoIWRhdGEudG8pIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy50bykpO1xuICB9IGVsc2Uge1xuICAgIHZhciBlbmRwb2ludCA9IGNsb25lKHZvaWNlRW5kcG9pbnQpO1xuICAgIGVuZHBvaW50LnBhdGggKz0gXCI/XCIgKyBxdWVyeXN0cmluZy5zdHJpbmdpZnkoZGF0YSk7XG4gICAgX29wdGlvbnMubG9nZ2VyLmluZm8oXG4gICAgICBcInNlbmRpbmcgVFRTIG1lc3NhZ2UgdG8gXCIgKyBkYXRhLnRvICsgXCIgd2l0aCBtZXNzYWdlIFwiICsgZGF0YS50ZXh0XG4gICAgKTtcbiAgICBzZW5kUmVxdWVzdChlbmRwb2ludCwgXCJQT1NUXCIsIGZ1bmN0aW9uKGVyciwgYXBpUmVzcG9uc2UpIHtcbiAgICAgIGlmICghZXJyICYmIGFwaVJlc3BvbnNlLnN0YXR1cyAmJiBhcGlSZXNwb25zZS5zdGF0dXMgPiAwKSB7XG4gICAgICAgIHNlbmRFcnJvcihjYWxsYmFjaywgbmV3IEVycm9yKGFwaVJlc3BvbnNlW1wiZXJyb3ItdGV4dFwiXSksIGFwaVJlc3BvbnNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXJyLCBhcGlSZXNwb25zZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0cy5zZW5kVFRTTWVzc2FnZSA9IGZ1bmN0aW9uKHJlY2lwaWVudCwgbWVzc2FnZSwgb3B0cywgY2FsbGJhY2spIHtcbiAgaWYgKCFtZXNzYWdlKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMubXNnKSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFvcHRzKSB7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIG9wdHNbXCJ0b1wiXSA9IHJlY2lwaWVudDtcbiAgICBvcHRzW1widGV4dFwiXSA9IG1lc3NhZ2U7XG4gICAgc2VuZFZvaWNlTWVzc2FnZSh0dHNFbmRwb2ludCwgb3B0cywgY2FsbGJhY2spO1xuICB9XG59O1xuXG5leHBvcnRzLnNlbmRUVFNQcm9tcHRXaXRoQ2FwdHVyZSA9IGZ1bmN0aW9uKFxuICByZWNpcGllbnQsXG4gIG1lc3NhZ2UsXG4gIG1heERpZ2l0cyxcbiAgYnllVGV4dCxcbiAgb3B0cyxcbiAgY2FsbGJhY2tcbikge1xuICBpZiAoIW1lc3NhZ2UpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5tc2cpKTtcbiAgfSBlbHNlIGlmICghbWF4RGlnaXRzIHx8IGlzTmFOKG1heERpZ2l0cykgfHwgbWF4RGlnaXRzLmxlbmd0aCA+IDE2KSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMubWF4RGlnaXRzKSk7XG4gIH0gZWxzZSBpZiAoIWJ5ZVRleHQpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5ieWVUZXh0KSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFvcHRzKSB7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIG9wdHNbXCJ0b1wiXSA9IHJlY2lwaWVudDtcbiAgICBvcHRzW1widGV4dFwiXSA9IG1lc3NhZ2U7XG4gICAgb3B0c1tcIm1heF9kaWdpdHNcIl0gPSBtYXhEaWdpdHM7XG4gICAgb3B0c1tcImJ5ZV90ZXh0XCJdID0gYnllVGV4dDtcbiAgICBzZW5kVm9pY2VNZXNzYWdlKHR0c1Byb21wdEVuZHBvaW50LCBvcHRzLCBjYWxsYmFjayk7XG4gIH1cbn07XG5cbmV4cG9ydHMuc2VuZFRUU1Byb21wdFdpdGhDb25maXJtID0gZnVuY3Rpb24oXG4gIHJlY2lwaWVudCxcbiAgbWVzc2FnZSxcbiAgbWF4RGlnaXRzLFxuICBwaW5Db2RlLFxuICBieWVUZXh0LFxuICBmYWlsZWRUZXh0LFxuICBvcHRzLFxuICBjYWxsYmFja1xuKSB7XG4gIGlmICghbWVzc2FnZSkge1xuICAgIHNlbmRFcnJvcihjYWxsYmFjaywgbmV3IEVycm9yKEVSUk9SX01FU1NBR0VTLm1zZykpO1xuICB9IGVsc2UgaWYgKCFtYXhEaWdpdHMgfHwgaXNOYU4obWF4RGlnaXRzKSB8fCBtYXhEaWdpdHMubGVuZ3RoID4gMTYpIHtcbiAgICBzZW5kRXJyb3IoY2FsbGJhY2ssIG5ldyBFcnJvcihFUlJPUl9NRVNTQUdFUy5tYXhEaWdpdHMpKTtcbiAgfSBlbHNlIGlmICghcGluQ29kZSB8fCBwaW5Db2RlLmxlbmd0aCAhPT0gbWF4RGlnaXRzKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMucGluQ29kZSkpO1xuICB9IGVsc2UgaWYgKCFieWVUZXh0KSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMuYnllVGV4dCkpO1xuICB9IGVsc2UgaWYgKCFmYWlsZWRUZXh0KSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMuZmFpbGVkVGV4dCkpO1xuICB9IGVsc2Uge1xuICAgIGlmICghb3B0cykge1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH1cbiAgICBvcHRzW1widG9cIl0gPSByZWNpcGllbnQ7XG4gICAgb3B0c1tcInRleHRcIl0gPSBtZXNzYWdlO1xuICAgIG9wdHNbXCJtYXhfZGlnaXRzXCJdID0gbWF4RGlnaXRzO1xuICAgIG9wdHNbXCJwaW5fY29kZVwiXSA9IHBpbkNvZGU7XG4gICAgb3B0c1tcImJ5ZV90ZXh0XCJdID0gYnllVGV4dDtcbiAgICBvcHRzW1wiZmFpbGVkX3RleHRcIl0gPSBmYWlsZWRUZXh0O1xuICAgIHNlbmRWb2ljZU1lc3NhZ2UodHRzUHJvbXB0RW5kcG9pbnQsIG9wdHMsIGNhbGxiYWNrKTtcbiAgfVxufTtcblxuZXhwb3J0cy5jYWxsID0gZnVuY3Rpb24ocmVjaXBpZW50LCBhbnN3ZXJVcmwsIG9wdHMsIGNhbGxiYWNrKSB7XG4gIGlmICghYW5zd2VyVXJsKSB7XG4gICAgc2VuZEVycm9yKGNhbGxiYWNrLCBuZXcgRXJyb3IoRVJST1JfTUVTU0FHRVMuYW5zd2VyVXJsKSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFvcHRzKSB7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIG9wdHNbXCJ0b1wiXSA9IHJlY2lwaWVudDtcbiAgICBvcHRzW1wiYW5zd2VyX3VybFwiXSA9IGFuc3dlclVybDtcbiAgICBzZW5kVm9pY2VNZXNzYWdlKGNhbGxFbmRwb2ludCwgb3B0cywgY2FsbGJhY2spO1xuICB9XG59O1xuXG5mdW5jdGlvbiBzZW5kRXJyb3IoY2FsbGJhY2ssIGVyciwgcmV0dXJuRGF0YSkge1xuICAvLyBUaHJvdyB0aGUgZXJyb3IgaW4gY2FzZSBpZiB0aGVyZSBpcyBubyBjYWxsYmFjayBwYXNzZWRcbiAgaWYgKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2soZXJyLCByZXR1cm5EYXRhKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0cy5zZXRIb3N0ID0gZnVuY3Rpb24oYUhvc3QpIHtcbiAgbXNncGF0aC5ob3N0ID0gYUhvc3Q7XG4gIHNob3J0Y29kZVBhdGguaG9zdCA9IGFIb3N0O1xuICB0dHNFbmRwb2ludC5ob3N0ID0gYUhvc3Q7XG4gIHR0c1Byb21wdEVuZHBvaW50Lmhvc3QgPSBhSG9zdDtcbiAgY2FsbEVuZHBvaW50Lmhvc3QgPSBhSG9zdDtcbiAgdmVyaWZ5RW5kcG9pbnQuaG9zdCA9IGFIb3N0O1xuICBjaGVja1ZlcmlmeUVuZHBvaW50Lmhvc3QgPSBhSG9zdDtcbiAgY29udHJvbFZlcmlmeUVuZHBvaW50Lmhvc3QgPSBhSG9zdDtcbiAgc2VhcmNoVmVyaWZ5RW5kcG9pbnQuaG9zdCA9IGFIb3N0O1xuICBuaUVuZHBvaW50Lmhvc3QgPSBhSG9zdDtcbiAgbmlCYXNpY0VuZHBvaW50Lmhvc3QgPSBhSG9zdDtcbiAgbmlTdGFuZGFyZEVuZHBvaW50Lmhvc3QgPSBhSG9zdDtcbn07XG4iXX0=