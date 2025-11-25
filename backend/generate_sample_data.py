"""
Sample Data Generator for Social Media Strategy Lab
Generates realistic test data when real dataset is not available
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_data(n_samples=1000, output_path='data/Viral_Social_Media_Trends_cleaned.csv'):
    """
    Generate sample social media data
    
    Args:
        n_samples: Number of posts to generate
        output_path: Where to save the CSV file
    """
    np.random.seed(42)
    
    # Define options
    platforms = ['TikTok', 'Instagram', 'Twitter', 'YouTube']
    content_types = ['Video', 'Image', 'Text', 'Story', 'Reel']
    regions = ['USA', 'India', 'Brazil', 'UK', 'Japan', 'Germany', 'Canada', 'Australia', 'France', 'Mexico']
    
    # Platform-specific parameters
    platform_stats = {
        'TikTok': {'views_mean': 150000, 'eng_rate': 0.08},
        'Instagram': {'views_mean': 80000, 'eng_rate': 0.06},
        'Twitter': {'views_mean': 50000, 'eng_rate': 0.04},
        'YouTube': {'views_mean': 200000, 'eng_rate': 0.05}
    }
    
    data = []
    start_date = datetime(2023, 1, 1)
    
    for i in range(n_samples):
        platform = np.random.choice(platforms)
        stats = platform_stats[platform]
        
        # Generate views with log-normal distribution
        views = int(np.random.lognormal(np.log(stats['views_mean']), 1.5))
        views = max(100, views)  # Minimum 100 views
        
        # Generate engagement rate with some variance
        base_eng_rate = stats['eng_rate']
        eng_rate = max(0.001, np.random.normal(base_eng_rate, base_eng_rate * 0.5))
        
        # Calculate engagement metrics
        total_engagement = int(views * eng_rate)
        
        # Distribute engagement across metrics
        likes = int(total_engagement * np.random.uniform(0.5, 0.7))
        shares = int(total_engagement * np.random.uniform(0.1, 0.2))
        comments = total_engagement - likes - shares
        comments = max(0, comments)
        
        # Random date within range
        random_days = np.random.randint(0, 730)  # 2 years
        post_date = start_date + timedelta(days=random_days)
        
        data.append({
            'Platform': platform,
            'Content_Type': np.random.choice(content_types),
            'Region': np.random.choice(regions),
            'Views': views,
            'Likes': likes,
            'Shares': shares,
            'Comments': comments,
            'Post_Date': post_date.strftime('%Y-%m-%d')
        })
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Add some viral outliers (5% of data)
    n_viral = int(n_samples * 0.05)
    viral_indices = np.random.choice(df.index, n_viral, replace=False)
    df.loc[viral_indices, 'Views'] *= np.random.uniform(5, 20, n_viral)
    df.loc[viral_indices, 'Likes'] *= np.random.uniform(3, 10, n_viral)
    df.loc[viral_indices, 'Shares'] *= np.random.uniform(3, 15, n_viral)
    df.loc[viral_indices, 'Comments'] *= np.random.uniform(2, 8, n_viral)
    
    # Round all numeric columns
    numeric_cols = ['Views', 'Likes', 'Shares', 'Comments']
    df[numeric_cols] = df[numeric_cols].round().astype(int)
    
    # Sort by date
    df = df.sort_values('Post_Date').reset_index(drop=True)
    
    # Save to CSV
    df.to_csv(output_path, index=False)
    
    print(f"✅ Generated {n_samples} sample posts")
    print(f"📁 Saved to: {output_path}")
    print(f"\nSample statistics:")
    print(f"  Average Views: {df['Views'].mean():,.0f}")
    print(f"  Average Likes: {df['Likes'].mean():,.0f}")
    print(f"  Date range: {df['Post_Date'].min()} to {df['Post_Date'].max()}")
    print(f"\nPlatform distribution:")
    print(df['Platform'].value_counts())

if __name__ == '__main__':
    import os
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Generate sample data
    generate_sample_data(n_samples=2000)
    
    print("\n🎉 Sample data generated successfully!")
    print("You can now start the Flask server with: python app.py")
