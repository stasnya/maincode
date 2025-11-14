import { reviewService } from '../service/reviewService.js';
const correctReviewData = {
    user: "test_user_ok",
    productType: "vinyl",
    productId: "v-001",
    text: "Це чудовий продукт для тестування!",
    rating: 5
};
// Приклад даних, які повинні викликати помилку (400)
const invalidDataEmptyText = {
    user: "test_user",
    productType: "vinyl",
    productId: "v-001",
    text: "",
    rating: 1
};
// Приклад даних, які повинні викликати помилку (400)
const invalidDataMissingUser = {
    user: null,
    productType: "cassette",
    productId: "c-002",
    text: "Це коментар.",
    rating: 5
};

describe('Review Service Unit Tests (Validation and Creation)', () => {
    beforeEach(() => {
    });
    // a. Успішний випадок (Створення)
    test("should successfully create a review with valid data", () => {
        try {
            const createdReview = reviewService.create(correctReviewData);
            expect(createdReview).toHaveProperty('id');
            expect(createdReview.text).toBe(correctReviewData.text);
            const allReviews = reviewService.getAll();
            expect(allReviews.length).toBeGreaterThan(0);
        } catch (e) {
            throw new Error(`Тест провалено, не мав кидати помилку, але кинув: ${e.message}`);
        }
    });
    // b. Помилковий випадок (Порожній текст)
    test("should throw an error for empty review text", () => {
        expect(() => {
            reviewService.create(invalidDataEmptyText);
        }).toThrow();
    });
    // b. Помилковий випадок (Відсутній користувач)
    test("should throw an error for missing user field", () => {
        expect(() => {
            reviewService.create(invalidDataMissingUser);
        }).toThrow(); 
    });
});