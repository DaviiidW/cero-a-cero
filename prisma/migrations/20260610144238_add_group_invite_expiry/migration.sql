/*
  Warnings:

  - Added the required column `inviteExpiresAt` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3) NOT NULL;
