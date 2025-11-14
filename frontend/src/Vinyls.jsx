import React, { useState, useEffect } from "react";
import "./Vinyls.css";
import { fetchWithResilience } from "./lib/http";
import { getOrReuseKey } from "./lib/idempotency";

const alert = (msg) => console.log('ALERT:', msg);
const confirm = window.confirm; 

export default function Vinyls() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [isDegraded, setIsDegraded] = useState(false);
  const [vinylList, setVinylList] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedVinyl, setSelectedVinyl] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalError, setModalError] = useState("");

  const [postError, setPostError] = useState(""); 
  const [userId, setUserId] = useState("");
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

  const loadVinyls = () => {
  fetch("http://localhost:5000/api/vinyls")
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setVinylList(data);
      } else {
        console.error("Отримано невірний формат даних для вінілів:", data);
        setVinylList([]);
      }
    })
    .catch((err) => {
        console.error("Помилка при завантаженні вінілів:", err);
        setVinylList([]);
    });
};

 const loadReviews = (id) => {
    const url = `http://localhost:5000/api/reviews?productType=vinyl&productId=${id}`;

    fetch(url)
        .then((res) => res.json())
        .then((filteredData) => {
            const sortedReviews = filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setReviews(sortedReviews);
        })
        .catch((err) => console.error("Помилка завантаження відгуків:", err));
};

  useEffect(() => {
    loadVinyls();
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
    const found = vinylList.find((v) => v.ID.toString() === id);
    setSelectedVinyl(found);
    setRefreshKey(prev => prev + 1);
  };

  const handleOpenModal = (vinyl = null) => {
    if (vinyl) {
      setFormData({
        Title: vinyl.Title,
        Artist: vinyl.Artist,
        Genre: vinyl.Genre,
        Country: vinyl.Country,
        Published: vinyl.Published,
        Price: vinyl.Price,
        Photo: vinyl.Photo,
      });
      setSelectedId(vinyl.ID);
    } else {
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

  const handleSave = async () => {
    // 1. Отримуємо токен
    const token = localStorage.getItem('authToken');
    
    // Якщо операція POST або PUT, потрібен токен
    if (!token) {
        alert("Помилка: Щоб додавати або редагувати товари, потрібно увійти як Адміністратор.");
        return; 
    }

    try {
      const method = selectedId ? "PUT" : "POST";
      const url = selectedId
        ? `http://localhost:5000/api/vinyls/${selectedId}`
        : "http://localhost:5000/api/vinyls";

      const res = await fetch(url, {
        method,
        headers: { 
            "Content-Type": "application/json",
            // === КРИТИЧНО: ДОДАЄМО ЗАГОЛОВОК АВТОРИЗАЦІЇ ===
            "Authorization": `Bearer ${token}` 
            // ==============================================
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
           // Обробка помилки 403 Forbidden (Не Адмін)
           if (res.status === 403) {
               throw new Error("Недостатньо прав. Додавання/редагування доступне лише Адміністратору.");
           }
           throw new Error("Помилка при збереженні вінілу");
        }

      loadVinyls(); 
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(`Не вдалося зберегти вініл. ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    // 1. Отримуємо токен
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert("Помилка: Щоб видалити товар, потрібно увійти як Адміністратор.");
        return; 
    }

    if (!confirm("Видалити цей вініл?")) return; 
    try {
      const res = await fetch(`http://localhost:5000/api/vinyls/${id}`, {
        method: "DELETE",
        // === КРИТИЧНО: ДОДАЄМО ЗАГОЛОВОК АВТОРИЗАЦІЇ ===
        headers: { "Authorization": `Bearer ${token}` }
        // ==============================================
      });

      if (!res.ok) {
          if (res.status === 403) {
               throw new Error("Недостатньо прав. Видалення доступне лише Адміністратору.");
          }
          throw new Error("Помилка при видаленні");
       }
       
      setVinylList((prev) => prev.filter((v) => v.ID !== id));
      setSelectedVinyl(null);
      setSelectedId("");
    } catch (err) {
      console.error(err);
      alert(`Не вдалося видалити вініл. ${err.message}`);
    }
  };

 const handleAddReview = async (e) => {
        e.preventDefault();
        setPostError("");

        // === КРОК 1: ОТРИМУЄМО ТОКЕН ===
        const token = localStorage.getItem('authToken');
        if (!token) {
            setPostError("Помилка: Щоб залишити відгук, потрібно увійти в систему.");
            return;
        }
        // =================================

        // if (!userId || !comment) {
        //     return setPostError("Ім'я та коментар не можуть бути порожніми.");
        // }
        setIsSubmitting(true);
        setPostError("");
        
        // Примітка: Оскільки ваш бекенд тепер бере userId з токена, 
        // поле 'user' у payload більше не потрібне (або ігнорується).
        // Ви можете видалити input для userId з форми, щоб уникнути плутанини.
        const payload = {
            // user: userId, // ЦЕ ПОЛЕ ТЕПЕР БЕРЕТЬСЯ З req.user.id НА БЕКЕНДІ
            rating,
            comment,
            productType: "vinyl",
            productId: selectedVinyl.ID,
        };

        try {
            const idemKey = getOrReuseKey(payload);
            
            const headers = {
                "Content-Type": "application/json",
                // === КРОК 2: ДОДАЄМО ЗАГОЛОВОК АВТОРИЗАЦІЇ ===
                "Authorization": `Bearer ${token}`, 
                // ==============================================
            };

            const res = await fetchWithResilience("http://localhost:5000/api/reviews", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: headers, // <-- ПЕРЕДАЄМО НОВІ ЗАГОЛОВКИ
                idempotencyKey: idemKey,
                retry: { retries: 3, baseDelayMs: 300, timeoutMs: 3500 },
            });

            // ... (обробка res.ok та помилок) ...
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Невідома помилка сервера");
            }

            setFailureCount(0);
            setRefreshKey(k => k + 1);
            setUserId(""); // Очистити поле (хоча воно більше не використовується для відправки)
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
    const token = localStorage.getItem('authToken');
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
            `http://localhost:5000/api/reviews/${currentReview.ID}`,
            {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    // КРИТИЧНО: Додаємо токен
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ rating: modalRating, comment: modalComment }),
            }
        );
        
        if (res.status !== 200) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Помилка при оновленні відгуку");
        }
        
        alert("Відгук успішно оновлено!"); // Додамо підтвердження

        setRefreshKey(prev => prev + 1);
        setReviewModalOpen(false);
        setCurrentReview(null);
    } catch (err) {
        console.error(err);
        alert(`Не вдалося оновити відгук. ${err.message}`);
    }
};

  const deleteReviewModal = async () => {
    // 1. Отримуємо токен
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert("Помилка: Увійдіть, щоб видалити відгук.");
        return;
    }

    if (!confirm("Видалити відгук?")) return;
    
    try {
        const res = await fetch(
            `http://localhost:5000/api/reviews/${currentReview.ID}`,
            { 
                method: "DELETE",
                // === КРИТИЧНО: ДОДАЄМО ЗАГОЛОВОК АВТОРИЗАЦІЇ ===
                headers: {
                    "Authorization": `Bearer ${token}` 
                }
                // ==============================================
            }
        );
        
        // Ваш бекенд повертає 204 No Content
        if (res.status !== 204) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Помилка при видаленні відгуку");
        }
        
        alert("Відгук успішно видалено!"); // Додамо підтвердження

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
      <h2>Вініли</h2>
      {isDegraded && (
      <div style={{ color: "white", backgroundColor: "red", padding: "10px", textAlign: "center", margin: "1rem 0" }}>
        Увага! Сервіс перевантажено. Спробуйте пізніше.
      </div>
      )}

      <button className="add-vinyl-btn" onClick={() => handleOpenModal()}>Додати вініл</button>

      <select
        value={selectedId}
        onChange={handleSelectChange}
        className="select-item"
      >
        <option value="">-- Оберіть вініл --</option>
        {vinylList.map((v) => (
          <option key={v.ID} value={v.ID}>
            {v.Title} — {v.Artist}
          </option>
        ))}
      </select>

      {selectedVinyl && (
        <div className="product-card">
          <h3>{selectedVinyl.Title}</h3>
          <p>Виконавець: {selectedVinyl.Artist}</p>
          <p>Жанр: {selectedVinyl.Genre}</p>
          <p>Країна: {selectedVinyl.Country}</p>
          <p>Рік: {selectedVinyl.Published}</p>
          <p>Ціна: {selectedVinyl.Price} $</p>
          {selectedVinyl.Photo && (
            <img
              src={`http://localhost:5000/uploads/${selectedVinyl.Photo}`}
              alt={selectedVinyl.Title}
            />
          )}

          <div className="vinyl-buttons">
            <button onClick={() => handleOpenModal(selectedVinyl)}>Редагувати</button>
            <button
              className="delete-btn"
              onClick={() => handleDelete(selectedVinyl.ID)}
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
                        <b className="v">{r.username}</b>: {r.rating}★ — {r.comment}
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
            <h3>{selectedId ? "Редагувати вініл" : "Додати вініл"}</h3>
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
              <button className = "delete-btn" onClick={deleteReviewModal}>Видалити</button>
              <button className = "last-child" onClick={() => setReviewModalOpen(false)}>Відмінити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
