import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score, mean_squared_error
import warnings

warnings.filterwarnings('ignore')

# 1. Synthetic Data Generation for Restaurant Demand
def generate_synthetic_data(samples=2000, time_steps=24):
    """
    Generate synthetic time-series data representing hourly restaurant covers.
    Includes daily seasonality and some random noise/anomalies.
    """
    print("Generating synthetic restaurant demand data...")
    time = np.arange(0, samples, 1)
    # Daily seasonality (24 hours) + weekly seasonality (168 hours)
    demand = 50 + 30 * np.sin(2 * np.pi * time / 24) + 15 * np.sin(2 * np.pi * time / 168) + np.random.normal(0, 5, samples)
    
    # Introduce some anomalies (e.g., sudden massive spikes or drops)
    anomaly_indices = np.random.choice(samples, size=int(samples * 0.05), replace=False)
    demand[anomaly_indices] += np.random.normal(50, 20, size=len(anomaly_indices))
    
    # Ensure no negative demand
    demand = np.clip(demand, 0, None)
    
    # Create sequences
    X, y = [], []
    for i in range(len(demand) - time_steps):
        X.append(demand[i:i + time_steps])
        y.append(demand[i + time_steps])
        
    X = np.array(X).reshape(-1, time_steps, 1)
    y = np.array(y)
    
    # Binary classification target: High demand (1) vs Normal/Low demand (0)
    threshold = np.percentile(y, 75)
    y_class = (y > threshold).astype(int)
    
    # Split train/test
    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train_reg, y_test_reg = y[:split], y[split:]
    y_train_cls, y_test_cls = y_class[:split], y_class[split:]
    
    # Normalize features
    scaler = MinMaxScaler()
    X_train_shape = X_train.shape
    X_test_shape = X_test.shape
    X_train = scaler.fit_transform(X_train.reshape(-1, 1)).reshape(X_train_shape)
    X_test = scaler.transform(X_test.reshape(-1, 1)).reshape(X_test_shape)
    
    return (X_train, y_train_reg, y_train_cls), (X_test, y_test_reg, y_test_cls), scaler

# 2. LSTM Autoencoder for Anomaly Detection
def build_lstm_autoencoder(time_steps, features):
    print("Building LSTM Autoencoder...")
    inputs = layers.Input(shape=(time_steps, features))
    
    # Encoder
    encoded = layers.LSTM(32, activation='relu', return_sequences=True)(inputs)
    encoded = layers.LSTM(16, activation='relu', return_sequences=False)(encoded)
    
    # Repeat vector for decoder
    repeated = layers.RepeatVector(time_steps)(encoded)
    
    # Decoder
    decoded = layers.LSTM(16, activation='relu', return_sequences=True)(repeated)
    decoded = layers.LSTM(32, activation='relu', return_sequences=True)(decoded)
    outputs = layers.TimeDistributed(layers.Dense(features))(decoded)
    
    model = models.Model(inputs=inputs, outputs=outputs, name="LSTM_Autoencoder")
    model.compile(optimizer='adam', loss='mse')
    return model

# 3. GRU Benchmarking (Forecasting/Classification)
def build_gru_model(time_steps, features):
    print("Building GRU Benchmarking Model...")
    inputs = layers.Input(shape=(time_steps, features))
    x = layers.GRU(64, return_sequences=True)(inputs)
    x = layers.Dropout(0.2)(x)
    x = layers.GRU(32, return_sequences=False)(x)
    x = layers.Dense(16, activation='relu')(x)
    outputs = layers.Dense(1, activation='sigmoid')(x) # Classification output
    
    model = models.Model(inputs=inputs, outputs=outputs, name="GRU_Classifier")
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

# 4. Multi-Head Attention Model
def build_attention_model(time_steps, features):
    print("Building Multi-Head Attention Model...")
    inputs = layers.Input(shape=(time_steps, features))
    
    # Positional encoding-like feature mapping
    x = layers.Dense(32)(inputs)
    
    # Multi-Head Attention Layer
    attention_output = layers.MultiHeadAttention(num_heads=4, key_dim=32)(x, x)
    
    # Add & Norm
    x = layers.Add()([x, attention_output])
    x = layers.LayerNormalization()(x)
    
    # Feed Forward
    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dense(32, activation='relu')(x)
    outputs = layers.Dense(1, activation='sigmoid')(x)
    
    model = models.Model(inputs=inputs, outputs=outputs, name="Attention_Classifier")
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

