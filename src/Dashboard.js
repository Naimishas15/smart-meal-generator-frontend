
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import './App.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    ingredients: '',
    calorieGoal: '',
    mealType: '',
    dietaryPreference: ''
  });
  const [mealPlan, setMealPlan] = useState(null);
  const [savedMeals, setSavedMeals] = useState([]);
  const [filterMealType, setFilterMealType] = useState('');
  const [filterDiet, setFilterDiet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleProfileMenu = () => {
    setShowProfileMenu(prev => !prev);
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      fetchMealPlans(storedUser.email);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchMealPlans = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/get-meals?email=${email}`);
      const data = await response.json();
      setSavedMeals(data.meals);
    } catch (error) {
      console.error('Failed to fetch saved meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/generate-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      const mealText = data.meal || "⚠️ Failed to generate meal.";
      setMealPlan(mealText);

      if (user && mealText) {
        await fetch('http://localhost:5001/store-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            ...formData,
            meal: mealText
          })
        });
        await fetchMealPlans(user.email);
      }
    } catch (error) {
      console.error('Error generating meal:', error);
      setMealPlan({ error: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteToggle = async (requestId, currentStatus) => {
    try {
      await fetch('http://localhost:5001/favorite-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          requestId,
          isFavorite: !currentStatus,
        })
      });
      await fetchMealPlans(user.email);
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDelete = async (requestId) => {
    try {
      await fetch('http://localhost:5001/delete-meal', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, requestId })
      });
      await fetchMealPlans(user.email);
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredMeals = savedMeals.filter((item) => {
    const matchMeal = filterMealType ? item.mealType === filterMealType : true;
    const matchDiet = filterDiet ? item.dietaryPreference === filterDiet : true;
    return matchMeal && matchDiet;
  });

  return (
    <div className="dashboard-container">
      {isLoading && (
        <div className="spinner-overlay">
          <div className="spinner" />
        </div>
      )}

      <div className="dashboard-header">
        <div className="user-info">
          <div className="avatar-wrapper" onClick={toggleProfileMenu}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="avatar" />
            ) : (
              <div className="avatar fallback">👤</div>
            )}
          </div>
          <h1>Welcome, {user?.name || user?.displayName} 🥗</h1>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <p><strong>{user.name}</strong></p>
              <p>{user.email}</p>
              <button className="logout-btn small" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>

      <form className="meal-form" onSubmit={handleSubmit}>
        <input type="text" name="ingredients" placeholder="Ingredients" value={formData.ingredients} onChange={handleChange} />
        <input type="number" name="calorieGoal" placeholder="Calorie goal" value={formData.calorieGoal} onChange={handleChange} />
        <select name="mealType" value={formData.mealType} onChange={handleChange}>
          <option value="">Meal type</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option>
        </select>
        <select name="dietaryPreference" value={formData.dietaryPreference} onChange={handleChange}>
          <option value="">Dietary preference</option><option value="none">None</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="gluten-free">Gluten-Free</option>
        </select>
        <button type="submit">Generate</button>
      </form>

      {mealPlan && (
        <div className="output">
          <h2>Meal Plan</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{typeof mealPlan === 'string' ? mealPlan : JSON.stringify(mealPlan)}</pre>
        </div>
      )}

      {savedMeals.length > 0 && (
        <div className="saved-meals">
          <h2>Saved Meals</h2>
          <div className="filters" style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '20px' }}>
              Filter by Meal Type:
              <select value={filterMealType} onChange={(e) => setFilterMealType(e.target.value)}>
                <option value="">All</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </label>

            <label>
              Filter by Dietary Preference:
              <select value={filterDiet} onChange={(e) => setFilterDiet(e.target.value)}>
                <option value="">All</option>
                <option value="none">None</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten-Free</option>
              </select>
            </label>
          </div>
          <div className="meal-grid">
            {filteredMeals.map((item) => (
              <div key={item.requestId} className="meal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{item.mealType.toUpperCase()}</strong>
                  <button onClick={() => handleFavoriteToggle(item.requestId, item.isFavorite)}>{item.isFavorite ? '★' : '☆'}</button>
                </div>
                <p><strong>Ingredients:</strong> {item.ingredients}</p>
                <p><strong>Calories:</strong> {item.calorieGoal}</p>
                <p><strong>Diet:</strong> {item.dietaryPreference}</p>
                <pre>{item.meal}</pre>
                <button onClick={() => handleDelete(item.requestId)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

  );
}

export default Dashboard;
