-- CreateTable
CREATE TABLE "federations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(255),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "additional_points_conditions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "federations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(255),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "federation_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP,
    "password" TEXT,
    "image" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "surname" VARCHAR(100),
    "nickname" VARCHAR(100),
    "country" VARCHAR(100),
    "club_id" INTEGER,
    "birthday" DATE,
    "gender" VARCHAR(20),
    "is_tournament_judge" BOOLEAN NOT NULL DEFAULT false,
    "is_side_judge" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" VARCHAR(255),
    "scope" VARCHAR(255),
    "id_token" TEXT,
    "session_state" VARCHAR(255),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "game_type" VARCHAR(50) NOT NULL,
    "result" VARCHAR(50),
    "referee_id" INTEGER,
    "referee_comments" TEXT,
    "table_number" INTEGER,
    "club_id" INTEGER,
    "federation_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100) NOT NULL,
    "nickname" VARCHAR(100),
    "country" VARCHAR(100),
    "club_id" INTEGER,
    "birthday" TIMESTAMP,
    "gender" VARCHAR(20),
    "photo_url" VARCHAR(255),
    "is_tournament_judge" BOOLEAN NOT NULL DEFAULT false,
    "is_side_judge" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_players" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "fouls" INTEGER NOT NULL DEFAULT 0,
    "additional_points" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "slot_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_stages" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "order_number" INTEGER NOT NULL,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_networks" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_side_referees" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_side_referees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "game_players_game_id_slot_number_key" ON "game_players"("game_id", "slot_number");

-- CreateIndex
CREATE UNIQUE INDEX "game_players_game_id_player_id_key" ON "game_players"("game_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_side_referees_game_id_player_id_key" ON "game_side_referees"("game_id", "player_id");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_federation_id_fkey" FOREIGN KEY ("federation_id") REFERENCES "federations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_federation_id_fkey" FOREIGN KEY ("federation_id") REFERENCES "federations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_stages" ADD CONSTRAINT "game_stages_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_networks" ADD CONSTRAINT "social_networks_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_side_referees" ADD CONSTRAINT "game_side_referees_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_side_referees" ADD CONSTRAINT "game_side_referees_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