# 5. Ensemble Methods: Voting Strategies
def ensemble_predictions(y_pred_gru, y_pred_att, y_true):
    print("\n--- Applying Ensemble Voting Strategies ---")
    
    # Convert probabilities to binary classes
    gru_classes = (y_pred_gru > 0.5).astype(int).flatten()
    att_classes = (y_pred_att > 0.5).astype(int).flatten()
    
    # We will simulate a third base model (e.g., a simple baseline) to have 3 voters
    # Let's use a naive persistence model (predicting based on the last time step)
    # For simulation, we'll just create a slightly noisy version of GRU
    base_classes = (y_pred_gru + np.random.normal(0, 0.2, y_pred_gru.shape) > 0.5).astype(int).flatten()
    
    # 5a. Hard Voting (Majority Rule)
    print("1. Hard Voting Strategy")
    hard_vote = np.round((gru_classes + att_classes + base_classes) / 3).astype(int)
    hard_acc = accuracy_score(y_true, hard_vote)
    
    # 5b. Soft Voting (Average of Probabilities)
    print("2. Soft Voting Strategy")
    # Simulate prob for baseline
    base_probs = np.clip(y_pred_gru.flatten() + np.random.normal(0, 0.1, len(y_pred_gru)), 0, 1)
    soft_probs = (y_pred_gru.flatten() + y_pred_att.flatten() + base_probs) / 3
    soft_vote = (soft_probs > 0.5).astype(int)
    soft_acc = accuracy_score(y_true, soft_vote)
    
    # 5c. Weighted Voting
    print("3. Weighted Voting Strategy")
    # Assign higher weight to Multi-Head Attention (0.5), then GRU (0.3), Baseline (0.2)
    weighted_probs = (0.5 * y_pred_att.flatten()) + (0.3 * y_pred_gru.flatten()) + (0.2 * base_probs)
    weighted_vote = (weighted_probs > 0.5).astype(int)
    weighted_acc = accuracy_score(y_true, weighted_vote)
    
    print(f"Base GRU Accuracy:       {accuracy_score(y_true, gru_classes):.4f}")
    print(f"Base Attention Accuracy: {accuracy_score(y_true, att_classes):.4f}")
    print(f"Hard Voting Accuracy:    {hard_acc:.4f}")
    print(f"Soft Voting Accuracy:    {soft_acc:.4f}")
    print(f"Weighted Accuracy:       {weighted_acc:.4f}")
    
    best_improvement = max(hard_acc, soft_acc, weighted_acc) - max(accuracy_score(y_true, gru_classes), accuracy_score(y_true, att_classes))
    print(f"\nOverall Ensemble Improvement: {best_improvement * 100:.2f}%")
    if best_improvement >= 0.07:
        print("Goal achieved: > 7% improvement reached.")

# 6. TensorFlow Lite Quantization
def export_to_tflite(model, filename):
    print(f"\nQuantizing and exporting {model.name} to TensorFlow Lite format...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    
    # Apply standard quantization optimization
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    
    # Convert the model
    tflite_model = converter.convert()
    
    # Save to disk
    os.makedirs('models', exist_ok=True)
    filepath = os.path.join('models', filename)
    with open(filepath, 'wb') as f:
        f.write(tflite_model)
    print(f"Saved optimized TFLite model to: {filepath} ({len(tflite_model) / 1024:.2f} KB)")


def main():
    print("=== REMO Advanced ML Benchmarking ===")
    time_steps = 24
    features = 1
    
    # 1. Generate Data
    (X_train, y_train_reg, y_train_cls), (X_test, y_test_reg, y_test_cls), scaler = generate_synthetic_data(samples=2000, time_steps=time_steps)
    print(f"Training data shape: {X_train.shape}")
    
    # 2. LSTM Autoencoder
    autoencoder = build_lstm_autoencoder(time_steps, features)
    print("Training LSTM Autoencoder...")
    autoencoder.fit(X_train, X_train, epochs=3, batch_size=32, validation_split=0.1, verbose=0)
    
    # Anomaly Detection Evaluation
    reconstructions = autoencoder.predict(X_test, verbose=0)
    mse = np.mean(np.power(X_test - reconstructions, 2), axis=1)
    print(f"Autoencoder Mean Reconstruction Error: {np.mean(mse):.4f}")
    
    # 3. GRU Classifier
    gru_model = build_gru_model(time_steps, features)
    print("Training GRU Model...")
    gru_model.fit(X_train, y_train_cls, epochs=5, batch_size=32, validation_split=0.1, verbose=0)
    
    # 4. Multi-Head Attention Classifier
    att_model = build_attention_model(time_steps, features)
    print("Training Multi-Head Attention Model...")
    att_model.fit(X_train, y_train_cls, epochs=5, batch_size=32, validation_split=0.1, verbose=0)
    
    # Predict for Ensemble
    y_pred_gru = gru_model.predict(X_test, verbose=0)
    y_pred_att = att_model.predict(X_test, verbose=0)
    
    # 5. Ensemble Strategies
    ensemble_predictions(y_pred_gru, y_pred_att, y_test_cls)
    
    # 6. Quantization
    export_to_tflite(gru_model, "gru_forecast_quantized.tflite")
    export_to_tflite(att_model, "attention_forecast_quantized.tflite")
    
    print("\nBenchmarking complete. Models are ready for edge deployment.")

if __name__ == "__main__":
    main()
