import http from 'k6/http';
import { sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { getBaseUrl, randomEmail, randomHabitName, register, login, createHabit } from './Helpers/utils.js';

const postHabitTrend = new Trend('post_habit_duration');

export let options = {
    stages:[
        { duration: '5s', target: 5 },
        { duration: '5s', target: 10 },
        { duration: '5s', target: 0 },
    ],
  //vus: 10,
  //duration: '15s',
  thresholds: {
    // overall HTTP request 95th percentile must be < 2000ms
    'http_req_duration': ['p(95)<2000'],
    // custom trend for POST /habits
    'post_habit_duration': ['p(95)<2000'],
    // ensure the checks pass at an acceptable rate (optional)
    'checks': ['rate>0.95'],
  },
};

export default function () {
  const baseUrl = getBaseUrl();

  group('Register -> Login -> Create Habit', () => {
    const email = randomEmail();
    const password = 'Pass123!';

    group('Register', () => {
      // register must return 201 (created)
      register(baseUrl, email, password);
    });

    let token = null;
    group('Login', () => {
      const res = login(baseUrl, email, password);
      try {
        token = res.json('token');
      } catch (e) {
        token = null;
      }
    });

    group('Create Habit', () => {
      const habitName = randomHabitName();
      const res = (() => {
        const start = Date.now();
        const r = createHabit(baseUrl, token, habitName);
        const duration = r && r.timings && r.timings.duration ? r.timings.duration : 0;
        postHabitTrend.add(duration);
        return r;
      })();

      // createHabit helper already checks for 201; if you want to allow existing habits, adapt the check in helper
    });
  });

  sleep(1);
}
