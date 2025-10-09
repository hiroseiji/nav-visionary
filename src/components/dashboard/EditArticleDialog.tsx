import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface Article {
  _id: string;
  source: string;
  title: string;
  url: string;
  snippet: string;
  publication_date: string;
  sentiment: string;
  ave: number;
}

interface EditArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  onSave: (articleId: string, updatedData: Partial<Article>) => void;
}

export const EditArticleDialog: React.FC<EditArticleDialogProps> = ({
  isOpen,
  onClose,
  article,
  onSave
}) => {
  const [formData, setFormData] = useState({
    source: '',
    title: '',
    url: '',
    snippet: '',
    publication_date: '',
    sentiment: 'neutral',
    ave: 0
  });

  useEffect(() => {
    if (article) {
      setFormData({
        source: article.source || '',
        title: article.title || '',
        url: article.url || '',
        snippet: article.snippet || '',
        publication_date: article.publication_date ? 
          new Date(article.publication_date).toISOString().split('T')[0] : '',
        sentiment: article.sentiment || 'neutral',
        ave: article.ave || 0
      });
    }
  }, [article]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (article) {
      onSave(article._id, formData);
      onClose();
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Article</DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source Name</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              placeholder="Enter source name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Article Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter article title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Article URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="Enter article URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="snippet">Article Snippet</Label>
            <Textarea
              id="snippet"
              value={formData.snippet}
              onChange={(e) => handleChange('snippet', e.target.value)}
              placeholder="Enter article snippet"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publication_date">Publication Date</Label>
            <Input
              id="publication_date"
              type="date"
              value={formData.publication_date}
              onChange={(e) => handleChange('publication_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sentiment">Article Sentiment</Label>
            <select
              id="sentiment"
              value={formData.sentiment}
              onChange={(e) => handleChange('sentiment', e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ave">CPM</Label>
            <Input
              id="ave"
              type="number"
              value={formData.ave}
              onChange={(e) => handleChange('ave', parseFloat(e.target.value) || 0)}
              placeholder="Enter CPM value"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
