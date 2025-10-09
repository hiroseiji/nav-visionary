import React from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  ThumbsUp, 
  ThumbsDown, 
  Minus, 
  ArrowUpDown,
  ExternalLink,
  Download,
  Mail,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
}

interface ArticlesTableProps {
  articles: Article[];
  onSentimentEdit?: (id: string, sentiment: string) => void;
  onDelete?: (id: string) => void;
  userRole: string;
  orgId: string;
}

export const ArticlesTable: React.FC<ArticlesTableProps> = ({
  articles,
  onSentimentEdit,
  onDelete,
  userRole,
  orgId
}) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    const sentimentLower = sentiment.toLowerCase();
    let variant: "positive" | "negative" | "neutral" | "mixed" = "neutral";
    
    if (sentimentLower === 'positive') variant = 'positive';
    else if (sentimentLower === 'negative') variant = 'negative';
    else if (sentimentLower === 'mixed') variant = 'mixed';
    else variant = 'neutral';
    
    return (
      <Badge variant={variant}>
        <span className="capitalize">{sentiment}</span>
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Online Articles</CardTitle>
            <CardDescription>Latest online media mentions</CardDescription>
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
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-medium">Source</TableHead>
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">Summary</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/30 font-medium">
                  <div className="flex items-center space-x-1">
                    <span>Date Published</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="font-medium">Country</TableHead>
                <TableHead className="font-medium">Sentiment</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/30 font-medium">
                  <div className="flex items-center space-x-1">
                    <span>AVE</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="font-medium">Coverage</TableHead>
                <TableHead className="font-medium">Reach</TableHead>
                <TableHead className="w-[50px] font-medium"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.slice(0, 8).map((article) => (
                <TableRow key={article._id} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                  <TableCell className="py-4">
                    <div className="flex items-center space-x-2">
                      {article.logo_url && (
                        <img
                          src={article.logo_url}
                          alt={`${article.source} logo`}
                          className="h-8 w-8 rounded-full object-cover border"
                        />
                      )}
                      <span className="font-medium text-sm">{article.source}</span>
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
                      {article.snippet ? 
                        `"${article.snippet.replace(/^Summary:\s*/, '').split(' ').slice(0, 15).join(' ')}..."` :
                        article.title
                      }
                    </p>
                  </TableCell>
                  <TableCell className="text-sm py-4">
                    {new Date(article.publication_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm py-4">{article.country || 'Unknown'}</TableCell>
                  <TableCell className="py-4">
                    {getSentimentBadge(article.sentiment)}
                  </TableCell>
                  <TableCell className="font-medium text-sm py-4">
                    {article.ave?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || '-'}
                  </TableCell>
                  <TableCell className="text-sm py-4">{article.coverage_type}</TableCell>
                  <TableCell className="text-sm py-4">{article.reach?.toLocaleString() || '-'}</TableCell>
                  <TableCell className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={article.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Article
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`mailto:?subject=Interesting Article&body=${article.url}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            Share via Email
                          </a>
                        </DropdownMenuItem>
                        {userRole === 'super_admin' && onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(article._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {articles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No articles found for this organization.
          </div>
        )}
      </CardContent>
    </Card>
  );
};