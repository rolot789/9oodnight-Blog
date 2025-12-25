-- Add tags column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

-- Add GIN index for faster array searching (for the @> operator or similar)
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN (tags);
