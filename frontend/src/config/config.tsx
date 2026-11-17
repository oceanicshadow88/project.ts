/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-import-module-exports */

export default {
  apiAddressV2:
    process.env.REACT_APP_BACKEND_URL ??
    process.env.REACT_APP_BACKEND_URL_V2 ??
    'https://afternoon-fortress-36104.herokuapp.com/api/v2',
  apiAddressV1:
    process.env.REACT_APP_BACKEND_URL ??
    process.env.REACT_APP_BACKEND_URL_V2 ??
    'https://afternoon-fortress-36104.herokuapp.com/api/v1',
  kScrumAddress: 'https://be-kscrum-production.up.railway.app/api/v1',
  isCI: process.env.REACT_APP_CI ?? false,
  apiKToken: process.env.REACT_APP_KSCRUM_API_TOKEN ?? 'your_api_token_secret_here',
  socketUrl: process.env.REACT_APP_SOCKET_URL ?? 'http://localhost:8000'
};
