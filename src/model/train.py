import pandas as pd
import numpy as np
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import EarlyStopping

def train_mlp_model(train_csv_path, model_output_path, validation_split=0.2, 
                     batch_size=16, max_epochs=100, random_state=42):
    """Train MLP model following exact architecture from spec."""
    
    # Load normalized training data
    df_train = pd.read_csv(train_csv_path)
    
    feature_cols = ['mq135_mean', 'mq135_std', 'mq135_slope', 
                    'mq136_mean', 'mq136_std', 'mq136_slope', 
                    'temp_mean', 'humidity_mean']
    
    X_train = df_train[feature_cols].values
    y_train_labels = df_train['label'].values
    
    # Label encoding: Layak=0, Perlu Diperiksa=1, Tidak Layak=2
    label_map = {'Layak': 0, 'Perlu Diperiksa': 1, 'Tidak Layak': 2}
    y_train_encoded = np.array([label_map[label] for label in y_train_labels])
    
    # One-hot encode
    y_train_onehot = keras.utils.to_categorical(y_train_encoded, num_classes=3)
    
    print(f"Training data shape: X={X_train.shape}, y={y_train_onehot.shape}")
    print(f"Label distribution: {np.bincount(y_train_encoded)}")
    
    # Build MLP architecture (exact from spec)
    # Input: 8 -> Hidden1: 12 (ReLU) -> Hidden2: 8 (ReLU) -> Output: 3 (Softmax)
    model = keras.Sequential([
        layers.Input(shape=(8,)),
        layers.Dense(12, activation='relu'),
        layers.Dense(8, activation='relu'),
        layers.Dense(3, activation='softmax')
    ])
    
    # Compile
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\nModel architecture:")
    model.summary()
    
    # EarlyStopping callback
    early_stop = EarlyStopping(
        monitor='val_loss',
        patience=15,
        restore_best_weights=True,
        verbose=1
    )
    
    # Train
    print(f"\nTraining with validation_split={validation_split}, batch_size={batch_size}, max_epochs={max_epochs}")
    history = model.fit(
        X_train, y_train_onehot,
        validation_split=validation_split,
        batch_size=batch_size,
        epochs=max_epochs,
        callbacks=[early_stop],
        verbose=1
    )
    
    # Save model
    model.save(model_output_path)
    print(f"\nModel saved -> {model_output_path}")
    
    # Training summary
    final_epoch = len(history.history['loss'])
    final_train_acc = history.history['accuracy'][-1]
    final_val_acc = history.history['val_accuracy'][-1]
    final_train_loss = history.history['loss'][-1]
    final_val_loss = history.history['val_loss'][-1]
    
    print(f"\nTraining completed in {final_epoch} epochs:")
    print(f"  Final train accuracy: {final_train_acc:.4f}")
    print(f"  Final val accuracy:   {final_val_acc:.4f}")
    print(f"  Final train loss:     {final_train_loss:.4f}")
    print(f"  Final val loss:       {final_val_loss:.4f}")
    
    return model, history

if __name__ == "__main__":
    train_path = "data/processed/train_normalized.csv"
    model_path = "models/sigap_mbg_mlp.h5"
    
    model, history = train_mlp_model(train_path, model_path)
