import pandas as pd
import numpy as np
from tensorflow import keras
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

def evaluate_model(model_path, test_csv_path):
    """Evaluate model on test set with detailed metrics."""
    
    # Load model
    model = keras.models.load_model(model_path)
    print(f"Model loaded from {model_path}")
    
    # Load test data
    df_test = pd.read_csv(test_csv_path)
    
    feature_cols = ['mq135_mean', 'mq135_std', 'mq135_slope', 
                    'mq136_mean', 'mq136_std', 'mq136_slope', 
                    'temp_mean', 'humidity_mean']
    
    X_test = df_test[feature_cols].values
    y_test_labels = df_test['label'].values
    
    # Encode labels
    label_map = {'Layak': 0, 'Perlu Diperiksa': 1, 'Tidak Layak': 2}
    y_test_encoded = np.array([label_map[label] for label in y_test_labels])
    
    print(f"\nTest set size: {len(X_test)} samples")
    print(f"Label distribution: {np.bincount(y_test_encoded)}")
    
    # Predict
    y_pred_probs = model.predict(X_test, verbose=0)
    y_pred_classes = y_pred_probs.argmax(axis=1)
    
    # Classification report
    target_names = ['Layak', 'Perlu Diperiksa', 'Tidak Layak']
    print("\n" + "="*60)
    print("CLASSIFICATION REPORT")
    print("="*60)
    print(classification_report(y_test_encoded, y_pred_classes, 
                                target_names=target_names, digits=4))
    
    # Confusion matrix
    cm = confusion_matrix(y_test_encoded, y_pred_classes)
    print("="*60)
    print("CONFUSION MATRIX")
    print("="*60)
    print(f"{'':20s} {'Pred: Layak':>15s} {'Pred: Perlu':>15s} {'Pred: Tidak':>15s}")
    print(f"{'':20s} {'':>15s} {'Diperiksa':>15s} {'Layak':>15s}")
    print("-"*60)
    for i, true_label in enumerate(target_names):
        row_str = f"True: {true_label:15s}"
        for j in range(3):
            row_str += f"{cm[i,j]:>15d}"
        print(row_str)
    
    # Check recall for "Tidak Layak" (most critical)
    recall_tidak_layak = cm[2,2] / cm[2,:].sum() if cm[2,:].sum() > 0 else 0
    print("\n" + "="*60)
    print(f"CRITICAL METRIC: Recall 'Tidak Layak' = {recall_tidak_layak:.4f}")
    print("="*60)
    
    # Overall accuracy
    accuracy = (y_pred_classes == y_test_encoded).mean()
    print(f"\nOverall Test Accuracy: {accuracy:.4f}")
    
    # Plot confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=target_names, yticklabels=target_names)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.title('Confusion Matrix - SIGAP MBG MLP')
    plt.tight_layout()
    plt.savefig('models/confusion_matrix.png', dpi=150)
    print(f"\nConfusion matrix plot saved -> models/confusion_matrix.png")
    
    return accuracy, cm

if __name__ == "__main__":
    model_path = "models/sigap_mbg_mlp.h5"
    test_path = "data/processed/test_normalized.csv"
    
    accuracy, cm = evaluate_model(model_path, test_path)
