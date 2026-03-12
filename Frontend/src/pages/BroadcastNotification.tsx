import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export default function BroadcastNotification() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return <div className="text-center py-20 text-muted-foreground">Access Denied</div>;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      toast.error('Title and message are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ title, body, url }),
      });

      if (!res.ok) throw new Error('Failed to send notification');
      
      const data = await res.json();
      toast.success(data.message || 'Notification sent successfully!');
      setTitle('');
      setBody('');
      setUrl('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="stat-card">
        <h1 className="text-2xl font-bold text-foreground mb-2">Broadcast Notification</h1>
        <p className="text-sm text-muted-foreground mb-6">Send push notification to all users</p>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Message *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message"
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">URL (Optional)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/dashboard or https://example.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Users will be redirected here when they click the notification</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Send size={18} />
            {loading ? 'Sending...' : 'Send to All Users'}
          </button>
        </form>
      </div>
    </div>
  );
}
