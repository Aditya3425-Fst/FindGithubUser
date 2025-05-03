import { useState, useEffect, useRef } from "react";
import "./App.css";
import UserCard from "./components/user-card/user-card";

// Icons (can be replaced with your preferred icon library like Font Awesome or Material Icons)
const SearchIcon = () => <span>🔍</span>;
const HistoryIcon = () => <span>⏱️</span>;
const ResultsIcon = () => <span>👤</span>;
const ClockIcon = () => <span>🕒</span>;

function App() {
  // State Management
  const [inputValue, setInputValue] = useState("");
  const [activePage, setActivePage] = useState("home"); // "home" or "about"
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);

  // Refs
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load search history from localStorage on initial render
  useEffect(() => {
    const savedHistory = localStorage.getItem('githubFinderHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Error parsing search history:", error);
      }
    }
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Input change handler with debounced API call
  function handleInputChange(event) {
    const value = event.target.value;
    setInputValue(value);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Show suggestions after typing
    if (value.trim().length > 0) {
      // Debounce the suggestions fetch (300ms)
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }
  
  // Fetch suggestions for autocomplete
  async function fetchSuggestions(query) {
    if (!query.trim()) return;
    
    try {
      const response = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setSuggestions(data.items);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setShowSuggestions(false);
    }
  }
  
  // Handle suggestion click
  function handleSuggestionClick(user) {
    setInputValue(user.login);
    setShowSuggestions(false);
    onSearchSubmit(user.login);
  }

  // Handle search form submission
  async function onSearchSubmit(username = null) {
    const searchQuery = username || inputValue;
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await findGithubAccounts(searchQuery);
      
      setResults(results);
      
      // Add first result to search history if any results found
      if (results.length > 0) {
        addToSearchHistory(results[0]);
      }
    } catch (err) {
      setError(err.message || "An error occurred while searching.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Main API call to find GitHub accounts
  async function findGithubAccounts(query) {
    try {
      const response = await fetch(`https://api.github.com/search/users?q=${query}`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const json = await response.json();
      return json.items || [];
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }
  
  // Add a user to search history
  function addToSearchHistory(user) {
    setSearchHistory(prevHistory => {
      // Check if user already exists in history
      const existingUserIndex = prevHistory.findIndex(item => item.id === user.id);
      
      let newHistory;
      if (existingUserIndex >= 0) {
        // If exists, move to top of history
        newHistory = [
          user,
          ...prevHistory.filter(item => item.id !== user.id)
        ];
      } else {
        // If new, add to top
        newHistory = [user, ...prevHistory];
      }
      
      // Limit to 5 items
      newHistory = newHistory.slice(0, 5);
      
      // Save to localStorage
      localStorage.setItem('githubFinderHistory', JSON.stringify(newHistory));
      
      return newHistory;
    });
  }
  
  // Handle history item click
  function handleHistoryClick(user) {
    setInputValue(user.login);
    onSearchSubmit(user.login);
  }
  
  // Clear search history
  function clearSearchHistory() {
    setSearchHistory([]);
    localStorage.removeItem('githubFinderHistory');
  }
  
  // Navigation functions
  function navigateToHome() {
    setActivePage("home");
  }
  
  function navigateToAbout() {
    setActivePage("about");
  }

  // Render Home Page
  const renderHomePage = () => (
    <div className="search-section">
      {/* Search Bar */}
      <div className="search-bar-container" ref={suggestionsRef}>
        <div className="search-bar">
          <input
            className="search-input"
            ref={searchInputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter GitHub username..."
            disabled={isLoading}
          />
          <button 
            className="search-button"
            onClick={() => onSearchSubmit()}
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? "Searching..." : (
              <>
                <SearchIcon /> Search
              </>
            )}
          </button>
        </div>
        
        {/* Live Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map(user => (
              <div 
                className="suggestion-item" 
                key={user.id}
                onClick={() => handleSuggestionClick(user)}
              >
                <img 
                  className="suggestion-avatar" 
                  src={user.avatar_url} 
                  alt={`${user.login}'s avatar`} 
                />
                <div className="suggestion-info">
                  <span className="suggestion-username">{user.login}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3 className="history-title">
              <HistoryIcon /> Recent Searches
            </h3>
            <button className="clear-history" onClick={clearSearchHistory}>
              Clear
            </button>
          </div>
          <div className="history-list">
            {searchHistory.map(user => (
              <div 
                className="history-item" 
                key={user.id}
                onClick={() => handleHistoryClick(user)}
              >
                <img 
                  className="history-avatar" 
                  src={user.avatar_url} 
                  alt={`${user.login}'s avatar`} 
                />
                <span className="history-username">{user.login}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="error-message" style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          color: 'var(--error)',
          marginTop: '2rem'
        }}>
          {error}
        </div>
      )}
      
      {/* Results */}
      {!isLoading && !error && results.length > 0 && (
        <div className="results-section">
          <h2 className="results-title">
            <ResultsIcon /> Results
          </h2>
          <div className="results-container">
            {results.map(user => (
              <UserCard
                key={user.id}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render About Page
  const renderAboutPage = () => (
    <div className="about-container">
      <section className="about-section">
        <h2 className="about-title">About GitHubFinder</h2>
        <p className="about-text">
          GitHubFinder is a modern, interactive tool designed to help you discover GitHub users and explore their profiles and repositories. With a clean, intuitive interface, it allows you to search through GitHub's extensive developer community and get detailed information about users and their work.
        </p>
      </section>
      
      <section className="about-section">
        <h2 className="about-title">Key Features</h2>
        <ul className="feature-list">
          <li className="feature-item">
            <span className="feature-icon">🔍</span>
            <div className="feature-content">
              <h3 className="feature-title">Live GitHub Search</h3>
              <p className="feature-description">Search for GitHub users in real-time with auto-suggestions as you type, making it easy to find exactly who you're looking for.</p>
            </div>
          </li>
          <li className="feature-item">
            <span className="feature-icon">👤</span>
            <div className="feature-content">
              <h3 className="feature-title">Detailed User Profiles</h3>
              <p className="feature-description">View comprehensive user information including avatars, bio, location, followers count, and more in a clean, organized layout.</p>
            </div>
          </li>
          <li className="feature-item">
            <span className="feature-icon">📁</span>
            <div className="feature-content">
              <h3 className="feature-title">Repository Showcase</h3>
              <p className="feature-description">Browse through users' most recent repositories, complete with descriptions, language information, stars, and forks.</p>
            </div>
          </li>
          <li className="feature-item">
            <span className="feature-icon">⏱️</span>
            <div className="feature-content">
              <h3 className="feature-title">Search History</h3>
              <p className="feature-description">Keep track of your recent searches with our convenient history feature, allowing you to quickly revisit profiles you've recently viewed.</p>
            </div>
          </li>
          <li className="feature-item">
            <span className="feature-icon">📱</span>
            <div className="feature-content">
              <h3 className="feature-title">Responsive Design</h3>
              <p className="feature-description">Enjoy a seamless experience across all your devices with our fully responsive layout that works on desktops, tablets, and mobile phones.</p>
            </div>
          </li>
        </ul>
      </section>
      
      <section className="about-section">
        <h2 className="about-title">Powered By GitHub API</h2>
        <p className="about-text">
          This application leverages the powerful <a href="https://docs.github.com/en/rest" target="_blank" rel="noopener noreferrer">GitHub REST API</a> to provide you with accurate, up-to-date information on millions of developers worldwide.
        </p>
        <div className="fun-fact">
          Did you know? GitHub hosts over 200 million repositories and is home to more than 83 million developers from around the globe! It's the world's largest platform for code collaboration and open-source projects.
        </div>
      </section>
      
      <section className="creator-section">
        <img 
          className="creator-avatar" 
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" 
          alt="GitHub Logo" 
        />
        <div className="creator-info">
          <h3 className="creator-name">Project Creator</h3>
          <p className="creator-title">GitHub Finder Developer</p>
          <div className="creator-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="creator-link">
              <span>GitHub</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="creator-link">
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="app">
      {/* Header/Navigation */}
      <header className="header">
        <div className="container header-container">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); navigateToHome(); }}>
            <span className="logo-icon">🔎</span> GitHubFinder
          </a>
          <nav className="nav">
            <a 
              href="#" 
              className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigateToHome(); }}
            >
              Home
            </a>
            <a 
              href="#" 
              className={`nav-link ${activePage === 'about' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigateToAbout(); }}
            >
              About
            </a>
          </nav>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="main">
        <div className="container">
          <h1 className="page-title">
            {activePage === 'home' ? 'GitHub Account Finder' : 'About GitHubFinder'}
          </h1>
          
          {activePage === 'home' ? renderHomePage() : renderAboutPage()}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="footer">
        <div className="container footer-container">
          <div className="footer-text">
            &copy; {new Date().getFullYear()} GitHubFinder | Powered by GitHub API
          </div>
          <div className="footer-links">
            <a 
              href="https://github.com/topics/github-api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub API
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigateToAbout(); }}
              className="footer-link"
            >
              About
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
