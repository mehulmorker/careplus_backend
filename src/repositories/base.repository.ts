import { PrismaClient } from "@prisma/client";

/**
 * Base Repository Interface
 *
 * Defines the contract that all repositories must implement.
 * Following Interface Segregation Principle (ISP) - clients only depend on methods they use.
 *
 * @template T - The entity type
 * @template CreateInput - Input type for creating entities
 * @template UpdateInput - Input type for updating entities
 */
export interface IBaseRepository<T, CreateInput, UpdateInput> {
  /**
   * Find a single entity by its unique identifier
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities (with optional filtering in subclasses)
   */
  findAll(): Promise<T[]>;

  /**
   * Create a new entity
   */
  create(data: CreateInput): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Delete an entity by its identifier
   */
  delete(id: string): Promise<T>;
}

/**
 * Abstract Base Repository
 *
 * Provides common functionality for all repositories.
 * Following Open/Closed Principle (OCP) - open for extension, closed for modification.
 *
 * Why Abstract Class?
 * - Allows sharing common code (prisma client)
 * - Enforces implementation of abstract methods
 * - Provides template for consistent repository structure
 *
 * @template T - The Prisma model type
 * @template CreateInput - Prisma create input type
 * @template UpdateInput - Prisma update input type
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput>
  implements IBaseRepository<T, CreateInput, UpdateInput>
{
  /**
   * Protected Prisma client - accessible to subclasses only
   * Following Dependency Inversion Principle (DIP) - depend on abstraction (PrismaClient)
   */
  protected readonly prisma: PrismaClient;

  /**
   * Constructor with dependency injection
   *
   * @param prisma - Prisma client instance (injected)
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Abstract methods - must be implemented by subclasses
   * Each repository knows how to interact with its specific model
   */
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<T>;
}

/**
 * Repository Factory Type
 *
 * Useful for dependency injection and testing.
 * Allows creating repositories with a specific Prisma client instance.
 */
export type RepositoryFactory<R> = (prisma: PrismaClient) => R;

