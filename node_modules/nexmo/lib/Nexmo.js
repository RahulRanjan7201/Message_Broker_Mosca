"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _Credentials = require("./Credentials");

var _Credentials2 = _interopRequireDefault(_Credentials);

var _JwtGenerator = require("./JwtGenerator");

var _JwtGenerator2 = _interopRequireDefault(_JwtGenerator);

var _HashGenerator = require("./HashGenerator");

var _HashGenerator2 = _interopRequireDefault(_HashGenerator);

var _Message = require("./Message");

var _Message2 = _interopRequireDefault(_Message);

var _Voice = require("./Voice");

var _Voice2 = _interopRequireDefault(_Voice);

var _Number = require("./Number");

var _Number2 = _interopRequireDefault(_Number);

var _Verify = require("./Verify");

var _Verify2 = _interopRequireDefault(_Verify);

var _NumberInsight = require("./NumberInsight");

var _NumberInsight2 = _interopRequireDefault(_NumberInsight);

var _App = require("./App");

var _App2 = _interopRequireDefault(_App);

var _Account = require("./Account");

var _Account2 = _interopRequireDefault(_Account);

var _CallsResource = require("./CallsResource");

var _CallsResource2 = _interopRequireDefault(_CallsResource);

var _FilesResource = require("./FilesResource");

var _FilesResource2 = _interopRequireDefault(_FilesResource);

var _Conversion = require("./Conversion");

var _Conversion2 = _interopRequireDefault(_Conversion);

var _Media = require("./Media");

var _Media2 = _interopRequireDefault(_Media);

var _Redact = require("./Redact");

var _Redact2 = _interopRequireDefault(_Redact);

var _Pricing = require("./Pricing");

var _Pricing2 = _interopRequireDefault(_Pricing);

var _HttpClient = require("./HttpClient");

var _HttpClient2 = _interopRequireDefault(_HttpClient);

var _NullLogger = require("./NullLogger");

var _NullLogger2 = _interopRequireDefault(_NullLogger);

var _ConsoleLogger = require("./ConsoleLogger");

