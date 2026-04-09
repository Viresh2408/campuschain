-- =========================================
-- CampusChain - Student Documents Table
-- =========================================

CREATE TABLE IF NOT EXISTS student_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'certificate' or 'image'
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for prototype
ALTER TABLE student_documents DISABLE ROW LEVEL SECURITY;
