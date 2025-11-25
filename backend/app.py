from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
import os
from datetime import datetime
import traceback
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)

# Global variables for loaded models and data
data = None
models = {}

def load_data():
    """Load the cleaned dataset"""
    global data
    try:
        # Adjust path as needed
        data_path = 'data/Viral_Social_Media_Trends_cleaned.csv'
        if os.path.exists(data_path):
            data = pd.read_csv(data_path)
            
            # Parse dates
            data['Post_Date'] = pd.to_datetime(data['Post_Date'], errors='coerce')
            data['Post_Year'] = data['Post_Date'].dt.year
            data['Post_Month'] = data['Post_Date'].dt.month
            data['Post_DayOfWeek'] = data['Post_Date'].dt.dayofweek
            data['is_weekend'] = data['Post_DayOfWeek'].isin([5, 6]).astype(int)
            
            # Calculate engagement rate
            data['eng_rate'] = (data['Likes'] + data['Shares'] + data['Comments']) / data['Views'].replace(0, 1)
            
            # Create engagement levels based on percentiles
            q25 = data['eng_rate'].quantile(0.25)
            q75 = data['eng_rate'].quantile(0.75)
            
            def categorize_engagement(rate):
                if rate <= q25:
                    return 'Low'
                elif rate <= q75:
                    return 'Medium'
                else:
                    return 'High'
            
            data['Engagement_Level_new'] = data['eng_rate'].apply(categorize_engagement)
            
            print(f"Data loaded successfully: {len(data)} rows")
            return True
        else:
            print(f"Warning: Data file not found at {data_path}")
            # Create dummy data for testing
            create_dummy_data()
            return True
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        create_dummy_data()
        return False

def create_dummy_data():
    """Create dummy data for testing when real data is unavailable"""
    global data
    np.random.seed(42)
    n = 1000
    
    platforms = ['TikTok', 'Instagram', 'Twitter', 'YouTube']
    content_types = ['Video', 'Image', 'Text', 'Story']
    regions = ['USA', 'India', 'Brazil', 'UK', 'Japan']
    
    data = pd.DataFrame({
        'Platform': np.random.choice(platforms, n),
        'Content_Type': np.random.choice(content_types, n),
        'Region': np.random.choice(regions, n),
        'Views': np.random.exponential(100000, n),
        'Likes': np.random.exponential(5000, n),
        'Shares': np.random.exponential(1000, n),
        'Comments': np.random.exponential(500, n),
        'Post_Date': pd.date_range(start='2023-01-01', periods=n, freq='12H'),
    })
    
    data['Post_Year'] = data['Post_Date'].dt.year
    data['Post_Month'] = data['Post_Date'].dt.month
    data['Post_DayOfWeek'] = data['Post_Date'].dt.dayofweek
    data['is_weekend'] = data['Post_DayOfWeek'].isin([5, 6]).astype(int)
    data['eng_rate'] = (data['Likes'] + data['Shares'] + data['Comments']) / data['Views'].replace(0, 1)
    
    q25 = data['eng_rate'].quantile(0.25)
    q75 = data['eng_rate'].quantile(0.75)
    data['Engagement_Level_new'] = data['eng_rate'].apply(
        lambda x: 'Low' if x <= q25 else ('High' if x > q75 else 'Medium')
    )
    
    print("Dummy data created for testing")

def load_models():
    """Load pre-trained models"""
    global models
    models_dir = 'models'
    
    # Try to load models if they exist
    model_files = {
        'strategy_kmeans': 'strategy_kmeans_k2.pkl',
        'tiktok_autoencoder': 'tiktok_audience_autoencoder.pkl',
        'instagram_autoencoder': 'instagram_audience_autoencoder.pkl',
        'twitter_autoencoder': 'twitter_audience_autoencoder.pkl',
        'youtube_autoencoder': 'youtube_audience_autoencoder.pkl',
    }
    
    for key, filename in model_files.items():
        filepath = os.path.join(models_dir, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, 'rb') as f:
                    models[key] = pickle.load(f)
                print(f"Loaded model: {key}")
            except Exception as e:
                print(f"Error loading {key}: {str(e)}")
        else:
            print(f"Model not found: {filepath}")
    
    print(f"Models loaded: {list(models.keys())}")

# Initialize on startup
load_data()
load_models()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'data_loaded': data is not None,
        'data_rows': len(data) if data is not None else 0,
        'models_loaded': list(models.keys())
    })

