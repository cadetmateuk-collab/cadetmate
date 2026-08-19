-- Community feature: posts, comments, votes, categories, tags, moderation

-- Enums
CREATE TYPE community_content_status AS ENUM ('published', 'removed', 'flagged', 'pending');
CREATE TYPE community_vote_target AS ENUM ('post', 'comment');
CREATE TYPE community_moderation_action AS ENUM ('approved', 'blocked', 'flagged');

-- Extend user stats (linked to existing profiles)
CREATE TABLE community_user_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  karma_score INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE post_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#2966f4',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES post_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 300),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 50000),
  vote_score INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  hot_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  status community_content_status NOT NULL DEFAULT 'published',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post-tag junction
CREATE TABLE post_tag_assignments (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES post_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Comments (nested via parent_id)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  vote_score INTEGER NOT NULL DEFAULT 0,
  depth INTEGER NOT NULL DEFAULT 0 CHECK (depth >= 0 AND depth <= 10),
  status community_content_status NOT NULL DEFAULT 'published',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes (one per user per target)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type community_vote_target NOT NULL,
  target_id UUID NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

-- Moderation logs
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type community_vote_target NOT NULL,
  content_id UUID,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  action community_moderation_action NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  toxicity_score DOUBLE PRECISION,
  explanation TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_hot_score ON posts(hot_score DESC) WHERE is_deleted = false AND status = 'published';
CREATE INDEX idx_posts_vote_score ON posts(vote_score DESC) WHERE is_deleted = false AND status = 'published';
CREATE INDEX idx_posts_status ON posts(status) WHERE is_deleted = false;
CREATE INDEX idx_posts_search ON posts USING gin (to_tsvector('english', title || ' ' || body));

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

CREATE INDEX idx_votes_target ON votes(target_type, target_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

CREATE INDEX idx_moderation_logs_content ON moderation_logs(content_type, content_id);
CREATE INDEX idx_moderation_logs_user_id ON moderation_logs(user_id);

-- Hot score calculation (Reddit-style)
CREATE OR REPLACE FUNCTION community_calc_hot_score(score INTEGER, created TIMESTAMPTZ)
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE AS $$
  SELECT
    CASE
      WHEN score > 0 THEN log(greatest(score, 1)::double precision)
      WHEN score < 0 THEN -log(greatest(abs(score), 1)::double precision)
      ELSE 0
    END + extract(epoch FROM created) / 45000.0;
$$;

-- Update post hot_score
CREATE OR REPLACE FUNCTION community_update_post_hot_score()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.hot_score := community_calc_hot_score(NEW.vote_score, NEW.created_at);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_posts_hot_score
  BEFORE INSERT OR UPDATE OF vote_score ON posts
  FOR EACH ROW EXECUTE FUNCTION community_update_post_hot_score();

-- Ensure community_user_profiles row exists
CREATE OR REPLACE FUNCTION community_ensure_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO community_user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_community_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION community_ensure_user_profile();

-- Backfill existing profiles
INSERT INTO community_user_profiles (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Post count maintenance
CREATE OR REPLACE FUNCTION community_on_post_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
    INSERT INTO community_user_profiles (user_id, post_count)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      post_count = community_user_profiles.post_count + 1,
      updated_at = now();
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE community_user_profiles SET post_count = GREATEST(post_count - 1, 0), updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE community_user_profiles SET post_count = post_count + 1, updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = false THEN
    UPDATE community_user_profiles SET post_count = GREATEST(post_count - 1, 0), updated_at = now()
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_posts_user_count
  AFTER INSERT OR UPDATE OF is_deleted OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION community_on_post_change();

-- Comment count on posts + user comment count
CREATE OR REPLACE FUNCTION community_on_comment_insert()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_deleted = false THEN
    UPDATE posts SET comment_count = comment_count + 1, updated_at = now()
    WHERE id = NEW.post_id;
    INSERT INTO community_user_profiles (user_id, comment_count)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      comment_count = community_user_profiles.comment_count + 1,
      updated_at = now();
  END IF;
  IF NEW.parent_id IS NOT NULL THEN
    NEW.depth := (SELECT depth + 1 FROM comments WHERE id = NEW.parent_id);
  ELSE
    NEW.depth := 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION community_on_comment_update_delete()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0), updated_at = now()
      WHERE id = NEW.post_id;
      UPDATE community_user_profiles SET comment_count = GREATEST(comment_count - 1, 0), updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE posts SET comment_count = comment_count + 1, updated_at = now()
      WHERE id = NEW.post_id;
      UPDATE community_user_profiles SET comment_count = comment_count + 1, updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_deleted = false THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0), updated_at = now()
    WHERE id = OLD.post_id;
    UPDATE community_user_profiles SET comment_count = GREATEST(comment_count - 1, 0), updated_at = now()
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_comments_before_insert
  BEFORE INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION community_on_comment_insert();

CREATE TRIGGER trg_comments_after_change
  AFTER UPDATE OF is_deleted OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION community_on_comment_update_delete();

-- Vote score aggregation + karma
CREATE OR REPLACE FUNCTION community_recalculate_vote_score(p_target_type community_vote_target, p_target_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_score INTEGER;
  content_owner UUID;
BEGIN
  SELECT COALESCE(SUM(value), 0) INTO new_score
  FROM votes WHERE target_type = p_target_type AND target_id = p_target_id;

  IF p_target_type = 'post' THEN
    UPDATE posts SET vote_score = new_score, updated_at = now() WHERE id = p_target_id
    RETURNING user_id INTO content_owner;
  ELSE
    UPDATE comments SET vote_score = new_score, updated_at = now() WHERE id = p_target_id
    RETURNING user_id INTO content_owner;
  END IF;

  -- Update karma for content owner
  IF content_owner IS NOT NULL THEN
    UPDATE community_user_profiles SET
      karma_score = (
        SELECT COALESCE(SUM(p.vote_score), 0) FROM posts p WHERE p.user_id = content_owner AND p.is_deleted = false
      ) + (
        SELECT COALESCE(SUM(c.vote_score), 0) FROM comments c WHERE c.user_id = content_owner AND c.is_deleted = false
      ),
      updated_at = now()
    WHERE user_id = content_owner;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION community_on_vote_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM community_recalculate_vote_score(NEW.target_type, NEW.target_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM community_recalculate_vote_score(NEW.target_type, NEW.target_id);
    IF OLD.target_id <> NEW.target_id OR OLD.target_type <> NEW.target_type THEN
      PERFORM community_recalculate_vote_score(OLD.target_type, OLD.target_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM community_recalculate_vote_score(OLD.target_type, OLD.target_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_votes_change
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION community_on_vote_change();

-- Rate limiting helper
CREATE OR REPLACE FUNCTION community_check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_count INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  IF p_action = 'post' THEN
    SELECT COUNT(*) INTO recent_count FROM posts
    WHERE user_id = p_user_id AND created_at > now() - (p_window_minutes || ' minutes')::interval;
  ELSE
    SELECT COUNT(*) INTO recent_count FROM comments
    WHERE user_id = p_user_id AND created_at > now() - (p_window_minutes || ' minutes')::interval;
  END IF;
  RETURN recent_count < p_max_count;
END;
$$;

-- RLS
ALTER TABLE community_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is admin
CREATE OR REPLACE FUNCTION community_is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- community_user_profiles policies
CREATE POLICY "community_profiles_read" ON community_user_profiles FOR SELECT USING (true);
CREATE POLICY "community_profiles_update_own" ON community_user_profiles FOR UPDATE USING (user_id = auth.uid());

-- post_categories: read all, admin write
CREATE POLICY "categories_read" ON post_categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON post_categories FOR ALL USING (community_is_admin());

-- post_tags: read all, authenticated create
CREATE POLICY "tags_read" ON post_tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON post_tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- posts policies
CREATE POLICY "posts_read" ON posts FOR SELECT USING (
  (status = 'published' AND is_deleted = false)
  OR user_id = auth.uid()
  OR community_is_admin()
);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = auth.uid() AND status IN ('published', 'pending', 'flagged')
);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (user_id = auth.uid() OR community_is_admin());
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (user_id = auth.uid() OR community_is_admin());

-- post_tag_assignments
CREATE POLICY "tag_assignments_read" ON post_tag_assignments FOR SELECT USING (true);
CREATE POLICY "tag_assignments_write" ON post_tag_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND (posts.user_id = auth.uid() OR community_is_admin()))
);

-- comments policies
CREATE POLICY "comments_read" ON comments FOR SELECT USING (
  (status = 'published' AND is_deleted = false)
  OR user_id = auth.uid()
  OR community_is_admin()
);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);
CREATE POLICY "comments_update_own" ON comments FOR UPDATE USING (user_id = auth.uid() OR community_is_admin());
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (user_id = auth.uid() OR community_is_admin());

-- votes policies
CREATE POLICY "votes_read" ON votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "votes_update_own" ON votes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "votes_delete_own" ON votes FOR DELETE USING (user_id = auth.uid());

-- moderation_logs: users see own, admins see all
CREATE POLICY "moderation_read_own" ON moderation_logs FOR SELECT USING (
  user_id = auth.uid() OR community_is_admin()
);
CREATE POLICY "moderation_insert" ON moderation_logs FOR INSERT WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Seed default categories
INSERT INTO post_categories (name, slug, description, color) VALUES
  ('General', 'general', 'General maritime discussion', '#2966f4'),
  ('Navigation', 'navigation', 'Charts, passage planning, and navigation', '#0891b2'),
  ('Engineering', 'engineering', 'Marine engineering topics', '#d97706'),
  ('Safety', 'safety', 'Safety procedures and regulations', '#dc2626'),
  ('Career', 'career', 'Career advice and training tips', '#7c3aed'),
  ('Exam Prep', 'exam-prep', 'Oral and written exam preparation', '#059669')
ON CONFLICT (slug) DO NOTHING;
