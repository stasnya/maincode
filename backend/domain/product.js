// domain/product.js
class Review {
    constructor(userId, rating, comment) {
      this.userId = userId;
      this.rating = rating;
      this.comment = comment;
      this.date = new Date();
    }
  
    update(newRating, newComment) {
      this.rating = newRating;
      this.comment = newComment;
      this.date = new Date();
    }
  
    getSummary() {
      return `${this.userId}: ${this.rating}★ - ${this.comment}`;
    }
  }
  
  class Product {
    constructor(id, title, artist, genre, year, tracks, format, inStock) {
      this.id = id;
      this.title = title;
      this.artist = artist;
      this.genre = genre;
      this.year = year;
      this.tracks = tracks;
      this.format = format;
      this.inStock = inStock;
      this.reviews = [];
    }
  
    addReview(review) {
      this.reviews.push(review);
    }
  
    deleteReview(userId) {
      this.reviews = this.reviews.filter(r => r.userId !== userId);
    }
  
    sell(quantity = 1) {
      if (this.inStock >= quantity) {
        this.inStock -= quantity;
        return true;
      } else {
        throw new Error("Немає достатньо товару на складі!");
      }
    }
  
    isAvailable() {
      return this.inStock > 0;
    }
  }
  
  export { Product, Review };
  