import numpy as np
import pandas as pd

def extract_window_features(window_df):
    """Extract 8 features from 240-point window."""
    mq135 = window_df['mq135'].values
    mq136 = window_df['mq136'].values
    temp = window_df['temp'].values
    humidity = window_df['humidity'].values
    
    # Compute slopes using least-squares linear regression
    time_idx = np.arange(len(mq135))
    mq135_slope = np.polyfit(time_idx, mq135, 1)[0]
    mq136_slope = np.polyfit(time_idx, mq136, 1)[0]
    
    features = {
        'mq135_mean': np.mean(mq135),
        'mq135_std': np.std(mq135),
        'mq135_slope': mq135_slope,
        'mq136_mean': np.mean(mq136),
        'mq136_std': np.std(mq136),
        'mq136_slope': mq136_slope,
        'temp_mean': np.mean(temp),
        'humidity_mean': np.mean(humidity),
        'label': window_df['label'].iloc[0]  # label same for entire window
    }
    
    return features

def extract_features_from_raw(raw_csv_path, output_csv_path, window_size=240):
    """Process raw sensor data into feature dataset."""
    df = pd.read_csv(raw_csv_path)
    
    # Verify label consistency per window
    total_rows = len(df)
    if total_rows % window_size != 0:
        print(f"WARNING: {total_rows} rows not divisible by {window_size}, truncating...")
        df = df.iloc[:total_rows - (total_rows % window_size)]
    
    num_windows = len(df) // window_size
    feature_list = []
    
    for i in range(num_windows):
        start_idx = i * window_size
        end_idx = start_idx + window_size
        window_df = df.iloc[start_idx:end_idx]
        
        # Check label consistency
        unique_labels = window_df['label'].unique()
        if len(unique_labels) > 1:
            print(f"WARNING: Window {i} has mixed labels: {unique_labels}")
        
        features = extract_window_features(window_df)
        feature_list.append(features)
    
    # Create feature dataset
    feature_df = pd.DataFrame(feature_list)
    feature_df.to_csv(output_csv_path, index=False)
    
    print(f"Extracted {len(feature_df)} feature rows from {num_windows} windows -> {output_csv_path}")
    print(f"\nFeature dataset shape: {feature_df.shape}")
    print(f"Label distribution:\n{feature_df['label'].value_counts()}")
    print(f"\nFeature columns: {list(feature_df.columns)}")
    
    return feature_df

if __name__ == "__main__":
    raw_path = "data/raw/dummy_sensor_data.csv"
    output_path = "data/processed/feature_dataset.csv"
    
    df_features = extract_features_from_raw(raw_path, output_path)
    
    # Show sample
    print("\nFirst 3 rows:")
    print(df_features.head(3))
