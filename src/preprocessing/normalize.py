import pandas as pd
import json
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

def fit_and_save_scaler(feature_csv_path, scaler_output_path, test_size=0.2, random_state=42):
    """Fit Min-Max scaler on training data and save parameters."""
    df = pd.read_csv(feature_csv_path)
    
    # Separate features and labels
    feature_cols = ['mq135_mean', 'mq135_std', 'mq135_slope', 
                    'mq136_mean', 'mq136_std', 'mq136_slope', 
                    'temp_mean', 'humidity_mean']
    
    X = df[feature_cols].values
    y = df['label'].values
    
    # Stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=random_state
    )
    
    # Fit scaler on training data ONLY
    scaler = MinMaxScaler()
    scaler.fit(X_train)
    
    # Save scaler parameters as JSON (for firmware use)
    scaler_params = {}
    for i, col in enumerate(feature_cols):
        scaler_params[col] = {
            'min': float(scaler.data_min_[i]),
            'max': float(scaler.data_max_[i])
        }
    
    with open(scaler_output_path, 'w') as f:
        json.dump(scaler_params, f, indent=2)
    
    print(f"Scaler fitted on {len(X_train)} training samples")
    print(f"Scaler params saved -> {scaler_output_path}")
    print(f"\nScaler ranges:")
    for col in feature_cols:
        print(f"  {col:20s}: [{scaler_params[col]['min']:.4f}, {scaler_params[col]['max']:.4f}]")
    
    # Transform and save normalized datasets
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save normalized data with labels
    train_df = pd.DataFrame(X_train_scaled, columns=feature_cols)
    train_df['label'] = y_train
    train_df.to_csv('data/processed/train_normalized.csv', index=False)
    
    test_df = pd.DataFrame(X_test_scaled, columns=feature_cols)
    test_df['label'] = y_test
    test_df.to_csv('data/processed/test_normalized.csv', index=False)
    
    print(f"\nNormalized datasets saved:")
    print(f"  Train: {train_df.shape} -> data/processed/train_normalized.csv")
    print(f"  Test:  {test_df.shape} -> data/processed/test_normalized.csv")
    print(f"\nLabel distribution in train set:")
    print(pd.Series(y_train).value_counts())
    print(f"\nLabel distribution in test set:")
    print(pd.Series(y_test).value_counts())
    
    return scaler

if __name__ == "__main__":
    feature_path = "data/processed/feature_dataset.csv"
    scaler_path = "models/scaler_params.json"
    
    scaler = fit_and_save_scaler(feature_path, scaler_path)
