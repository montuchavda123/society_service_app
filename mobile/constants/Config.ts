const BASE_URL = 'http://10.183.95.133:5000/api';

export default {
  BASE_URL,
  ENDPOINTS: {
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    SOCIETY_REGISTER: `${BASE_URL}/society/register`,
    SOCIETY_JOIN: `${BASE_URL}/society/join`,
    COMPLAINTS: `${BASE_URL}/complaints`,
    PROCESS_VOICE: `${BASE_URL}/ai/process-voice`,
  }
};
