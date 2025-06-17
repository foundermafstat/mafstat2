-- CreateTable
CREATE TABLE "ratings" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "owner_id" INTEGER,
    "club_id" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_games" (
    "id" SERIAL NOT NULL,
    "rating_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_results" (
    "id" SERIAL NOT NULL,
    "rating_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "civilian_wins" INTEGER NOT NULL DEFAULT 0,
    "mafia_wins" INTEGER NOT NULL DEFAULT 0,
    "don_games" INTEGER NOT NULL DEFAULT 0,
    "sheriff_games" INTEGER NOT NULL DEFAULT 0,
    "first_outs" INTEGER NOT NULL DEFAULT 0,
    "best_move" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rating_games_rating_id_game_id_key" ON "rating_games"("rating_id", "game_id");

-- CreateIndex
CREATE UNIQUE INDEX "rating_results_rating_id_player_id_key" ON "rating_results"("rating_id", "player_id");

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_games" ADD CONSTRAINT "rating_games_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "ratings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_games" ADD CONSTRAINT "rating_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_results" ADD CONSTRAINT "rating_results_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "ratings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_results" ADD CONSTRAINT "rating_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