@app.route('/filters/options', methods=['GET'])
def get_filter_options():
    """Get available filter options"""
    try:
        if data is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        return jsonify({
            'platforms': sorted(data['Platform'].unique().tolist()),
            'content_types': sorted(data['Content_Type'].unique().tolist()),
            'regions': sorted(data['Region'].unique().tolist()),
            'date_range': {
                'min': data['Post_Date'].min().isoformat(),
                'max': data['Post_Date'].max().isoformat()
            },
            'stats': {
                'total_posts': len(data),
                'avg_views': float(data['Views'].mean()),
                'avg_engagement_rate': float(data['eng_rate'].mean())
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/explore/filter', methods=['POST'])
def explore_filter():
    """Filter and explore data based on criteria"""
    try:
        if data is None:
            return jsonify({'error': 'Data not loaded'}), 500
        
        filters = request.json
        filtered_data = data.copy()
        
        # Apply filters
        if 'platform' in filters and filters['platform']:
            filtered_data = filtered_data[filtered_data['Platform'] == filters['platform']]
        
        if 'content_type' in filters and filters['content_type']:
            filtered_data = filtered_data[filtered_data['Content_Type'] == filters['content_type']]
        
        if 'region' in filters and filters['region']:
            filtered_data = filtered_data[filtered_data['Region'] == filters['region']]
        
        if 'date_start' in filters and filters['date_start']:
            filtered_data = filtered_data[filtered_data['Post_Date'] >= filters['date_start']]
        
        if 'date_end' in filters and filters['date_end']:
            filtered_data = filtered_data[filtered_data['Post_Date'] <= filters['date_end']]
        
        # Calculate summary statistics
        summary = {
            'total_posts': len(filtered_data),
            'avg_views': float(filtered_data['Views'].mean()) if len(filtered_data) > 0 else 0,
            'avg_likes': float(filtered_data['Likes'].mean()) if len(filtered_data) > 0 else 0,
            'avg_shares': float(filtered_data['Shares'].mean()) if len(filtered_data) > 0 else 0,
            'avg_comments': float(filtered_data['Comments'].mean()) if len(filtered_data) > 0 else 0,
            'avg_engagement_rate': float(filtered_data['eng_rate'].mean()) if len(filtered_data) > 0 else 0,
        }
        
        # Distribution data for plots
        if len(filtered_data) > 0:
            engagement_dist = filtered_data['Engagement_Level_new'].value_counts().to_dict()
            
            # Time series data
            time_series = filtered_data.groupby(filtered_data['Post_Date'].dt.to_period('M')).agg({
                'Views': 'mean',
                'eng_rate': 'mean'
            }).reset_index()
            time_series['Post_Date'] = time_series['Post_Date'].astype(str)
            
            # Top posts
            top_posts = filtered_data.nlargest(10, 'eng_rate')[
                ['Platform', 'Content_Type', 'Region', 'Views', 'Likes', 'Shares', 'Comments', 'eng_rate']
            ].to_dict('records')
            
            # Convert numpy types to Python native types
            for post in top_posts:
                for key, value in post.items():
                    if isinstance(value, (np.integer, np.floating)):
                        post[key] = float(value)
        else:
            engagement_dist = {}
            time_series = []
            top_posts = []
        
        return jsonify({
            'summary': summary,
            'engagement_distribution': engagement_dist,
            'time_series': time_series.to_dict('records') if len(time_series) > 0 else [],
            'top_posts': top_posts
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    """Generate strategy recommendations based on input"""
    try:
        input_data = request.json
        
        platform = input_data.get('platform', 'TikTok')
        content_type = input_data.get('content_type', 'Video')
        region = input_data.get('region', 'USA')
        expected_views = input_data.get('expected_views', None)
        
        # Get platform-specific statistics from data
        platform_data = data[data['Platform'] == platform]
        
        # Calculate percentiles for the platform
        views_percentiles = {
            'p25': float(platform_data['Views'].quantile(0.25)),
            'p50': float(platform_data['Views'].quantile(0.50)),
            'p75': float(platform_data['Views'].quantile(0.75))
        }
        
        eng_rate_percentiles = {
            'p25': float(platform_data['eng_rate'].quantile(0.25)),
            'p50': float(platform_data['eng_rate'].quantile(0.50)),
            'p75': float(platform_data['eng_rate'].quantile(0.75))
        }
        
        # Determine segments
        segment_info = {}
        recommendations = []
        
        # Strategy segment based on expected views (if provided)
        if expected_views:
            if expected_views > views_percentiles['p75']:
                segment_info['strategy_segment'] = 'Reach-Heavy'
                segment_info['strategy_description'] = 'High reach, moderate efficiency strategy'
                recommendations.extend([
                    'Focus on viral mechanics and shareability',
                    'Optimize posting times for maximum visibility',
                    'Consider trending topics and hashtags',
                    'Add strong hooks in the first 3 seconds'
                ])
            elif expected_views > views_percentiles['p25']:
                segment_info['strategy_segment'] = 'Balanced'
                segment_info['strategy_description'] = 'Balanced reach and engagement approach'
                recommendations.extend([
                    'Balance reach tactics with engagement optimization',
                    'Test different content formats',
                    'Build community through consistent posting'
                ])
            else:
                segment_info['strategy_segment'] = 'Efficiency-Focused'
                segment_info['strategy_description'] = 'Niche audience with high engagement efficiency'
                recommendations.extend([
                    'Double down on community-building content',
                    'Encourage comments and discussions',
                    'Use interactive formats (polls, Q&A)',
                    'Focus on loyal audience rather than viral reach'
                ])
        
        # Platform-specific recommendations
        platform_recs = {
            'TikTok': [
                'Use trending sounds and effects',
                'Keep videos under 60 seconds for best engagement',
                'Post during peak hours (7-9 PM local time)',
                'Strong efficiency niche exists - consider community content'
            ],
            'Instagram': [
                'Mix of Reels, Stories, and carousel posts',
                'Consistent aesthetic and brand voice',
                'Use 3-5 relevant hashtags',
                'Efficiency niche performs well - focus on loyal followers'
            ],
            'Twitter': [
                'Thread format for complex ideas',
                'Engage with replies within first hour',
                '3 distinct audience segments exist - test different approaches',
                'Consider visual content (images/videos) for higher engagement'
            ],
            'YouTube': [
                'First 30 seconds are critical',
                'Optimize thumbnails and titles',
                '3 audience segments - test content styles',
                'Encourage subscriptions and notifications'
            ]
        }
        
        recommendations.extend(platform_recs.get(platform, []))
        
        # Region-specific insights
        region_avg_eng = float(platform_data[platform_data['Region'] == region]['eng_rate'].mean()) \
            if len(platform_data[platform_data['Region'] == region]) > 0 else eng_rate_percentiles['p50']
        
        if region_avg_eng > eng_rate_percentiles['p75']:
            recommendations.append(f'{region} shows high engagement rates - leverage local trends and culture')
        elif region_avg_eng < eng_rate_percentiles['p25']:
            recommendations.append(f'{region} has lower engagement rates - focus on reach optimization')
        
        # Content type recommendations
        content_recs = {
            'Video': ['Optimize first 3 seconds', 'Add captions for silent viewing'],
            'Image': ['High-quality visuals', 'Strong composition and colors'],
            'Text': ['Clear formatting', 'Break into digestible chunks'],
            'Story': ['Interactive elements', 'Time-sensitive content']
        }
        
        if content_type in content_recs:
            recommendations.extend(content_recs[content_type])
        
        return jsonify({
            'segment_info': segment_info,
            'recommendations': recommendations,
            'platform_stats': {
                'views_percentiles': views_percentiles,
                'engagement_percentiles': eng_rate_percentiles,
                'avg_engagement_rate': float(platform_data['eng_rate'].mean())
            },
            'confidence': 0.75  # Placeholder confidence score
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/compare/platforms', methods=['GET'])
def compare_platforms():
    """Compare statistics between platforms"""
    try:
        platform_a = request.args.get('A', 'TikTok')
        platform_b = request.args.get('B', 'Instagram')
        
        def get_platform_stats(platform):
            platform_data = data[data['Platform'] == platform]
            return {
                'platform': platform,
                'avg_views': float(platform_data['Views'].mean()),
                'avg_engagement_rate': float(platform_data['eng_rate'].mean()),
                'avg_likes': float(platform_data['Likes'].mean()),
                'avg_shares': float(platform_data['Shares'].mean()),
                'avg_comments': float(platform_data['Comments'].mean()),
                'total_posts': len(platform_data),
                'engagement_distribution': platform_data['Engagement_Level_new'].value_counts().to_dict()
            }
        
        return jsonify({
            'platform_a': get_platform_stats(platform_a),
            'platform_b': get_platform_stats(platform_b)
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/compare/regions', methods=['GET'])
def compare_regions():
    """Compare statistics across regions"""
    try:
        regions_str = request.args.get('list', 'USA,India')
        regions = [r.strip() for r in regions_str.split(',')]
        
        results = []
        for region in regions:
            region_data = data[data['Region'] == region]
            if len(region_data) > 0:
                results.append({
                    'region': region,
                    'avg_views': float(region_data['Views'].mean()),
                    'avg_engagement_rate': float(region_data['eng_rate'].mean()),
                    'avg_likes': float(region_data['Likes'].mean()),
                    'total_posts': len(region_data),
                    'engagement_distribution': region_data['Engagement_Level_new'].value_counts().to_dict()
                })
        
        return jsonify({'regions': results})
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
