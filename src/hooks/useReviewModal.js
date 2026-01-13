import { useState, useCallback } from "react";

/**
 * Hook to manage ReviewModal state
 */
export function useReviewModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [selectedNewPlace, setSelectedNewPlace] = useState(null);
    const [newReviewParams, setNewReviewParams] = useState({ text: "", score: 5 });

    // For handling ranking insertion position
    const [tempRankIndex, setTempRankIndex] = useState(0);

    const openForNew = useCallback((place) => {
        setEditingReview(null);
        setSelectedNewPlace(place);
        setNewReviewParams({ text: "", score: 5 });
        setIsOpen(true);
    }, []);

    const openForEdit = useCallback((review) => {
        setEditingReview(review);
        // Ensure category is preserved from the review
        setSelectedNewPlace({ ...review, category: review.category });
        setNewReviewParams({ text: review.comment || "", score: review.globalScore || 5 });
        // [FIX] Initialize tempRankIndex with the existing rank so "Update" preserves it
        setTempRankIndex(review.rankIndex !== undefined ? review.rankIndex : 0);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setEditingReview(null);
        setSelectedNewPlace(null);
        setNewReviewParams({ text: "", score: 5 });
        setTempRankIndex(0);
    }, []);

    return {
        isOpen,
        setIsOpen,
        editingReview,
        setEditingReview, // [FIX] Added export for App.jsx manual handling
        selectedNewPlace,
        setSelectedNewPlace, // Exposed if needed specific overriding
        newReviewParams,
        setNewReviewParams,
        tempRankIndex,
        setTempRankIndex,
        openForNew,
        openForEdit,
        close
    };
}
