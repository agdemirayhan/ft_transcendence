CREATE TABLE "users" (
	"id" SERIAL NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"email" TEXT NOT NULL,
	"username" TEXT,
	"twoFA" BOOLEAN DEFAULT false,
	"following" INTEGER DEFAULT 0,
	"followers" INTEGER DEFAULT 0,
	"likes" INTEGER DEFAULT 0,
	"blocked" INTEGER[],
	"blocking" INTEGER[],
);

CREATE TABLE "Msg" (
	"id" SERIAL NOT NULL,
	"msg" TEXT NOT NULL,
	"history" TEXT[],
	"seen" BOOLEAN NOT NULL DEFAULT false,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"partnerid" SERIAL NOT NULL,
);

CREATE UNIQUE INDEX "users_email_key" on "users"("email");

CREATE UNIQUE INDEX "users_username_key" on "users"("username");

CREATE UNIQUE INDEX "users_id_email_key" on "users"("id", "email");
