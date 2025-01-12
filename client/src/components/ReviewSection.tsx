import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: number;
  userId: number;
  plantId: number;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
}

interface ReviewSectionProps {
  plantId: number;
}

export function ReviewSection({ plantId }: ReviewSectionProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data, isLoading } = useQuery<{ reviews: Review[]; total: number }>({
    queryKey: [`/api/plants/${plantId}/reviews?page=${page}&pageSize=${pageSize}`],
  });

  const reviews = data?.reviews || [];
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  function renderRating(rating: number) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="h-4 w-4 fill-primary text-primary" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half" className="h-4 w-4 fill-primary text-primary" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className="h-4 w-4 text-muted-foreground/40"
        />
      );
    }

    return stars;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{review.userName}</span>
                <div className="flex items-center">{renderRating(review.rating)}</div>
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
