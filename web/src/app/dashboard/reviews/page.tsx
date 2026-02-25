"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Search, Filter, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'

const reviews = [
    { id: '1', guest: 'Sarah Johnson', rating: 5, title: 'Absolutely wonderful!', comment: 'The ocean view was breathtaking and the staff went above and beyond. The AI concierge was surprisingly helpful!', date: '2026-02-23', sentiment: 0.95, response: null, booking: 'BK-20260220-a1b2' },
    { id: '2', guest: 'Michael Chen', rating: 4, title: 'Great stay, minor issues', comment: 'Loved the room and amenities. Check-in was a bit slow but the spa made up for it. Would definitely return.', date: '2026-02-22', sentiment: 0.72, response: 'Thank you Michael! We\'re working on improving our check-in process.', booking: 'BK-20260218-c3d4' },
    { id: '3', guest: 'Emma Williams', rating: 3, title: 'Average experience', comment: 'Room was clean but the AC wasn\'t working properly in our standard room. Maintenance took too long to respond.', date: '2026-02-21', sentiment: 0.35, response: null, booking: 'BK-20260219-e5f6' },
    { id: '4', guest: 'James Brown', rating: 5, title: 'Best hotel experience ever', comment: 'Everything was perfect - the room, the service, the food. The garden suite is like a paradise. Already booked my next stay!', date: '2026-02-20', sentiment: 0.98, response: 'We\'re thrilled to hear that James! Can\'t wait to welcome you back.', booking: 'BK-20260215-g7h8' },
    { id: '5', guest: 'Lisa Davis', rating: 2, title: 'Disappointing', comment: 'Expected more for the price. Noisy neighbors and thin walls. Breakfast variety was limited.', date: '2026-02-19', sentiment: 0.15, response: null, booking: 'BK-20260217-i9j0' },
]

const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
const avgSentiment = (reviews.reduce((acc, r) => acc + r.sentiment, 0) / reviews.length * 100).toFixed(0)

function getSentimentColor(score: number) {
    if (score >= 0.7) return 'text-emerald-600 bg-emerald-500/10'
    if (score >= 0.4) return 'text-amber-600 bg-amber-500/10'
    return 'text-red-600 bg-red-500/10'
}

function getSentimentLabel(score: number) {
    if (score >= 0.7) return 'Positive'
    if (score >= 0.4) return 'Neutral'
    return 'Negative'
}

export default function ReviewsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
                    <p className="text-muted-foreground">Monitor guest feedback and sentiment</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/10">
                            <Star className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{avgRating}</p>
                            <p className="text-sm text-muted-foreground">Average Rating</p>
                            <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`h-3 w-3 ${s <= Math.round(Number(avgRating)) ? 'fill-amber-500 text-amber-500' : 'text-muted'}`} />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10">
                            <ThumbsUp className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{avgSentiment}%</p>
                            <p className="text-sm text-muted-foreground">Avg Sentiment</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10">
                            <MessageSquare className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{reviews.length}</p>
                            <p className="text-sm text-muted-foreground">Total Reviews</p>
                            <p className="text-xs text-muted-foreground">{reviews.filter(r => !r.response).length} need response</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                {reviews.map(review => (
                    <Card key={review.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Avatar><AvatarFallback className="bg-primary/10 text-primary font-semibold">{review.guest.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between flex-wrap gap-2">
                                        <div>
                                            <h3 className="font-semibold">{review.guest}</h3>
                                            <p className="text-xs text-muted-foreground">{review.date} • {review.booking}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-muted'}`} />
                                                ))}
                                            </div>
                                            <Badge className={getSentimentColor(review.sentiment)}>
                                                {getSentimentLabel(review.sentiment)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <h4 className="font-medium mt-3">{review.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>

                                    {review.response ? (
                                        <div className="mt-4 p-3 rounded-lg bg-muted/50 border-l-2 border-primary">
                                            <p className="text-xs font-medium text-primary mb-1">Hotel Response</p>
                                            <p className="text-sm">{review.response}</p>
                                        </div>
                                    ) : (
                                        <Button variant="outline" size="sm" className="mt-4">
                                            <MessageSquare className="h-3 w-3 mr-2" />
                                            Write Response
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
