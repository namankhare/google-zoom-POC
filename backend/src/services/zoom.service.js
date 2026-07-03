"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomService = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../config/index");
class ZoomService {
    static accessToken = null;
    static tokenExpiresAt = 0;
    static async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }
        const { accountId, clientId, clientSecret } = index_1.config.zoom;
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await axios_1.default.post(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {}, {
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        this.accessToken = response.data.access_token;
        // Buffer of 60 seconds
        this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
        return this.accessToken;
    }
    static async getMeetingSummary(meetingUuid) {
        const token = await this.getAccessToken();
        const response = await axios_1.default.get(`https://api.zoom.us/v2/meetings/${meetingUuid}/meeting_summary`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
    static async getMeetingDetails(meetingId) {
        const token = await this.getAccessToken();
        const response = await axios_1.default.get(`https://api.zoom.us/v2/meetings/${meetingId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
}
exports.ZoomService = ZoomService;
//# sourceMappingURL=zoom.service.js.map