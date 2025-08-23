const redisClient = require('../config/redis');

class CacheService {
  constructor() {
    this.client = redisClient;
  }

  // Set cache with expiration
  async set(key, value, expirationSeconds = 900) { // Default 15 minutes
    try {
      if (!this.client || !this.client.isOpen) return false;
      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, expirationSeconds, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get cache value
  async get(key) {
    try {
      if (!this.client || !this.client.isOpen) return null;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache key
  async del(key) {
    try {
      if (!this.client || !this.client.isOpen) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete multiple cache keys by pattern
  async delPattern(pattern) {
    try {
      if (!this.client || !this.client.isOpen) return false;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (!this.client || !this.client.isOpen) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Set cache with different expiration times
  async setUserAnalytics(userId, data) {
    return this.set(`analytics:user:${userId}`, data, 900); // 15 minutes
  }

  async setCategories(data) {
    return this.set('categories:all', data, 3600); // 1 hour
  }

  async setTransactionList(userId, filters, data) {
    const filterKey = JSON.stringify(filters);
    return this.set(`transactions:user:${userId}:${filterKey}`, data, 300); // 5 minutes
  }

  // Get cached data
  async getUserAnalytics(userId) {
    return this.get(`analytics:user:${userId}`);
  }

  async getCategories() {
    return this.get('categories:all');
  }

  async getTransactionList(userId, filters) {
    const filterKey = JSON.stringify(filters);
    return this.get(`transactions:user:${userId}:${filterKey}`);
  }

  // Invalidate cache
  async invalidateUserAnalytics(userId) {
    return this.del(`analytics:user:${userId}`);
  }

  async invalidateCategories() {
    return this.del('categories:all');
  }

  async invalidateUserTransactions(userId) {
    return this.delPattern(`transactions:user:${userId}:*`);
  }

  // Invalidate all user-related cache
  async invalidateUserCache(userId) {
    await this.invalidateUserAnalytics(userId);
    await this.invalidateUserTransactions(userId);
  }
}

module.exports = new CacheService();
