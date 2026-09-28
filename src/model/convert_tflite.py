import tensorflow as tf
from tensorflow import keras
import numpy as np

def convert_to_tflite(model_path, tflite_output_path, quantize=True):
    """Convert Keras model to TensorFlow Lite format."""
    
    # Load model
    model = keras.models.load_model(model_path)
    print(f"Model loaded from {model_path}")
    
    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    
    if quantize:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        print("Quantization enabled (tf.lite.Optimize.DEFAULT)")
    
    tflite_model = converter.convert()
    
    # Save TFLite model
    with open(tflite_output_path, 'wb') as f:
        f.write(tflite_model)
    
    size_kb = len(tflite_model) / 1024
    print(f"\nTFLite model saved -> {tflite_output_path}")
    print(f"Model size: {size_kb:.2f} KB")
    
    return tflite_model

def tflite_to_c_array(tflite_model, header_output_path, array_name="sigap_mbg_model"):
    """Convert TFLite model to C header array."""
    
    # Convert bytes to C array format
    hex_array = ', '.join([f'0x{b:02x}' for b in tflite_model])
    
    # Build C header content
    header_content = f"""// Auto-generated TFLite model for SIGAP MBG
// Model: MLP (8 -> 12 -> 8 -> 3)
// Generated: 2026-09-19

#ifndef SIGAP_MBG_MODEL_H
#define SIGAP_MBG_MODEL_H

const unsigned char {array_name}[] = {{
{format_array_multiline(tflite_model)}
}};

const unsigned int {array_name}_len = {len(tflite_model)};

#endif  // SIGAP_MBG_MODEL_H
"""
    
    with open(header_output_path, 'w') as f:
        f.write(header_content)
    
    print(f"\nC header array saved -> {header_output_path}")
    print(f"Array name: {array_name}")
    print(f"Array length: {len(tflite_model)} bytes")

def format_array_multiline(data, bytes_per_line=12):
    """Format byte array with multiple bytes per line."""
    lines = []
    for i in range(0, len(data), bytes_per_line):
        chunk = data[i:i+bytes_per_line]
        hex_str = ', '.join([f'0x{b:02x}' for b in chunk])
        lines.append(f"  {hex_str}")
    return ',\n'.join(lines)

def verify_tflite_model(tflite_path, test_input):
    """Test TFLite model inference."""
    
    # Load TFLite model
    interpreter = tf.lite.Interpreter(model_path=tflite_path)
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    print("\n" + "="*60)
    print("TFLITE MODEL VERIFICATION")
    print("="*60)
    print(f"Input shape:  {input_details[0]['shape']}")
    print(f"Input dtype:  {input_details[0]['dtype']}")
    print(f"Output shape: {output_details[0]['shape']}")
    print(f"Output dtype: {output_details[0]['dtype']}")
    
    # Test inference
    interpreter.set_tensor(input_details[0]['index'], test_input)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])
    
    pred_class = output.argmax()
    class_names = ['Layak', 'Perlu Diperiksa', 'Tidak Layak']
    
    print(f"\nTest inference:")
    print(f"  Input:  {test_input[0]}")
    print(f"  Output: {output[0]}")
    print(f"  Predicted class: {pred_class} ({class_names[pred_class]})")
    print(f"  Confidence: {output[0][pred_class]:.4f}")
    print("="*60)

if __name__ == "__main__":
    model_path = "models/sigap_mbg_mlp.h5"
    tflite_path = "models/sigap_mbg_mlp.tflite"
    header_path = "firmware/esp32/model_data.h"
    
    # Convert to TFLite
    tflite_model = convert_to_tflite(model_path, tflite_path, quantize=True)
    
    # Convert to C array
    tflite_to_c_array(tflite_model, header_path)
    
    # Verify with dummy input (normalized values [0, 1])
    test_input = np.array([[0.5, 0.3, 0.2, 0.4, 0.3, 0.1, 0.6, 0.7]], dtype=np.float32)
    verify_tflite_model(tflite_path, test_input)
    
    print("\n✓ Conversion complete. Model ready for ESP32 deployment.")
