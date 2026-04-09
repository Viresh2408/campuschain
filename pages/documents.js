import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import { FileText, Camera, Upload, Trash2, CheckCircle, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDocuments() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('certificate'); // 'certificate' or 'image'

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const savedUser = localStorage.getItem('cc_user');
    if (!token) { router.push('/auth'); return; }
    setUser(JSON.parse(savedUser));
    fetchDocs(token);
  }, []);

  async function fetchDocs(token) {
    const res = await fetch('/api/documents', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setDocs(data || []);
    setLoading(false);
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB allowed.');
      return;
    }

    setUploading(true);
    const token = localStorage.getItem('cc_token');

    try {
      // 1. Get presigned URL
      const urlRes = await fetch('/api/documents/upload-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: uploadType,
          mimeType: file.type
        })
      });

      const { uploadUrl, key } = await urlRes.json();
      if (!uploadUrl) throw new Error('Failed to get upload URL');

      // 2. Upload to S3 directly
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!s3Res.ok) throw new Error('S3 upload failed');

      // 3. Save metadata to DB
      await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileKey: key,
          fileType: uploadType,
          mimeType: file.type
        })
      });

      toast.success('Document uploaded successfully! 🚀');
      fetchDocs(token);
    } catch (error) {
      console.error(error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  }

  function triggerUpload(type) {
    setUploadType(type);
    fileInputRef.current.click();
  }

  return (
    <>
      <Head><title>My Documents — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Document Safe <span className="gradient-text">🔒</span></h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Securely store your academic certificates and verification captures.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
            {/* Upload Certificate Card */}
            <div className="card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px dashed var(--border)', background: 'rgba(99,102,241,0.03)' }} 
                 onClick={() => triggerUpload('certificate')}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FileText size={28} color="var(--accent)" />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Upload Certificate</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>PDF, JPG or PNG (Max 5MB)</p>
              <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                <Upload size={16} /> Select File
              </button>
            </div>

            {/* Capture Image Card */}
            <div className="card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px dashed var(--border)', background: 'rgba(16,185,129,0.03)' }}
                 onClick={() => triggerUpload('image')}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Camera size={28} color="var(--success)" />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Take a Photo</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Capture student ID or activity proof</p>
              <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%', justifyContent: 'center', borderColor: 'rgba(16,185,129,0.4)', color: 'var(--success)' }}>
                <Camera size={16} /> Open Camera
              </button>
            </div>
          </div>

          {/* Hidden Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileUpload}
            accept={uploadType === 'certificate' ? '.pdf,image/*' : 'image/*'}
            capture={uploadType === 'image' ? 'environment' : undefined}
          />

          {uploading && (
            <div className="card" style={{ padding: 20, marginBottom: 20, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: 15 }}>
              <div className="spinner-small" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Uploading to AWS S3...</div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: '60%', animation: 'progress 2s ease-in-out infinite' }} />
                </div>
              </div>
            </div>
          )}

          {/* Documents List */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="var(--success)" /> My Uploaded Assets
              </h3>
              <span className="badge badge-blue">{docs.length} Files</span>
            </div>
            
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : docs.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Upload size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
                <p>No documents uploaded yet. Start by adding one above.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Type</th>
                      <th>Uploaded On</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map(doc => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {doc.file_type === 'certificate' ? <FileText size={14} color="var(--accent)" /> : <Camera size={14} color="var(--success)" />}
                            {doc.file_name}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${doc.file_type === 'certificate' ? 'blue' : 'green'}`} style={{ textTransform: 'capitalize' }}>
                            {doc.file_type}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(doc.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--success)' }}>
                            <CheckCircle size={14} /> Verified on S3
                          </div>
                        </td>
                        <td>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                            <ExternalLink size={12} /> View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
      <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-top: 2px solid var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
