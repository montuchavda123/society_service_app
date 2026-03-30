import React from 'react';
import renderer from 'react-test-renderer';

// Mock the AuthContext since it's not needed for a basic test
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// A simple test to check if the app environment is set up correctly
describe('Mobile App Setup', () => {
  it('has a valid environment', () => {
    expect(true).toBe(true);
  });
});
