import axios from 'axios';
import { config } from '../config/index.js';

export class ZoomService {
  private static accessToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  private static async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const { accountId, clientId, clientSecret } = config.zoom;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    this.accessToken = response.data.access_token;
    // Buffer of 60 seconds
    this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

    return this.accessToken!;
  }

  static async getMeetingSummary(meetingUuid: string) {
    const token = await this.getAccessToken();
    const response = await axios.get(
      `https://api.zoom.us/v2/meetings/${meetingUuid}/meeting_summary`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }

  static async getMeetingDetails(meetingId: string) {
    const token = await this.getAccessToken();
    const response = await axios.get(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  }
}
