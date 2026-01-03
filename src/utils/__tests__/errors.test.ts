/**
 * Tests for custom error classes
 */
import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have correct name', () => {
      const error = new AppError('Test', 'TEST', 500);
      expect(error.name).toBe('AppError');
    });
  });

  describe('NotFoundError', () => {
    it('should create error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with resource name and id', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe("User with id '123' not found");
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    it('should create error with default values', () => {
      const error = new ValidationError('Invalid email');

      expect(error.message).toBe('Invalid email');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('AuthenticationError', () => {
    it('should create error with default values', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error.message).toBe('Invalid token');
      expect(error.code).toBe('UNAUTHENTICATED');
      expect(error.statusCode).toBe(401);
      expect(error).toBeInstanceOf(AuthenticationError);
    });
  });

  describe('AuthorizationError', () => {
    it('should create error with default values', () => {
      const error = new AuthorizationError('Access denied');

      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
      expect(error).toBeInstanceOf(AuthorizationError);
    });
  });
});

