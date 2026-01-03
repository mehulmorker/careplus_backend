-- AlterTable: Make password optional
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;


