import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [filterOptions, setFilterOptions] = useState(null);
  const [filters, setFilters] = useState({
    platform: '',
    content_type: '',
    region: '',
    date_start: '',
    date_end: ''
  });
  const [exploreData, setExploreData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Recommendation form state
  const [recForm, setRecForm] = useState({
    platform: 'TikTok',
    content_type: 'Video',
    region: 'USA',
    expected_views: ''
  });
  const [recommendations, setRecommendations] = useState(null);
  
  // Comparison state
  const [platformA, setPlatformA] = useState('TikTok');
  const [platformB, setPlatformB] = useState('Instagram');
  const [platformComparison, setPlatformComparison] = useState(null);
  
  const [selectedRegions, setSelectedRegions] = useState(['USA', 'India']);
  const [regionComparison, setRegionComparison] = useState(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/filters/options`);
      const data = await response.json();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleExplore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/explore/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      const data = await response.json();
      setExploreData(data);
    } catch (error) {
      console.error('Error exploring data:', error);
    }
    setLoading(false);
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recForm,
          expected_views: recForm.expected_views ? parseInt(recForm.expected_views) : null
        })
      });
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    }
    setLoading(false);
  };

  const handleComparePlatforms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/compare/platforms?A=${platformA}&B=${platformB}`);
      const data = await response.json();
      setPlatformComparison(data);
    } catch (error) {
      console.error('Error comparing platforms:', error);
    }
    setLoading(false);
  };

  const handleCompareRegions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/compare/regions?list=${selectedRegions.join(',')}`);
      const data = await response.json();
      setRegionComparison(data);
    } catch (error) {
      console.error('Error comparing regions:', error);
    }
    setLoading(false);
  };

  const renderLanding = () => (
    <div className="landing">
      <div className="hero">
        <div className="hero-badge">DATA-DRIVEN INSIGHTS</div>
        <h1 className="hero-title">
          Social Media<br />
          <span className="gradient-text">Strategy Lab</span>
        </h1>
        <p className="hero-subtitle">
          Discover what makes content viral vs truly engaging.<br />
          Move beyond guesswork with behavioral segmentation.
        </p>
        <div className="hero-stats">
          {filterOptions && (
            <>
              <div className="stat">
                <div className="stat-value">{filterOptions.stats.total_posts.toLocaleString()}</div>
                <div className="stat-label">Posts Analyzed</div>
              </div>
              <div className="stat">
                <div className="stat-value">{(filterOptions.stats.avg_engagement_rate * 100).toFixed(2)}%</div>
                <div className="stat-label">Avg Engagement</div>
              </div>
              <div className="stat">
                <div className="stat-value">{filterOptions.platforms.length}</div>
                <div className="stat-label">Platforms</div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="nav-cards">
        <div className="nav-card" onClick={() => setCurrentView('explore')}>
          <div className="nav-card-icon">📊</div>
          <h3>Explore Trends</h3>
          <p>Interactive filtering and visualization of social media performance patterns</p>
        </div>
        
        <div className="nav-card primary" onClick={() => setCurrentView('recommend')}>
          <div className="nav-card-icon">🎯</div>
          <h3>Get Recommendations</h3>
          <p>Receive strategy insights based on your content and audience segments</p>
        </div>
        
        <div className="nav-card" onClick={() => setCurrentView('compare')}>
          <div className="nav-card-icon">⚡</div>
          <h3>Compare & Analyze</h3>
          <p>Platform and region comparison with behavioral segmentation insights</p>
        </div>
      </div>
    </div>
  );

  const renderExplore = () => (
    <div className="explore-view">
      <div className="view-header">
        <h2>Interactive Exploration Dashboard</h2>
        <p>Filter and analyze social media performance patterns</p>
      </div>
      
      <div className="filter-panel">
        <div className="filter-group">
          <label>Platform</label>
          <select 
            value={filters.platform} 
            onChange={(e) => setFilters({...filters, platform: e.target.value})}
          >
            <option value="">All Platforms</option>
            {filterOptions?.platforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Content Type</label>
          <select 
            value={filters.content_type} 
            onChange={(e) => setFilters({...filters, content_type: e.target.value})}
          >
            <option value="">All Types</option>
            {filterOptions?.content_types.map(ct => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Region</label>
          <select 
            value={filters.region} 
            onChange={(e) => setFilters({...filters, region: e.target.value})}
          >
            <option value="">All Regions</option>
            {filterOptions?.regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        
        <button className="btn-primary" onClick={handleExplore} disabled={loading}>
          {loading ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>
      
      {exploreData && (
        <div className="results">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-value">{exploreData.summary.total_posts.toLocaleString()}</div>
              <div className="summary-label">Posts</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{exploreData.summary.avg_views.toFixed(0).toLocaleString()}</div>
              <div className="summary-label">Avg Views</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{(exploreData.summary.avg_engagement_rate * 100).toFixed(2)}%</div>
              <div className="summary-label">Engagement Rate</div>
            </div>
          </div>
          
          <div className="charts-grid">
            <div className="chart-container">
              <h3>Engagement Distribution</h3>
              <Plot
                data={[{
                  values: Object.values(exploreData.engagement_distribution),
                  labels: Object.keys(exploreData.engagement_distribution),
                  type: 'pie',
                  marker: {
                    colors: ['#ff6b6b', '#ffd93d', '#6bcf7f']
                  },
                  textinfo: 'label+percent',
                  hole: 0.4
                }]}
                layout={{
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: { color: '#fff', family: 'Inter, sans-serif' },
                  showlegend: false,
                  margin: { t: 20, b: 20, l: 20, r: 20 }
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '300px' }}
              />
            </div>
            
            {exploreData.time_series.length > 0 && (
              <div className="chart-container">
                <h3>Engagement Over Time</h3>
                <Plot
                  data={[{
                    x: exploreData.time_series.map(d => d.Post_Date),
                    y: exploreData.time_series.map(d => d.eng_rate * 100),
                    type: 'scatter',
                    mode: 'lines+markers',
                    line: { color: '#6bcf7f', width: 3 },
                    marker: { color: '#6bcf7f', size: 6 }
                  }]}
                  layout={{
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { color: '#fff', family: 'Inter, sans-serif' },
                    xaxis: { gridcolor: '#333', showgrid: true },
                    yaxis: { gridcolor: '#333', showgrid: true, title: 'Engagement Rate (%)' },
                    margin: { t: 20, b: 40, l: 50, r: 20 }
                  }}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%', height: '300px' }}
                />
              </div>
            )}
          </div>
          
          {exploreData.top_posts.length > 0 && (
            <div className="top-posts">
              <h3>Top Performing Posts</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th>Type</th>
                      <th>Region</th>
                      <th>Views</th>
                      <th>Likes</th>
                      <th>Shares</th>
                      <th>Comments</th>
                      <th>Eng Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exploreData.top_posts.slice(0, 10).map((post, idx) => (
                      <tr key={idx}>
                        <td>{post.Platform}</td>
                        <td>{post.Content_Type}</td>
                        <td>{post.Region}</td>
                        <td>{post.Views.toFixed(0).toLocaleString()}</td>
                        <td>{post.Likes.toFixed(0).toLocaleString()}</td>
                        <td>{post.Shares.toFixed(0).toLocaleString()}</td>
                        <td>{post.Comments.toFixed(0).toLocaleString()}</td>
                        <td>{(post.eng_rate * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderRecommend = () => (
    <div className="recommend-view">
      <div className="view-header">
        <h2>Strategy Recommendation Simulator</h2>
        <p>Get personalized insights based on your content strategy</p>
      </div>
      
      <div className="rec-form">
        <div className="form-section">
          <h3>Content Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Platform *</label>
              <select 
                value={recForm.platform} 
                onChange={(e) => setRecForm({...recForm, platform: e.target.value})}
              >
                {filterOptions?.platforms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Content Type</label>
              <select 
                value={recForm.content_type} 
                onChange={(e) => setRecForm({...recForm, content_type: e.target.value})}
              >
                {filterOptions?.content_types.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Target Region</label>
              <select 
                value={recForm.region} 
                onChange={(e) => setRecForm({...recForm, region: e.target.value})}
              >
                {filterOptions?.regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Expected Views (optional)</label>
              <input 
                type="number" 
                placeholder="e.g. 100000"
                value={recForm.expected_views}
                onChange={(e) => setRecForm({...recForm, expected_views: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <button className="btn-primary btn-large" onClick={handleGetRecommendations} disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Recommendations'}
        </button>
      </div>
      
      {recommendations && (
        <div className="recommendations-result">
          {recommendations.segment_info?.strategy_segment && (
            <div className="segment-card">
              <div className="segment-badge">{recommendations.segment_info.strategy_segment}</div>
              <p className="segment-description">{recommendations.segment_info.strategy_description}</p>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{width: `${recommendations.confidence * 100}%`}}></div>
              </div>
              <p className="confidence-text">{(recommendations.confidence * 100).toFixed(0)}% confidence</p>
            </div>
          )}
          
          <div className="recommendations-list">
            <h3>💡 Strategy Recommendations</h3>
            <ul>
              {recommendations.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
          
          <div className="platform-insights">
            <h3>Platform Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-label">Avg Views (25-75 percentile)</div>
                <div className="insight-value">
                  {recommendations.platform_stats.views_percentiles.p25.toLocaleString()} - {recommendations.platform_stats.views_percentiles.p75.toLocaleString()}
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Avg Engagement Rate</div>
                <div className="insight-value">
                  {(recommendations.platform_stats.avg_engagement_rate * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompare = () => (
    <div className="compare-view">
      <div className="view-header">
        <h2>Platform & Region Comparison</h2>
        <p>Analyze behavioral patterns across platforms and regions</p>
      </div>
      
      <div className="comparison-section">
        <h3>Platform Comparison</h3>
        <div className="compare-form">
          <select value={platformA} onChange={(e) => setPlatformA(e.target.value)}>
            {filterOptions?.platforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span className="vs">VS</span>
          <select value={platformB} onChange={(e) => setPlatformB(e.target.value)}>
            {filterOptions?.platforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleComparePlatforms} disabled={loading}>
            Compare
          </button>
        </div>
        
        {platformComparison && (
          <div className="comparison-results">
            <div className="comparison-cards">
              <div className="comparison-card">
                <h4>{platformComparison.platform_a.platform}</h4>
                <div className="metric">
                  <span className="metric-label">Avg Views</span>
                  <span className="metric-value">{platformComparison.platform_a.avg_views.toFixed(0).toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Engagement Rate</span>
                  <span className="metric-value">{(platformComparison.platform_a.avg_engagement_rate * 100).toFixed(2)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Total Posts</span>
                  <span className="metric-value">{platformComparison.platform_a.total_posts.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="comparison-card">
                <h4>{platformComparison.platform_b.platform}</h4>
                <div className="metric">
                  <span className="metric-label">Avg Views</span>
                  <span className="metric-value">{platformComparison.platform_b.avg_views.toFixed(0).toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Engagement Rate</span>
                  <span className="metric-value">{(platformComparison.platform_b.avg_engagement_rate * 100).toFixed(2)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Total Posts</span>
                  <span className="metric-value">{platformComparison.platform_b.total_posts.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="chart-container">
              <Plot
                data={[
                  {
                    x: ['Avg Views', 'Engagement Rate', 'Avg Likes', 'Avg Shares', 'Avg Comments'],
                    y: [
                      platformComparison.platform_a.avg_views / 1000,
                      platformComparison.platform_a.avg_engagement_rate * 100,
                      platformComparison.platform_a.avg_likes,
                      platformComparison.platform_a.avg_shares,
                      platformComparison.platform_a.avg_comments
                    ],
                    name: platformComparison.platform_a.platform,
                    type: 'bar',
                    marker: { color: '#6bcf7f' }
                  },
                  {
                    x: ['Avg Views', 'Engagement Rate', 'Avg Likes', 'Avg Shares', 'Avg Comments'],
                    y: [
                      platformComparison.platform_b.avg_views / 1000,
                      platformComparison.platform_b.avg_engagement_rate * 100,
                      platformComparison.platform_b.avg_likes,
                      platformComparison.platform_b.avg_shares,
                      platformComparison.platform_b.avg_comments
                    ],
                    name: platformComparison.platform_b.platform,
                    type: 'bar',
                    marker: { color: '#ffd93d' }
                  }
                ]}
                layout={{
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: { color: '#fff', family: 'Inter, sans-serif' },
                  barmode: 'group',
                  xaxis: { gridcolor: '#333' },
                  yaxis: { gridcolor: '#333', title: 'Value (normalized)' },
                  legend: { orientation: 'h', y: -0.2 },
                  margin: { t: 20, b: 60, l: 50, r: 20 }
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '400px' }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="comparison-section">
        <h3>Region Comparison</h3>
        <div className="compare-form">
          <div className="multi-select">
            {filterOptions?.regions.map(r => (
              <label key={r} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedRegions.includes(r)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRegions([...selectedRegions, r]);
                    } else {
                      setSelectedRegions(selectedRegions.filter(reg => reg !== r));
                    }
                  }}
                />
                {r}
              </label>
            ))}
          </div>
          <button className="btn-primary" onClick={handleCompareRegions} disabled={loading}>
            Compare Regions
          </button>
        </div>
        
        {regionComparison && regionComparison.regions.length > 0 && (
          <div className="comparison-results">
            <div className="chart-container">
              <Plot
                data={[
                  {
                    x: regionComparison.regions.map(r => r.region),
                    y: regionComparison.regions.map(r => r.avg_engagement_rate * 100),
                    type: 'bar',
                    marker: { 
                      color: regionComparison.regions.map((_, idx) => 
                        ['#6bcf7f', '#ffd93d', '#ff6b6b', '#4ecdc4', '#ff8c42'][idx % 5]
                      )
                    },
                    text: regionComparison.regions.map(r => `${(r.avg_engagement_rate * 100).toFixed(2)}%`),
                    textposition: 'auto',
                  }
                ]}
                layout={{
                  title: 'Engagement Rate by Region',
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: { color: '#fff', family: 'Inter, sans-serif' },
                  xaxis: { gridcolor: '#333' },
                  yaxis: { gridcolor: '#333', title: 'Engagement Rate (%)' },
                  margin: { t: 40, b: 40, l: 50, r: 20 }
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '400px' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => setCurrentView('landing')}>
          <span className="brand-icon">📈</span>
          <span className="brand-text">Strategy Lab</span>
        </div>
        <div className="nav-links">
          <button 
            className={currentView === 'explore' ? 'active' : ''} 
            onClick={() => setCurrentView('explore')}
          >
            Explore
          </button>
          <button 
            className={currentView === 'recommend' ? 'active' : ''} 
            onClick={() => setCurrentView('recommend')}
          >
            Recommendations
          </button>
          <button 
            className={currentView === 'compare' ? 'active' : ''} 
            onClick={() => setCurrentView('compare')}
          >
            Compare
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        {currentView === 'landing' && renderLanding()}
        {currentView === 'explore' && renderExplore()}
        {currentView === 'recommend' && renderRecommend()}
        {currentView === 'compare' && renderCompare()}
      </main>
      
      <footer className="footer">
        <p>Social Media Strategy Lab • Data-Driven Content Insights</p>
      </footer>
    </div>
  );
}

export default App;
