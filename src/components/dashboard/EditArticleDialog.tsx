import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_COUNTRIES } from '@/utils/countries';

interface Article {
  _id: string;
  source: string;
  title: string;
  url: string;
  snippet: string;
  publication_date: string;
  country: string;
  sentiment: string;
  reach: number;
  ave?: number;
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
    country: '',
    sentiment: 'neutral',
    reach: 0
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
        country: article.country || '',
        sentiment: article.sentiment || 'neutral',
        reach: article.reach || 0
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
          <DialogTitle>Edit Article</DialogTitle>
          <DialogDescription>
            Update the article details below
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                placeholder="Media source"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Article title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="snippet">Snippet</Label>
              <Input
                id="snippet"
                value={formData.snippet}
                onChange={(e) => handleChange('snippet', e.target.value)}
                placeholder="Article snippet"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="publication_date">Date</Label>
              <Input
                id="publication_date"
                type="date"
                value={formData.publication_date}
                onChange={(e) => handleChange('publication_date', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select
                value={formData.sentiment}
                onValueChange={(value) => handleChange('sentiment', value)}
              >
                <SelectTrigger id="sentiment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleChange('country', value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reach">Reach</Label>
              <Input
                id="reach"
                type="number"
                value={formData.reach}
                onChange={(e) => handleChange('reach', Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Article
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