var _ConsoleLogger2 = _interopRequireDefault(_ConsoleLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var jwtGeneratorInstance = new _JwtGenerator2.default();
var hashGeneratorInstance = new _HashGenerator2.default();

var Nexmo = function () {
  /**
   * @param {Credentials} credentials - Nexmo API credentials
   * @param {string} credentials.apiKey - the Nexmo API key
   * @param {string} credentials.apiSecret - the Nexmo API secret
   * @param {Object} options - Additional options
   * @param {boolean} options.debug - `true` to turn on debug logging
   * @param {Object} options.logger - Set a custom logger.
   * @param {string} options.appendToUserAgent - A value to append to the user agent.
   *                    The value will be prefixed with a `/`
   */
  function Nexmo(credentials) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { debug: false };

    _classCallCheck(this, Nexmo);

    this.credentials = _Credentials2.default.parse(credentials);
    this.options = options;

    // If no logger has been supplied but debug has been set
    // default to using the ConsoleLogger
    if (!this.options.logger && this.options.debug) {
      this.options.logger = new _ConsoleLogger2.default();
    } else if (!this.options.logger) {
      // Swallow the logging
      this.options.logger = new _NullLogger2.default();
    }

    var userAgent = "nexmo-node/UNKNOWN node/UNKNOWN";
    try {
      var packageDetails = require(_path2.default.join(__dirname, "..", "package.json"));
      userAgent = "nexmo-node/" + packageDetails.version + " node/" + process.version.replace("v", "");
    } catch (e) {
      console.warn("Could not load package details");
    }
    this.options.userAgent = userAgent;
    if (this.options.appendToUserAgent) {
      this.options.userAgent += " " + this.options.appendToUserAgent;
    }

    // This is legacy, everything should use rest or api going forward
    this.options.httpClient = new _HttpClient2.default(Object.assign({ host: "rest.nexmo.com" }, this.options), this.credentials);

    // We have two different hosts, so we use two different HttpClients
    this.options.api = new _HttpClient2.default(Object.assign({ host: "api.nexmo.com" }, this.options), this.credentials);
    this.options.rest = new _HttpClient2.default(Object.assign({ host: "rest.nexmo.com" }, this.options), this.credentials);

    this.message = new _Message2.default(this.credentials, this.options);
    this.voice = new _Voice2.default(this.credentials, this.options);
    this.number = new _Number2.default(this.credentials, this.options);
    this.verify = new _Verify2.default(this.credentials, this.options);
    this.numberInsight = new _NumberInsight2.default(this.credentials, this.options);
    this.applications = new _App2.default(this.credentials, this.options);
    this.account = new _Account2.default(this.credentials, this.options);
    this.calls = new _CallsResource2.default(this.credentials, this.options);
    this.files = new _FilesResource2.default(this.credentials, this.options);
    this.conversion = new _Conversion2.default(this.credentials, this.options);
    this.media = new _Media2.default(this.credentials, this.options);
    this.redact = new _Redact2.default(this.credentials, this.options);
    this.pricing = new _Pricing2.default(this.credentials, this.options);

    /**
     * @deprecated Please use nexmo.applications
     */
    this.app = this.applications;
  }

  /**
   * Generate a JSON Web Token (JWT).
   *
   * The private key used upon Nexmo instance construction will be used to sign
   * the JWT. The application_id you used upon Nexmo instance creation will be
   * included in the claims for the JWT, however this can be overridden by passing
   * an application_id as part of the claims.
   *
   * @param {Object} claims - name/value pair claims to sign within the JWT
   *
   * @returns {String} the generated token
   */

  _createClass(Nexmo, [{
    key: "generateJwt",
    value: function generateJwt() {
      var claims = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (claims.application_id === undefined) {
        claims.application_id = this.credentials.applicationId;
      }
      return Nexmo.generateJwt(this.credentials.privateKey, claims);
    }

    /**
     * Generate a Signature Hash.
     *
     * @param {Object} params - params to generate hash from
     *
     * @returns {String} the generated token
     */

  }, {
    key: "generateSignature",
    value: function generateSignature(params) {
      return this.credentials.generateSignature(params);
    }
  }]);

  return Nexmo;
}();

/**
 * Generate a JSON Web Token (JWT).
 *
 * @param {String|Buffer} privateKey - the path to the private key certificate
 *          to be used when signing the claims.
 * @param {Object} claims - name/value pair claims to sign within the JWT
 *
 * @returns {String} the generated token
 */


Nexmo.generateJwt = function (privateKey, claims) {
  if (!(privateKey instanceof Buffer)) {
    if (!_fs2.default.existsSync(privateKey)) {
      throw new Error("File \"" + privateKey + "\" not found.");
    } else {
      privateKey = _fs2.default.readFileSync(privateKey);
    }
  }
  return jwtGeneratorInstance.generate(privateKey, claims);
};

/**
 * Generate a Signature Hash.
 *
 * @param {String} method - the method to be used when creating the hash
 * @param {String} secret - the secret to be used when creating the hash
 * @param {Object} params - params to generate hash from
 *
 * @returns {String} the generated token
 */
Nexmo.generateSignature = function (method, secret, params) {
  return hashGeneratorInstance.generate(method, secret, params);
};

