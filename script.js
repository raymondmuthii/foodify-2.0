const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const mealContainer = document.getElementById('meal-container');
const homepage = document.getElementById('homepage');
const backButton = document.getElementById('back-button');
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const recipeDetails = document.getElementById('recipe-details');
const userGreeting = document.getElementById('user-greeting');

const apiKey = 'ae55277eaamshf56b5c81f1faaebp156f4cjsn0065f146bcd4';
const apiHost = 'tasty.p.rapidapi.com';

// Base URL of our own signup/login backend (server.js). Change this if you
// deploy the backend somewhere other than localhost.
const API_BASE_URL = 'http://localhost:3000';

// ---------- Session helpers ----------
// The token + user are kept in localStorage so a refresh doesn't log you out.
function getToken() {
  return localStorage.getItem('foodify_token');
}

function saveSession(token, user) {
  localStorage.setItem('foodify_token', token);
  localStorage.setItem('foodify_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('foodify_token');
  localStorage.removeItem('foodify_user');
}

function getStoredUser() {
  const raw = localStorage.getItem('foodify_user');
  return raw ? JSON.parse(raw) : null;
}

// Toggles which auth buttons are visible and shows/hides the greeting
function updateAuthUI(user) {
  if (user) {
    logoutBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    userGreeting.textContent = `Hi, ${user.name || user.email}`;
    userGreeting.style.display = 'inline-block';
  } else {
    logoutBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    signupBtn.style.display = 'inline-block';
    userGreeting.style.display = 'none';
    userGreeting.textContent = '';
  }
}

// On page load, if we have a saved token, confirm it's still valid with the
// backend (it may have been cleared server-side by a logout elsewhere).
async function restoreSession() {
  const token = getToken();
  if (!token) {
    updateAuthUI(null);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      clearSession();
      updateAuthUI(null);
      return;
    }
    const data = await response.json();
    updateAuthUI(data.user);
  } catch (error) {
    console.error('Could not verify session:', error);
    // Network hiccup or backend not running — don't log the user out,
    // just fall back to whatever we had cached locally.
    const cachedUser = getStoredUser();
    updateAuthUI(cachedUser);
  }
}

restoreSession();

searchBtn.addEventListener('click', function() {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    homepage.style.display = 'none';
    mealContainer.style.display = 'grid';
    fetch(`https://tasty.p.rapidapi.com/recipes/list?from=0&size=20&q=${searchTerm}`, {
      method: 'GET',
      headers: {
        'X-Rapidapi-Key': apiKey,
        'X-Rapidapi-Host': apiHost
      }
    })
    .then(response => response.json())
    .then(data => {
      const meals = data.results;
      if (meals) {
        displayMeals(meals);
      } else {
        mealContainer.innerHTML = "No meals found for that search term.";
      }
    })
    .catch(error => {
      console.error('Error fetching meals:', error);
      mealContainer.innerHTML = "Error fetching meals. Please try again later.";
    });
  } else {
    alert("Please enter a search term.");
  }
});

backButton.addEventListener('click', function() {
  homepage.style.display = 'flex';
  mealContainer.style.display = 'none';
  recipeDetails.style.display = 'none';
});

signupBtn.addEventListener('click', function() {
  signupForm.style.display = 'block';
  loginForm.style.display = 'none';
  homepage.style.display = 'none';
  mealContainer.style.display = 'none';
  recipeDetails.style.display = 'none';
});

loginBtn.addEventListener('click', function() {
  loginForm.style.display = 'block';
  signupForm.style.display = 'none';
  homepage.style.display = 'none';
  mealContainer.style.display = 'none';
  recipeDetails.style.display = 'none';
});

logoutBtn.addEventListener('click', function() {
  logout();
});

signupForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  signUp(name, email, password);
});

loginForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  login(email, password);
});

function displayMeals(meals) {
  mealContainer.innerHTML = "";

  meals.forEach(meal => {
    const mealElement = createMealElement(meal);
    mealContainer.appendChild(mealElement);
  });
}

function createMealElement(meal) {
  const title = document.createElement('h1');
  title.textContent = meal.name;

  const image = document.createElement('img');
  image.src = meal.thumbnail_url;
  image.alt = meal.name;

  const instructions = document.createElement('p');
  instructions.innerHTML = formatInstructions(meal.instructions);

  const mealContent = document.createElement('div');
  mealContent.classList.add('meal-content');
  mealContent.appendChild(title);
  mealContent.appendChild(instructions);

  const mealElem = document.createElement('div');
  mealElem.classList.add('meal');
  mealElem.appendChild(image);
  mealElem.appendChild(mealContent);

  mealElem.addEventListener('click', function() {
    displayRecipeDetails(meal);
  });

  return mealElem;
}

function formatInstructions(instructions) {
  if (Array.isArray(instructions)) {
    return instructions.map(instruction => instruction.display_text).join('<br><br>');
  }
  return instructions || '#';
}

function displayRecipeDetails(meal) {
  recipeDetails.style.display = 'block';
  homepage.style.display = 'none';
  mealContainer.style.display = 'none';

  document.getElementById('recipe-image').src = meal.thumbnail_url;
  document.getElementById('recipe-title').textContent = meal.name;
  document.getElementById('recipe-ingredients').innerHTML = formatIngredients(meal.sections);
  document.getElementById('recipe-instructions').innerHTML = formatInstructions(meal.instructions);
  document.getElementById('recipe-nutrition').innerHTML = formatNutrition(meal.nutrition);
  displayComments(meal.id);
}

function formatIngredients(sections) {
  return sections.map(section => section.components.map(component => component.raw_text).join('<br>')).join('<br><br>');
}

function formatNutrition(nutrition) {
  return Object.entries(nutrition).map(([key, value]) => `${key}: ${value}`).join('<br>');
}

async function signUp(name, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Sign up failed. Please try again.');
      return;
    }

    alert('Sign up successful! You can now log in.');
    signupForm.style.display = 'none';
    document.getElementById('signup').reset();

    // Send them straight to the login form since they just created an account.
    loginForm.style.display = 'block';
  } catch (error) {
    console.error('Error signing up:', error);
    alert('Could not reach the server. Is the backend running on ' + API_BASE_URL + '?');
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Login failed. Please check your credentials.');
      return;
    }

    saveSession(data.token, data.user);
    updateAuthUI(data.user);

    alert('Login successful!');
    loginForm.style.display = 'none';
    document.getElementById('login').reset();
    homepage.style.display = 'flex';
  } catch (error) {
    console.error('Error logging in:', error);
    alert('Could not reach the server. Is the backend running on ' + API_BASE_URL + '?');
  }
}

async function logout() {
  const token = getToken();

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (error) {
    console.error('Error logging out on server (clearing local session anyway):', error);
  } finally {
    clearSession();
    updateAuthUI(null);
    alert('Logout successful!');
  }
}