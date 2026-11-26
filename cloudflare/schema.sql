
-- ==========================================
-- BANOTY ❤️ - SUPABASE DATABASE
-- PostgreSQL schema
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Couple members
CREATE TABLE IF NOT EXISTS public.couple_members (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL UNIQUE
        CHECK (role IN ('ahmed', 'banoty')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL
        CHECK (sender_role IN ('ahmed', 'banoty')),
    body TEXT NOT NULL CHECK (length(trim(body)) > 0),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_created
ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_recipient
ON public.messages(recipient_id, created_at DESC);

-- 3. Media metadata
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    object_key TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size BIGINT NOT NULL CHECK (size >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_created
ON public.media(created_at DESC);

-- 4. Shared dreams
CREATE TABLE IF NOT EXISTS public.dreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (length(trim(body)) > 0),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dreams_created
ON public.dreams(created_at DESC);

-- ==========================================
-- 5. Enable Row Level Security
-- ==========================================

ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

-- Members can view only their own membership
CREATE POLICY "members_view_own_profile"
ON public.couple_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only the sender and recipient can read messages
CREATE POLICY "participants_read_messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
);

-- Only the logged-in sender can send as themselves
CREATE POLICY "send_own_messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.couple_members m
        WHERE m.user_id = auth.uid()
          AND m.role = sender_role
    )
    AND EXISTS (
        SELECT 1
        FROM public.couple_members recipient
        WHERE recipient.user_id = recipient_id
    )
);

-- Only recipient can mark message as read
CREATE POLICY "recipient_update_read_status"
ON public.messages
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Only sender or recipient can delete a message
CREATE POLICY "participants_delete_messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
);

-- Media: only owner can access metadata
CREATE POLICY "media_owner_access"
ON public.media
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Dreams: shared between the two registered members
CREATE POLICY "couple_read_dreams"
ON public.dreams
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.couple_members m
        WHERE m.user_id = auth.uid()
    )
);

CREATE POLICY "couple_create_dreams"
ON public.dreams
FOR INSERT
TO authenticated
WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.couple_members m
        WHERE m.user_id = auth.uid()
    )
);

CREATE POLICY "dream_owner_update"
ON public.dreams
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "dream_owner_delete"
ON public.dreams
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- ==========================================
-- END BANOTY DATABASE
-- ==========================================
