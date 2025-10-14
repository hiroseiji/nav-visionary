import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Minus, 
  ArrowUpDown,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  Filter,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EditArticleDialog } from './EditArticleDialog';
import { mapSentimentToLabel } from '@/utils/sentimentUtils';

interface Article {
  _id: string;
  source: string;
  title: string;
  snippet: string;
  publication_date: string;
  country: string;
  sentiment: string;
  ave: number;
  coverage_type: string;
  rank: number;
  reach: number;
  url: string;
  logo_url?: string;
  section?: string;
}

interface ArticlesTableProps {
  articles: Article[];
  onDelete?: (id: string) => void;
  onArticleUpdate?: (articleId: string, updatedData: Partial<Article>) => void;
  userRole: string;
  orgId: string;
  title?: string;
  subtitle?: string;
  hideReach?: boolean;
  coverageLabel?: string;
  useSectionField?: boolean;
}

export const ArticlesTable: React.FC<ArticlesTableProps> = ({
  articles,
  onDelete,
  onArticleUpdate,
  userRole,
  orgId,
  title = "Online Articles",
  subtitle = "Latest online media mentions",
  hideReach = false,
  coverageLabel = "Coverage",
  useSectionField = false,
}) => {
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [coverageFilter, setCoverageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'ave' | 'reach'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    setIsEditDialogOpen(true);
  };

  const handleSaveArticle = (articleId: string, updatedData: Partial<Article>) => {
    if (onArticleUpdate) {
      onArticleUpdate(articleId, updatedData);
    }
  };
  const getSentimentIcon = (sentiment: string) => {
    const sentimentStr = String(sentiment || 'neutral').toLowerCase();
    switch (sentimentStr) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentBadge = (sentiment: string | number) => {
    // Convert numeric sentiment to label using the mapping function
    const sentimentLabel = mapSentimentToLabel(sentiment);
    const sentimentLower = sentimentLabel.toLowerCase();
    let variant: "positive" | "negative" | "neutral" | "mixed" = "neutral";
    
    if (sentimentLower === 'positive') variant = 'positive';
    else if (sentimentLower === 'negative') variant = 'negative';
    else if (sentimentLower === 'mixed') variant = 'mixed';
    else variant = 'neutral';
    
    return (
      <Badge variant={variant}>
        <span className="capitalize">{sentimentLabel}</span>
      </Badge>
    );
  };

  // Get unique values for filters
  const uniqueCountries = Array.from(new Set(articles.map(a => a.country).filter(Boolean)));
  const uniqueCoverageTypes = Array.from(new Set(articles.map(a => a.coverage_type).filter(Boolean)));

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const sentimentLabel = mapSentimentToLabel(article.sentiment).toLowerCase();
    const matchesSentiment = sentimentFilter === 'all' || sentimentLabel === sentimentFilter;
    const matchesCountry = countryFilter === 'all' || article.country === countryFilter;
    const matchesCoverage = coverageFilter === 'all' || article.coverage_type === coverageFilter;
    return matchesSentiment && matchesCountry && matchesCoverage;
  });

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      comparison = new Date(a.publication_date).getTime() - new Date(b.publication_date).getTime();
    } else if (sortBy === 'ave') {
      comparison = (a.ave || 0) - (b.ave || 0);
    } else if (sortBy === 'reach') {
      comparison = (a.reach || 0) - (b.reach || 0);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'date' | 'ave' | 'reach') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <>
      <EditArticleDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingArticle(null);
        }}
        article={editingArticle}
        onSave={handleSaveArticle}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </div>
            <Link to={`/media/online/${orgId}`}>
              <Button variant="outline" size="sm">
                View All
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Sentiment" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="all">All Sentiment</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={coverageFilter} onValueChange={setCoverageFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Coverage" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="all">All Coverage</SelectItem>
                  {uniqueCoverageTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {sortedArticles.slice(0, 8).length} of {sortedArticles.length} articles
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-medium">Source</TableHead>
                  <TableHead className="font-medium">Title</TableHead>
                  <TableHead className="font-medium">Summary</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30 font-medium"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date Published</span>
                      <ArrowUpDown className={`h-4 w-4 ${sortBy === 'date' ? 'text-primary' : ''}`} />
                    </div>
                  </TableHead>
                  <TableHead className="font-medium">Country</TableHead>
                  <TableHead className="font-medium">Sentiment</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30 font-medium"
                    onClick={() => handleSort('ave')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>AVE</span>
                      <ArrowUpDown className={`h-4 w-4 ${sortBy === 'ave' ? 'text-primary' : ''}`} />
                    </div>
                  </TableHead>
                  <TableHead className="font-medium">{coverageLabel}</TableHead>
                  {!hideReach && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/30 font-medium"
                      onClick={() => handleSort('reach')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Reach</span>
                        <ArrowUpDown className={`h-4 w-4 ${sortBy === 'reach' ? 'text-primary' : ''}`} />
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="w-[50px] font-medium"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedArticles.slice(0, 8).map((article) => (
                  <TableRow
                    key={article._id}
                    className="hover:bg-muted/30 transition-colors border-b last:border-0"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        {article.logo_url && (
                          <img
                            src={article.logo_url}
                            alt={`${article.source} logo`}
                            className="h-8 w-8 rounded-full object-cover border"
                          />
                        )}
                        <span className="font-medium text-sm">
                          {article.source}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] py-4">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline line-clamp-2 text-sm"
                      >
                        {article.title}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-[200px] py-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.snippet
                          ? `"${article.snippet
                              .replace(/^Summary:\s*/, "")
                              .split(" ")
                              .slice(0, 15)
                              .join(" ")}..."`
                          : article.title}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm py-4">
                      {new Date(article.publication_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm py-4">
                      {article.country || "Unknown"}
                    </TableCell>
                    <TableCell className="py-4">
                      {getSentimentBadge(article.sentiment)}
                    </TableCell>
                    <TableCell className="font-medium text-sm py-4">
                      {article.ave?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "-"}
                    </TableCell>
                    <TableCell className="text-sm py-4">
                      {useSectionField ? (
                        article.section || "-"
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {article.coverage_type}
                        </Badge>
                      )}
                    </TableCell>
                    {!hideReach && (
                      <TableCell className="text-sm py-4">
                        {article.reach?.toLocaleString() || "-"}
                      </TableCell>
                    )}
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(article)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit article"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {userRole === "super_admin" && onDelete && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this article?"
                                )
                              ) {
                                onDelete(article._id);
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete article"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sortedArticles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No articles found matching the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};