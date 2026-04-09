import { requireAuth } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { getDownloadUrl } from '../../../lib/s3';

async function handler(req, res) {
  const userId = req.user.id;

  if (req.method === 'GET') {
    try {
      const { data: docs, error } = await supabaseAdmin
        .from('student_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add temporary download URLs for each document
      const docsWithUrls = await Promise.all((docs || []).map(async (doc) => {
        try {
          const url = await getDownloadUrl(doc.file_key);
          return { ...doc, url };
        } catch (e) {
          return { ...doc, url: null, error: 'Failed to get URL' };
        }
      }));

      return res.json(docsWithUrls);
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  if (req.method === 'POST') {
    const { fileName, fileKey, fileType, mimeType } = req.body;

    if (!fileName || !fileKey || !fileType || !mimeType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('student_documents')
        .insert([{
          user_id: userId,
          file_name: fileName,
          file_key: fileKey,
          file_type: fileType,
          mime_type: mimeType
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (error) {
      console.error('Error saving document metadata:', error);
      return res.status(500).json({ error: 'Failed to save document info' });
    }
  }

  return res.status(445).json({ error: 'Method not allowed' });
}

export default requireAuth(handler);
