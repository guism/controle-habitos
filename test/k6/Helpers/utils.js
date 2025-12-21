import http from 'k6/http';
import { check } from 'k6';

export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}

export function randomEmail() {
  return `user_${Math.random().toString(36).slice(2,10)}@example.com`;
}

export function randomHabitName() {
  return `Novo Hábito ${Math.random().toString(36).slice(2,10)}`;
}

export function register(baseUrl, username, password = 'Pass123!') {
  const url = `${baseUrl}/users/register`;
  const payload = JSON.stringify({ username, password });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);
  check(res, {
    'register: status is 201': (r) => r.status === 201,
  });
  return res;
}

export function login(baseUrl, username, password = 'Pass123!') {
  const url = `${baseUrl}/users/login`;
  const payload = JSON.stringify({ username, password });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);
  check(res, {
    'login: status is 200': (r) => r.status === 200,
    'login: has token': (r) => {
      try {
        return !!r.json('token');
      } catch (e) {
        return false;
      }
    },
  });
  return res;
}

export function createHabit(baseUrl, token, habitName) {
  const url = `${baseUrl}/habits`;
  const payload = JSON.stringify({ habitName });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const res = http.post(url, payload, params);
  check(res, {
    'create habit: status is 201': (r) => r.status === 201,
  });
  return res;
}
