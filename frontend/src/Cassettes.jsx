import React, { useState, useEffect } from "react";
import "./Cassettes.css"; 
import { fetchWithResilience } from "./lib/http";
import { getOrReuseKey } from "./lib/idempotency";

const alert = (msg) => console.log('ALERT:', msg);
const confirm = window.confirm; 

const ENTITY_TYPE = "cassette";
const API_URL = "http://localhost:5000/api/cassettes";
const API_REVIEWS_URL = "http://localhost:5000/api/reviews";
const API_UPLOADS_URL = "http://localhost:5000/uploads";

const getToken = () => localStorage.getItem('authToken');

export default function Cassettes() {
const [isSubmitting, setIsSubmitting] = useState(false);
const [failureCount, setFailureCount] = useState(0);
const [isDegraded, setIsDegraded] = useState(false);
const [cassetteList, setCassetteList] = useState([]); // Змінено: vinylList -> cassetteList
const [selectedId, setSelectedId] = useState("");
const [selectedCassette, setSelectedCassette] = useState(null); // Змінено: selectedVinyl -> selectedCassette
const [refreshKey, setRefreshKey] = useState(0);
const [modalError, setModalError] = useState("");

const [postError, setPostError] = useState(""); 
const [rating, setRating] = useState(5);
const [comment, setComment] = useState("");
const [reviews, setReviews] = useState([]);

const [formData, setFormData] = useState({
Title: "",
Artist: "",
Genre: "",
Country: "",
Published: "",
Price: "",
Photo: "",
});
const [isModalOpen, setIsModalOpen] = useState(false);

const [reviewModalOpen, setReviewModalOpen] = useState(false);
const [currentReview, setCurrentReview] = useState(null);
const [modalRating, setModalRating] = useState(5);
const [modalComment, setModalComment] = useState("");

const loadCassettes = () => { 
fetch(API_URL)
.then((res) => res.json())
.then((data) => {
if (Array.isArray(data)) {
setCassetteList(data); 
} 
else {
console.error("Отримано невірний формат даних для касет:", data); // Змінено
 setCassetteList([]); 
 }
})
.catch((err) => {
console.error("Помилка при завантаженні касет:", err); // Змінено
 setCassetteList([]); 
 });
  };

const loadReviews = (id) => {
const url = `${API_REVIEWS_URL}?productType=${ENTITY_TYPE}&productId=${id}`;

fetch(url)
.then((res) => res.json())
.then((filteredData) => {
const sortedReviews = filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
setReviews(sortedReviews);
})
.catch((err) => console.error("Помилка завантаження відгуків:", err));
  };

useEffect(() => {
loadCassettes(); 
 }, []);

 useEffect(() => {
if (selectedId) {
loadReviews(selectedId);
 }
 }, [selectedId, refreshKey]); 

 useEffect(() => {
 if (failureCount >= 3) {

  setIsDegraded(true);
const timer = setTimeout(() => {
setIsDegraded(false);
setFailureCount(0);
 }, 30000);
return () => clearTimeout(timer);
}
 }, [failureCount]);

const handleSelectChange = (e) => {
const id = e.target.value;
setSelectedId(id);
 const found = cassetteList.find((c) => c.ID.toString() === id); // Змінено
 setSelectedCassette(found); // Змінено
 setRefreshKey(prev => prev + 1);
 };

  const handleOpenModal = (cassette = null) => { // Змінено
    if (cassette) { // Змінено
      setFormData({
        Title: cassette.Title,
        Artist: cassette.Artist,
        Genre: cassette.Genre,
        Country: cassette.Country,
        Published: cassette.Published,
        Price: cassette.Price,
        Photo: cassette.Photo,
      });
      setSelectedId(cassette.ID);
    } else {
      // ... (сброс форми без змін) ...
      setFormData({
        Title: "",
        Artist: "",
        Genre: "",
        Country: "",
        Published: "",
        Price: "",
        Photo: "",
      });
      setSelectedId("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      Title: "",
      Artist: "",
      Genre: "",
      Country: "",
      Published: "",
      Price: "",
      Photo: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

// ==========================================================
// CRUD (АДМІН)
// ==========================================================
  const handleSave = async () => {
    // 1. Отримуємо токен
    const token = getToken();
    if (!token) {
        alert("Помилка: Щоб додавати або редагувати товари, потрібно увійти як Адміністратор.");
        return; 
    }

    try {
      const method = selectedId ? "PUT" : "POST";
      const url = selectedId
        // Змінено: api/vinyls -> api/cassettes
        ? `${API_URL}/${selectedId}`
        : API_URL;

      const res = await fetch(url, {
        method,
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
           if (res.status === 403) {
               throw new Error("Недостатньо прав. Додавання/редагування доступне лише Адміністратору.");
           }
           throw new Error("Помилка при збереженні касети"); // Змінено
        }

      loadCassettes(); // Змінено
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(`Не вдалося зберегти касету. ${err.message}`); // Змінено
    }
  };

  const handleDelete = async (id) => {
    // 1. Отримуємо токен
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert("Помилка: Щоб видалити товар, потрібно увійти як Адміністратор.");
        return; 
    }

    if (!confirm("Видалити цю касету?")) return; // Змінено
    try {
        // Змінено: api/vinyls -> api/cassettes
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
          if (res.status === 403) {
               throw new Error("Недостатньо прав. Видалення доступне лише Адміністратору.");
          }
          throw new Error("Помилка при видаленні");
       }
       
      setCassetteList((prev) => prev.filter((c) => c.ID !== id)); // Змінено
      setSelectedCassette(null); // Змінено
      setSelectedId("");
    } catch (err) {
      console.error(err);
      alert(`Не вдалося видалити касету. ${err.message}`); // Змінено
    }
  };

// ==========================================================
// ВІДГУКИ (АВТЕНТИФІКАЦІЯ)
// ==========================================================
 const handleAddReview = async (e) => {
        e.preventDefault();
        setPostError("");

        const token = getToken();
        if (!token) {
            setPostError("Помилка: Щоб залишити відгук, потрібно увійти в систему.");
            return;
        }

        setIsSubmitting(true);
        setPostError("");
        
        // Перевірка коментаря
        if (!comment || comment.length < 3) {
            setPostError("Коментар не може бути порожнім або коротким.");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            rating,
            comment,
            productType: ENTITY_TYPE, // Змінено: "vinyl" -> ENTITY_TYPE
            productId: selectedCassette.ID, // Змінено
        };

        try {
            const idemKey = getOrReuseKey(payload);
            
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, 
            };

            const res = await fetchWithResilience(API_REVIEWS_URL, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: headers, 
                idempotencyKey: idemKey,
                retry: { retries: 3, baseDelayMs: 300, timeoutMs: 3500 },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Невідома помилка сервера");
            }

            setFailureCount(0);
            setRefreshKey(k => k + 1);
            setComment("");
        } catch (error) {
            console.error("Final error after retries:", error);
            setPostError(`Помилка: ${error.message}`);
            setFailureCount(c => c + 1); 
        }
        finally {
        setIsSubmitting(false);
        }
    };
    
  const openReviewModal = (review) => {
    setCurrentReview(review);
    setModalRating(review.rating);
    setModalComment(review.comment);
    setReviewModalOpen(true);
    setModalError("");
  };

const saveReviewModal = async () => {
    const token = getToken();
    if (!token) {
        setModalError("Помилка: Увійдіть, щоб редагувати відгук.");
        return;
    }

    if (modalComment.trim().length < 3) {
        setModalError("Коментар повинен містити щонайменше 3 символи.");        
        return;
    }

    try {
        const res = await fetch(
            `${API_REVIEWS_URL}/${currentReview.ID}`,
            {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ rating: modalRating, comment: modalComment }),
            }
        );
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Помилка при оновленні відгуку");
        }
        
        alert("Відгук успішно оновлено!");

        setRefreshKey(prev => prev + 1);
        setReviewModalOpen(false);
        setCurrentReview(null);
    } catch (err) {
        console.error(err);
        alert(`Не вдалося оновити відгук. ${err.message}`);
    }
};

  const deleteReviewModal = async () => {
    const token = getToken();
    if (!token) {
        alert("Помилка: Увійдіть, щоб видалити відгук.");
        return;
    }

    if (!confirm("Видалити відгук?")) return;
    
    try {
        const res = await fetch(
            `${API_REVIEWS_URL}/${currentReview.ID}`,
            { 
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            }
        );
        
        if (res.status !== 204) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Помилка при видаленні відгуку");
        }
        
        alert("Відгук успішно видалено!"); 

        setRefreshKey(prev => prev + 1);
        setReviewModalOpen(false);
        setCurrentReview(null);
    } catch (err) {
        console.error(err);
        alert(`Не вдалося видалити відгук. ${err.message}`);
    }
};

  return (
    <div className="catalog-section">
      <h2>Касети</h2> {/* Змінено */}
      {isDegraded && (
      <div style={{ color: "white", backgroundColor: "red", padding: "10px", textAlign: "center", margin: "1rem 0" }}>
        Увага! Сервіс перевантажено. Спробуйте пізніше.
      </div>
      )}

      <button className="add-vinyl-btn" onClick={() => handleOpenModal()}>Додати касету</button> {/* Змінено */}

      <select
        value={selectedId}
        onChange={handleSelectChange}
        className="select-item"
      >
        <option value="">-- Оберіть касету --</option> {/* Змінено */}
        {cassetteList.map((c) => ( // Змінено
          <option key={c.ID} value={c.ID}>
            {c.Title} — {c.Artist}
          </option>
        ))}
      </select>

      {selectedCassette && ( // Змінено
        <div className="product-card">
          <h3>{selectedCassette.Title}</h3> {/* Змінено */}
          <p>Виконавець: {selectedCassette.Artist}</p> {/* Змінено */}
          <p>Жанр: {selectedCassette.Genre}</p> {/* Змінено */}
          <p>Країна: {selectedCassette.Country}</p> {/* Змінено */}
          <p>Рік: {selectedCassette.Published}</p> {/* Змінено */}
          <p>Ціна: {selectedCassette.Price} $</p> {/* Змінено */}
          {selectedCassette.Photo && (
            <img
              src={`${API_UPLOADS_URL}/${selectedCassette.Photo}`} /* Змінено */
              alt={selectedCassette.Title}
            />
          )}

          <div className="vinyl-buttons">
            <button onClick={() => handleOpenModal(selectedCassette)}>Редагувати</button>
            <button
              className="delete-btn"
// РЯДОК 417: ВИДАЛИТИ КОМЕНТАР
              onClick={() => handleDelete(selectedCassette.ID)} 
            >
              Видалити
            </button>
          </div>
          
          <form onSubmit={handleAddReview} className="review-form">
            <h4>Додати відгук:</h4>
            {postError && <p className="text-red-500">{postError}</p>}
            
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(+e.target.value)}
              disabled={isDegraded}
            />
            <input
              placeholder="Коментар (мін. 3 символи)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isDegraded}
            />
            <button type="submit" disabled={isDegraded || isSubmitting}>
            {isSubmitting ? "Відправка..." : isDegraded ? "Тимчасово недоступно" : "Додати відгук"}
            </button>
</form>

          <div className="reviews">
            <h4>Відгуки:</h4>
            {reviews.length === 0 ? (
                <p>Поки що немає відгуків.</p>
            ) : (
                reviews.map((r) => (
                    <div key={r.ID} className="review-item">
                        <b className="v">{r.username}</b>: {r.rating}★ — {r.comment} {/* Змінено */}
                        <br />
                        <small className="v" >{new Date(r.date).toLocaleString()}</small>
                        <div className="review-buttons">
                            <button onClick={() => openReviewModal(r)}>Редагувати</button>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedId ? "Редагувати касету" : "Додати касету"}</h3> {/* Змінено */}
            <input
              name="Title"
              placeholder="Назва"
              value={formData.Title}
              onChange={handleChange}
            />
            <input
              name="Artist"
              placeholder="Виконавець"
              value={formData.Artist}
              onChange={handleChange}
            />
            <input
              name="Genre"
              placeholder="Жанр"
              value={formData.Genre}
              onChange={handleChange}
            />
            <input
              name="Country"
              placeholder="Країна"
              value={formData.Country}
              onChange={handleChange}
            />
            <input
              name="Published"
              placeholder="Рік"
              value={formData.Published}
              onChange={handleChange}
            />
            <input
              name="Price"
              placeholder="Ціна"
              value={formData.Price}
              onChange={handleChange}
            />
            <input
              name="Photo"
              placeholder="Назва фото (файл у /uploads)"
              value={formData.Photo}
              onChange={handleChange}
            />

            <div className="modal-actions">
              <button className="save-btn" onClick={handleSave}>Зберегти</button>
              <button className="close-btn" onClick={handleCloseModal}>Закрити</button>
            </div>
          </div>
        </div>
      )}

      {reviewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Редагування відгуку</h3>
            <input
              type="number"
              min="1"
              max="5"
              value={modalRating}
              onChange={(e) => setModalRating(+e.target.value)}
            />
            <textarea
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="first-child" onClick={saveReviewModal}>Зберегти</button>
              <button className= "delete-btn"onClick={deleteReviewModal}>Видалити</button>
              <button className = "last-child"onClick={() => setReviewModalOpen(false)}>Відмінити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}