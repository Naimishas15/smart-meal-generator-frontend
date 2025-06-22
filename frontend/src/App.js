import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Smart Meal Generator</h1>
      <p>Input your ingredients, calorie goal, meal type, and dietary preference.</p>

      <button className="google-login">Login with Google</button>

      <form className="meal-form">
        <input type="text" placeholder="Enter ingredients (e.g., rice, chicken)" />
        <input type="number" placeholder="Enter calorie goal (e.g., 500)" />

        <select>
          <option value="">Select meal type</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>

        <select>
          <option value="">Dietary preference</option>
          <option value="none">None</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="gluten-free">Gluten-Free</option>
        </select>

        <button type="submit">Generate Meal Plan</button>
      </form>
      <div className="output">
        <h2>Suggested Meal Plan</h2>
        <p>🥗 1 cup of rice</p>
        <p>🍗 100g grilled chicken</p>
        <p>🥬 Mixed salad with dressing</p>
        <p>Total Calories: ~500 kcal</p>
      </div>

        <footer style={{ marginTop: '50px', fontSize: '14px', color: '#666' }}>
          <p>Week 3: Frontend UI design complete. Backend integration coming next.</p>
        </footer>
    </div>
  );
}

export default App;
