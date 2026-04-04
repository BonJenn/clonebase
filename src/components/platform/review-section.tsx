'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import type { TemplateReview } from '@/types';

interface ReviewSectionProps {
  templateId: string;
  isOwner: boolean;
}

export function ReviewSection({ templateId, isOwner }: ReviewSectionProps) {
  const { user } = useUser();
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reviews?template_id=${templateId}`)
      .then((r) => r.json())
      .then((data) => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [templateId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId, rating, review_text: reviewText }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to submit review');
      setSubmitting(false);
      return;
    }

    // Refresh reviews
    const updated = await fetch(`/api/reviews?template_id=${templateId}`).then((r) => r.json());
    setReviews(updated);
    setReviewText('');
    setSubmitting(false);
  }

  const userReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Reviews</h2>

      {/* Review form */}
      {user && !isOwner && !userReview && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                &#9733;
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write a review (optional)..."
            rows={3}
            className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Button type="submit" className="mt-3" loading={submitting}>
            Submit Review
          </Button>
        </form>
      )}

      {userReview && (
        <p className="mt-4 text-sm text-gray-500">You rated this template {userReview.rating}/5.</p>
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{review.reviewer?.display_name || 'Anonymous'}</span>
                  <span className="flex text-yellow-400 text-sm">
                    {Array.from({ length: review.rating }, (_, i) => (
                      <span key={i}>&#9733;</span>
                    ))}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
              </div>
              {review.review_text && (
                <p className="mt-2 text-sm text-gray-600">{review.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
