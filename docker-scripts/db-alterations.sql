-- CREATE EXTENSION IF NOT EXISTS postgis;


-- ALTER TABLE "BoardingHouse" ALTER COLUMN "amenities" TYPE jsonb USING "amenities"::jsonb;
-- ALTER TABLE "AuditLog" ALTER COLUMN "user" TYPE jsonb USING "user"::jsonb;

-- UPDATE "BoardingHouse" SET "amenities" = '[]'::jsonb WHERE "amenities" IS NULL;
-- UPDATE "AuditLog" SET "user" = '{}'::jsonb WHERE "user" IS NULL;

-- CREATE INDEX IF NOT EXISTS gin_idx_boardinghouse_amenities ON "BoardingHouse" USING GIN ("amenities");
-- CREATE INDEX IF NOT EXISTS gin_idx_auditlog_user ON "AuditLog" USING GIN ("user");

-- ALTER TABLE "Image" ADD CONSTRAINT check_one_relation CHECK (
--   "boardingHouseId" IS NOT NULL OR
--   "roomId" IS NOT NULL OR
--   "ownerId" IS NOT NULL OR
--   "tenantId" IS NOT NULL OR
--   "adminId" IS NOT NULL
);
-- ALTER TABLE "Image" ADD CONSTRAINT IF NOT EXISTS check_one_relation CHECK (
--   "boardingHouseId" IS NOT NULL OR
--   "roomId" IS NOT NULL OR
--   "ownerId" IS NOT NULL OR
--   "tenantId" IS NOT NULL OR
--   "adminId" IS NOT NULL
-- );

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "BoardingHouse" ALTER COLUMN "amenities" TYPE jsonb USING COALESCE("amenities"::jsonb, '[]'::jsonb);

ALTER TABLE "Room" ALTER COLUMN "tags" TYPE jsonb USING COALESCE("tags"::jsonb, '[]'::jsonb);

ALTER TABLE "AuditLog" ALTER COLUMN "user" TYPE jsonb USING COALESCE("user"::jsonb, '{}'::jsonb);

ALTER TABLE "AuditLog" ALTER COLUMN "meta" TYPE jsonb USING COALESCE("meta"::jsonb, '{}'::jsonb);

CREATE INDEX IF NOT EXISTS gin_idx_boardinghouse_amenities ON "BoardingHouse" USING GIN ("amenities");

CREATE INDEX IF NOT EXISTS gin_idx_room_tags ON "Room" USING GIN ("tags");

CREATE INDEX IF NOT EXISTS gin_idx_auditlog_user ON "AuditLog" USING GIN ("user");

CREATE INDEX IF NOT EXISTS gin_idx_auditlog_meta ON "AuditLog" USING GIN ("meta");

ALTER TABLE "Image" DROP CONSTRAINT IF EXISTS check_image_has_entity;
ALTER TABLE "Image" ADD CONSTRAINT check_image_has_entity CHECK ("entityId" IS NOT NULL);

