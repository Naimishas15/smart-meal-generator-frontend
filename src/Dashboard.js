import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();
const [refineInput, setRefineInput] = useState('');
const [refinedMeal, setRefinedMeal] = useState('');

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userEmail, setUserEmail] = useState('');
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser || firebaseUser);
        setUserEmail(firebaseUser.email);
        fetchMealPlans(firebaseUser.email);
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchMealPlans = async (email) => {
    if (!email) {
      console.error('❌ userEmail is empty, cannot fetch meals.');
      return;
    }
    setIsLoading(true);
    try {
      console.log('📧 Fetching meals for:', email);
      const response = await fetch(`http://54.208.41.138:5001/get-meals?email=${email}`);
      const data = await response.json();
      setSavedMeals(data.meals);
    } catch (error) {
      console.error('Error fetching meals:', error);
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
    if (!userEmail) {
      console.error('❌ userEmail is missing. Cannot generate meal.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://54.208.41.138:5001/generate-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      const mealText = data.meal || '⚠️ Failed to generate meal.';
      setMealPlan(mealText);

      if (mealText) {
        await fetch('http://54.208.41.138:5001/store-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            ...formData,
            meal: mealText
          })
        });
        await fetchMealPlans(userEmail);
      }
    } catch (error) {
      console.error('Error generating meal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteToggle = async (requestId, currentStatus) => {
    try {
      await fetch('http://54.208.41.138:5001/favorite-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          requestId,
          isFavorite: !currentStatus
        })
      });
      await fetchMealPlans(userEmail);
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDelete = async (requestId) => {
    try {
      await fetch(`http://54.208.41.138:5001/delete-meal`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, requestId })
      });
      await fetchMealPlans(userEmail);
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsLoading(true);
      const response = await fetch('http://54.208.41.138:5001/image-to-ingredients', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        ingredients: data.ingredients || ''
      }));
      alert("🎉 Ingredients detected and added!");
    } catch (error) {
      console.error("Error detecting ingredients:", error);
      alert("❌ Failed to detect ingredients.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!mealPlan || !refineInput) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://54.208.41.138:5001/refine-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousMeal: mealPlan,
          userMessage: refineInput
        })
      });
      const data = await response.json();
      setRefinedMeal(data.refinedMeal || "No response");
    } catch (error) {
      console.error("Error refining meal:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const filteredMeals = savedMeals.filter((item) => {
    const matchMeal = filterMealType ? item.mealType === filterMealType : true;
    const matchDiet = filterDiet ? item.dietaryPreference === filterDiet : true;
    return matchMeal && matchDiet;
  });

  return (
    <div className="dashboard-container colorful">
      {isLoading && <div className="spinner-overlay"><div className="spinner" /></div>}

      <div className="dashboard-header">
        <h1>Welcome, {user?.name || user?.displayName} 🥗</h1>
        <img
          src={user?.photoURL}
          alt="User avatar"
          className="user-avatar"
          onClick={() => alert('Profile or settings menu here!')}
        />
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <form className="meal-form" onSubmit={handleSubmit}>
        {/* Image Upload for Ingredient Detection */}
        <div className="image-upload-section">
          <h3>🖼️ Detect Ingredients from Image</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
        <div className="chip-container">
          {formData.ingredients.split(',').map((ingredient, index) => (
            <span key={index} className="chip">{ingredient.trim()}</span>
          ))}
        </div>
        <input type="text" name="ingredients" placeholder="Ingredients" value={formData.ingredients} onChange={handleChange} />
        <input type="number" name="calorieGoal" placeholder="Calorie Goal" value={formData.calorieGoal} onChange={handleChange} />
        <select name="mealType" value={formData.mealType} onChange={handleChange}>
          <option value="">Meal Type</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
        <select name="dietaryPreference" value={formData.dietaryPreference} onChange={handleChange}>
          <option value="">Dietary Preference</option>
          <option value="none">None</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten-Free</option>
        </select>
        <button type="submit">Generate Meal Plan</button>
      </form>

      {mealPlan && (
        <div>
          <div className="output">
            <h2>Suggested Meal</h2>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{mealPlan}</pre>
          </div>

          <div className="refine-chat">
            <h3>💬 Refine this Meal</h3>
            <input
              type="text"
              placeholder="e.g. Make this gluten-free"
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
            />
            <button onClick={handleRefine}>Ask</button>

            {refinedMeal && (
              <div className="output">
                <h4>Refined Suggestion</h4>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{refinedMeal}</pre>
              </div>
            )}
          </div>
        </div>
      )}


      {savedMeals.length > 0 && (
        <div className="saved-meals">
          <h2>Saved Meal Plans</h2>
          <div className="filters">
            <label>
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
              Filter by Diet:
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
            {filteredMeals.map(item => {
              const userIngredients = formData.ingredients.toLowerCase().split(',').map(i => i.trim());
              const missingIngredients = item.ingredients.split(',').map(i => i.trim()).filter(i => !userIngredients.includes(i.toLowerCase()));
              return (
                <div key={item.requestId} className="meal-card colorful-card">
                  <div className="meal-header">
                    <strong>{item.mealType.toUpperCase()}</strong>
                    <button onClick={() => handleFavoriteToggle(item.requestId, item.isFavorite)}>
                      {item.isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                  <p><strong>Ingredients:</strong> {item.ingredients}</p>
                  {missingIngredients.length > 0 && (
                    <p className="missing"><strong>Missing:</strong> {missingIngredients.join(', ')}</p>
                  )}
                  <p><strong>Calories:</strong> {item.calorieGoal}</p>
                  <p><strong>Diet:</strong> {item.dietaryPreference}</p>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{item.meal}</pre>
                  <button onClick={() => handleDelete(item.requestId)} className="delete-btn">Delete</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Smart Meal Generator • Colorful Edition • React + Node + OpenAI + Firebase + AWS</p>
      </footer>
    </div>
  );
}

export default Dashboard;
