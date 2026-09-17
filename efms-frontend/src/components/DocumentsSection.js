import { useState } from 'react';
import { uploadDocument, deleteDocument } from '../api';

function DocumentsSection({ token, employeeId, documents, onRefresh, readOnly }) {
  const [docType, setDocType] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    if (!file || !docType) return;
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('document_type', docType);

    const res = await uploadDocument(token, employeeId, uploadData);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to upload document');
      return;
    }
    setDocType('');
    setFile(null);
    onRefresh();
  };

  const handleDelete = async (id) => {
    setError('');
    const res = await deleteDocument(token, id);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to delete document');
      return;
    }
    onRefresh();
  };

  return (
    <>
      <h3>Documents</h3>
      {!readOnly && (
        <form onSubmit={handleUpload} className="upload-form">
          <input
            type="text"
            placeholder="Document type (e.g. Contract, Certificate)"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            required
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
          <button type="submit">Upload</button>
        </form>
      )}
      {error && <p className="error-text">{error}</p>}

      <ul className="document-list">
        {documents.map((doc) => (
          <li key={doc.id}>
             <a href={doc.file_path} target="_blank" rel="noreferrer"> {doc.document_type} — {doc.file_name} </a>
            {!readOnly && (
              <button className="delete-btn" onClick={() => handleDelete(doc.id)}>Delete</button>
            )}
          </li>
        ))}
        {documents.length === 0 && <li className="empty">No documents uploaded yet.</li>}
      </ul>
    </>
  );
}

export default DocumentsSection;