exports.default = Nexmo;
module.exports = exports["default"];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9OZXhtby5qcyJdLCJuYW1lcyI6WyJqd3RHZW5lcmF0b3JJbnN0YW5jZSIsImhhc2hHZW5lcmF0b3JJbnN0YW5jZSIsIk5leG1vIiwiY3JlZGVudGlhbHMiLCJvcHRpb25zIiwiZGVidWciLCJwYXJzZSIsImxvZ2dlciIsInVzZXJBZ2VudCIsInBhY2thZ2VEZXRhaWxzIiwicmVxdWlyZSIsImpvaW4iLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwicHJvY2VzcyIsInJlcGxhY2UiLCJlIiwiY29uc29sZSIsIndhcm4iLCJhcHBlbmRUb1VzZXJBZ2VudCIsImh0dHBDbGllbnQiLCJPYmplY3QiLCJhc3NpZ24iLCJob3N0IiwiYXBpIiwicmVzdCIsIm1lc3NhZ2UiLCJ2b2ljZSIsIm51bWJlciIsInZlcmlmeSIsIm51bWJlckluc2lnaHQiLCJhcHBsaWNhdGlvbnMiLCJhY2NvdW50IiwiY2FsbHMiLCJmaWxlcyIsImNvbnZlcnNpb24iLCJtZWRpYSIsInJlZGFjdCIsInByaWNpbmciLCJhcHAiLCJjbGFpbXMiLCJhcHBsaWNhdGlvbl9pZCIsInVuZGVmaW5lZCIsImFwcGxpY2F0aW9uSWQiLCJnZW5lcmF0ZUp3dCIsInByaXZhdGVLZXkiLCJwYXJhbXMiLCJnZW5lcmF0ZVNpZ25hdHVyZSIsIkJ1ZmZlciIsImV4aXN0c1N5bmMiLCJFcnJvciIsInJlYWRGaWxlU3luYyIsImdlbmVyYXRlIiwibWV0aG9kIiwic2VjcmV0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNQSx1QkFBdUIsNEJBQTdCO0FBQ0EsSUFBTUMsd0JBQXdCLDZCQUE5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QU83QyxxQkFBcUJvRCxRQUFyQixDQUE4QlAsVUFBOUIsRUFBMENMLE1BQTFDLENBQVA7QUFDRCxDQVREOztBQVdBOzs7Ozs7Ozs7QUFTQXRDLE1BQU02QyxpQkFBTixHQUEwQixVQUFDTSxNQUFELEVBQVNDLE1BQVQsRUFBaUJSLE1BQWpCLEVBQTRCO0FBQ3BELFNBQU83QyxzQkFBc0JtRCxRQUF0QixDQUErQkMsTUFBL0IsRUFBdUNDLE1BQXZDLEVBQStDUixNQUEvQyxDQUFQO0FBQ0QsQ0FGRDs7a0JBSWU1QyxLIiwiZmlsZSI6Ik5leG1vLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuaW1wb3J0IENyZWRlbnRpYWxzIGZyb20gXCIuL0NyZWRlbnRpYWxzXCI7XG5pbXBvcnQgSnd0R2VuZXJhdG9yIGZyb20gXCIuL0p3dEdlbmVyYXRvclwiO1xuaW1wb3J0IEhhc2hHZW5lcmF0b3IgZnJvbSBcIi4vSGFzaEdlbmVyYXRvclwiO1xuaW1wb3J0IE1lc3NhZ2UgZnJvbSBcIi4vTWVzc2FnZVwiO1xuaW1wb3J0IFZvaWNlIGZyb20gXCIuL1ZvaWNlXCI7XG5pbXBvcnQgTnVtYmVyIGZyb20gXCIuL051bWJlclwiO1xuaW1wb3J0IFZlcmlmeSBmcm9tIFwiLi9WZXJpZnlcIjtcbmltcG9ydCBOdW1iZXJJbnNpZ2h0IGZyb20gXCIuL051bWJlckluc2lnaHRcIjtcbmltcG9ydCBBcHAgZnJvbSBcIi4vQXBwXCI7XG5pbXBvcnQgQWNjb3VudCBmcm9tIFwiLi9BY2NvdW50XCI7XG5pbXBvcnQgQ2FsbHNSZXNvdXJjZSBmcm9tIFwiLi9DYWxsc1Jlc291cmNlXCI7XG5pbXBvcnQgRmlsZXNSZXNvdXJjZSBmcm9tIFwiLi9GaWxlc1Jlc291cmNlXCI7XG5pbXBvcnQgQ29udmVyc2lvbiBmcm9tIFwiLi9Db252ZXJzaW9uXCI7XG5pbXBvcnQgTWVkaWEgZnJvbSBcIi4vTWVkaWFcIjtcbmltcG9ydCBSZWRhY3QgZnJvbSBcIi4vUmVkYWN0XCI7XG5pbXBvcnQgUHJpY2luZyBmcm9tIFwiLi9QcmljaW5nXCI7XG5pbXBvcnQgSHR0cENsaWVudCBmcm9tIFwiLi9IdHRwQ2xpZW50XCI7XG5pbXBvcnQgTnVsbExvZ2dlciBmcm9tIFwiLi9OdWxsTG9nZ2VyXCI7XG5pbXBvcnQgQ29uc29sZUxvZ2dlciBmcm9tIFwiLi9Db25zb2xlTG9nZ2VyXCI7XG5cbmNvbnN0IGp3dEdlbmVyYXRvckluc3RhbmNlID0gbmV3IEp3dEdlbmVyYXRvcigpO1xuY29uc3QgaGFzaEdlbmVyYXRvckluc3RhbmNlID0gbmV3IEhhc2hHZW5lcmF0b3IoKTtcblxuY2xhc3MgTmV4bW8ge1xuICAvKipcbiAgICogQHBhcmFtIHtDcmVkZW50aWFsc30gY3JlZGVudGlhbHMgLSBOZXhtbyBBUEkgY3JlZGVudGlhbHNcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNyZWRlbnRpYWxzLmFwaUtleSAtIHRoZSBOZXhtbyBBUEkga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjcmVkZW50aWFscy5hcGlTZWNyZXQgLSB0aGUgTmV4bW8gQVBJIHNlY3JldFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIEFkZGl0aW9uYWwgb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuZGVidWcgLSBgdHJ1ZWAgdG8gdHVybiBvbiBkZWJ1ZyBsb2dnaW5nXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLmxvZ2dlciAtIFNldCBhIGN1c3RvbSBsb2dnZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmFwcGVuZFRvVXNlckFnZW50IC0gQSB2YWx1ZSB0byBhcHBlbmQgdG8gdGhlIHVzZXIgYWdlbnQuXG4gICAqICAgICAgICAgICAgICAgICAgICBUaGUgdmFsdWUgd2lsbCBiZSBwcmVmaXhlZCB3aXRoIGEgYC9gXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjcmVkZW50aWFscywgb3B0aW9ucyA9IHsgZGVidWc6IGZhbHNlIH0pIHtcbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gQ3JlZGVudGlhbHMucGFyc2UoY3JlZGVudGlhbHMpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAvLyBJZiBubyBsb2dnZXIgaGFzIGJlZW4gc3VwcGxpZWQgYnV0IGRlYnVnIGhhcyBiZWVuIHNldFxuICAgIC8vIGRlZmF1bHQgdG8gdXNpbmcgdGhlIENvbnNvbGVMb2dnZXJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5sb2dnZXIgJiYgdGhpcy5vcHRpb25zLmRlYnVnKSB7XG4gICAgICB0aGlzLm9wdGlvbnMubG9nZ2VyID0gbmV3IENvbnNvbGVMb2dnZXIoKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMubG9nZ2VyKSB7XG4gICAgICAvLyBTd2FsbG93IHRoZSBsb2dnaW5nXG4gICAgICB0aGlzLm9wdGlvbnMubG9nZ2VyID0gbmV3IE51bGxMb2dnZXIoKTtcbiAgICB9XG5cbiAgICBsZXQgdXNlckFnZW50ID0gXCJuZXhtby1ub2RlL1VOS05PV04gbm9kZS9VTktOT1dOXCI7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwYWNrYWdlRGV0YWlscyA9IHJlcXVpcmUocGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLlwiLCBcInBhY2thZ2UuanNvblwiKSk7XG4gICAgICB1c2VyQWdlbnQgPSBgbmV4bW8tbm9kZS8ke1xuICAgICAgICBwYWNrYWdlRGV0YWlscy52ZXJzaW9uXG4gICAgICB9IG5vZGUvJHtwcm9jZXNzLnZlcnNpb24ucmVwbGFjZShcInZcIiwgXCJcIil9YDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJDb3VsZCBub3QgbG9hZCBwYWNrYWdlIGRldGFpbHNcIik7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucy51c2VyQWdlbnQgPSB1c2VyQWdlbnQ7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hcHBlbmRUb1VzZXJBZ2VudCkge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXJBZ2VudCArPSBgICR7dGhpcy5vcHRpb25zLmFwcGVuZFRvVXNlckFnZW50fWA7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBsZWdhY3ksIGV2ZXJ5dGhpbmcgc2hvdWxkIHVzZSByZXN0IG9yIGFwaSBnb2luZyBmb3J3YXJkXG4gICAgdGhpcy5vcHRpb25zLmh0dHBDbGllbnQgPSBuZXcgSHR0cENsaWVudChcbiAgICAgIE9iamVjdC5hc3NpZ24oeyBob3N0OiBcInJlc3QubmV4bW8uY29tXCIgfSwgdGhpcy5vcHRpb25zKSxcbiAgICAgIHRoaXMuY3JlZGVudGlhbHNcbiAgICApO1xuXG4gICAgLy8gV2UgaGF2ZSB0d28gZGlmZmVyZW50IGhvc3RzLCBzbyB3ZSB1c2UgdHdvIGRpZmZlcmVudCBIdHRwQ2xpZW50c1xuICAgIHRoaXMub3B0aW9ucy5hcGkgPSBuZXcgSHR0cENsaWVudChcbiAgICAgIE9iamVjdC5hc3NpZ24oeyBob3N0OiBcImFwaS5uZXhtby5jb21cIiB9LCB0aGlzLm9wdGlvbnMpLFxuICAgICAgdGhpcy5jcmVkZW50aWFsc1xuICAgICk7XG4gICAgdGhpcy5vcHRpb25zLnJlc3QgPSBuZXcgSHR0cENsaWVudChcbiAgICAgIE9iamVjdC5hc3NpZ24oeyBob3N0OiBcInJlc3QubmV4bW8uY29tXCIgfSwgdGhpcy5vcHRpb25zKSxcbiAgICAgIHRoaXMuY3JlZGVudGlhbHNcbiAgICApO1xuXG4gICAgdGhpcy5tZXNzYWdlID0gbmV3IE1lc3NhZ2UodGhpcy5jcmVkZW50aWFscywgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLnZvaWNlID0gbmV3IFZvaWNlKHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5udW1iZXIgPSBuZXcgTnVtYmVyKHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy52ZXJpZnkgPSBuZXcgVmVyaWZ5KHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5udW1iZXJJbnNpZ2h0ID0gbmV3IE51bWJlckluc2lnaHQodGhpcy5jcmVkZW50aWFscywgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLmFwcGxpY2F0aW9ucyA9IG5ldyBBcHAodGhpcy5jcmVkZW50aWFscywgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLmFjY291bnQgPSBuZXcgQWNjb3VudCh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuY2FsbHMgPSBuZXcgQ2FsbHNSZXNvdXJjZSh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuZmlsZXMgPSBuZXcgRmlsZXNSZXNvdXJjZSh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuY29udmVyc2lvbiA9IG5ldyBDb252ZXJzaW9uKHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5tZWRpYSA9IG5ldyBNZWRpYSh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMucmVkYWN0ID0gbmV3IFJlZGFjdCh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMucHJpY2luZyA9IG5ldyBQcmljaW5nKHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG5cbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBQbGVhc2UgdXNlIG5leG1vLmFwcGxpY2F0aW9uc1xuICAgICAqL1xuICAgIHRoaXMuYXBwID0gdGhpcy5hcHBsaWNhdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBKU09OIFdlYiBUb2tlbiAoSldUKS5cbiAgICpcbiAgICogVGhlIHByaXZhdGUga2V5IHVzZWQgdXBvbiBOZXhtbyBpbnN0YW5jZSBjb25zdHJ1Y3Rpb24gd2lsbCBiZSB1c2VkIHRvIHNpZ25cbiAgICogdGhlIEpXVC4gVGhlIGFwcGxpY2F0aW9uX2lkIHlvdSB1c2VkIHVwb24gTmV4bW8gaW5zdGFuY2UgY3JlYXRpb24gd2lsbCBiZVxuICAgKiBpbmNsdWRlZCBpbiB0aGUgY2xhaW1zIGZvciB0aGUgSldULCBob3dldmVyIHRoaXMgY2FuIGJlIG92ZXJyaWRkZW4gYnkgcGFzc2luZ1xuICAgKiBhbiBhcHBsaWNhdGlvbl9pZCBhcyBwYXJ0IG9mIHRoZSBjbGFpbXMuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjbGFpbXMgLSBuYW1lL3ZhbHVlIHBhaXIgY2xhaW1zIHRvIHNpZ24gd2l0aGluIHRoZSBKV1RcbiAgICpcbiAgICogQHJldHVybnMge1N0cmluZ30gdGhlIGdlbmVyYXRlZCB0b2tlblxuICAgKi9cblxuICBnZW5lcmF0ZUp3dChjbGFpbXMgPSB7fSkge1xuICAgIGlmIChjbGFpbXMuYXBwbGljYXRpb25faWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY2xhaW1zLmFwcGxpY2F0aW9uX2lkID0gdGhpcy5jcmVkZW50aWFscy5hcHBsaWNhdGlvbklkO1xuICAgIH1cbiAgICByZXR1cm4gTmV4bW8uZ2VuZXJhdGVKd3QodGhpcy5jcmVkZW50aWFscy5wcml2YXRlS2V5LCBjbGFpbXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgU2lnbmF0dXJlIEhhc2guXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBwYXJhbXMgdG8gZ2VuZXJhdGUgaGFzaCBmcm9tXG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IHRoZSBnZW5lcmF0ZWQgdG9rZW5cbiAgICovXG4gIGdlbmVyYXRlU2lnbmF0dXJlKHBhcmFtcykge1xuICAgIHJldHVybiB0aGlzLmNyZWRlbnRpYWxzLmdlbmVyYXRlU2lnbmF0dXJlKHBhcmFtcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIEpTT04gV2ViIFRva2VuIChKV1QpLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlcn0gcHJpdmF0ZUtleSAtIHRoZSBwYXRoIHRvIHRoZSBwcml2YXRlIGtleSBjZXJ0aWZpY2F0ZVxuICogICAgICAgICAgdG8gYmUgdXNlZCB3aGVuIHNpZ25pbmcgdGhlIGNsYWltcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjbGFpbXMgLSBuYW1lL3ZhbHVlIHBhaXIgY2xhaW1zIHRvIHNpZ24gd2l0aGluIHRoZSBKV1RcbiAqXG4gKiBAcmV0dXJucyB7U3RyaW5nfSB0aGUgZ2VuZXJhdGVkIHRva2VuXG4gKi9cbk5leG1vLmdlbmVyYXRlSnd0ID0gKHByaXZhdGVLZXksIGNsYWltcykgPT4ge1xuICBpZiAoIShwcml2YXRlS2V5IGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwcml2YXRlS2V5KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWxlIFwiJHtwcml2YXRlS2V5fVwiIG5vdCBmb3VuZC5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJpdmF0ZUtleSA9IGZzLnJlYWRGaWxlU3luYyhwcml2YXRlS2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGp3dEdlbmVyYXRvckluc3RhbmNlLmdlbmVyYXRlKHByaXZhdGVLZXksIGNsYWltcyk7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgU2lnbmF0dXJlIEhhc2guXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZCAtIHRoZSBtZXRob2QgdG8gYmUgdXNlZCB3aGVuIGNyZWF0aW5nIHRoZSBoYXNoXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VjcmV0IC0gdGhlIHNlY3JldCB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgdGhlIGhhc2hcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgLSBwYXJhbXMgdG8gZ2VuZXJhdGUgaGFzaCBmcm9tXG4gKlxuICogQHJldHVybnMge1N0cmluZ30gdGhlIGdlbmVyYXRlZCB0b2tlblxuICovXG5OZXhtby5nZW5lcmF0ZVNpZ25hdHVyZSA9IChtZXRob2QsIHNlY3JldCwgcGFyYW1zKSA9PiB7XG4gIHJldHVybiBoYXNoR2VuZXJhdG9ySW5zdGFuY2UuZ2VuZXJhdGUobWV0aG9kLCBzZWNyZXQsIHBhcmFtcyk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOZXhtbztcbiJdfQ==