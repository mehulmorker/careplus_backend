import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { env, connectDatabase, disconnectDatabase } from "./config";
import { initializeEmailService } from "./config/email";
import { initializeCloudinary } from "./config/cloudinary";
import { logger } from "./utils/logger";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { createContext, Context } from "./graphql/context";

async function startServer() {
  // Create Express app
  const app = express();

  // Connect to database
  await connectDatabase();

  // Initialize email service
  initializeEmailService();

  // Initialize Cloudinary
  initializeCloudinary();

  // Create GraphQL schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create Apollo Server
  const server = new ApolloServer<Context>({
    schema,
    csrfPrevention: false, // Disable CSRF protection for API usage
    formatError: (formattedError, error) => {
      logger.error("GraphQL Error", {
        message: formattedError.message,
        path: formattedError.path as unknown as string,
        extensions: formattedError.extensions as Record<string, unknown>,
      });

      // Don't expose internal errors in production
      if (env.NODE_ENV === "production") {
        if (formattedError.extensions?.code === "INTERNAL_SERVER_ERROR") {
          return {
            message: "An internal error occurred",
            extensions: { code: "INTERNAL_ERROR" },
          };
        }
      }

      return formattedError;
    },
  });

  // Start Apollo Server
  await server.start();

  // Middleware
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    })
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req: express.Request, res: express.Response): void => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GraphQL endpoint
  app.use(
    "/graphql",
    // @ts-expect-error - Apollo Server expressMiddleware types conflict with Express types
    expressMiddleware(server, {
      context: async ({ req, res }) => createContext({ req, res }),
    })
  );

  // Start listening
  app.listen(env.PORT, () => {
    logger.info(`🚀 Server ready at http://${env.HOST}:${env.PORT}/graphql`);
    logger.info(`📊 Health check at http://${env.HOST}:${env.PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down gracefully...");
    await server.stop();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Start the server
startServer().catch((error) => {
  logger.error("Failed to start server", { error });
  process.exit(1);
});
