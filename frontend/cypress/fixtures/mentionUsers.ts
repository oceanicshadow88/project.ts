import { IUserInfo } from '../../src/types';

// 11 project members: more than the 8 rows the dropdown shows, and two people named Alex Chen.
export const mentionUsers: IUserInfo[] = [
  { id: 'u-alice', name: 'Alice Wang', email: 'alice.wang@example.com', backgroundColor: '#6a2add' },
  { id: 'u-alex', name: 'Alex Chen', email: 'alex.chen@example.com', backgroundColor: '#1971c2' },
  { id: 'u-ben', name: 'Ben Zhou', email: 'ben.zhou@example.com', backgroundColor: '#0b8f6a' },
  { id: 'u-chloe', name: 'Chloe Li', email: 'xiaoli@example.com', backgroundColor: '#c2255c' },
  { id: 'u-daniel', name: 'Daniel Park', email: 'daniel.park@example.com', backgroundColor: '#d9480f' },
  { id: 'u-emily', name: 'Emily Nguyen', email: 'emily.n@example.com', backgroundColor: '#5c7cfa' },
  { id: 'u-jerry', name: 'Jerry Huang', email: 'jerry.huang@example.com', backgroundColor: '#862e9c' },
  { id: 'u-kevin', name: 'Kevin Smith', email: 'kevin.smith@example.com', backgroundColor: '#e67700' },
  { id: 'u-lucy', name: 'Lucy Tan', email: 'lucy.tan@example.com', backgroundColor: '#2b8a3e' },
  { id: 'u-natalie', name: 'Natalie Brown', email: 'natalie.b@example.com', backgroundColor: '#495057' },
  { id: 'u-alex-2', name: 'Alex Chen', email: 'alexc.design@example.com', backgroundColor: '#d9480f' }
];

export const BRAND_PURPLE = 'rgb(106, 42, 221)';

// TipTap's "Mod" is Cmd on macOS and Ctrl elsewhere.
export const MOD_ENTER = Cypress.platform === 'darwin' ? '{cmd}{enter}' : '{ctrl}{enter}';
