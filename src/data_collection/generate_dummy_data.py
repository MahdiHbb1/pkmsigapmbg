import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)

def generate_window(label, window_idx):
    """Generate 240 data points (5 min window) for one label."""
    base_time = datetime(2026, 9, 1, 8, 0, 0) + timedelta(minutes=5*window_idx)
    
    # Define patterns per class
    if label == "Layak":
        mq135_base = np.random.uniform(60, 120)
        mq135_slope = np.random.uniform(-0.5, 0.5)  # stable
        mq136_base = np.random.uniform(15, 30)
        mq136_slope = np.random.uniform(-0.2, 0.2)
        temp_base = np.random.uniform(22, 28)
        humidity_base = np.random.uniform(50, 70)
    elif label == "Perlu Diperiksa":
        mq135_base = np.random.uniform(200, 350)
        mq135_slope = np.random.uniform(0.3, 1.2)  # mild increase
        mq136_base = np.random.uniform(40, 65)
        mq136_slope = np.random.uniform(0.1, 0.5)
        temp_base = np.random.uniform(26, 32)
        humidity_base = np.random.uniform(60, 80)
    else:  # Tidak Layak
        mq135_base = np.random.uniform(350, 480)
        mq135_slope = np.random.uniform(1.0, 3.0)  # strong increase
        mq136_base = np.random.uniform(65, 95)
        mq136_slope = np.random.uniform(0.5, 1.5)
        temp_base = np.random.uniform(28, 34)
        humidity_base = np.random.uniform(65, 88)
    
    # Generate 240 points with trend + noise
    time_idx = np.arange(240)
    mq135 = mq135_base + mq135_slope * time_idx + np.random.normal(0, 5, 240)
    mq136 = mq136_base + mq136_slope * time_idx + np.random.normal(0, 2, 240)
    temp = temp_base + np.random.normal(0, 0.5, 240)
    humidity = humidity_base + np.random.normal(0, 2, 240)
    
    # Clip to valid ranges
    mq135 = np.clip(mq135, 50, 500)
    mq136 = np.clip(mq136, 10, 100)
    temp = np.clip(temp, 20, 35)
    humidity = np.clip(humidity, 40, 90)
    
    # Build dataframe
    timestamps = [base_time + timedelta(seconds=5*i) for i in range(240)]
    df = pd.DataFrame({
        'timestamp': timestamps,
        'mq135': mq135,
        'mq136': mq136,
        'temp': temp,
        'humidity': humidity,
        'label': label
    })
    
    return df

# Generate 300 windows (100 per class)
labels = ["Layak"] * 100 + ["Perlu Diperiksa"] * 100 + ["Tidak Layak"] * 100
np.random.shuffle(labels)  # shuffle order

all_data = []
for idx, label in enumerate(labels):
    window_df = generate_window(label, idx)
    all_data.append(window_df)

# Combine and save
df_all = pd.concat(all_data, ignore_index=True)
output_path = "data/raw/dummy_sensor_data.csv"
df_all.to_csv(output_path, index=False)

print(f"Generated {len(df_all)} rows ({len(labels)} windows) -> {output_path}")
print(f"Label distribution:")
print(df_all['label'].value_counts())
