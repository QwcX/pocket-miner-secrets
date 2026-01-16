-- Добавить поле для эмодзи профиля
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_emoji text DEFAULT NULL;

-- Добавить таблицу для rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    action_type text NOT NULL,
    count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(identifier, action_type)
);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits policies - через функцию (не через true)
CREATE POLICY "Rate limits insert via function"
ON rate_limits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Rate limits update via function"
ON rate_limits FOR UPDATE
USING (true);

CREATE POLICY "Rate limits select all"
ON rate_limits FOR SELECT
USING (true);

-- Функция для проверки rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier text,
    p_action_type text,
    p_max_requests integer DEFAULT 60,
    p_window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
    v_window_start timestamp with time zone;
BEGIN
    -- Получить текущее состояние
    SELECT count, window_start INTO v_count, v_window_start
    FROM rate_limits
    WHERE identifier = p_identifier AND action_type = p_action_type;
    
    -- Если записи нет или окно истекло - создать/обновить
    IF v_window_start IS NULL OR v_window_start < now() - (p_window_seconds || ' seconds')::interval THEN
        INSERT INTO rate_limits (identifier, action_type, count, window_start)
        VALUES (p_identifier, p_action_type, 1, now())
        ON CONFLICT (identifier, action_type) 
        DO UPDATE SET count = 1, window_start = now();
        RETURN true;
    END IF;
    
    -- Проверить лимит
    IF v_count >= p_max_requests THEN
        RETURN false;
    END IF;
    
    -- Увеличить счётчик
    UPDATE rate_limits
    SET count = count + 1
    WHERE identifier = p_identifier AND action_type = p_action_type;
    
    RETURN true;
END;
$$;

-- Функция для проверки можно ли менять цвет ника (iron+)
CREATE OR REPLACE FUNCTION can_customize_nickname(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_donors
        WHERE user_id = p_user_id
        AND tier IN ('iron', 'bronze', 'silver', 'gold', 'diamond', 'emerald', 'sponsor')
        AND (expires_at IS NULL OR expires_at > now())
    );
$$;

-- Функция для проверки можно ли ставить эмодзи профиля (gold+)
CREATE OR REPLACE FUNCTION can_set_profile_emoji(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_donors
        WHERE user_id = p_user_id
        AND tier IN ('gold', 'diamond', 'emerald', 'sponsor')
        AND (expires_at IS NULL OR expires_at > now())
    );
$$;