import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const auth = getAuth();

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
  const [refineInput, setRefineInput] = useState('');
  const [refinedMeal, setRefinedMeal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMealId, setExpandedMealId] = useState(null);

  const mealsPerPage = 6;

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
    if (!email) return;
    setIsLoading(true);
    try {
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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userEmail) return;
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
          body: JSON.stringify({ email: userEmail, ...formData, meal: mealText })
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
        body: JSON.stringify({ email: userEmail, requestId, isFavorite: !currentStatus })
      });
      await fetchMealPlans(userEmail);
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleDelete = async (requestId) => {
    try {
      await fetch('http://54.208.41.138:5001/delete-meal', {
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
    signOut(auth).then(() => {
      localStorage.removeItem('user');
      navigate('/');
    }).catch((error) => {
      console.error('Logout error:', error);
    });
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
      setFormData(prev => ({ ...prev, ingredients: data.ingredients || '' }));
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
        body: JSON.stringify({ previousMeal: mealPlan, userMessage: refineInput })
      });
      const data = await response.json();
      setRefinedMeal(data.refinedMeal || "No response");
    } catch (error) {
      console.error("Error refining meal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMeals = savedMeals.filter(item => {
    const matchMeal = filterMealType ? item.mealType === filterMealType : true;
    const matchDiet = filterDiet ? item.dietaryPreference === filterDiet : true;
    return matchMeal && matchDiet;
  });

  const paginatedMeals = filteredMeals.slice((currentPage - 1) * mealsPerPage, currentPage * mealsPerPage);

  return (
    <div className="dashboard-container colorful">
      {isLoading && <div className="spinner-overlay"><div className="spinner" /></div>}

      <header className="new-header">
        <div className="logo-title">🍴 Smart Meals</div>
        <nav className="nav-links">
          <a href="#">Home</a>
          <a href="#">Recipes</a>
          <a href="#">Meal Plans</a>
          <a href="#">Community</a>
        </nav>
        <div className="profile-section" onClick={() => setShowDropdown(!showDropdown)}>
          <img src={user?.photoURL} alt="Avatar" className="avatar-circle" />
          <span className="profile-name">{user?.displayName || "User"}</span>
          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>
      <div className="meal-form">
        <h2>Generate Meal Plan</h2>
        <input
          type="text"
          name="ingredients"
          placeholder="Enter ingredients (comma-separated)"
          value={formData.ingredients}
          onChange={handleChange}
        />
        <input
          type="number"
          name="calorieGoal"
          placeholder="Enter calorie goal"
          value={formData.calorieGoal}
          onChange={handleChange}
        />
        <select name="mealType" value={formData.mealType} onChange={handleChange}>
          <option value="">Select meal type</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Snack</option>
        </select>
        <select
          name="dietaryPreference"
          value={formData.dietaryPreference}
          onChange={handleChange}
        >
          <option value="">Select dietary preference</option>
          <option value="None">None</option>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Vegan">Vegan</option>
          <option value="Gluten-Free">Gluten-Free</option>
        </select>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button onClick={handleSubmit}>Generate Meal</button>
      </div>
      {mealPlan && (
        <div className="output">
          <h2>Suggested Meal</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{mealPlan}</pre>

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
          
      {/* Saved Meals Section */}
      {savedMeals.length > 0 && (
        <div className="saved-meals">
          <h2>Saved Meal Plans</h2>
          <div className="filters">
            <label>
              Meal Type:
              <select value={filterMealType} onChange={(e) => setFilterMealType(e.target.value)}>
                <option value="">All</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </label>
            <label>
              Dietary:
              <select value={filterDiet} onChange={(e) => setFilterDiet(e.target.value)}>
                <option value="">All</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten-Free</option>
                <option value="none">None</option>
              </select>
            </label>
          </div>

          <div className="meal-grid">
            {paginatedMeals.map(item => {
              const userIngredients = formData.ingredients.toLowerCase().split(',').map(i => i.trim());
              const missingIngredients = item.ingredients.split(',').map(i => i.trim()).filter(i => !userIngredients.includes(i.toLowerCase()));
              const isExpanded = expandedMealId === item.requestId;

              return (
                <div key={item.requestId} className="meal-card colorful-card">
                  <div className="meal-header">
                    <span className={`badge ${item.mealType}`}>{item.mealType}</span>
                    <span className="badge" style={{ background: '#6366f1' }}>{item.dietaryPreference}</span>
                    <button onClick={() => handleFavoriteToggle(item.requestId, item.isFavorite)} style={{ float: 'right', fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {item.isFavorite ? '★' : '☆'}
                    </button>
                  </div>

                  <p><strong>Ingredients:</strong></p>
                  <div className="chip-container">
                    {item.ingredients.split(',').map((ingredient, i) => (
                      <span key={i} className="chip">{ingredient.trim()}</span>
                    ))}
                  </div>

                  {missingIngredients.length > 0 && (
                    <p className="missing"><strong>Missing:</strong> {missingIngredients.join(', ')}</p>
                  )}

                  <p><strong>Calories:</strong> {item.calorieGoal}</p>

                  <pre style={{ whiteSpace: 'pre-wrap', maxHeight: isExpanded ? 'none' : '100px', overflow: 'hidden' }}>{item.meal}</pre>
                  <button onClick={() => setExpandedMealId(isExpanded ? null : item.requestId)}>
                    {isExpanded ? 'Show Less' : 'Show More'}
                  </button>

                  <button onClick={() => handleDelete(item.requestId)} className="delete-btn">🗑️ Delete</button>
                </div>
              );
            })}
          </div>

          <div className="pagination">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>Previous</button>
            <span>Page {currentPage}</span>
            <button onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;
